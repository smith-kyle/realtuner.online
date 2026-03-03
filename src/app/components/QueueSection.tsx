'use client'

import { useState, useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'

export function QueueSection() {
  const { gameState, requestMicrophonePermission, joinQueue, doneTuning, error } = useWebSocket()
  const [micPending, setMicPending] = useState(false)
  const [micDenied, setMicDenied] = useState(false)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  )

  const userId = typeof window !== 'undefined' ? localStorage.getItem('realtuner-user-id') : null

  const isInQueue = userId && gameState.queue.some((p) => p.userId === userId)
  const isCurrentPlayer = userId && gameState.activeTuner?.userId === userId
  const queuePosition = isInQueue
    ? gameState.queue.findIndex((p) => p.userId === userId) + 1
    : null

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleStartTuning = async () => {
    setMicPending(true)
    const hasPermission = await requestMicrophonePermission()
    setMicPending(false)
    if (hasPermission) {
      joinQueue()
    } else {
      setMicDenied(true)
    }
  }

  const pad = windowWidth < 768 ? '12px' : '15px'
  const panelStyle = {
    border: '2px solid var(--border)',
    backgroundColor: 'var(--panel-bg)',
    padding: pad,
  }

  const waitingCount = gameState.queue.length

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ border: '2px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ ...panelStyle, borderBottom: '2px solid var(--border)' }}>
          {error && (
            <div style={{ color: 'var(--error)', marginBottom: '10px', fontSize: windowWidth < 768 ? '13px' : '14px' }}>
              {error}
            </div>
          )}

          {isCurrentPlayer ? (
            <div style={{ textAlign: 'center' }}>
              <button onClick={doneTuning} className="btn btn-danger" style={{ marginBottom: '10px' }}>
                Done Tuning
              </button>
              <div style={{ fontWeight: 'bold', fontSize: windowWidth < 768 ? '14px' : '15px', color: 'var(--foreground-dark)' }}>
                It's your turn! Tune away.
              </div>
            </div>
          ) : isInQueue ? (
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: windowWidth < 768 ? '14px' : '16px', color: 'var(--foreground-dark)' }}>
              You're #{queuePosition} in line &nbsp;&mdash;&nbsp; {gameState.queue.length} {gameState.queue.length === 1 ? 'person' : 'people'} waiting
            </div>
          ) : micDenied ? (
            <button onClick={() => window.location.reload()} className="btn btn-neutral">
              Mic needed — refresh to allow
            </button>
          ) : (
            <button onClick={handleStartTuning} disabled={micPending} className="btn btn-primary">
              {micPending ? 'Requesting mic...' : 'Start Tuning'}
            </button>
          )}
        </div>

        {waitingCount > 0 && (
          <div style={{ padding: pad, backgroundColor: 'var(--panel-bg)', textAlign: 'center' }}>
            <span style={{ fontSize: windowWidth < 768 ? '14px' : '15px', color: 'var(--foreground-dark)' }}>
              {`${waitingCount} ${waitingCount === 1 ? 'person' : 'people'} waiting to tune`}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: windowWidth < 768 ? '12px' : '14px',
          color: 'var(--foreground)',
          fontWeight: 'bold',
        }}
      >
        Total tunes: {gameState.totalTunes}
      </div>
    </div>
  )
}
