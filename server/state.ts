export interface Lease {
  userId: string
  name: string
  expiresAt: number // ms timestamp
}

export interface ServerState {
  activeTuner: Lease | null
  queue: Lease[]
  totalTunes: number
}

export interface ClientState {
  activeTuner: { userId: string; name: string } | null
  queue: Array<{ userId: string; name: string; position: number }>
  totalTunes: number
}

export const initialState: ServerState = {
  activeTuner: null,
  queue: [],
  totalTunes: 0,
}

export function toClientState(state: ServerState): ClientState {
  return {
    activeTuner: state.activeTuner
      ? { userId: state.activeTuner.userId, name: state.activeTuner.name }
      : null,
    queue: state.queue.map((l, i) => ({
      userId: l.userId,
      name: l.name,
      position: i + 1,
    })),
    totalTunes: state.totalTunes,
  }
}
