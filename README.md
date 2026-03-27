# Real Tuner Online

[realtuner.online](https://realtuner.online) — tune your instrument on a real Boss TU-3, live on stream.

Users join a queue and take turns. When it's your turn, your browser captures mic audio via a Web Audio worklet, streams raw PCM over a WebSocket to a Raspberry Pi, which pipes it to `ffplay` connected to a physical tuner. The audience watches via Cloudflare Stream.

## Architecture

```
Browser (mic) ──PCM/WebSocket──▶ Hono server (Pi) ──stdin──▶ ffplay ──▶ Boss TU-3
                                       │
                                  JSON state broadcast ──▶ all clients
                                       │
Cloudflare Stream ◀── camera pointed at tuner
```

**Server** — Hono + `@hono/node-server` (port 3001), raw `ws` WebSocket. Redux-style state management: events are dispatched to a pure reducer, subscribers broadcast state and handle side effects (audio, persistence).

**Client** — Next.js 15 / React 19. Single client island (`QueueSection`) connects via `useWebSocket` hook (native WebSocket, exponential backoff reconnect). Audio captured with an `AudioWorklet` processor, buffered into 1024-sample Int16 chunks, sent as binary WS frames.

**Leases** — 10s TTL heartbeat system. Client sends heartbeat every 3s. Expired leases are pruned every 1s. Active tuner has a 2-minute hard cap.

**Persistence** — `tuner-data.json` stores `{ totalTunes }`. No database.

## Server structure

```
server/
  index.ts          Hono app, WSS setup, lifecycle hooks
  state.ts          ServerState / ClientState types, toClientState()
  events.ts         Discriminated union of all events
  reducer.ts        Pure (state, event) → state
  store.ts          Store class: dispatch → reduce → notify
  leases.ts         Lease TTL checker, session timeout
  connections.ts    userId → WebSocket map, broadcast/sendTo
  ws.ts             WS message parsing → store.dispatch
  audio.ts          ffplay spawn/write/close
  persistence.ts    tuner-data.json load/save
```

## WS protocol

**Client → Server** (JSON): `identify`, `heartbeat`, `join-queue`, `leave-queue`, `done-tuning`
**Client → Server** (binary): raw PCM audio frames (16-bit signed, 44100 Hz, mono)
**Server → Client** (JSON): `{ type: 'state', payload: ClientState }` on every state change

## Running locally

```bash
pnpm install

# Terminal 1 — backend (port 3001)
pnpm dev:server

# Terminal 2 — frontend (port 3000)
pnpm dev
```

Env vars (`.env`):
- `HOST` — server bind address
- `NEXT_PUBLIC_WS_URL` — WebSocket URL the client connects to (e.g. `ws://localhost:3001`)

## Recovery

The Raspberry Pi SSD backup (`realtuner-backup.img.zip`, ~3 GB, gitignored) can be restored with:

```bash
unzip realtuner-backup.img.zip
diskutil list                        # identify the target disk
diskutil unmountDisk /dev/diskN
sudo dd if=realtuner-backup.img of=/dev/rdiskN bs=4m status=progress
diskutil eject /dev/diskN
```

To create a new backup, shut down the Pi, connect the SSD, and `dd` in reverse.

## License

MIT
