# Server — Hono + raw WebSockets

## Data flow

```
Client WS message
      ↓
  ws.ts (parse + validate)
      ↓
  store.dispatch(event)
      ↓
  reducer(state, event) → new state   [pure, no side effects]
      ↓
  subscribers notified
      ├── broadcast(state) → all WS clients
      └── audio side effects (writeToFfplay / closeFfplay)
```

## Message protocol

### Client → Server

| Message | Payload | Notes |
|---|---|---|
| `{ type: 'identify', userId, name }` | string, string | First message on connect/reconnect |
| `{ type: 'heartbeat' }` | — | Every 3s; renews 10s lease |
| `{ type: 'join-queue' }` | — | Requires prior identify |
| `{ type: 'leave-queue' }` | — | — |
| `{ type: 'done-tuning' }` | — | Only valid as active tuner |
| Binary frame | PCM audio | Int16, 44100 Hz, mono; only forwarded from active tuner |

### Server → Clients (broadcast on every state change)

| Message | Payload |
|---|---|
| `{ type: 'state', payload: ClientState }` | Sent to all connected clients |

### Server → Single client

| Message | When |
|---|---|
| `{ type: 'error', message }` | Invalid request |

## Lease lifecycle

1. Client connects, sends `identify`
2. Client sends `join-queue` → lease created with `expiresAt = now + 10s`
3. Client sends `heartbeat` every 3s → `expiresAt` reset to `now + 10s`
4. Server checks leases every 1s; dispatches `LEASE_EXPIRED` for stale leases
5. `LEASE_EXPIRED` / `LEAVE_QUEUE` / `USER_DISCONNECTED` / `DONE_TUNING` → removed from queue/active

## State shape sent to clients

```ts
{
  activeTuner: { userId: string; name: string } | null
  queue: Array<{ userId: string; name: string; position: number }>
  totalTunes: number
}
```
