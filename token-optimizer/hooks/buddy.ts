// Ember: um pequeno robô em pixel art que mostra o que o Claude está a fazer.
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
const RED = '#ff3355'

// Grelha de 32×32 "pixéis"; cada pixel é 4 unidades.
function px(x: number, y: number, w: number, h: number, fill: string, cls = ''): string {
  return `<rect x="${x * 4}" y="${y * 4}" width="${w * 4}" height="${h * 4}" fill="${fill}"${cls ? ` class="${cls}"` : ''}/>`
}

function body(eyes: string): string {
  return [
    // antena
    px(15, 3, 2, 4, ORANGE),
    px(14, 1, 4, 3, LIGHT, 'tip'),
    // cabeça/corpo
    px(8, 7, 16, 14, ORANGE),
    px(9, 8, 14, 1, LIGHT),
    // visor
    px(10, 10, 12, 7, DARK),
    eyes,
    // braços
    px(5, 12, 3, 6, ORANGE, 'arm-l'),
    px(24, 12, 3, 6, ORANGE, 'arm-r'),
    // pernas
    px(10, 21, 3, 4, ORANGE, 'leg-l'),
    px(19, 21, 3, 4, ORANGE, 'leg-r'),
    px(9, 25, 5, 1, DARK),
    px(18, 25, 5, 1, DARK),
  ].join('')
}

const NORMAL_EYES = `<g class="eyes">${px(12, 12, 3, 3, LIGHT)}${px(17, 12, 3, 3, LIGHT)}</g>`
const X_EYES = `<g>${px(12, 12, 1, 1, RED)}${px(14, 12, 1, 1, RED)}${px(13, 13, 1, 1, RED)}${px(12, 14, 1, 1, RED)}${px(14, 14, 1, 1, RED)}${px(17, 12, 1, 1, RED)}${px(19, 12, 1, 1, RED)}${px(18, 13, 1, 1, RED)}${px(17, 14, 1, 1, RED)}${px(19, 14, 1, 1, RED)}</g>`
const HAPPY_EYES = `<g>${px(12, 13, 1, 1, LIGHT)}${px(13, 12, 1, 1, LIGHT)}${px(14, 13, 1, 1, LIGHT)}${px(17, 13, 1, 1, LIGHT)}${px(18, 12, 1, 1, LIGHT)}${px(19, 13, 1, 1, LIGHT)}</g>`

const STYLE = `
.bot { transform-box: view-box; transform-origin: 64px 100px; }
.idle .bot { animation: bob 2.4s ease-in-out infinite; }
.idle .eyes { animation: blink 4s steps(1) infinite; transform-box: fill-box; transform-origin: center; }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes blink { 0%, 92%, 100% { transform: scaleY(1); } 94% { transform: scaleY(0.1); } }
.thinking .bot { animation: bob 1.6s ease-in-out infinite; }
.thinking .tip { animation: glow 0.9s steps(1) infinite; }
@keyframes glow { 0%, 100% { fill: #ffd29a; } 50% { fill: #02d7f2; } }
.dot { opacity: 0; animation: dot 1.5s steps(1) infinite; }
.d2 { animation-delay: 0.5s; }
.d3 { animation-delay: 1s; }
@keyframes dot { 0% { opacity: 0; } 20%, 80% { opacity: 1; } 100% { opacity: 0; } }
.terminal .bot { animation: bob 0.5s ease-in-out infinite; }
.terminal .arm-l, .terminal .arm-r { animation: type 0.25s steps(2) infinite; }
@keyframes type { 0% { transform: translateY(0); } 50% { transform: translateY(2px); } }
.scroll { animation: scroll 1s linear infinite; }
@keyframes scroll { from { transform: translateY(0); } to { transform: translateY(-8px); } }
.building .hammer { transform-box: view-box; transform-origin: 104px 64px; animation: swing 0.5s ease-in-out infinite alternate; }
@keyframes swing { from { transform: rotate(-35deg); } to { transform: rotate(25deg); } }
.building .bot { animation: bob 0.5s ease-in-out infinite; }
.reading .lens { animation: scan 2s ease-in-out infinite alternate; }
@keyframes scan { from { transform: translateX(-18px); } to { transform: translateX(10px); } }
.reading .eyes { animation: look 2s ease-in-out infinite alternate; }
@keyframes look { from { transform: translateX(-3px); } to { transform: translateX(3px); } }
.wave { opacity: 0; transform-box: view-box; transform-origin: 64px 8px; animation: wave 1.8s ease-out infinite; }
.w2 { animation-delay: 0.6s; }
.w3 { animation-delay: 1.2s; }
@keyframes wave { 0% { opacity: 0.9; transform: scale(0.3); } 100% { opacity: 0; transform: scale(1.4); } }
.error .bot { animation: shake 0.4s linear infinite; }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
.done .bot { animation: jump 0.8s ease-out infinite; }
@keyframes jump { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-14px); } }
.spark { animation: spark 0.8s steps(1) infinite; }
.s2 { animation-delay: 0.4s; }
@keyframes spark { 0% { opacity: 1; } 50% { opacity: 0; } }
.compacting .bot { animation: squish 1.4s ease-in-out infinite; }
@keyframes squish { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.18, 0.7); } }
`

