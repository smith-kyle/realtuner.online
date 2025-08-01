const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'https://realtuner.online',
    methods: ['GET', 'POST'],
  },
})

// Data storage
const DATA_FILE = path.join(__dirname, 'tuner-data.json')

// Initialize data structure
let gameState = {
  queue: [],
  currentPlayer: null,
  timeLeft: 0,
  totalTunes: 0,
  isActive: false,
}

// Track disconnected users for graceful reconnection
let disconnectedUsers = new Map() // userId -> { player, disconnectTime }
const RECONNECT_GRACE_PERIOD = 30000 // 30 seconds to reconnect

// Track active connections by user ID
let activeConnections = new Map() // userId -> socketId

// Audio FFplay setup
let ffplayProcess = null
let currentPlayerId = null
let audioFileStream = null

function initializeFFplayAudio(userId) {
  if (!ffplayProcess || ffplayProcess.killed || currentPlayerId !== userId) {
    const startTime = Date.now()
    console.log(`[TIMING] Starting ffplay process for user ${userId} at ${startTime}`)

    // Clean up old process
    if (ffplayProcess && !ffplayProcess.killed) {
      ffplayProcess.kill()
    }

    // Spawn new ffplay process
    ffplayProcess = spawn('ffplay', [
      '-fflags',
      'nobuffer',
      '-analyzeduration',
      '0',
      '-probesize',
      '32',
      '-f',
      's16le', // 16-bit signed little-endian PCM (matches client Int16Array)
      '-ar',
      '44100', // Sample rate
      '-ch_layout',
      'mono', // Mono channel layout
      '-nodisp', // No video display
      '-autoexit', // Exit when input ends
      'pipe:0', // Read from stdin using pipe protocol
    ])

    ffplayProcess.on('spawn', () => {
      const spawnTime = Date.now()
      console.log(`[TIMING] FFplay spawned in ${spawnTime - startTime}ms`)
    })

    // Add stdin error handling
    ffplayProcess.stdin.on('error', (error) => {
      if (error.code === 'EPIPE') {
        console.log('FFplay stdin closed, process likely ended')
      } else {
        console.error('FFplay stdin error:', error)
      }
    })

    ffplayProcess.stderr.on('data', (data) => {
      // FFplay outputs info to stderr, suppress unless debugging
      // console.log('FFplay:', data.toString())
    })

    ffplayProcess.on('error', (error) => {
      console.error('FFplay process error:', error)
    })

    ffplayProcess.on('exit', (code) => {
      console.log('FFplay exited with code:', code)
      // Mark process as dead
      if (ffplayProcess) {
        ffplayProcess.killed = true
      }
    })

    currentPlayerId = userId
  }
  return ffplayProcess
}

function closeFFplayAudio() {
  if (ffplayProcess && !ffplayProcess.killed) {
    try {
      // Close stdin first to allow graceful shutdown
      if (ffplayProcess.stdin && !ffplayProcess.stdin.destroyed) {
        ffplayProcess.stdin.end()
      }

      // Give it a moment to close gracefully, then force kill if needed
      setTimeout(() => {
        if (ffplayProcess && !ffplayProcess.killed) {
          ffplayProcess.kill('SIGTERM')
        }
      }, 100)

      console.log('FFplay closed for user:', currentPlayerId)
    } catch (error) {
      console.error('Error closing FFplay:', error)
    }
    ffplayProcess = null
    currentPlayerId = null
  }

  // Close audio file stream
  if (audioFileStream) {
    try {
      audioFileStream.end()
      console.log('Audio recording file closed')
    } catch (error) {
      console.error('Error closing audio file stream:', error)
    }
    audioFileStream = null
  }
}

// Load existing data
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8')
      gameState = { ...gameState, ...JSON.parse(data) }
    }
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

// Save data to disk
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(gameState, null, 2))
    console.log('Saved data to disk')
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

// Timer management
let gameTimer = null

