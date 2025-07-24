'use client'

import { useState, useEffect } from 'react'
import { useSocket } from './hooks/useSocket'

export default function Home() {
  const { gameState, requestMicrophonePermission, joinQueue, error } = useSocket()
  const [name, setName] = useState('')
  const [micDenied, setMicDenied] = useState(false)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  )

  // Get user ID from localStorage to check if they're in queue
  const userId = typeof window !== 'undefined' ? localStorage.getItem('realtuner-user-id') : null

  // Check if current user is in queue or currently playing
  const isInQueue = userId && gameState.queue.some((p) => p.id === userId)
  const isCurrentPlayer = userId && gameState.currentPlayer && gameState.currentPlayer.id === userId

  // Track window width for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleJoinQueue = async () => {
    if (!name.trim()) return

    const hasPermission = await requestMicrophonePermission()
    if (hasPermission) {
      joinQueue(name)
      setName('')
    } else {
      setMicDenied(true)
    }
  }

  // Determine if we should stack vertically
  const isNarrow = windowWidth < 1000

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '20px' }}>
      {/* Current player info above video */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {gameState.currentPlayer ? (
          <>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {gameState.currentPlayer.name}'s turn to tune
            </div>
            <div style={{ fontSize: '16px', color: '#666' }}>{gameState.timeLeft}s left</div>
          </>
        ) : (
          <div style={{ fontSize: '16px', color: '#666' }}>Join the queue to start tuning</div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: isNarrow ? 'column' : 'row',
          gap: '20px',
          flex: 1,
        }}
      >
        {/* Video section */}
        <div
          style={{
            width: isNarrow ? '100%' : '60%',
            aspectRatio: '16/9',
            maxHeight: isNarrow ? '300px' : '500px',
            position: 'relative',
          }}
        >
          <iframe
            src="https://customer-45m451mk4pl7803c.cloudflarestream.com/887f8fa55974c95626b02dc4f92d9f26/iframe?muted=true&amp;autoplay=true"
            style={{
              border: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
            }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen={true}
          ></iframe>
        </div>

        {/* Queue section */}
        <div
          style={{
            width: isNarrow ? '100%' : '40%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Combined queue and join form */}
          <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Join queue form */}
            <div
              style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e9ecef',
              }}
            >
              {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

              {isCurrentPlayer ? (
                <div style={{ fontWeight: 'bold' }}>It's your turn.</div>
              ) : isInQueue ? (
                <div style={{ fontWeight: 'bold' }}>
                  You're in the queue. Position:{' '}
                  {gameState.queue.findIndex((p) => p.id === userId) + 1}
                </div>
              ) : micDenied ? (
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Refresh to allow microphone
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    onClick={handleJoinQueue}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                    }}
                  >
                    Join Queue
                  </button>
                </div>
              )}
            </div>

            {/* Queue list */}
            <div style={{ padding: '15px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600' }}>
                Queue ({gameState.queue.length})
              </h3>
              {gameState.queue.length === 0 ? (
                <p style={{ color: '#666', margin: 0 }}>No one in queue</p>
              ) : (
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  {gameState.queue.map((player, index) => (
                    <li key={player.id} style={{ marginBottom: '8px', fontSize: '14px' }}>
                      {player.name}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Total tunes counter at bottom */}
      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#666' }}>
        Total tunes: {gameState.totalTunes}
      </div>
    </div>
  )
}
