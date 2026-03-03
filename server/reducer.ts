import type { ServerState, Lease } from './state'
import type { Event } from './events'
import { LEASE_TTL } from './leases'

export function reducer(state: ServerState, event: Event): ServerState {
  switch (event.type) {
    case 'JOIN_QUEUE': {
      // Ignore if already active or in queue
      if (state.activeTuner?.userId === event.userId) return state
      if (state.queue.some((l) => l.userId === event.userId)) return state

      const lease: Lease = {
        userId: event.userId,
        name: event.name,
        expiresAt: Date.now() + LEASE_TTL,
        activeSince: 0,
      }
      const newQueue = [...state.queue, lease]

      // Auto-promote if no active tuner
      if (!state.activeTuner) {
        return { ...state, activeTuner: { ...newQueue[0], activeSince: Date.now() }, queue: newQueue.slice(1) }
      }
      return { ...state, queue: newQueue }
    }

    case 'SESSION_TIMEOUT':
    case 'DONE_TUNING': {
      if (state.activeTuner?.userId !== event.userId) return state
      const totalTunes = state.totalTunes + 1
      const next = state.queue[0] ?? null
      const nextTuner = next ? { ...next, activeSince: Date.now() } : null
      const newQueue = state.queue.slice(1)
      return { ...state, activeTuner: nextTuner, queue: newQueue, totalTunes }
    }

    case 'LEAVE_QUEUE':
    case 'LEASE_EXPIRED':
    case 'USER_DISCONNECTED': {
      // If they are the active tuner, promote next
      if (state.activeTuner?.userId === event.userId) {
        const next = state.queue[0] ?? null
        const nextTuner = next ? { ...next, activeSince: Date.now() } : null
        const newQueue = state.queue.slice(1)
        return { ...state, activeTuner: nextTuner, queue: newQueue }
      }
      // If they are in the queue, remove them
      return { ...state, queue: state.queue.filter((l) => l.userId !== event.userId) }
    }

    case 'LEASE_RENEWED': {
      const newExpiry = Date.now() + LEASE_TTL
      if (state.activeTuner?.userId === event.userId) {
        return { ...state, activeTuner: { ...state.activeTuner, expiresAt: newExpiry } }
      }
      return {
        ...state,
        queue: state.queue.map((l) =>
          l.userId === event.userId ? { ...l, expiresAt: newExpiry } : l
        ),
      }
    }

    case 'USER_CONNECTED':
    case 'AUDIO_DATA':
      return state

    default:
      return state
  }
}
