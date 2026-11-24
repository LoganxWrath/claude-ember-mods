import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Mood, Usage } from '../types'
import { MOOD_LABEL, buddyChip, buddySvg, moodForTool } from './buddy'

// ── Paleta cyberpunk ────────────────────────────────────────────────
const NEON_PINK = '#ff3355'
const NEON_CYAN = '#ff7a00'
const NEON_YELLOW = '#ffc400'
const NEON_GREEN = '#ffd29a'
const NEON_PURPLE = '#ff7a00'
const DIM = '#8a6a48'

const PANE = 'token-optimizer'
const CACHE_TTL_MS = 60 * 60 * 1000
// Saídas de Bash maiores que isto são cortadas (cabeça + cauda) antes de entrarem no contexto.
const MAX_OUTPUT_CHARS = 12_000
const KEEP_HEAD = 5_000
const KEEP_TAIL = 5_000
const FULL_OUTPUT_DIR = '/tmp/token-optimizer'

const HANDOFF_PROMPT =
  'Vou começar uma sessão nova para poupar tokens. Escreve (ou atualiza) o ficheiro HANDOFF.md na raiz do projeto, ' +
  'curto e denso (máx. ~60 linhas), com: 1) objetivo atual, 2) o que já está feito, 3) ficheiros relevantes com caminhos, ' +
  '4) decisões tomadas e porquê, 5) o que já falhou e não vale repetir, 6) próximos passos concretos por ordem. ' +
  'Não faças mais nada além de escrever esse ficheiro.'
const RESUME_PROMPT = 'Lê o HANDOFF.md e continua a partir dos próximos passos.'

const compactions = atom({ plugin: 'token-optimizer', key: 'compactions' } as const, 0)
const sessionStartedAt = atom({ plugin: 'token-optimizer', key: 'sessionStartedAt' } as const, 0)
const lastRequestAt = atom({ plugin: 'token-optimizer', key: 'lastRequestAt' } as const, null)
const now = atom({ plugin: 'token-optimizer', key: 'now' } as const, 0)
const usage = atom({ plugin: 'token-optimizer', key: 'usage' } as const, {
  contextPercent: null,
  fiveHourPercent: null,
  weekPercent: null,
} as Usage)
const isConfirming = atom({ plugin: 'token-optimizer', key: 'isConfirming' } as const, false)
const isHidden = atom({ plugin: 'token-optimizer', key: 'isHidden' } as const, false)
const handoffPending = atom({ plugin: 'token-optimizer', key: 'handoffPending' } as const, false)
const savedChars = atom({ plugin: 'token-optimizer', key: 'savedChars' } as const, 0)
const buddyFrame = atom({ plugin: 'token-optimizer', key: 'buddyFrame' } as const, 0)
const mood = atom({ plugin: 'token-optimizer', key: 'mood' } as const, 'idle' as Mood)
const trimmedCount = atom({ plugin: 'token-optimizer', key: 'trimmedCount' } as const, 0)

// Heurística: contexto cheio e cada compactação baixam a qualidade.
function quality(ctx: number, comp: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - ctx * 0.5 - comp * 15)))
}

function grade(q: number): string {
  return q >= 80 ? 'A' : q >= 65 ? 'B' : q >= 50 ? 'C' : q >= 35 ? 'D' : 'F'
}

function tone(good: boolean, warn: boolean): string {
  return good ? NEON_GREEN : warn ? NEON_YELLOW : NEON_PINK
}

function meter(pct: number, width: number): string {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)))
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

function advice(ctx: number, comp: number, cacheLeftMin: number | null): string {
  if (comp >= 3) return `COMPACTADO ${comp}x // o detalhe inicial já se perdeu quase todo`
  if (comp >= 1 && ctx >= 60) return 'já compactado e outra vez cheio // recomeça'
  if (ctx >= 80) return 'contexto quase cheio // cada mensagem sai cara'
  if (cacheLeftMin === 0) return 'cache expirado // a próxima mensagem relê tudo a preço cheio'
  if (ctx >= 60) return 'contexto a encher // prepara o handoff'
  return 'sistema nominal'
}

