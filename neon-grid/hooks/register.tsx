import type { Register, ThemeColor, ThemeMessageRule, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// ── Ember Grid: megacidade à noite, preto e laranja, com toques de ciano ──
const ORANGE: ThemeColor = '#ff7a00'
const AMBER: ThemeColor = '#ffc400'
const CYAN: ThemeColor = '#02d7f2'
const RED: ThemeColor = '#ff3355'
const BG: ThemeColor = '#0a0806'
const CARD: ThemeColor = '#120e0a'
const CARD_USER: ThemeColor = '#16110c'

const { theme, problems } = makeColors({
  label: 'Ember Grid',
  only: 'dark',
  roles: { accent: ORANGE, danger: RED, success: '#ffcc66', warning: AMBER, pro: CYAN },
  dark: {
    gray: {
      anchors: {
        'surface-0': BG,
        'surface-1': '#120e0a',
        'surface-2': '#18130e',
        'surface-3': '#1e1812',
        'text-primary': '#f6efe6',
        'text-secondary': '#cfc3b4',
        'text-muted': '#a39684',
      },
    },
    git: { added: '#ffcc66', removed: RED, modified: AMBER, merged: CYAN },
  },
  codeTheme: { dark: 'dracula' },
})

// Fundo: placas laranja em diagonal, circuitos com pulsos a correr, grelha de pontos e faixa de perigo.
function traces(): string {
  // [pontos do caminho, atraso da animação]
  const paths: Array<[string, number]> = [
    ['M0 140H180L230 190H420L450 160H560', 0],
    ['M0 230H120L170 280H300', 2.2],
    ['M1600 760H1420L1370 710H1180L1150 740H1040', 1.1],
    ['M1600 850H1480L1430 800H1300', 3.4],
    ['M260 1000V900L300 860H460L500 820', 0.6],
    ['M1340 0V90L1300 130H1140L1100 170', 2.8],
  ]
  let out = ''
  for (const [d, delay] of paths) {
    out += `<path d="${d}" fill="none" stroke="#ff7a00" stroke-width="2" opacity="0.55"/>`
    out += `<path d="${d}" fill="none" stroke="#ffd29a" stroke-width="3" stroke-linecap="round" class="pulse d${Math.round(delay * 10)}"/>`
  }
  const nodes: Array<[number, number]> = [[560, 160], [300, 280], [1040, 740], [1300, 800], [500, 820], [1100, 170]]
  for (const [x, y] of nodes) {
    out += `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="#0a0806" stroke="#ff7a00" stroke-width="2"/>`
    out += `<rect x="${x - 2}" y="${y - 2}" width="4" height="4" fill="#ffb366" class="node"/>`
  }
  return out
}

function chevrons(x0: number, y: number, count: number): string {
  let out = ''
  for (let i = 0; i < count; i++) {
    const x = x0 + i * 38
    out += `<path d="M${x} ${y}h18l16 16-16 16h-18l16-16z" fill="#0a0806"/>`
  }
  return out
}

const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#2a1203"/><stop offset="0.45" stop-color="#0c0805"/><stop offset="0.6" stop-color="#0c0805"/><stop offset="1" stop-color="#331502"/>
</linearGradient>
<linearGradient id="slab" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#ff5e00"/><stop offset="1" stop-color="#ff9a1f"/>
</linearGradient>
<radialGradient id="glowA" cx="0" cy="1" r="0.9">
<stop offset="0" stop-color="#ff7a00" stop-opacity="0.55"/><stop offset="1" stop-color="#ff7a00" stop-opacity="0"/>
</radialGradient>
<radialGradient id="glowB" cx="1" cy="0" r="0.8">
<stop offset="0" stop-color="#ff7a00" stop-opacity="0.45"/><stop offset="1" stop-color="#ff7a00" stop-opacity="0"/>
</radialGradient>
<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
<rect x="11" y="11" width="2" height="2" fill="#ff7a00" opacity="0.22"/>
</pattern>
<clipPath id="band"><rect x="560" y="976" width="1040" height="24"/></clipPath>
<pattern id="hazard" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
<rect width="20" height="40" fill="#ff7a00"/><rect x="20" width="20" height="40" fill="#0a0806"/>
</pattern>
</defs>
<style>
.pulse { stroke-dasharray: 26 900; animation: run 5s linear infinite; }
.d6 { animation-delay: 0.6s; } .d11 { animation-delay: 1.1s; } .d22 { animation-delay: 2.2s; } .d28 { animation-delay: 2.8s; } .d34 { animation-delay: 3.4s; }
@keyframes run { from { stroke-dashoffset: 926; } to { stroke-dashoffset: 0; } }
.node { animation: glow 3s ease-in-out infinite; }
@keyframes glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.breathe { animation: breathe 8s ease-in-out infinite; }
@keyframes breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
.slide { animation: slide 10s linear infinite; }
@keyframes slide { from { transform: translateX(0); } to { transform: translateX(-56.6px); } }
.sweep { animation: sweep 12s ease-in-out infinite; }
@keyframes sweep { 0% { transform: translateX(-300px); opacity: 0; } 20% { opacity: 0.5; } 60% { opacity: 0.5; } 100% { transform: translateX(1700px); opacity: 0; } }
</style>
<rect width="1600" height="1000" fill="url(#bg)"/>
<rect width="1600" height="1000" fill="url(#glowA)" class="breathe"/>
<rect width="1600" height="1000" fill="url(#glowB)" class="breathe"/>
<rect width="1600" height="1000" fill="url(#dots)"/>
<path d="M0 640L420 1000H0Z" fill="url(#slab)"/>
<path d="M0 600L470 1000H440L0 626Z" fill="#ffb366" opacity="0.8"/>
<path d="M0 560L520 1000H506L0 572Z" fill="#ff7a00" opacity="0.5"/>
<g>${chevrons(24, 930, 5)}</g>
<path d="M1600 0V330L1220 0Z" fill="url(#slab)"/>
<path d="M1170 0H1196L1600 352V376Z" fill="#ffb366" opacity="0.8"/>
<path d="M1120 0H1134L1600 404V416Z" fill="#ff7a00" opacity="0.5"/>
<g fill="#0a0806" opacity="0.85">
<rect x="1470" y="40" width="90" height="6"/><rect x="1500" y="56" width="60" height="6"/><rect x="1530" y="72" width="30" height="6"/>
</g>
${traces()}
<g clip-path="url(#band)"><rect class="slide" x="560" y="976" width="1100" height="24" fill="url(#hazard)"/></g>
<rect x="560" y="972" width="1040" height="2" fill="#ff7a00"/>
<rect x="0" y="420" width="1600" height="1" fill="#02d7f2" opacity="0.35"/>
<rect class="sweep" x="0" y="419" width="220" height="3" fill="#02d7f2"/>
<g fill="none" stroke="#ff7a00" stroke-width="3">
<path d="M28 96V28H96"/><path d="M1504 972H1572V904" opacity="0"/>
</g>
<g fill="#ff7a00">
<rect x="110" y="26" width="70" height="4"/><rect x="188" y="26" width="16" height="4"/><rect x="26" y="110" width="4" height="40"/>
</g>
</svg>`

// Cartão com cantos cortados (sup. esquerdo e inf. direito) e uma aba na aresta de cima.
function plate(edge: ThemeColor, fill: ThemeColor, tab: ThemeColor): ThemeMessageRule['fill'] {
  return {
    vector: {
      viewBox: 96,
      slice: 28,
      paths: [
        { d: 'M16 0H96V80L80 96H0V16Z', color: edge },
        { d: 'M16.6 1.5H94.5V79.4L79.4 94.5H1.5V16.6Z', color: fill },
        { d: 'M20 0H44L42 3H22Z', color: tab },
      ],
    },
  }
}


// Fundo desenhado pela app, animado trocando fotogramas com $.theme.set.
type VPath = { d: string; color: ThemeColor; strokeWidth?: number }

const FRAMES = 30
const FRAME_MS = 200

const f1 = (n: number) => n.toFixed(1)

function rng(seed: number): () => number {
  let x = (seed * 2654435761) % 4294967296
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296
    return x / 4294967296
  }
}

function rect(x: number, y: number, w: number, h: number): string {
  return `M${f1(x)} ${f1(y)}h${f1(w)}v${f1(h)}h${f1(-w)}z`
}

// Megaestrutura em brasa: torres em diagonal, escuro à esquerda e laranja à direita,
// linhas de glitch, luzes pequenas e toques de vermelho.
const SKEW = 0.3 // quanto as estruturas inclinam para a direita ao subir

function sx(x: number, y: number): number {
  return x + (160 - y) * SKEW
}

// Paralelogramo: uma "torre" vertical de x a x+w, de y0 até ao fundo, inclinada.
function slab(x: number, w: number, y0: number, y1 = 166): string {
  return `M${f1(sx(x, y1))} ${f1(y1)}L${f1(sx(x, y0))} ${f1(y0)}H${f1(sx(x + w, y0))}L${f1(sx(x + w, y1))} ${f1(y1)}Z`
}

function hline(x: number, y: number, len: number): string {
  return `M${f1(sx(x, y))} ${f1(y)}h${f1(len)}`
}

type Tower = { x: number; w: number; top: number; layer: number }

const TOWERS: Tower[] = (() => {
  const r = rng(2077)
  const out: Tower[] = []
  for (let layer = 0; layer < 3; layer++) {
    for (let x = -80; x < 256; ) {
      const w = 3 + r() * (layer === 2 ? 14 : 9)
      out.push({ x, w, top: -10 + r() * (layer === 0 ? 60 : layer === 1 ? 90 : 120), layer })
      x += w + r() * (layer === 2 ? 10 : 4)
    }
  }
  return out
})()

function ground(frame: number): ThemeSetArgs['backdrop'] {
  const t = frame / FRAMES
  const paths: VPath[] = []

  // fundo: preto à esquerda a passar a laranja vivo à direita, em bandas diagonais
  paths.push({ d: 'M0 0H256V160H0Z', color: '#070302' })
  const bands: Array<[number, string]> = [
    [60, '#3a120418'], [90, '#5a1a0524'], [115, '#8a2a0630'], [138, '#c0400a40'],
    [158, '#ff5a0050'], [175, '#ff6a0070'], [190, '#ff7a1090'], [205, '#ff8a20b0'],
    [220, '#ff9a30d0'], [236, '#ffb050e0'],
  ]
  const pulse = 0.85 + 0.15 * Math.sin(t * Math.PI * 2)
  for (const [x, c] of bands) {
    const alpha = Math.round(parseInt(c.slice(7), 16) * pulse).toString(16).padStart(2, '0')
    paths.push({ d: `M${sx(x, 166)} 166L${sx(x, -6)} -6H330V166Z`, color: `${c.slice(0, 7)}${alpha}` as ThemeColor })
  }

  // torres: três camadas de profundidade
  const lr = rng(77)
  const tw = ['', '', '']
  const edge = ['', '']
  let lit = ''
  for (const T of TOWERS) {
    if (T.x > 150 && T.layer > 0) lit += slab(T.x, T.w, T.top)
    else tw[T.layer] += slab(T.x, T.w, T.top)
    if (T.layer > 0 && lr() < 0.5) edge[T.layer - 1] += `M${f1(sx(T.x, 166))} 166L${f1(sx(T.x, T.top))} ${f1(T.top)}`
  }
  paths.push({ d: tw[0]!, color: '#1a0a0488' })
  paths.push({ d: tw[1]!, color: '#0d0503bb' })
  paths.push({ d: edge[0]!, strokeWidth: 0.6, color: '#ff7a0055' })
  paths.push({ d: tw[2]!, color: '#060201dd' })
  paths.push({ d: lit, color: '#3a120366' })
  paths.push({ d: edge[1]!, strokeWidth: 0.8, color: (frame % 3 === 0 ? '#ffb366cc' : '#ff9a1f88') as ThemeColor })

  // nervuras horizontais nas torres (estáticas)
  const nr = rng(31)
  let ribs = ''
  let ribsHot = ''
  for (let i = 0; i < 160; i++) {
    const T = TOWERS[Math.floor(nr() * TOWERS.length)]!
    const y = T.top + 2 + nr() * (160 - T.top)
    const seg = hline(T.x + 0.5, y, Math.max(1, T.w - 1) * (0.4 + nr() * 0.6))
    if (nr() < 0.18) ribsHot += seg
    else ribs += seg
  }
  paths.push({ d: ribs, strokeWidth: 0.5, color: '#ff6a0066' })
  paths.push({ d: ribsHot, strokeWidth: 0.6, color: '#ffb366aa' })

  // toques de vermelho
  paths.push({ d: slab(128, 2, 62, 112) + slab(160, 1.2, 30, 92), color: '#ff1e2e55' })
  paths.push({ d: slab(66, 0.8, 104, 150) + slab(182, 0.8, 24, 70), color: '#ff2a3a99' })

  // luzes pequenas: estáticas + a piscar
  const wr = rng(909)
  const fr = rng(frame * 31 + 1)
  let lights = ''
  let lightsWarm = ''
  let twinkle = ''
  for (let i = 0; i < 220; i++) {
    const T = TOWERS[Math.floor(wr() * TOWERS.length)]!
    const y = T.top + 2 + wr() * (158 - T.top)
    const x = sx(T.x + wr() * T.w, y)
    const sq1 = rect(x, y, 0.7, 0.7)
    const kind = wr()
    if (fr() < 0.06) twinkle += rect(x - 0.3, y - 0.3, 1.3, 1.3)
    else if (kind < 0.25) lights += sq1
    else lightsWarm += sq1
  }
  paths.push({ d: lights, color: '#fff3e0cc' })
  paths.push({ d: lightsWarm, color: '#ffb36699' })
  if (twinkle) paths.push({ d: twinkle, color: '#ffffff' })

  // linhas de glitch: mudam a cada fotograma
  const gr = rng(frame * 131 + 17)
  let gO = ''
  let gR = ''
  let gW = ''
  for (let i = 0; i < 80; i++) {
    const y = gr() * 160
    const x = gr() * 300 - 40
    const len = 3 + gr() * (gr() < 0.15 ? 60 : 18)
    const seg = `M${f1(x)} ${f1(y)}h${f1(len)}`
    const k = gr()
    if (k < 0.55) gO += seg
    else if (k < 0.75) gR += seg
    else gW += seg
  }
  paths.push({ d: gO, strokeWidth: 0.5, color: '#ff7a00aa' })
  paths.push({ d: gR, strokeWidth: 0.5, color: '#ff3344aa' })
  paths.push({ d: gW, strokeWidth: 0.4, color: '#fff1dd99' })

  // pulsos de energia a subir pelas arestas das torres
  let pulses = ''
  const pr = rng(555)
  let pulsesRed = ''
  for (let i = 0; i < 34; i++) {
    const T = TOWERS[Math.floor(pr() * TOWERS.length)]!
    if (T.layer === 0) continue
    const span = 166 - T.top
    const len = 5 + pr() * 10
    const y = 166 - ((pr() + t * (1 + Math.floor(pr() * 3))) % 1) * span
    const seg = `M${f1(sx(T.x, y))} ${f1(y)}L${f1(sx(T.x, y - len))} ${f1(y - len)}`
    if (i % 5 === 0) pulsesRed += seg
    else pulses += seg
  }
  paths.push({ d: pulses, strokeWidth: 1, color: '#ffe0b8' })
  paths.push({ d: pulsesRed, strokeWidth: 1, color: '#ff4455' })

  // faíscas a subir do lado laranja, inclinadas como as torres
  const er = rng(8080)
  let sparks = ''
  let sparksHot = ''
  for (let i = 0; i < 40; i++) {
    const baseX = 120 + er() * 150
    const speed = 1 + Math.floor(er() * 3)
    const y = 170 - ((er() + t * speed) % 1) * 180
    const x = sx(baseX, y)
    const sz = 0.6 + er() * 0.9
    const tail = `M${f1(x)} ${f1(y)}L${f1(x - SKEW * 4)} ${f1(y + 4)}`
    if (i % 4 === 0) sparksHot += rect(x - sz / 2, y - sz / 2, sz, sz)
    else sparks += tail
  }
  paths.push({ d: sparks, strokeWidth: 0.6, color: '#ffc27acc' })
  paths.push({ d: sparksHot, color: '#fff6e8' })

  // rajadas de dados: faixas horizontais curtas que aparecem e somem
  const dr = rng(Math.floor(frame / 3) * 17 + 3)
  let burst = ''
  for (let i = 0; i < 3; i++) {
    const y = 10 + dr() * 140
    const x = dr() * 200
    const n = 6 + Math.floor(dr() * 10)
    for (let j = 0; j < n; j++) if (dr() < 0.7) burst += rect(x + j * 3, y, 2, 0.7)
  }
  if (burst) paths.push({ d: burst, color: frame % 3 === 1 ? '#02d7f2aa' : '#ff9a1fcc' })

  // um feixe de luz que varre na diagonal, da esquerda para a direita
  for (let i = 0; i < 2; i++) {
    const bx = -60 + ((t * (i ? 2 : 1) + i * 0.45) % 1) * 380
    const bw = i ? 3 : 8
    paths.push({ d: `M${f1(sx(bx, 166))} 166L${f1(sx(bx, -6))} -6h${bw}L${f1(sx(bx + bw, 166))} 166Z`, color: i ? '#ff7a0022' : '#ffb36620' })
    paths.push({ d: `M${f1(sx(bx + bw / 2, 166))} 166L${f1(sx(bx + bw / 2, -6))} -6`, strokeWidth: 0.6, color: i ? '#ff9a1f99' : '#ffd29a77' })
  }

  // linha preta grossa (como uma viga) que corta a cena
  paths.push({ d: `M${f1(150 + (frame % 4 === 0 ? 1.5 : 0))} 96h46`, strokeWidth: 2.2, color: '#050201' })

  return { vector: { viewBox: [256, 160], paths } }
}

// Teste: uma cena animada mínima, para ver se esta app mostra movimento contínuo.
const TEST_SCENE = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
.ball { animation: move 4s ease-in-out infinite alternate; }
@keyframes move { from { transform: translateX(0); } to { transform: translateX(1200px); } }
</style>
<rect width="1600" height="1000" fill="#200c00"/>
<circle class="ball" cx="200" cy="500" r="120" fill="#ff7a00"/>
</svg>`

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: ground(0),
  style: {
    Text: { fontFamily: ['code'], fontSize: 14, lineHeight: 23, letterSpacing: 0.5, color: '#ffe4c4' },
    Heading: { color: ORANGE, fontFamily: ['code'], fontWeight: 'bold', fontSize: 19, lineHeight: 30, letterSpacing: 4 },
    UserMessage: {
      color: '#f6efe6',
      backgroundColor: CARD_USER,
      fill: plate(CYAN, CARD_USER, CYAN),
      paddingX: 10,
      paddingY: 10,
      shadow: { x: 0, y: 0, blur: 12, color: '#02d7f233' },
    },
    AssistantMessage: {
      color: '#f6efe6',
      backgroundColor: CARD,
      fill: plate(ORANGE, CARD, AMBER),
      paddingX: 10,
      paddingY: 12,
      paddingTop: 16,
      shadow: { x: 0, y: 0, blur: 18, color: '#ff7a0040' },
    },
    ToolUse: { color: '#02d7f2', fontFamily: ['code'], backgroundColor: '#0a0806f2', radius: 0, paddingX: 8 },
  },
}