function extras(mood: Mood): { front: string; back: string } {
  switch (mood) {
    case 'thinking':
      return {
        back: '',
        front: `${px(22, 2, 2, 2, LIGHT, 'dot')}${px(25, 1, 2, 2, LIGHT, 'dot d2')}${px(28, 0, 2, 2, LIGHT, 'dot d3')}`,
      }
    case 'terminal':
      return {
        back: '',
        front:
          px(6, 19, 20, 8, DARK) +
          `<rect x="24" y="76" width="80" height="32" fill="none" stroke="${ORANGE}" stroke-width="2"/>` +
          `<g class="scroll">${px(8, 21, 10, 1, ORANGE)}${px(8, 23, 14, 1, LIGHT)}${px(8, 25, 7, 1, ORANGE)}${px(8, 27, 12, 1, LIGHT)}</g>` +
          px(6, 27, 20, 2, DARK),
      }
    case 'building':
      return {
        back: '',
        front: `<g class="hammer">${px(26, 10, 1, 9, LIGHT)}${px(24, 8, 5, 3, '#8a4a1a')}</g>${px(20, 27, 10, 2, '#8a4a1a')}`,
      }
    case 'reading':
      return {
        back: '',
        front: `<g class="lens"><circle cx="92" cy="60" r="10" fill="${CYAN}33" stroke="${LIGHT}" stroke-width="3"/>${px(25, 17, 2, 5, LIGHT)}</g>`,
      }
    case 'searching':
      return {
        back: [1, 2, 3]
          .map(i => `<circle class="wave${i > 1 ? ` w${i}` : ''}" cx="64" cy="8" r="40" fill="none" stroke="${CYAN}" stroke-width="2"/>`)
          .join(''),
        front: '',
      }
    case 'done':
      return {
        back: '',
        front: `${px(3, 4, 2, 2, LIGHT, 'spark')}${px(27, 6, 2, 2, ORANGE, 'spark s2')}${px(5, 20, 1, 1, LIGHT, 'spark s2')}${px(28, 18, 1, 1, LIGHT, 'spark')}`,
      }
    default:
      return { back: '', front: '' }
  }
}

export function buddySvg(mood: Mood): string {
  const eyes = mood === 'error' ? X_EYES : mood === 'done' ? HAPPY_EYES : NORMAL_EYES
  const { front, back } = extras(mood)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><style>${STYLE}</style><g class="${mood}">${back}<g class="bot">${body(eyes)}</g>${front}</g></svg>`
}

export function moodForTool(tool: string): Mood {
  if (tool === 'Bash' || tool === 'BashOutput' || tool === 'KillShell') return 'terminal'
  if (tool === 'Edit' || tool === 'Write' || tool === 'MultiEdit' || tool === 'NotebookEdit') return 'building'
  if (tool === 'Read' || tool === 'Grep' || tool === 'Glob') return 'reading'
  return 'searching'
}
