// Ember: uma criaturinha em pixel art que mostra o que o Claude está a fazer.
// A app desenha a imagem parada, por isso a animação é feita aqui: cada `frame`
// é uma pose, e o painel redesenha-o várias vezes por segundo.
import type { Mood } from '../types'

export const MOOD_LABEL: Record<Mood, string> = {
  idle: 'à espera',
  thinking: 'a pensar…',
  terminal: 'a correr comandos',
  building: 'a editar código',
  reading: 'a ler ficheiros',
  searching: 'a pesquisar',
  error: 'algo falhou',
  done: 'feito!',
  compacting: 'a compactar a conversa',
}

const ORANGE = '#ff7a00'
const DARK = '#1a0c03'
const LIGHT = '#ffd29a'
const CYAN = '#02d7f2'
const CORAL = '#e8835f'
const CORAL_LIGHT = '#f4a989'
const CHEEK = '#ff9f8a'
const WOOD = '#8a4a1a'

// Grelha de 32×32 "pixéis"; cada pixel são 4 unidades.
function px(x: number, y: number, w: number, h: number, fill: string): string {
  return `<rect x="${x * 4}" y="${y * 4}" width="${w * 4}" height="${h * 4}" fill="${fill}"/>`
}

function eyes(mood: Mood, frame: number, lookX: number): string {
  if (mood === 'error') {
    const x = (cx: number) =>
      px(cx, 11, 1, 1, DARK) + px(cx + 2, 11, 1, 1, DARK) + px(cx + 1, 12, 1, 1, DARK) + px(cx, 13, 1, 1, DARK) + px(cx + 2, 13, 1, 1, DARK)
    return x(11) + x(18)
  }
  if (mood === 'done') {
    const arc = (cx: number) => px(cx, 13, 1, 1, DARK) + px(cx + 1, 12, 1, 1, DARK) + px(cx + 2, 13, 1, 1, DARK)
    return arc(11) + arc(18)
  }
  const isBlink = mood === 'idle' ? frame % 14 === 0 : frame % 22 === 0
  if (isBlink) return px(12 + lookX, 13, 2, 1, DARK) + px(18 + lookX, 13, 2, 1, DARK)
  return (
    px(12 + lookX, 11, 2, 4, DARK) +
    px(18 + lookX, 11, 2, 4, DARK) +
    px(12 + lookX, 11, 1, 1, LIGHT) +
    px(18 + lookX, 11, 1, 1, LIGHT)
  )
}

function critter(mood: Mood, frame: number, armDy: number, lookX: number): string {
  const earColor = mood === 'thinking' && frame % 2 === 0 ? CYAN : CORAL
  const legShift = mood === 'terminal' || mood === 'building' ? frame % 2 : 0
  return [
    px(9, 5, 3, 3, earColor),
    px(20, 5, 3, 3, earColor),
    px(9, 7, 14, 1, CORAL),
    px(8, 8, 16, 12, CORAL),
    px(7, 9, 1, 10, CORAL),
    px(24, 9, 1, 10, CORAL),
    px(9, 8, 6, 1, CORAL_LIGHT),
    px(10, 16, 2, 1, CHEEK),
    px(20, 16, 2, 1, CHEEK),
    eyes(mood, frame, lookX),
    px(4, 13 + armDy, 3, 3, CORAL),
    px(25, 13 - armDy, 3, 3, CORAL),
    px(11, 20, 3, 4 - legShift, CORAL),
    px(18, 20, 3, 3 + legShift, CORAL),
  ].join('')
}


// Movimento contínuo para superfícies que correm animações CSS (modo interativo).
const STYLE = [
  '.m-idle,.m-thinking,.m-terminal,.m-building,.m-reading,.m-searching,.m-error,.m-done,.m-compacting{transform-box:view-box;transform-origin:64px 96px}',
  '.m-idle{animation:bob 2.4s ease-in-out infinite}',
  '.m-thinking{animation:bob 1.2s ease-in-out infinite}',
  '.m-searching{animation:bob 1.2s ease-in-out infinite}',
  '.m-terminal,.m-building{animation:bob .4s ease-in-out infinite}',
  '.m-reading{animation:sway 2s ease-in-out infinite alternate}',
  '.m-error{animation:shake .3s linear infinite}',
  '.m-done{animation:jump .8s ease-out infinite}',
  '.m-compacting{animation:squish 1.2s ease-in-out infinite}',
  '@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
  '@keyframes sway{from{transform:translateX(-4px)}to{transform:translateX(4px)}}',
  '@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}',
  '@keyframes jump{0%,100%{transform:translateY(0)}40%{transform:translateY(-18px)}}',
  '@keyframes squish{0%,100%{transform:scale(1,1)}50%{transform:scale(1.2,.7)}}',
].join('')

