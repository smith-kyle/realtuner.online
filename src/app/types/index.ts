export interface Player {
  id: string
  name: string
  socketId: string
  joinedAt: string
}

export interface GameState {
  queue: Player[]
  currentPlayer: Player | null
  totalTunes: number
  isActive: boolean
}
