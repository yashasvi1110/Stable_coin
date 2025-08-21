'use client'
import React, { useState, useEffect } from 'react'

interface MiningInterfaceProps {
  onMine: () => void
  onClaim: () => void
  miningStats: {
    active: boolean
    tokensEarned: number
    clicks: number
    canClaim: boolean
  }
  loading: boolean
}

export default function MiningInterface({ onMine, onClaim, miningStats, loading }: MiningInterfaceProps) {
  const [clickAnimation, setClickAnimation] = useState(false)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number }>>([])
  const [showReward, setShowReward] = useState(false)

  const handleMineClick = () => {
    if (loading) return
    
    // Trigger click animation
    setClickAnimation(true)
    
    // Create particle effect
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 200 + 100,
      y: Math.random() * 200 + 100,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10
    }))
    setParticles(newParticles)
    
    // Show reward animation
    setShowReward(true)
    
    // Call the mining function
    onMine()
    
    // Reset animations
    setTimeout(() => {
      setClickAnimation(false)
      setShowReward(false)
    }, 1000)
    
    // Clear particles after animation
    setTimeout(() => {
      setParticles([])
    }, 2000)
  }

  useEffect(() => {
    // Animate particles
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vx: particle.vx * 0.98,
          vy: particle.vy * 0.98
        })).filter(particle => 
          Math.abs(particle.vx) > 0.1 || Math.abs(particle.vy) > 0.1
        )
      )
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h2 className="text-3xl font-bold text-center mb-6">⛏️ Vardiano Mining</h2>
        
        {/* Mining Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center bg-white/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{miningStats.clicks}</div>
            <div className="text-sm opacity-80">Total Clicks</div>
          </div>
          <div className="text-center bg-white/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{miningStats.tokensEarned}</div>
            <div className="text-sm opacity-80">VARD Earned</div>
          </div>
          <div className="text-center bg-white/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{miningStats.active ? '🟢' : '🔴'}</div>
            <div className="text-sm opacity-80">Status</div>
          </div>
        </div>

        {/* Mining Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleMineClick}
            disabled={loading}
            className={`relative inline-flex items-center justify-center px-12 py-6 text-2xl font-bold rounded-2xl transition-all duration-200 transform ${
              clickAnimation ? 'scale-110' : 'hover:scale-105'
            } ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 shadow-2xl'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                <span>Mining...</span>
              </div>
            ) : (
              <>
                <span className="mr-2">🖱️</span>
                Click to Mine!
                <span className="ml-2 text-lg">+1 VARD</span>
              </>
            )}
          </button>
        </div>

        {/* Claim Button */}
        {miningStats.canClaim && (
          <div className="text-center">
            <button
              onClick={onClaim}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              💰 Claim {miningStats.tokensEarned} VARD
            </button>
          </div>
        )}

        {/* Mining Tips */}
        <div className="mt-8 text-center opacity-80">
          <p className="text-sm">
            💡 <strong>Tip:</strong> Click faster to earn more VARD tokens!
          </p>
          <p className="text-xs mt-2">
            Each click earns 1 VARD. Claim your earnings when ready.
          </p>
        </div>
      </div>

      {/* Particle Effects */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full pointer-events-none animate-pulse"
          style={{
            left: particle.x,
            top: particle.y,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* Reward Animation */}
      {showReward && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-6xl animate-bounce animate-ping">
            🪙
          </div>
        </div>
      )}

      {/* Floating Coins Animation */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-20 animate-bounce"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 10}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s'
            }}
          >
            🪙
          </div>
        ))}
      </div>
    </div>
  )
}
