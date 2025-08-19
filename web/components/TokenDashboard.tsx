'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount, getMint } from '@solana/spl-token'
import AdvancedFeatures from './AdvancedFeatures'

interface TokenInfo {
  mintAddress: string
  symbol: string
  name: string
  decimals: number
  initialSupply: number
  metadataUri?: string
  logo?: {
    ipfs?: string
    arweave?: string
  }
}

interface TokenDashboardProps {
  tokenInfo: TokenInfo
}

export default function TokenDashboard({ tokenInfo }: TokenDashboardProps) {
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<string>('')
  const [solBalance, setSolBalance] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [miningStats, setMiningStats] = useState({
    clicks: 0,
    canClaim: false,
    claiming: false
  })
  
  // Advanced features
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferAddress, setTransferAddress] = useState('')
  const [miningLevel, setMiningLevel] = useState(1)
  const [miningMultiplier, setMiningMultiplier] = useState(1)
  const [achievements, setAchievements] = useState<string[]>([])
  const [showAchievements, setShowAchievements] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('devnet'), 'confirmed')

  useEffect(() => {
    if (connected && publicKey) {
      loadTokenData()
      initParticleSystem()
    }
  }, [connected, publicKey])

  // Particle system for background effects
  const initParticleSystem = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: any[] = []
    
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.x += particle.vx
        particle.y += particle.vy
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
        
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${particle.opacity})`
        ctx.fill()
      })
      
      requestAnimationFrame(animate)
    }
    
    animate()
  }



  const loadTokenData = async () => {
    if (!publicKey) return
    
    try {
      setLoading(true)
      setError('')
      
      // Load token balance
      const mint = new PublicKey(tokenInfo.mintAddress)
      const ata = await getAssociatedTokenAddress(mint, publicKey)
      const account = await getAccount(connection, ata)
      const mintInfo = await getMint(connection, mint)
      const humanBalance = Number(account.amount) / 10 ** mintInfo.decimals
      setBalance(humanBalance.toLocaleString())
      
      // Load SOL balance
      const lamports = await connection.getBalance(publicKey)
      setSolBalance((lamports / 1e9).toFixed(4))
      
      // Check achievements
      checkAchievements(humanBalance)
      
    } catch (err: any) {
      setError(err.message || 'Failed to load token data')
    } finally {
      setLoading(false)
    }
  }

  const checkAchievements = (balance: number) => {
    const newAchievements: string[] = []
    if (balance >= 1000 && !achievements.includes('Whale')) {
      newAchievements.push('🐋 Whale - 1000+ VARD')
    }
    if (miningStats.clicks >= 100 && !achievements.includes('Miner')) {
      newAchievements.push('⛏️ Miner - 100+ clicks')
    }
    if (miningStats.clicks >= 500 && !achievements.includes('Master Miner')) {
      newAchievements.push('👑 Master Miner - 500+ clicks')
    }
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements])
      setShowAchievements(true)
      setTimeout(() => setShowAchievements(false), 3000)
    }
  }

  const handleMine = async () => {
    if (!connected) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/mining/click', { method: 'POST' })
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        return
      }
      
      const newClicks = data.tokensEarned
      setMiningStats(prev => ({
        ...prev,
        clicks: newClicks,
        canClaim: data.canClaim
      }))
      
      // Level up system
      if (newClicks % 50 === 0) {
        setMiningLevel(prev => prev + 1)
        setMiningMultiplier(prev => prev + 0.5)
      }
      
      // Reload token data
      await loadTokenData()
      
    } catch (err: any) {
      setError(err.message || 'Mining failed')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!connected || !miningStats.canClaim) return
    
    try {
      setLoading(true)
      setMiningStats(prev => ({ ...prev, claiming: true }))
      
      const response = await fetch('/api/mining/claim', { method: 'POST' })
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        return
      }
      
      alert(`Claimed successfully! Transaction: ${data.tx}`)
      setMiningStats(prev => ({ ...prev, canClaim: false }))
      
      // Reload token data
      await loadTokenData()
      
    } catch (err: any) {
      setError(err.message || 'Claim failed')
    } finally {
      setLoading(false)
      setMiningStats(prev => ({ ...prev, claiming: false }))
    }
  }

  const handleTransfer = async () => {
    if (!connected || !transferAmount || !transferAddress) return
    
    try {
      setLoading(true)
      // Simulate transfer (you'd implement actual transfer logic here)
      alert(`Transfer ${transferAmount} VARD to ${transferAddress}`)
      setShowTransfer(false)
      setTransferAmount('')
      setTransferAddress('')
      
    } catch (err: any) {
      setError(err.message || 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadTokenData()
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
        <div className="text-center max-w-md mx-auto p-8 relative z-10">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="text-6xl mb-6 animate-bounce">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <div className="mb-6">
              <WalletMultiButton />
            </div>
            <p className="text-gray-600">Connect to view your Vardiano tokens</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            <h1 className="text-6xl font-bold mb-4 animate-pulse">{tokenInfo.name} Dashboard</h1>
            <p className="text-2xl text-gray-600">Your Gateway to the Future of Finance</p>
          </div>
          <div className="mt-6 flex justify-center space-x-4">
            <WalletMultiButton />
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
            >
              🏆 Achievements ({achievements.length})
            </button>
          </div>
        </div>

        {/* Achievement Popup */}
        {showAchievements && (
          <div className="fixed top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white p-4 rounded-xl shadow-2xl z-50 animate-bounce">
            <h3 className="font-bold mb-2">🏆 New Achievement!</h3>
            <p>{achievements[achievements.length - 1]}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="text-red-500 text-2xl mr-3">⚠️</div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}



        {/* Token Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="group bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20 p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Token Balance</h3>
              <div className="text-2xl animate-pulse">🪙</div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {loading ? '...' : balance} {tokenInfo.symbol}
            </p>
            <div className="mt-2 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
          
          <div className="group bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20 p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">SOL Balance</h3>
              <div className="text-2xl animate-pulse">⚡</div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {loading ? '...' : solBalance} SOL
            </p>
            <div className="mt-2 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
          </div>
          
          <div className="group bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20 p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mining Level</h3>
              <div className="text-2xl">⛏️</div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Level {miningLevel}
            </p>
            <div className="mt-2 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          </div>
          
          <div className="group bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20 p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Multiplier</h3>
              <div className="text-2xl">🚀</div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {miningMultiplier}x
            </p>
            <div className="mt-2 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
          </div>
        </div>

        {/* Advanced Mining Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">⛏️</span>
            Advanced Mining System
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <button
                  onClick={handleMine}
                  disabled={loading}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Mining...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="mr-2">✨</span>
                      Mine +{miningMultiplier} Token
                    </span>
                  )}
                </button>
                
                <button
                  onClick={handleClaim}
                  disabled={!miningStats.canClaim || loading || miningStats.claiming}
                  className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
                >
                  {miningStats.claiming ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Claiming...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="mr-2">🎁</span>
                      Claim Tokens
                    </span>
                  )}
                </button>
                
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  🔄 Refresh
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Mined Tokens</p>
                    <p className="text-2xl font-bold text-blue-600">{miningStats.clicks}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Can Claim</p>
                    <p className="text-2xl font-bold text-green-600">{miningStats.canClaim ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Next Level</p>
                    <p className="text-2xl font-bold text-purple-600">{50 - (miningStats.clicks % 50)} clicks</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Mining Progress</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Level {miningLevel}</span>
                    <span>{miningStats.clicks % 50}/50</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((miningStats.clicks % 50) / 50) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                  <h5 className="font-semibold mb-2">Level Benefits</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Mining multiplier: {miningMultiplier}x</li>
                    <li>• Faster claim times</li>
                    <li>• Special achievements</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">💸</span>
            Token Transfer
          </h3>
          {!showTransfer ? (
            <button
              onClick={() => setShowTransfer(true)}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              💸 Send VARD Tokens
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
                <input
                  type="text"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  placeholder="Enter Solana wallet address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (VARD)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleTransfer}
                  disabled={!transferAmount || !transferAddress || loading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all duration-200 font-semibold"
                >
                  Send Tokens
                </button>
                <button
                  onClick={() => setShowTransfer(false)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Token Details */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Token Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Mint Address</p>
              <p className="font-mono text-sm break-all bg-white/70 rounded-lg p-2">{tokenInfo.mintAddress}</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Symbol</p>
              <p className="font-semibold text-lg">{tokenInfo.symbol}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Decimals</p>
              <p className="font-semibold text-lg">{tokenInfo.decimals}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Network</p>
              <p className="font-semibold text-lg">Devnet</p>
            </div>
          </div>
          
          {/* Logo Display */}
          {tokenInfo.logo && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-3">Logo</p>
              <div className="flex space-x-4">
                {tokenInfo.logo.ipfs && (
                  <a 
                    href={tokenInfo.logo.ipfs} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                  >
                    View IPFS Logo
                  </a>
                )}
                {tokenInfo.logo.arweave && (
                  <a 
                    href={tokenInfo.logo.arweave} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                  >
                    View Arweave Logo
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Advanced Features */}
        <AdvancedFeatures tokenSymbol={tokenInfo.symbol} currentPrice={118} />

        {/* Explorer Links */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🔍</span>
            Blockchain Explorer
          </h3>
          <div className="space-y-4">
            <a
              href={`https://explorer.solana.com/address/${tokenInfo.mintAddress}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-center font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🌐 View Token on Solana Explorer
            </a>
            {publicKey && (
              <a
                href={`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 text-center font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                💰 View Wallet on Solana Explorer
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 