function trim(text: string): { text: string; cut: number } {
  if (text.length <= MAX_OUTPUT_CHARS) return { text, cut: 0 }
  const cut = text.length - KEEP_HEAD - KEEP_TAIL
  return {
    text:
      text.slice(0, KEEP_HEAD) +
      `\n\n… [token-optimizer: ${cut} caracteres cortados do meio] …\n\n` +
      text.slice(-KEEP_TAIL),
    cut,
  }
}

async function refresh($: EngineInterface) {
  const u = await $.session.usage()
  if (u.startedAt !== (await read($, sessionStartedAt))) {
    // /clear ou sessão nova: começa a contar de zero.
    await update($, sessionStartedAt, () => u.startedAt)
    await update($, compactions, () => 0)
    await update($, lastRequestAt, () => null)
  }
  const pct = (kind: string) => u.rateLimits.find(r => r.kind === kind)?.percentUsed ?? null
  await update($, usage, () => ({
    contextPercent: u.context.percent ?? null,
    fiveHourPercent: pct('five_hour'),
    weekPercent: pct('seven_day'),
  }))
  await update($, now, () => Date.now())
}

async function startHandoff($: EngineInterface) {
  await update($, isConfirming, () => false)
  await update($, handoffPending, () => true)
  $.ui.toast('▓ TOKEN//OPT ▓ a escrever HANDOFF.md…')
  await $.prompt.submit({ text: HANDOFF_PROMPT })
}

async function finishHandoff($: EngineInterface) {
  await update($, compactions, () => 0)
  await update($, lastRequestAt, () => null)
  await $.command.run({ command: 'clear' })
  $.ui.toast('▓ TOKEN//OPT ▓ conversa limpa // a continuar a partir do HANDOFF.md')
  // Espera a limpeza assentar e continua sozinho.
  $.clock.after(1_200, () => {
    void $.prompt.submit({ text: RESUME_PROMPT })
  })
}

type Ui = ReturnType<EngineInterface['ui']['resolve']>

function ring(pct: number): string {
  return pct >= 88 ? '●' : pct >= 63 ? '◕' : pct >= 38 ? '◑' : pct >= 13 ? '◔' : '○'
}

