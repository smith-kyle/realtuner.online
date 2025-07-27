import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Player, GameState } from '../types'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
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
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const userIdRef = useRef<string | null>(null)
  const isStreamingRef = useRef<boolean>(false)
  const lastSentTimeRef = useRef<Date>(new Date())

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

      // Check if current user became the active player
      const isCurrentPlayer = state.currentPlayer && state.currentPlayer.id === userId

      console.log('Game state update:', {
        userId,
        currentPlayerId: state.currentPlayer?.id,
        isCurrentPlayer,
        isStreaming: isStreamingRef.current,
      })

      if (isCurrentPlayer && !isStreamingRef.current) {
        // Start audio streaming when it's our turn
        console.log("Starting audio stream - it's our turn!")
        startAudioStream()
      } else if (!isCurrentPlayer && isStreamingRef.current) {
        // Stop audio streaming when it's no longer our turn
        console.log('Stopping audio stream - turn ended')
        stopAudioStream()
      }
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

    socketRef.current = newSocket

    return () => {
      // Clean up audio stream on component unmount
      stopAudioStream()
      newSocket.disconnect()
    }
  }, [])

  const joinQueue = (playerName: string) => {
    if (socketRef.current && playerName.trim()) {
      socketRef.current.emit('join-queue', playerName.trim())
    }
  }

  const leaveQueue = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-queue')
    }
  }

  const skipTurn = () => {
    if (socketRef.current) {
      socketRef.current.emit('skip-turn')
    }
  }

  const startAudioStream = async () => {
    try {
      if (isStreamingRef.current) {
        console.log('Audio stream already active')
        return true
      }
      isStreamingRef.current = true

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      })
      audioStreamRef.current = stream

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 44100 })
      audioContextRef.current = audioContext

      await audioContext.audioWorklet.addModule('/audio-processor.js')

      const node = new AudioWorkletNode(audioContext, 'audio-processor')

      // Create source from microphone stream
      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      // Buffer for 1 second of audio (44100 samples for 1 channel, 16-bit)
      const BUFFER_SIZE = 1024
      let audioBuffer: Int16Array | null = null
      let bufferOffset = 0

      node.port.onmessage = (event) => {
        if (!socketRef.current || !isStreamingRef.current) return
        const float32 = event.data as Float32Array

        // Allocate buffer if not present
        if (!audioBuffer) {
          audioBuffer = new Int16Array(BUFFER_SIZE)
          bufferOffset = 0
        }

        // Convert Float32 to Int16 and fill buffer
        for (let i = 0; i < float32.length; i++) {
          if (bufferOffset >= BUFFER_SIZE) break // Prevent overflow
          const s = Math.max(-1, Math.min(1, float32[i]))
          audioBuffer[bufferOffset++] = s < 0 ? s * 0x8000 : s * 0x7fff
        }

        // If buffer is full, send it and reset
        if (bufferOffset >= BUFFER_SIZE) {
          socketRef.current.emit('audio-stream', audioBuffer.buffer)
          console.log(
            'Between packets',
            new Date().getTime() - lastSentTimeRef.current.getTime(),
            'ms',
          )
          lastSentTimeRef.current = new Date()
          audioBuffer = null
          bufferOffset = 0
        }
      }

      // Connect the audio graph (don't connect to destination to avoid feedback)
      source.connect(node)

      console.log('Web Audio API stream started successfully')
      return true
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setError('Failed to access microphone')
      return false
    }
  }

  const stopAudioStream = () => {
    console.log('stopAudioStream called, isStreaming:', isStreamingRef.current)

    if (isStreamingRef.current) {
      // Disconnect audio nodes
      if (processorRef.current) {
        console.log('Disconnecting processor')
        processorRef.current.disconnect()
        processorRef.current = null
      }
      if (sourceRef.current) {
        console.log('Disconnecting source')
        sourceRef.current.disconnect()
        sourceRef.current = null
      }

      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        console.log('Closing audio context')
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      // Stop microphone stream
      if (audioStreamRef.current) {
        console.log('Stopping microphone tracks')
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
      }

      isStreamingRef.current = false
      console.log('Web Audio API stream stopped successfully')
    } else {
      console.log('Stream was not active, nothing to stop')
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
    socket: socketRef.current,
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