export const register: Register = on => {
  let lastResult = 'ainda não aplicado'
  let frame = 0
  let isAnimated = true
  let isTesting = false
  let timer: { cancel: () => void } | undefined
  let backdropDraws = 0
  let lastSurface = '-'

  on('command.run', { command: 'tema' }, async ($, e) => {
    const arg = e.args.trim()
    if (arg === 'teste') {
      isAnimated = false
      isTesting = true
      const set = await $.theme.set({ ...LOOK, backdrop: { scene: 'teste' } })
      return { text: 'Teste ligado: deves ver uma bola laranja a deslizar num fundo castanho. ' + (set.isDrawn ? '' : 'NÃO desenhado: ' + set.reason) + ' Escreve /tema animar para voltar.' }
    }
    if (arg === 'parar' || arg === 'animar') {
      isTesting = false
      isAnimated = arg === 'animar'
      return { text: isAnimated ? 'Animação do fundo ligada.' : 'Animação do fundo parada.' }
    }
    const surfaces = await $.session.surfaces()
    let reapplied = ''
    try {
      const set = await $.theme.set(LOOK)
      reapplied = set.isDrawn ? 'desenhado (requestId ' + set.requestId + ')' : 'NÃO desenhado: ' + set.reason
    } catch (error) {
      reapplied = 'erro: ' + String(error)
    }
    const blocking = problems.filter(line => line.startsWith("Desktop won't paint"))
    return {
      text: [
        'Ember Grid — diagnóstico',
        'superfícies ligadas: ' + (surfaces.length ? surfaces.join(', ') : 'nenhuma'),
        'no arranque: ' + lastResult,
        'agora: ' + reapplied,
        'fundo desenhado ' + backdropDraws + ' vez(es), última superfície: ' + lastSurface,
        'bloqueios de cor: ' + (blocking.length ? blocking.join(' | ') : 'nenhum'),
        'tamanho da cena: ' + SCENE.length + ' caracteres',
      ].join('\n'),
    }
  })

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'tema', description: 'Tema Ember Grid: diagnóstico; /tema parar ou /tema animar' })
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    try {
      const set = await $.theme.set(LOOK)
      timer?.cancel()
      timer = $.clock.every(FRAME_MS, () => {
        if (!isAnimated) return
        frame = (frame + 1) % FRAMES
        void $.theme.set({ ...LOOK, backdrop: ground(frame) }).catch(() => undefined)
      })
      lastResult = set.isDrawn ? 'desenhado' : 'NÃO desenhado: ' + set.reason
    } catch (error) {
      // Build sem suporte de `style`: aplica só as cores e a cena.
      lastResult = 'erro com style, sem style: ' + String(error)
      $.ui.log(String(error))
      await $.theme.set({ colors: theme, backdrop: LOOK.backdrop })
    }
    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    backdropDraws += 1
    lastSurface = e.surface
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    if (isTesting) return <Svg source={TEST_SCENE} alt="Teste: bola laranja a deslizar" isInteractive />
    return <Svg source={SCENE} alt="Placas laranja em diagonal, circuitos com pulsos de luz e uma faixa de perigo a deslizar" isInteractive />
  })
}