const BOB = [0, -1, -2, -1]
const JUMP = [0, -6, -9, -6, -2, 0]

export function buddySvg(mood: Mood, frame = 0): string {
  let dx = 0
  let dy = 0
  let sx = 1
  let sy = 1
  let armDy = 0
  let lookX = 0
  let back = ''
  let front = ''

  switch (mood) {
    case 'idle':
      dy = BOB[Math.floor(frame / 2) % 4]!
      break
    case 'thinking': {
      dy = BOB[frame % 4]!
      const n = frame % 4
      for (let i = 0; i < n; i++) front += px(22 + i * 3, 2 - i, 2, 2, LIGHT)
      break
    }
    case 'terminal': {
      dy = frame % 2 ? -1 : 0
      armDy = frame % 2 ? 1 : -1
      const off = (frame % 4) * 2
      const lines = [10, 14, 7, 12, 9, 13]
      let txt = ''
      for (let i = 0; i < 3; i++) {
        const w = lines[(i + Math.floor(off / 2)) % lines.length]!
        txt += px(8, 21 + i * 2, w, 1, i % 2 ? LIGHT : ORANGE)
      }
      front = px(6, 19, 20, 9, DARK) + `<rect x="24" y="76" width="80" height="36" fill="none" stroke="${ORANGE}" stroke-width="2"/>` + txt
      if (frame % 2 === 0) front += px(8 + (lines[0]! % 12), 27, 2, 1, LIGHT)
      break
    }
    case 'building': {
      dy = frame % 2 ? -1 : 0
      const angle = frame % 2 ? 25 : -35
      front =
        `<g transform="rotate(${angle} 104 72)">${px(26, 10, 1, 9, LIGHT)}${px(24, 8, 5, 3, WOOD)}</g>` +
        px(22, 27, 10, 2, WOOD) +
        (frame % 2 ? px(29, 25, 1, 1, LIGHT) + px(31, 26, 1, 1, ORANGE) : '')
      break
    }
    case 'reading': {
      const pos = [-4, -2, 0, 2, 4, 2, 0, -2][frame % 8]!
      lookX = pos > 1 ? 1 : pos < -1 ? -1 : 0
      const cx = 92 + pos * 4
      front = `<circle cx="${cx}" cy="60" r="10" fill="${CYAN}33" stroke="${LIGHT}" stroke-width="3"/><rect x="${cx + 4}" y="68" width="8" height="20" fill="${LIGHT}"/>`
      break
    }
    case 'searching': {
      dy = BOB[frame % 4]!
      for (let i = 0; i < 3; i++) {
        const r = ((frame * 6 + i * 16) % 48) + 6
        const a = Math.max(0, 1 - r / 54)
        back += `<circle cx="64" cy="22" r="${r}" fill="none" stroke="${CYAN}" stroke-opacity="${a.toFixed(2)}" stroke-width="2"/>`
      }
      break
    }
    case 'error':
      dx = frame % 2 ? 3 : -3
      break
    case 'done': {
      dy = JUMP[frame % JUMP.length]!
      const on = frame % 2 === 0
      front = on
        ? px(3, 4, 2, 2, LIGHT) + px(28, 18, 1, 1, LIGHT) + px(27, 6, 1, 1, ORANGE)
        : px(27, 6, 2, 2, ORANGE) + px(5, 20, 1, 1, LIGHT) + px(4, 9, 1, 1, ORANGE)
      break
    }
    case 'compacting': {
      const squash = [1, 0.9, 0.75, 0.9][frame % 4]!
      sy = squash
      sx = 2 - squash
      break
    }
  }

  // Encolher/esticar a partir dos pés (y = 96).
  const t = `translate(${dx * 4 + 64 * (1 - sx)} ${dy * 4 + 96 * (1 - sy)}) scale(${sx} ${sy})`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><style>${STYLE}</style>${back}<g class="m-${mood}"><g transform="${t}">${critter(mood, frame, armDy, lookX)}</g></g>${front}</svg>`
}

export function moodForTool(tool: string): Mood {
  if (tool === 'Bash' || tool === 'BashOutput' || tool === 'KillShell') return 'terminal'
  if (tool === 'Edit' || tool === 'Write' || tool === 'MultiEdit' || tool === 'NotebookEdit') return 'building'
  if (tool === 'Read' || tool === 'Grep' || tool === 'Glob') return 'reading'
  return 'searching'
}

// Versão em texto, para sítios que não mostram imagens: uma pose por fotograma.
export function buddyText(mood: Mood, frame: number): string {
  const blink = frame % 12 === 0
  const face = mood === 'error' ? '▛✕✕▜' : mood === 'done' ? '▛^^▜' : blink ? '▛--▜' : '▛▪▪▜'
  const bob = ['', ' ', '  ', ' '][frame % 4]!
  switch (mood) {
    case 'idle':
      return (['', ' ', '  ', ' '][Math.floor(frame / 2) % 4]!) + face
    case 'thinking':
      return bob + face + ' ' + ['·  ', '·· ', '···', '   '][frame % 4]!
    case 'terminal':
      return face + ' ' + ['▮▯▯', '▯▮▯', '▯▯▮', '▯▮▯'][frame % 4]!
    case 'building':
      return face + (frame % 2 ? ' ⚒' : ' ✦')
    case 'reading':
      return face + ['⌕  ', ' ⌕ ', '  ⌕', ' ⌕ '][frame % 4]!
    case 'searching':
      return ['(' + face + ')', '((' + face + '))', '(((' + face + ')))', ' ' + face + ' '][frame % 4]!
    case 'error':
      return (frame % 2 ? '  ' : '') + face
    case 'done':
      return (frame % 2 ? '\\' : '✦') + face + (frame % 2 ? '/' : '✦')
    case 'compacting':
      return ['▛▪▪▜', '▄▪▪▄', '▁▪▪▁', '▄▪▪▄'][frame % 4]!
  }
}

// Ember em blocos de cor (meio-bloco = 2 píxeis por célula), para sítios sem imagens.
// Devolve linhas de texto; cada segmento tem caráter, cor e fundo.
export type PixelSeg = { text: string; color?: string; bg?: string }

const SPRITE = [
  '.CC....CC.',
  'CCCCCCCCCC',
  'CCKCCCCKCC',
  'CCKCCCCKCC',
  'CPCCCCCCPC',
  'CCCCCCCCCC',
  '.CC....CC.',
  '.CC....CC.',
]

export function buddyPixels(mood: Mood, frame: number): PixelSeg[][] {
  const W = 14
  const H = 10
  const grid: (string | null)[][] = Array.from({ length: H }, () => Array<string | null>(W).fill(null))
  const bobs = mood === 'done' ? [2, 0, 0, 1] : [2, 1, 1, 2]
  const fast = mood === 'terminal' || mood === 'building' || mood === 'done' || mood === 'error'
  const oy = mood === 'idle' ? bobs[Math.floor(frame / 2) % 4]! : bobs[frame % 4]!
  const ox = 2 + (mood === 'error' ? (frame % 2 ? 1 : -1) : mood === 'reading' ? [0, 0, 1, 1][frame % 4]! - 0 : 0)
  const blink = !fast && frame % 12 === 0
  const squash = mood === 'compacting' ? frame % 4 : 0
  const ear = mood === 'thinking' && frame % 2 === 0 ? CYAN : CORAL
  const eye = mood === 'error' ? '#ff3355' : DARK

  SPRITE.forEach((row, y) => {
    if (squash === 2 && y === 1) return
    const yy = oy + y + (squash === 2 && y > 1 ? -1 : 0)
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!
      if (ch === '.') continue
      let c = CORAL
      if (ch === 'P') c = CHEEK
      if (ch === 'K') {
        if (blink || (mood === 'done' && y === 3)) c = CORAL
        else c = eye
      }
      if (y === 0) c = ear
      const xx = ox + x
      if (yy >= 0 && yy < H && xx >= 0 && xx < W) grid[yy]![xx] = c
    }
  })
  // bracinhos (sobem e descem quando está a trabalhar)
  const armY = oy + 3 + (fast && frame % 2 ? -1 : 0)
  for (const ax of [ox - 1, ox + 10]) if (ax >= 0 && ax < W && armY >= 0 && armY < H) grid[armY]![ax] = CORAL
  // extras por estado
  if (mood === 'thinking') for (let i = 0; i < frame % 4; i++) grid[Math.max(0, oy - 1 - i)]![ox + 10 + i < W ? ox + 10 + i : W - 1] = LIGHT
  if (mood === 'done' && frame % 2 === 0) {
    grid[0]![0] = LIGHT
    grid[1]![W - 1] = ORANGE
  }
  if (mood === 'searching') {
    const r = frame % 3
    for (let y = 2; y < 8; y++) {
      if (ox - 2 - r >= 0) grid[y]![ox - 2 - r] = y % 2 ? CYAN : null
      if (ox + 11 + r < W) grid[y]![ox + 11 + r] = y % 2 ? CYAN : null
    }
  }

  const lines: PixelSeg[][] = []
  for (let y = 0; y < H; y += 2) {
    const segs: PixelSeg[] = []
    for (let x = 0; x < W; x++) {
      const top = grid[y]![x]
      const bot = grid[y + 1]![x]
      let seg: PixelSeg
      if (!top && !bot) seg = { text: ' ' }
      else if (top && bot && top === bot) seg = { text: '█', color: top }
      else if (top && !bot) seg = { text: '▀', color: top }
      else if (!top && bot) seg = { text: '▄', color: bot }
      else seg = { text: '▀', color: top!, bg: bot! }
      const last = segs[segs.length - 1]
      if (last && last.color === seg.color && last.bg === seg.bg && (last.text[0] === seg.text)) last.text += seg.text
      else segs.push(seg)
    }
    lines.push(segs)
  }
  return lines
}

// Carinha numa só linha (sem espaços entre linhas): fundo coral com olhos.
export function buddyChip(mood: Mood, frame: number): PixelSeg[] {
  const fast = mood === 'terminal' || mood === 'building' || mood === 'error'
  const blink = !fast && mood !== 'done' && frame % 12 === 0
  const eye =
    mood === 'error' ? '×' : mood === 'done' ? '^' : blink ? '-' : mood === 'reading' ? (frame % 4 < 2 ? '◂' : '▸') : '●'
  const eyeColor = mood === 'error' ? '#ff3355' : DARK
  const ear = mood === 'thinking' && frame % 2 === 0 ? CYAN : CORAL
  const lead = mood === 'error' ? (frame % 2 ? ' ' : '') : mood === 'idle' ? (Math.floor(frame / 3) % 2 ? ' ' : '') : frame % 2 && fast ? ' ' : ''
  const segs: PixelSeg[] = []
  if (lead) segs.push({ text: lead })
  segs.push({ text: '▐', color: ear })
  segs.push({ text: ' ', bg: CORAL })
  segs.push({ text: eye, color: eyeColor, bg: CORAL })
  segs.push({ text: mood === 'done' ? '‿' : ' ', color: DARK, bg: CORAL })
  segs.push({ text: eye, color: eyeColor, bg: CORAL })
  segs.push({ text: ' ', bg: CORAL })
  segs.push({ text: '▌', color: ear })
  const extra =
    mood === 'thinking' ? ['·  ', '·· ', '···', '   '][frame % 4]!
    : mood === 'terminal' ? ['▮▯▯', '▯▮▯', '▯▯▮', '▯▮▯'][frame % 4]!
    : mood === 'building' ? (frame % 2 ? '⚒ ' : '✦ ')
    : mood === 'searching' ? [')  ', ')) ', ')))', '   '][frame % 4]!
    : mood === 'done' ? (frame % 2 ? '✦ ' : ' ✦')
    : mood === 'compacting' ? ['▁▂▃', '▂▃▁', '▃▁▂'][frame % 3]!
    : '   '
  segs.push({ text: ' ' + extra, color: mood === 'searching' ? CYAN : LIGHT })
  return segs
}
