import WebSocket from 'ws'
import type { ServerState } from './state'
import { toClientState } from './state'

const connections = new Map<string, WebSocket>()

export function register(userId: string, ws: WebSocket): void {
  connections.set(userId, ws)
}

export function unregister(userId: string): void {
  connections.delete(userId)
}

export function broadcast(state: ServerState): void {
  const msg = JSON.stringify({ type: 'state', payload: toClientState(state) })
  for (const ws of connections.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg)
    }
  }
}

export function sendTo(userId: string, msg: unknown): void {
  const ws = connections.get(userId)
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}
