export type Mood = 'idle' | 'thinking' | 'terminal' | 'building' | 'reading' | 'searching' | 'error' | 'done' | 'compacting'

export type Usage = {
  contextPercent: number | null
  fiveHourPercent: number | null
  weekPercent: number | null
}

declare module 'claude-code' {
  interface PluginState {
    'token-optimizer': {
      compactions: number
      sessionStartedAt: number
      lastRequestAt: number | null
      now: number
      usage: Usage
      isConfirming: boolean
      isHidden: boolean
      handoffPending: boolean
      savedChars: number
      trimmedCount: number
      mood: Mood
      buddyFrame: number
    }
  }
}
