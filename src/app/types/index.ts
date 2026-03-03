export interface QueueEntry {
  userId: string
  name: string
  position: number
}

export interface ActiveTuner {
  userId: string
  name: string
}

export interface GameState {
  activeTuner: ActiveTuner | null
  queue: QueueEntry[]
  totalTunes: number
}
