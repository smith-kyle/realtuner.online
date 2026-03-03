import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { Store } from './store'
import { initialState } from './state'
import { broadcast } from './connections'
import { writeToFfplay, closeFfplay } from './audio'
import { startLeaseChecker } from './leases'
import { setupWebSocketServer } from './ws'
import { loadTotalTunes, saveTotalTunes } from './persistence'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

const PORT = Number(process.env.PORT) || 3001
const HOST = process.env.HOST || '127.0.0.1'

const httpServer = serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  console.log(`[server] Listening on http://${info.address}:${info.port}`)
})

const store = new Store({ ...initialState, totalTunes: loadTotalTunes() })

// Track active tuner changes to close ffplay when tuner changes
let prevActiveTunerId: string | null = null

store.subscribe((state, event) => {
  broadcast(state)

  if (event.type === 'DONE_TUNING') {
    saveTotalTunes(state.totalTunes)
  }

  if (event.type === 'AUDIO_DATA') {
    writeToFfplay(event.buffer)
    return
  }

  const currentActiveTunerId = state.activeTuner?.userId ?? null
  if (prevActiveTunerId !== currentActiveTunerId) {
    closeFfplay()
    prevActiveTunerId = currentActiveTunerId
    if (currentActiveTunerId) {
      console.log(`[server] Active tuner: ${state.activeTuner?.name} (${currentActiveTunerId})`)
    } else {
      console.log('[server] No active tuner')
    }
  }
})

setupWebSocketServer(httpServer, store)
startLeaseChecker(store)

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[server] Shutting down...')
  closeFfplay()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('[server] Shutting down...')
  closeFfplay()
  process.exit(0)
})
