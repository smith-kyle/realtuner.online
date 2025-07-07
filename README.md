# 🎵 Real Tuner Online

An interactive online tuning application where users can join a queue to tune their instruments live in front of an audience via YouTube livestream.

## Features

- **Live YouTube Stream Integration**: Watch the tuning session via embedded YouTube livestream
- **Real-time Queue Management**: Users can join and leave the queue with live updates
- **30-Second Timer**: Each person gets exactly 30 seconds to tune their instrument
- **Audio Streaming**: User microphones are streamed live to the server output during their turn
- **Microphone Permission Handling**: Users must grant microphone access before joining the queue
- **Statistics Tracking**: Total number of completed tunes is tracked and displayed
- **Persistent Data**: All queue and statistics data is stored on disk
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Real-time Communication**: WebSockets
- **Audio**: Web Audio API, MediaRecorder API
- **Data Storage**: File-based JSON storage

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd realtuner.online
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

## Running the Application

The application consists of two parts that need to be run simultaneously:

### 1. Start the Backend Server

```bash
npm run dev:server
# or
yarn dev:server
```

This starts the Express/Socket.IO server on port 3001.

### 2. Start the Frontend Development Server

```bash
npm run dev
# or
yarn dev
```

This starts the Next.js development server on port 3000.

### 3. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## How It Works

### For Users:

1. **Allow Microphone Access**: Grant permission to use your microphone
2. **Join Queue**: Enter your name and join the tuning queue
3. **Wait Your Turn**: Watch the current player and see your position in the queue
4. **Tune Live**: When it's your turn, you get 30 seconds to tune your instrument
5. **Audio is Live**: Your microphone input is streamed to everyone listening

### For Administrators:

- The server automatically manages the queue and timers
- Data is persistently stored in `tuner-data.json`
- Users are automatically moved through the queue
- Disconnected users are automatically removed from the queue

## API Endpoints

The WebSocket server handles the following events:

### Client → Server:

- `join-queue` - Join the tuning queue with a name
- `leave-queue` - Leave the tuning queue
- `skip-turn` - Skip your current turn
- `audio-stream` - Stream audio data from microphone

### Server → Client:

- `game-state-update` - Full game state (queue, current player, etc.)
- `timer-update` - Timer countdown updates
- `queue-joined` - Confirmation of joining the queue
- `audio-output` - Audio stream from current player
- `error` - Error messages

## File Structure

```
realtuner.online/
├── src/
│   └── app/
│       ├── components/
│       │   ├── QueueDisplay.tsx      # Queue and current player display
│       │   ├── JoinQueue.tsx         # Join queue form with mic permissions
│       │   └── CurrentPlayerControls.tsx # Controls for current player
│       ├── hooks/
│       │   └── useSocket.ts          # WebSocket connection hook
│       ├── page.tsx                  # Main application page
│       └── layout.tsx                # App layout
├── server.js                         # Express/Socket.IO server
├── package.json                      # Dependencies and scripts
└── tuner-data.json                   # Persistent data storage (created automatically)
```

## Development Notes

### Audio Streaming

- Uses MediaRecorder API to capture audio from user microphones
- Audio is streamed in real-time via WebSocket
- Only the current player's audio is transmitted
- In production, server audio output would be connected to physical speakers

### Queue Management

- Automatic 30-second timer per player
- Queue automatically progresses when time expires
- Players can skip their turn early
- Disconnected players are automatically removed

### Data Persistence

- All data is stored in `tuner-data.json`
- Data is automatically saved on every state change
- Statistics persist across server restarts

## Production Deployment

For production deployment:

1. Build the Next.js application:

```bash
npm run build
```

2. Set up environment variables:

```bash
export NODE_ENV=production
export PORT=3001
```

3. Run the production server:

```bash
npm start
```

4. Set up a reverse proxy (nginx) to serve both the frontend and backend
5. Configure SSL certificates for HTTPS (required for microphone access)
6. Set up the server audio output to physical speakers/PA system

## Browser Requirements

- Modern browsers with WebRTC support
- HTTPS required for microphone access (in production)
- JavaScript must be enabled

## License

This project is licensed under the MIT License.