// Cartão único por cima da caixa de escrever: Ember, estado, métricas, poupança e botões.
async function drawBand($: EngineInterface, ui: Ui) {
  const { Box, Button, Text } = ui
  const u = await read($, usage)
  const comp = await read($, compactions)
  const last = await read($, lastRequestAt)
  const t = (await read($, now)) || Date.now()
  const confirming = await read($, isConfirming)
  const pending = await read($, handoffPending)
  const saved = await read($, savedChars)
  const trimmed = await read($, trimmedCount)
  const m = await read($, mood)
  const f = await read($, buddyFrame)

  const ctx = u.contextPercent ?? 0
  const q = quality(ctx, comp)
  const g = grade(q)
  const cacheLeftMin = last === null ? null : Math.max(0, Math.round((last + CACHE_TTL_MS - t) / 60_000))
  const cachePct = cacheLeftMin === null ? 100 : Math.round((cacheLeftMin / 60) * 100)
  const isBad = comp >= 3 || ctx >= 80
  const isWarn = comp >= 1 || ctx >= 60
  const savedK = Math.round(saved / 4 / 100) / 10
  const status = pending
    ? '⟳ a escrever o handoff…'
    : comp > 0
      ? `Compactado ${comp}x. ${comp >= 3 ? 'O detalhe inicial já se perdeu quase todo.' : 'Algum detalhe inicial perdeu-se.'}`
      : advice(ctx, comp, cacheLeftMin)

  const sep = <Text color="#5a4632">  ·  </Text>

  return (
    <Box flexDirection="row" alignItems="center" borderStyle="round" borderColor={isBad ? NEON_PINK : '#4a3420'} paddingX={1}>
      <Box marginRight={1} flexShrink={0} minWidth={12}>
        <Text bold wrap="truncate">
          {buddyChip(m, f).map(seg => (
            <Text color={seg.color} backgroundColor={seg.bg}>{seg.text}</Text>
          ))}
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        <Box>
          <Text bold color="#ffe9d1">Token Optimizer</Text>
          <Text color={isBad ? NEON_PINK : isWarn ? NEON_YELLOW : DIM}>
            {'  '}
            {isBad || isWarn ? '⧗ ' : ''}
            {status}
          </Text>
        </Box>
        <Box>
          <Text backgroundColor={tone(q >= 65, q >= 35)} color="#0a0806" bold> {g} </Text>
          <Text color="#ffe9d1"> {q}</Text>
          <Text color={DIM}> qualidade</Text>
          {sep}
          <Text color={tone(ctx < 60, ctx < 80)}>{ring(ctx)} </Text>
          <Text color="#ffe9d1">{u.contextPercent === null ? '--' : ctx + '%'}</Text>
          <Text color={DIM}> contexto</Text>
          {sep}
          <Text color={cacheLeftMin === null ? DIM : tone(cacheLeftMin > 15, cacheLeftMin > 0)}>{ring(cachePct)} </Text>
          <Text color="#ffe9d1">{cacheLeftMin === null ? '--' : cacheLeftMin + 'm'}</Text>
          <Text color={DIM}> cache</Text>
          {sep}
          <Text color={u.weekPercent === null ? DIM : tone(u.weekPercent < 60, u.weekPercent < 85)}>{ring(u.weekPercent ?? 0)} </Text>
          <Text color="#ffe9d1">{u.weekPercent === null ? '--' : u.weekPercent + '%'}</Text>
          <Text color={DIM}> semana</Text>
          {u.fiveHourPercent !== null ? sep : null}
          {u.fiveHourPercent !== null ? (
            <Text color={tone(u.fiveHourPercent < 60, u.fiveHourPercent < 85)}>{ring(u.fiveHourPercent)} </Text>
          ) : null}
          {u.fiveHourPercent !== null ? <Text color="#ffe9d1">{u.fiveHourPercent}%</Text> : null}
          {u.fiveHourPercent !== null ? <Text color={DIM}> 5h</Text> : null}
        </Box>
        <Box>
          <Text color={DIM}>
            {MOOD_LABEL[m]} · ✂ {trimmed} saídas cortadas · ~{savedK}k tokens poupados{comp > 0 ? ` · ${comp}x compactado` : ''}
          </Text>
        </Box>
      </Box>
      <Box marginLeft={1}>
        <Button
          key="fresh"
          hotkey="f"
          label={confirming ? 'Confirmar?' : '⟳ Resumir e recomeçar'}
          onPress={async () => {
            if (await read($, handoffPending)) return
            if (!(await read($, isConfirming))) {
              await update($, isConfirming, () => true)
              $.clock.after(8_000, () => {
                void update($, isConfirming, () => false)
              })
              return
            }
            await startHandoff($)
          }}
        />
        <Text> </Text>
        <Button key="hide" label="✕" onPress={() => update($, isHidden, () => true)} />
      </Box>
    </Box>
  )
}

