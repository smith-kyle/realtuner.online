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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: windowWidth < 768 ? '10px' : '20px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Current player info above video */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {gameState.currentPlayer ? (
          <>
            <div
              style={{
                fontSize: windowWidth < 768 ? '16px' : '18px',
                fontWeight: 'bold',
                marginBottom: '5px',
              }}
            >
              {gameState.currentPlayer.name}'s turn to tune
            </div>
            <div
              style={{
                fontSize: windowWidth < 768 ? '14px' : '16px',
                color: '#666',
              }}
            >
              {gameState.timeLeft}s left
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: windowWidth < 768 ? '14px' : '16px',
              color: '#666',
            }}
          >
            Join the queue to start tuning
          </div>
        )}
      </div>

      {/* Video section - always centered and full width on mobile */}
      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto 20px auto',
          aspectRatio: '16/9',
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
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

      {/* Queue section - below video, centered */}
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Combined queue and join form */}
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Join queue form */}
          <div
            style={{
              padding: windowWidth < 768 ? '12px' : '15px',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e9ecef',
            }}
          >
            {error && (
              <div
                style={{
                  color: 'red',
                  marginBottom: '10px',
                  fontSize: windowWidth < 768 ? '13px' : '14px',
                }}
              >
                {error}
              </div>
            )}

            {isCurrentPlayer ? (
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: windowWidth < 768 ? '14px' : '16px',
                  textAlign: 'center',
                  color: '#28a745',
                }}
              >
                🎵 It's your turn to tune!
              </div>
            ) : isInQueue ? (
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: windowWidth < 768 ? '14px' : '16px',
                  textAlign: 'center',
                  color: '#007bff',
                }}
              >
                You're in the queue - Position #
                {gameState.queue.findIndex((p) => p.id === userId) + 1}
              </div>
            ) : micDenied ? (
              <button
                onClick={() => window.location.reload()}
                style={{
                  width: '100%',
                  padding: windowWidth < 768 ? '12px 16px' : '10px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: windowWidth < 768 ? '14px' : '16px',
                }}
              >
                Refresh to allow microphone
              </button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: windowWidth < 480 ? 'column' : 'row',
                  gap: '10px',
                }}
              >
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: windowWidth < 768 ? '12px' : '10px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: windowWidth < 768 ? '16px' : '14px', // 16px on mobile prevents zoom
                  }}
                />
                <button
                  onClick={handleJoinQueue}
                  style={{
                    padding: windowWidth < 768 ? '12px 20px' : '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: windowWidth < 768 ? '14px' : '14px',
                    minWidth: windowWidth < 480 ? '100%' : 'auto',
                  }}
                >
                  Join Queue
                </button>
              </div>
            )}
          </div>

          {/* Queue list */}
          <div style={{ padding: windowWidth < 768 ? '12px' : '15px' }}>
            <h3
              style={{
                margin: '0 0 15px 0',
                fontSize: windowWidth < 768 ? '16px' : '18px',
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              Queue ({gameState.queue.length})
            </h3>
            {gameState.queue.length === 0 ? (
              <p
                style={{
                  color: '#666',
                  margin: 0,
                  textAlign: 'center',
                  fontSize: windowWidth < 768 ? '14px' : '16px',
                }}
              >
                No one in queue
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {gameState.queue.map((player, index) => (
                  <div
                    key={player.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: index === 0 ? '#fff3cd' : '#f8f9fa',
                      border: `1px solid ${index === 0 ? '#ffeaa7' : '#e9ecef'}`,
                      borderRadius: '6px',
                      fontSize: windowWidth < 768 ? '14px' : '15px',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? '#ffc107' : '#6c757d',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginRight: '10px',
                      }}
                    >
                      {index + 1}
                    </div>
                    <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                      {player.name}
                    </span>
                    {index === 0 && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '12px',
                          color: '#856404',
                          fontWeight: 'bold',
                        }}
                      >
                        UP NEXT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Total tunes counter at bottom */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: windowWidth < 768 ? '12px' : '14px',
          color: '#666',
        }}
      >
        Total tunes: {gameState.totalTunes}
      </div>
    </div>
  )
}
