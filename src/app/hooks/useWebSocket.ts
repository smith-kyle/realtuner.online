import { useEffect, useState, useRef, useCallback } from 'react'
import type { GameState } from '../types'

const HEARTBEAT_INTERVAL = 3_000
const MAX_BACKOFF = 30_000

const initialGameState: GameState = {
  activeTuner: null,
  queue: [],
  totalTunes: 0,
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const userIdRef = useRef<string | null>(null)
  const userNameRef = useRef<string | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backoffRef = useRef(1000)
  const wasInQueueRef = useRef(false)
  const isUnmountedRef = useRef(false)

  // Audio refs
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const isStreamingRef = useRef(false)

  const stopAudioStream = useCallback(() => {
    if (!isStreamingRef.current) return
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop())
      audioStreamRef.current = null
    }
    isStreamingRef.current = false
    console.log('[ws] Audio stream stopped')
  }, [])

  const startAudioStream = useCallback(async (): Promise<boolean> => {
    if (isStreamingRef.current) return true
    isStreamingRef.current = true
    try {
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

      const audioContext = new AudioContext({ sampleRate: 44100 })
      audioContextRef.current = audioContext
      await audioContext.resume()
      await audioContext.audioWorklet.addModule('/audio-processor.js')

      const node = new AudioWorkletNode(audioContext, 'audio-processor')
      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      const BUFFER_SIZE = 1024
      let audioBuffer: Int16Array | null = null
      let bufferOffset = 0

      node.port.onmessage = (event) => {
        const ws = wsRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN || !isStreamingRef.current) return
        const float32 = event.data as Float32Array

        if (!audioBuffer) {
          audioBuffer = new Int16Array(BUFFER_SIZE)
          bufferOffset = 0
        }

        for (let i = 0; i < float32.length; i++) {
          if (bufferOffset >= BUFFER_SIZE) break
          const s = Math.max(-1, Math.min(1, float32[i]))
          audioBuffer[bufferOffset++] = s < 0 ? s * 0x8000 : s * 0x7fff
        }

        if (bufferOffset >= BUFFER_SIZE) {
          ws.send(audioBuffer.buffer)
          audioBuffer = null
          bufferOffset = 0
        }
      }

      source.connect(node)
      console.log('[ws] Audio stream started')
      return true
    } catch (err) {
      isStreamingRef.current = false
      console.error('[ws] Microphone error:', err)
      setError('Failed to access microphone')
      return false
    }
  }, [])

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return

    const rawUrl =
      process.env.NEXT_PUBLIC_WS_URL ??
      (process.env.NEXT_PUBLIC_SOCKET_URL ?? 'https://api.realtuner.online').replace(
        /^http/,
        'ws'
      )

    const ws = new WebSocket(rawUrl)
    wsRef.current = ws

    ws.onopen = () => {
      if (isUnmountedRef.current) { ws.close(); return }
      setIsConnected(true)
      setError(null)
      backoffRef.current = 1000

      const userId = userIdRef.current!
      const name = userNameRef.current!

      ws.send(JSON.stringify({ type: 'identify', userId, name }))

      if (wasInQueueRef.current) {
        ws.send(JSON.stringify({ type: 'join-queue' }))
      }

      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }))
        }
      }, HEARTBEAT_INTERVAL)
    }

    ws.onmessage = (event) => {
      if (typeof event.data !== 'string') return
      let msg: { type: string; payload?: GameState; message?: string }
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }

      if (msg.type === 'state' && msg.payload) {
        const newState = msg.payload
        setGameState(newState)

        const userId = userIdRef.current
        const isActiveTuner = userId && newState.activeTuner?.userId === userId

        if (isActiveTuner && !isStreamingRef.current) {
          startAudioStream()
        } else if (!isActiveTuner && isStreamingRef.current) {
          stopAudioStream()
        }
      } else if (msg.type === 'error') {
        setError(msg.message ?? 'Server error')
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      if (!isUnmountedRef.current) {
        const delay = backoffRef.current
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF)
        console.log(`[ws] Disconnected, reconnecting in ${delay}ms`)
        reconnectTimerRef.current = setTimeout(connect, delay)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [startAudioStream, stopAudioStream])

  useEffect(() => {
    // Get or generate persistent user ID and name
    let userId = localStorage.getItem('realtuner-user-id')
    if (!userId) {
      userId = 'u-' + Math.random().toString(36).slice(2, 11) + '-' + Date.now().toString(36)
      localStorage.setItem('realtuner-user-id', userId)
    }
    userIdRef.current = userId

    let userName = localStorage.getItem('realtuner-user-name')
    if (!userName) {
      userName = 'Tuner #' + Math.random().toString(36).slice(2, 6).toUpperCase()
      localStorage.setItem('realtuner-user-name', userName)
    }
    userNameRef.current = userName

    isUnmountedRef.current = false
    connect()

    return () => {
      isUnmountedRef.current = true
      stopAudioStream()
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [connect, stopAudioStream])

  const joinQueue = useCallback(() => {
    wasInQueueRef.current = true
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'join-queue' }))
    }
  }, [])

  const leaveQueue = useCallback(() => {
    wasInQueueRef.current = false
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'leave-queue' }))
    }
  }, [])

  const doneTuning = useCallback(() => {
    wasInQueueRef.current = false
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'done-tuning' }))
    }
  }, [])

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      return true
    } catch {
      return false
    }
  }, [])

  return {
    gameState,
    isConnected,
    error,
    joinQueue,
    leaveQueue,
    doneTuning,
    startAudioStream,
    stopAudioStream,
    requestMicrophonePermission,
  }
}