async function drawPanel($: EngineInterface, ui: Ui) {
  const { Box, Button, Text } = ui
  const u = await read($, usage)
  const comp = await read($, compactions)
  const last = await read($, lastRequestAt)
  const t = (await read($, now)) || Date.now()
  const confirming = await read($, isConfirming)
  const pending = await read($, handoffPending)
  const saved = await read($, savedChars)
  const trimmed = await read($, trimmedCount)

  const ctx = u.contextPercent ?? 0
  const q = quality(ctx, comp)
  const g = grade(q)
  const cacheLeftMin = last === null ? null : Math.max(0, Math.round((last + CACHE_TTL_MS - t) / 60_000))
  const isBad = comp >= 3 || ctx >= 80
  const isWarn = comp >= 1 || ctx >= 60
  const savedK = Math.round(saved / 4 / 100) / 10

  return (
    <Box flexDirection="column" borderStyle="double" borderColor={isBad ? NEON_PINK : NEON_PURPLE} paddingX={1}>
      <Box>
        <Text color={NEON_PINK} bold>▓▒░ </Text>
        <Text color={NEON_CYAN} bold>TOKEN</Text>
        <Text color={NEON_PINK} bold>//</Text>
        <Text color={NEON_CYAN} bold>OPTIMIZER</Text>
        <Text color={NEON_PINK} bold> ░▒▓  </Text>
        <Text color={isBad ? NEON_PINK : isWarn ? NEON_YELLOW : NEON_GREEN}>
          {pending ? '⟳ a escrever handoff…' : '> ' + advice(ctx, comp, cacheLeftMin)}
        </Text>
      </Box>
      <Box>
        <Text color={tone(q >= 65, q >= 35)} bold>[{g}:{q}] </Text>
        <Text color={DIM}>CTX </Text>
        <Text color={tone(ctx < 60, ctx < 80)}>
          {meter(ctx, 10)} {u.contextPercent === null ? '--' : ctx + '%'}
        </Text>
        <Text color={DIM}>  CACHE </Text>
        <Text color={cacheLeftMin === null ? DIM : tone(cacheLeftMin > 15, cacheLeftMin > 0)}>
          {cacheLeftMin === null ? '--' : cacheLeftMin + 'm'}
        </Text>
        {u.fiveHourPercent !== null ? <Text color={DIM}>  5H </Text> : null}
        {u.fiveHourPercent !== null ? (
          <Text color={tone(u.fiveHourPercent < 60, u.fiveHourPercent < 85)}>{u.fiveHourPercent}%</Text>
        ) : null}
        <Text color={DIM}>  SEM </Text>
        <Text color={u.weekPercent === null ? DIM : tone(u.weekPercent < 60, u.weekPercent < 85)}>
          {u.weekPercent === null ? '--' : u.weekPercent + '%'}
        </Text>
        <Text color={DIM}>  CMP </Text>
        <Text color={tone(comp === 0, comp < 3)}>{comp}x</Text>
      </Box>
      <Box>
        <Text color={NEON_CYAN}>
          ✂ {trimmed} saídas cortadas // ~{savedK}k tokens poupados{'  '}
        </Text>
        <Button
          key="fresh"
          hotkey="f"
          label={confirming ? '⚠ CONFIRMAR' : '⟳ RESUMIR E RECOMEÇAR'}
          onPress={async () => {
            if (await read($, handoffPending)) return
            if (!(await read($, isConfirming))) {
              await update($, isConfirming, () => true)
              $.clock.after(8_000, () => {
                void update($, isConfirming, () => false)
              })
              return
            }
            await startHandoff($)
          }}
        />
      </Box>
    </Box>
  )
}

