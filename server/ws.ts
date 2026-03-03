import { WebSocketServer } from 'ws'
import type { Store } from './store'
import { register, unregister, sendTo } from './connections'
import { toClientState } from './state'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setupWebSocketServer(httpServer: any, store: Store): void {
  const wss = new WebSocketServer({ server: httpServer })

  wss.on('connection', (ws) => {
    let userId: string | null = null
    let userName: string | null = null

    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        // Binary frame = audio data
        if (!userId) return
        const state = store.getState()
        if (state.activeTuner?.userId !== userId) return
        store.dispatch({ type: 'AUDIO_DATA', userId, buffer: data as Buffer })
        return
      }

      let msg: { type: string; [key: string]: unknown }
      try {
        msg = JSON.parse(data.toString())
      } catch {
        return
      }

      switch (msg.type) {
        case 'identify': {
          if (typeof msg.userId !== 'string' || typeof msg.name !== 'string') {
            ws.send(JSON.stringify({ type: 'error', message: 'identify requires userId and name' }))
            return
          }
          userId = msg.userId
          userName = msg.name
          register(userId, ws)
          store.dispatch({ type: 'USER_CONNECTED', userId, name: userName })
          // Send current state immediately
          ws.send(JSON.stringify({ type: 'state', payload: toClientState(store.getState()) }))
          console.log(`[ws] User identified: ${userId} (${userName})`)
          break
        }

        case 'heartbeat': {
          if (!userId) return
          store.dispatch({ type: 'LEASE_RENEWED', userId })
          break
        }

        case 'join-queue': {
          if (!userId || !userName) {
            ws.send(JSON.stringify({ type: 'error', message: 'must identify before joining queue' }))
            return
          }
          store.dispatch({ type: 'JOIN_QUEUE', userId, name: userName })
          console.log(`[ws] ${userId} (${userName}) joined queue`)
          break
        }

        case 'leave-queue': {
          if (!userId) return
          store.dispatch({ type: 'LEAVE_QUEUE', userId })
          console.log(`[ws] ${userId} left queue`)
          break
        }

        case 'done-tuning': {
          if (!userId) return
          const state = store.getState()
          if (state.activeTuner?.userId !== userId) {
            sendTo(userId, { type: 'error', message: 'not the active tuner' })
            return
          }
          store.dispatch({ type: 'DONE_TUNING', userId })
          console.log(`[ws] ${userId} done tuning`)
          break
        }

        default:
          // unknown message type, ignore
          break
      }
    })

    ws.on('close', () => {
      if (userId) {
        console.log(`[ws] User disconnected: ${userId}`)
        unregister(userId)
        store.dispatch({ type: 'USER_DISCONNECTED', userId })
      }
    })

    ws.on('error', (err) => {
      console.error('[ws] WebSocket error:', err)
    })
  })

  console.log('[ws] WebSocketServer attached to HTTP server')
}
