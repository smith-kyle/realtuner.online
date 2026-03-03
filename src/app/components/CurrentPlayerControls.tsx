'use client'

import { useEffect, useState } from 'react'
import { ActiveTuner } from '../types'

interface CurrentPlayerControlsProps {
  currentPlayer: ActiveTuner | null
  timeLeft: number
  isCurrentPlayer: boolean
  onDoneTuning: () => void
  onStartAudio: () => Promise<boolean>
  onStopAudio: () => void
}

export function CurrentPlayerControls({
  currentPlayer,
  timeLeft,
  isCurrentPlayer,
  onDoneTuning,
  onStartAudio,
  onStopAudio,
}: CurrentPlayerControlsProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)

  useEffect(() => {
    if (isCurrentPlayer && currentPlayer) {
      handleStartStream()
    } else {
      if (isStreaming) {
        handleStopStream()
      }
    }
  }, [isCurrentPlayer, currentPlayer])

  const handleStartStream = async () => {
    try {
      setStreamError(null)
      const success = await onStartAudio()
      if (success) {
        setIsStreaming(true)
      } else {
        setStreamError('Failed to start audio stream')
      }
    } catch (error) {
      console.error('Error starting audio stream:', error)
      setStreamError('Error starting audio stream')
    }
  }

  const handleStopStream = () => {
    onStopAudio()
    setIsStreaming(false)
    setStreamError(null)
  }

  const handleDoneTuning = () => {
    if (isStreaming) {
      handleStopStream()
    }
    onDoneTuning()
  }

  if (!currentPlayer) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      {isCurrentPlayer ? (
        <>
          <div className="text-center mb-4">
            <div className="text-2xl font-bold mb-2">🎵 It's Your Turn!</div>
            <div className="text-lg text-gray-800">Start tuning your instrument</div>
          </div>

          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-600">Time remaining</div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
            ></div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                }`}
              ></div>
              <span className="font-medium text-gray-800">
                {isStreaming ? 'Microphone Live' : 'Microphone Off'}
              </span>
            </div>
            {streamError && <div className="text-sm text-red-600 mb-2">{streamError}</div>}
          </div>

          <div className="space-y-2">
            {!isStreaming ? (
              <button
                onClick={handleStartStream}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Start Streaming Audio
              </button>
            ) : (
              <button
                onClick={handleStopStream}
                className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Stop Streaming Audio
              </button>
            )}

            <button
              onClick={handleDoneTuning}
              className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Done Tuning
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500 text-center">
            <p>Your microphone is being streamed to the tuner.</p>
            <p>Tune your instrument and click Done when finished!</p>
          </div>
        </>
      ) : (
        <>
          <div className="text-center mb-4">
            <div className="text-xl font-bold text-gray-800 mb-2">
              {currentPlayer.name}'s turn to tune
            </div>
            <div className="text-lg text-gray-600">Listen to the tuning session</div>
          </div>

          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-600">Time remaining</div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 font-medium">LIVE</span>
          </div>

          <div className="text-sm text-gray-500 text-center">
            <p>Listen to {currentPlayer.name}'s tuning session.</p>
            <p>You'll be notified when it's your turn!</p>
          </div>
        </>
      )}
    </div>
  )
}
