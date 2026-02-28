'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '../hooks/useSocket'

export function QueueSection() {
  const { gameState, requestMicrophonePermission, joinQueue, skipTurn, error } = useSocket()
  const [micPending, setMicPending] = useState(false)
  const [micDenied, setMicDenied] = useState(false)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  )

  const userId = typeof window !== 'undefined' ? localStorage.getItem('realtuner-user-id') : null

  const isInQueue = userId && gameState.queue.some((p) => p.id === userId)
  const isCurrentPlayer = userId && gameState.currentPlayer && gameState.currentPlayer.id === userId
  const queuePosition = isInQueue
    ? gameState.queue.findIndex((p) => p.id === userId) + 1
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

  const panelStyle = {
    border: '2px solid #8B4513',
    backgroundColor: '#F5E0C8',
    padding: windowWidth < 768 ? '12px' : '15px',
  }

  const buttonStyle = {
    backgroundColor: '#8B4513',
    color: '#F5E0C8',
    border: '2px solid #5C2E00',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: windowWidth < 768 ? '14px' : '15px',
    padding: windowWidth < 768 ? '12px 20px' : '10px 20px',
    width: '100%',
  }

  const waitingCount = gameState.queue.length

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ border: '2px solid #8B4513', overflow: 'hidden' }}>
        <div style={{ ...panelStyle, borderBottom: '2px solid #8B4513' }}>
          {error && (
            <div style={{ color: '#8B0000', marginBottom: '10px', fontSize: windowWidth < 768 ? '13px' : '14px' }}>
              {error}
            </div>
          )}

          {isCurrentPlayer ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: windowWidth < 768 ? '16px' : '18px', color: '#5C2E00', marginBottom: '12px' }}>
                It's your turn! Tune away.
              </div>
              <button onClick={skipTurn} style={{ ...buttonStyle, backgroundColor: '#5C2E00', borderColor: '#3A1A00' }}>
                Done Tuning
              </button>
            </div>
          ) : isInQueue ? (
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: windowWidth < 768 ? '14px' : '16px', color: '#5C2E00' }}>
              You're #{queuePosition} in line &nbsp;&mdash;&nbsp; {gameState.queue.length} {gameState.queue.length === 1 ? 'person' : 'people'} waiting
            </div>
          ) : micDenied ? (
            <button
              onClick={() => window.location.reload()}
              style={{ ...buttonStyle, backgroundColor: '#8B0000', borderColor: '#5C0000' }}
            >
              Mic needed — refresh to allow
            </button>
          ) : (
            <button onClick={handleStartTuning} disabled={micPending} style={{ ...buttonStyle, opacity: micPending ? 0.7 : 1 }}>
              {micPending ? 'Requesting mic...' : 'Start Tuning'}
            </button>
          )}
        </div>

        {waitingCount > 0 && (
          <div style={{ padding: windowWidth < 768 ? '12px' : '15px', backgroundColor: '#F5E0C8', textAlign: 'center' }}>
            <span style={{ fontSize: windowWidth < 768 ? '14px' : '15px', color: '#5C2E00' }}>
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
          color: '#1a0a00',
          fontWeight: 'bold',
        }}
      >
        Total tunes: {gameState.totalTunes}
      </div>
    </div>
  )
}
