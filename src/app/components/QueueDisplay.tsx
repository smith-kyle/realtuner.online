'use client'

import { useEffect, useState } from 'react'
import { GameState } from '../types'

interface QueueDisplayProps {
  gameState: GameState
  isConnected: boolean
}

export function QueueDisplay({ gameState, isConnected }: QueueDisplayProps) {
  const [timeDisplay, setTimeDisplay] = useState('00:00')

  useEffect(() => {
    const minutes = Math.floor(gameState.timeLeft / 60)
    const seconds = gameState.timeLeft % 60
    setTimeDisplay(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
  }, [gameState.timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return ((30 - gameState.timeLeft) / 30) * 100
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        ></div>
        <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Total Tunes Counter */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-blue-600">{gameState.totalTunes}</div>
        <div className="text-sm text-gray-600">Total Tunes Completed</div>
      </div>

      {/* Current Player Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Currently Tuning</h3>
        {gameState.currentPlayer ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-medium text-blue-800">
                {gameState.currentPlayer.name}
              </div>
              <div className="text-2xl font-bold text-blue-600">{timeDisplay}</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>

            {/* Status Indicator */}
            <div className="mt-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live - Microphone Active</span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-gray-500">No one is currently tuning</div>
          </div>
        )}
      </div>

      {/* Queue Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Queue ({gameState.queue.length} waiting)
        </h3>

        {gameState.queue.length > 0 ? (
          <div className="space-y-2">
            {gameState.queue.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === 0 ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="font-medium text-gray-800">{player.name}</div>
                </div>

                {index === 0 && <div className="text-sm text-yellow-600 font-medium">Up Next</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-gray-500">Queue is empty</div>
          </div>
        )}
      </div>
    </div>
  )
}
