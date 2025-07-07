'use client'

import { useState } from 'react'

interface JoinQueueProps {
  onJoinQueue: (name: string) => void
  onRequestMicPermission: () => Promise<boolean>
  isConnected: boolean
  error?: string | null
}

export function JoinQueue({
  onJoinQueue,
  onRequestMicPermission,
  isConnected,
  error,
}: JoinQueueProps) {
  const [name, setName] = useState('')
  const [hasPermission, setHasPermission] = useState(false)
  const [isCheckingPermission, setIsCheckingPermission] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const handleRequestPermission = async () => {
    setIsCheckingPermission(true)
    try {
      const granted = await onRequestMicPermission()
      setHasPermission(granted)
      if (!granted) {
        alert(
          'Microphone permission is required to join the queue. Please refresh the page and allow microphone access.',
        )
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      alert('Error requesting microphone permission. Please try again.')
    } finally {
      setIsCheckingPermission(false)
    }
  }

  const handleJoinQueue = async () => {
    if (!name.trim()) {
      alert('Please enter your name')
      return
    }

    if (!hasPermission) {
      alert('Please allow microphone access first')
      return
    }

    setIsJoining(true)
    try {
      onJoinQueue(name.trim())
      setName('')
    } catch (error) {
      console.error('Error joining queue:', error)
    } finally {
      setIsJoining(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinQueue()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Join the Tuning Queue</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="text-yellow-700 text-sm">Connecting to server...</div>
        </div>
      )}

      {/* Step 1: Microphone Permission */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
              hasPermission ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}
          >
            {hasPermission ? '✓' : '1'}
          </div>
          <span className="font-medium text-gray-800">Microphone Permission</span>
        </div>

        {!hasPermission ? (
          <div className="ml-8">
            <p className="text-sm text-gray-600 mb-3">
              To ensure you get the full 30 seconds to tune, please allow microphone access first.
            </p>
            <button
              onClick={handleRequestPermission}
              disabled={isCheckingPermission || !isConnected}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isCheckingPermission || !isConnected
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isCheckingPermission ? 'Checking...' : 'Allow Microphone'}
            </button>
          </div>
        ) : (
          <div className="ml-8">
            <p className="text-sm ">✓ Microphone access granted</p>
          </div>
        )}
      </div>

      {/* Step 2: Name Input */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
              hasPermission ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}
          >
            2
          </div>
          <span className="font-medium text-gray-800">Your Name</span>
        </div>

        <div className="ml-8">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your name"
            disabled={!hasPermission}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !hasPermission ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            maxLength={30}
          />
        </div>
      </div>

      {/* Join Button */}
      <button
        onClick={handleJoinQueue}
        disabled={!hasPermission || !name.trim() || isJoining || !isConnected}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          !hasPermission || !name.trim() || isJoining || !isConnected
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isJoining ? 'Joining...' : 'Join Queue'}
      </button>

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        <p>Each person gets 30 seconds to tune their instrument.</p>
        <p>Your microphone will be live when it's your turn!</p>
      </div>
    </div>
  )
}
