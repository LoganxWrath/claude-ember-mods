import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'token-optimizer',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 8, bodyColumns: 120, scroll: { offset: 0, bodyRows: 8 } },
} as const

test('the band draws on every surface', async ($, on) => {
  on('command.register', () => ({ value: { command: 'tokens' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface } as never)
    const row = await ui.find({ type: 'Text', text: /Token Optimizer/ })
    expect(row?.text).toBe('Token Optimizer')
    await ui.unmount()
  }
})
