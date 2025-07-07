import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Player, GameState } from '../types'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    queue: [],
    currentPlayer: null,
    timeLeft: 0,
    totalTunes: 0,
    isActive: false,
  })
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const audioStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Get or generate persistent user ID
    let userId = localStorage.getItem('realtuner-user-id')
    if (!userId) {
      userId = 'user-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36)
      localStorage.setItem('realtuner-user-id', userId)
      console.log('Generated new user ID:', userId)
    } else {
      console.log('Using existing user ID:', userId)
    }

    // Store userId in ref for access in other functions
    userIdRef.current = userId

    // Initialize socket connection
    const newSocket = io('http://localhost:3001')

    newSocket.on('connect', () => {
      console.log('Socket connected, identifying user:', userId)
      setIsConnected(true)
      setError(null)

      // Identify user with persistent ID
      newSocket.emit('identify-user', userId)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('game-state-update', (state: GameState) => {
      setGameState(state)
    })

    newSocket.on('timer-update', (timeLeft: number) => {
      setGameState((prev) => ({ ...prev, timeLeft }))
    })

    newSocket.on('queue-joined', (player: Player) => {
      console.log('Successfully joined queue:', player)
    })

    newSocket.on('error', (errorMessage: string) => {
      setError(errorMessage)
    })

    newSocket.on('audio-output', (audioData: Blob) => {
      // Handle incoming audio from current player
      // This would typically be played through speakers
      console.log('Received audio data:', audioData)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const joinQueue = (playerName: string) => {
    if (socket && playerName.trim()) {
      socket.emit('join-queue', playerName.trim())
    }
  }

  const leaveQueue = () => {
    if (socket) {
      socket.emit('leave-queue')
    }
  }

  const skipTurn = () => {
    if (socket) {
      socket.emit('skip-turn')
    }
  }

  const startAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket) {
          socket.emit('audio-stream', event.data)
        }
      }

      mediaRecorder.start(100) // Send data every 100ms
      return true
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setError('Failed to access microphone')
      return false
    }
  }

  const stopAudioStream = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop())
    }
  }

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop()) // Stop immediately, we just need permission
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }

  return {
    socket,
    gameState,
    isConnected,
    error,
    joinQueue,
    leaveQueue,
    skipTurn,
    startAudioStream,
    stopAudioStream,
    requestMicrophonePermission,
  }
}