export const register: Register = on => {
  let tick: { cancel: () => void } | undefined
  let buddyTick: { cancel: () => void } | undefined
  let ticks = 0
  let hasWarned = false

  on('session.start', async ($, e, next) => {
    await update($, isHidden, () => false)
    await $.command.register({ name: 'tokens', description: 'Abre o painel Token Optimizer ao lado da conversa' })
    void $.ui.open({ id: PANE, title: 'TOKEN//OPTIMIZER' })
    await refresh($)
    tick?.cancel()
    tick = $.clock.every(60_000, () => {
      void update($, now, () => Date.now())
    })
    // Anima o Ember: uma pose nova ~3 vezes por segundo.
    buddyTick?.cancel()
    buddyTick = $.clock.every(350, () => {
      ticks += 1
      void update($, buddyFrame, f => (f + 1) % 840).then(() => $.ui.invalidate('ui.render'))
    })
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const pct = (kind: string) => e.rateLimits.find(r => r.kind === kind)?.percentUsed ?? null
    await update($, usage, () => ({
      contextPercent: e.context.percent ?? null,
      fiveHourPercent: pct('five_hour'),
      weekPercent: pct('seven_day'),
    }))
    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    if (e.agentId === undefined && e.trigger !== 'precompute') await update($, mood, () => 'compacting')
    const result = await next(e)
    if (e.agentId === undefined && e.trigger !== 'precompute') await update($, mood, () => 'thinking')
    if (e.agentId === undefined && e.trigger !== 'precompute' && !('skip' in result && result.skip)) {
      await update($, compactions, n => n + 1)
    }
    return result
  }).catch(($, e, next) => next(e))

  // Corta saídas enormes de comandos: a saída completa fica guardada num ficheiro.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true) return ran
    const r = ran.result
    if (r.isImage || r.backgroundTaskId !== undefined || r.structuredContent !== undefined) return ran

    const out = trim(r.stdout)
    const err = trim(r.stderr)
    const cut = out.cut + err.cut
    if (cut === 0) return ran

    const file = `${FULL_OUTPUT_DIR}/${e.tool_use_id ?? String(Date.now())}.log`
    let note = `\n[saída completa em ${file} — usa grep/sed -n nesse ficheiro se precisares do meio]`
    try {
      await $.fs.write(file, `$ ${e.command}\n\n--- stdout ---\n${r.stdout}\n\n--- stderr ---\n${r.stderr}\n`)
    } catch {
      note = '\n[saída completa não guardada; repete o comando filtrado com grep/head/tail se precisares]'
    }

    await update($, savedChars, n => n + cut)
    await update($, trimmedCount, n => n + 1)

    return {
      result: { ...r, stdout: out.text + (out.cut > 0 ? note : ''), stderr: err.text + (out.cut === 0 ? note : '') },
      context: ran.context,
    }
  }).catch(($, e, next) => next(e))

  on('prompt.submit', async ($, e, next) => {
    await update($, mood, () => 'thinking')
    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    if (e.agentId === undefined) await update($, mood, () => moodForTool(e.tool))
    const ran = await next(e)
    if (e.agentId === undefined) await update($, mood, () => (ran.isError === true ? 'error' : 'thinking'))
    return ran
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    await update($, mood, () => 'done')
    $.clock.after(5_000, () => {
      void update($, mood, m => (m === 'done' ? 'idle' : m))
    })
    const result = await next(e)
    const t = await $.clock.now()
    await update($, lastRequestAt, () => t)
    await refresh($)

    if (await read($, handoffPending)) {
      await update($, handoffPending, () => false)
      $.clock.after(1_500, () => {
        void finishHandoff($)
      })
      return result
    }

    const u = await read($, usage)
    const comp = await read($, compactions)
    const ctx = u.contextPercent ?? 0
    if (!hasWarned && (ctx >= 70 || comp >= 1)) {
      hasWarned = true
      $.ui.toast('▓ TOKEN//OPT ▓ contexto pesado // usa "Resumir e recomeçar" para poupar', { timeoutMs: 8_000 })
    }
    if (ctx < 40 && comp === 0) hasWarned = false
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) {
      return next(e)
    }
    return drawBand($, $.ui.resolve(e))
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const m = await read($, mood)
    const f = await read($, buddyFrame)
    const Svg = 'Svg' in ui ? ui.Svg : undefined
    return (
      <Box flexDirection="column">
        {Svg ? (
          <Box flexDirection="column" alignItems="center">
            <Svg source={buddySvg(m, f)} alt={'Ember: ' + MOOD_LABEL[m]} width={128} height={128} isInteractive />
            <Text color="#e8835f" bold>EMBER // {MOOD_LABEL[m]}</Text>
          </Box>
        ) : null}
        {await drawPanel($, ui)}
      </Box>
    )
  })

  on('command.run', { command: 'tokens' }, async $ => {
    await update($, isHidden, () => false)
    const { isPlaced } = await $.ui.open({ id: PANE, title: 'TOKEN//OPTIMIZER' })
    const fr = await read($, buddyFrame)
    return {
      text:
        (isPlaced ? 'Painel de tokens aberto.' : 'Painel de tokens pedido (esta superfície pode não mostrar painéis laterais).') +
        ` [diagnóstico: temporizador ${ticks} vezes, pose ${fr}]`,
    }
  })
}