function startTimer() {
  if (gameTimer) clearInterval(gameTimer)

  gameTimer = setInterval(() => {
    if (gameState.timeLeft > 0) {
      gameState.timeLeft--
      io.emit('timer-update', gameState.timeLeft)
    } else {
      nextPlayer(true) // Timer completed, count as a completed tune
    }
  }, 1000)
}

function stopTimer() {
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
}

function nextPlayer(completed = false) {
  if (gameState.currentPlayer && completed) {
    gameState.totalTunes++
  }

  // Close FFplay when current player's turn ends
  closeFFplayAudio()

  gameState.currentPlayer = null
  gameState.timeLeft = 0
  gameState.isActive = false

  if (gameState.queue.length > 0) {
    gameState.currentPlayer = gameState.queue.shift()
    gameState.timeLeft = 30
    gameState.isActive = true

    // Update socket ID for current player if they're connected
    if (gameState.currentPlayer && activeConnections.has(gameState.currentPlayer.id)) {
      gameState.currentPlayer.socketId = activeConnections.get(gameState.currentPlayer.id)
    }

    const playerTurnStartTime = Date.now()
    console.log(
      `[TIMING] Player ${gameState.currentPlayer.name} turn started at ${playerTurnStartTime}`,
    )

    startTimer()
  } else {
    stopTimer()
  }

  saveData()
  io.emit('game-state-update', gameState)
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  let userId = null

  // Handle user identification and reconnection
  socket.on('identify-user', (userIdFromClient) => {
    userId = userIdFromClient
    console.log('User identified:', userId, 'with socket:', socket.id)

    // Update active connections
    activeConnections.set(userId, socket.id)

    // Check if user was disconnected and can reconnect
    if (disconnectedUsers.has(userId)) {
      const disconnectedUser = disconnectedUsers.get(userId)
      console.log('User reconnected:', userId, 'Player name:', disconnectedUser.player?.name)
      console.log('Disconnected users map size before removal:', disconnectedUsers.size)

      // Update socket ID in queue if user is in queue
      const queueIndex = gameState.queue.findIndex((p) => p.id === userId)
      if (queueIndex !== -1) {
        console.log('Updating socket ID for user in queue at position', queueIndex)
        gameState.queue[queueIndex].socketId = socket.id
      }

      // Update socket ID if user is current player
      if (gameState.currentPlayer && gameState.currentPlayer.id === userId) {
        console.log('Updating socket ID for current player')
        gameState.currentPlayer.socketId = socket.id
      }

      // Remove from disconnected users
      disconnectedUsers.delete(userId)
      console.log('Disconnected users map size after removal:', disconnectedUsers.size)

      // Send updated game state
      saveData()
      io.emit('game-state-update', gameState)
    } else {
      console.log('User', userId, 'was not in disconnected users map')
    }

    // Send current game state to client
    socket.emit('game-state-update', gameState)
  })

  // Handle joining queue
  socket.on('join-queue', (playerName) => {
    if (!userId) {
      socket.emit('error', 'User not identified')
      return
    }

    if (!playerName || typeof playerName !== 'string') {
      socket.emit('error', 'Invalid player name')
      return
    }

    // Check if user is already in queue or currently active
    const isInQueue = gameState.queue.some((p) => p.id === userId)
    const isCurrentPlayer = gameState.currentPlayer && gameState.currentPlayer.id === userId

    if (isInQueue || isCurrentPlayer) {
      socket.emit('error', 'You are already in the queue or currently playing')
      return
    }

    const player = {
      id: userId,
      name: playerName.trim(),
      socketId: socket.id,
      joinedAt: new Date().toISOString(),
    }

    gameState.queue.push(player)

    // If no one is currently playing, start with this player
    if (!gameState.currentPlayer && !gameState.isActive) {
      nextPlayer(false)
    }

    saveData()
    io.emit('game-state-update', gameState)
    socket.emit('queue-joined', player)
  })

  // Handle leaving queue
  socket.on('leave-queue', () => {
    if (!userId) return

    gameState.queue = gameState.queue.filter((player) => player.id !== userId)

    if (gameState.currentPlayer && gameState.currentPlayer.id === userId) {
      nextPlayer(false) // Player left, don't count as completed tune
    }

    // Remove from active connections
    activeConnections.delete(userId)

    saveData()
    io.emit('game-state-update', gameState)
  })

  // Handle audio stream
  socket.on('audio-stream', (audioData) => {
    if (!userId || !gameState.currentPlayer || gameState.currentPlayer.id !== userId) {
      return
    }

    try {
      const ffplayProcess = initializeFFplayAudio(userId)

      const pcmBuffer = Buffer.from(audioData)

      // Write directly to ffplay stdin - ffplay handles buffering
      if (
        ffplayProcess &&
        !ffplayProcess.killed &&
        ffplayProcess.stdin &&
        !ffplayProcess.stdin.destroyed
      ) {
        try {
          ffplayProcess.stdin.write(pcmBuffer)
        } catch (error) {
          if (error.code !== 'EPIPE') {
            console.error('Error writing to ffplay stdin:', error)
          }
        }
      }

      socket.broadcast.emit('audio-output', audioData)
    } catch (error) {
      console.error('[AUDIO DEBUG] Error:', error)
    }
  })

  // Handle skip turn (for current player)
  socket.on('skip-turn', () => {
    if (!userId) return

    if (gameState.currentPlayer && gameState.currentPlayer.id === userId) {
      nextPlayer(true)
    }
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id, 'userId:', userId)

    if (!userId) {
      console.log('No userId for disconnected socket, skipping cleanup')
      return
    }

    // Small delay to allow for immediate reconnection (e.g., page refresh)
    setTimeout(() => {
      // Check if user has already reconnected
      if (activeConnections.has(userId)) {
        console.log(`User ${userId} already reconnected, skipping cleanup`)
        return
      }

      // Remove from active connections
      activeConnections.delete(userId)

      // Check if user is in queue or currently playing
      const isInQueue = gameState.queue.some((p) => p.id === userId)
      const isCurrentPlayer = gameState.currentPlayer && gameState.currentPlayer.id === userId

      console.log(`User ${userId} - isInQueue: ${isInQueue}, isCurrentPlayer: ${isCurrentPlayer}`)

      if (isInQueue || isCurrentPlayer) {
        // Add to disconnected users with grace period
        const playerData = isCurrentPlayer
          ? gameState.currentPlayer
          : gameState.queue.find((p) => p.id === userId)

        disconnectedUsers.set(userId, {
          player: playerData,
          disconnectTime: Date.now(),
        })

        console.log(
          `User ${userId} (${playerData?.name}) disconnected, giving ${
            RECONNECT_GRACE_PERIOD / 1000
          }s grace period to reconnect`,
        )
        console.log('Disconnected users map size:', disconnectedUsers.size)

        // Set a timeout to remove them if they don't reconnect
        setTimeout(() => {
          if (disconnectedUsers.has(userId)) {
            console.log(`User ${userId} grace period expired, removing from queue`)

            // Remove from queue
            gameState.queue = gameState.queue.filter((player) => player.id !== userId)

            // If they were current player, move to next
            if (gameState.currentPlayer && gameState.currentPlayer.id === userId) {
              nextPlayer(false) // Player disconnected, don't count as completed tune
            }

            // Remove from disconnected users
            disconnectedUsers.delete(userId)

            saveData()
            io.emit('game-state-update', gameState)
          } else {
            console.log(
              `User ${userId} was already removed from disconnected users (reconnected successfully)`,
            )
          }
        }, RECONNECT_GRACE_PERIOD)
      } else {
        console.log(`User ${userId} was not in queue or current player, no cleanup needed`)
      }
    }, 1000) // 1 second delay to allow for immediate reconnection
  })
})

// Load initial data
loadData()

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

console.log('Server started')

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...')
  saveData()

  // Close FFplay if it exists
  closeFFplayAudio()

  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
