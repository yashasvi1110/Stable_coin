'use client'
import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount, getMint } from '@solana/spl-token'
import MiningInterface from './MiningInterface'
import TokenManagement from './TokenManagement'

interface TokenInfo {
  name: string
  symbol: string
  mintAddress: string
  tokenAccount: string
  decimals: number
  initialSupply: number
  metadataUri: string
  network: string
  wallet: string
  createdAt: string
}

interface MiningStats {
  active: boolean
  tokensEarned: number
  clicks: number
  canClaim: boolean
}

export default function EnhancedTokenDashboard({ tokenInfo }: { tokenInfo: TokenInfo }) {
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<string>('')
  const [solBalance, setSolBalance] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [miningStats, setMiningStats] = useState<MiningStats>({
    active: false,
    tokensEarned: 0,
    clicks: 0,
    canClaim: false
  })
  const [transactionHistory, setTransactionHistory] = useState<any[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const connection = new Connection(clusterApiUrl('devnet'))

  useEffect(() => {
    if (connected && publicKey) {
      loadTokenData()
      loadMiningStats()
    }
  }, [connected, publicKey])

  const loadTokenData = async () => {
    try {
      setLoading(true)
      const mintPubkey = new PublicKey(tokenInfo.mintAddress)
      const tokenAccountPubkey = new PublicKey(tokenInfo.tokenAccount)
      
      // Get token balance
      const tokenAccount = await getAccount(connection, tokenAccountPubkey)
      const tokenBalance = Number(tokenAccount.amount) / Math.pow(10, tokenInfo.decimals)
      setBalance(tokenBalance.toFixed(2))
      
      // Get SOL balance
      const solBalance = await connection.getBalance(publicKey!)
      setSolBalance((solBalance / LAMPORTS_PER_SOL).toFixed(4))
      
      setError('')
    } catch (err) {
      setError('Failed to load token data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMiningStats = async () => {
    try {
      // Simulate loading mining stats from backend
      setMiningStats({
        active: true,
        tokensEarned: 5,
        clicks: 5,
        canClaim: true
      })
    } catch (err) {
      console.error('Failed to load mining stats:', err)
    }
  }

  const handleMine = async () => {
    try {
      setLoading(true)
      // Simulate mining operation
      const newStats = {
        ...miningStats,
        clicks: miningStats.clicks + 1,
        tokensEarned: miningStats.tokensEarned + 1
      }
      setMiningStats(newStats)
      
      // Add to transaction history
      setTransactionHistory(prev => [{
        type: 'Mining',
        amount: '1 VARD',
        timestamp: new Date().toLocaleTimeString(),
        status: 'Success'
      }, ...prev])
      
      setError('')
    } catch (err) {
      setError('Mining failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    try {
      setLoading(true)
      // Simulate claim operation
      setMiningStats(prev => ({
        ...prev,
        canClaim: false,
        tokensEarned: 0
      }))
      
      // Add to transaction history
      setTransactionHistory(prev => [{
        type: 'Claim',
        amount: `${miningStats.tokensEarned} VARD`,
        timestamp: new Date().toLocaleTimeString(),
        status: 'Success'
      }, ...prev])
      
      setError('')
    } catch (err) {
      setError('Claim failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBurn = async (amount: number) => {
    try {
      setLoading(true)
      // Simulate burn operation
      const currentBalance = parseFloat(balance)
      const newBalance = Math.max(0, currentBalance - amount)
      setBalance(newBalance.toFixed(2))
      
      // Add to transaction history
      setTransactionHistory(prev => [{
        type: 'Burn',
        amount: `${amount} VARD`,
        timestamp: new Date().toLocaleTimeString(),
        status: 'Success'
      }, ...prev])
      
      setError('')
    } catch (err) {
      setError('Burn failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async (to: string, amount: number) => {
    try {
      setLoading(true)
      // Simulate transfer operation
      const currentBalance = parseFloat(balance)
      const newBalance = Math.max(0, currentBalance - amount)
      setBalance(newBalance.toFixed(2))
      
      // Add to transaction history
      setTransactionHistory(prev => [{
        type: 'Transfer',
        amount: `${amount} VARD to ${to.slice(0, 8)}...`,
        timestamp: new Date().toLocaleTimeString(),
        status: 'Success'
      }, ...prev])
      
      setError('')
    } catch (err) {
      setError('Transfer failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMint = async (amount: number) => {
    try {
      setLoading(true)
      // Simulate mint operation
      const currentBalance = parseFloat(balance)
      const newBalance = currentBalance + amount
      setBalance(newBalance.toFixed(2))
      
      // Add to transaction history
      setTransactionHistory(prev => [{
        type: 'Mint',
        amount: `${amount} VARD`,
        timestamp: new Date().toLocaleTimeString(),
        status: 'Success'
      }, ...prev])
      
      setError('')
    } catch (err) {
      setError('Mint failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🚀 Vardiano Token</h1>
          <p className="text-xl text-gray-600 mb-8">Connect your wallet to start managing your tokens</p>
          <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !text-white !px-8 !py-3 !text-lg !rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🚀 Vardiano Dashboard</h1>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {tokenInfo.network.toUpperCase()}
              </span>
            </div>
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Token Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">🪙</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Token Balance</p>
                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : balance} {tokenInfo.symbol}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">SOL Balance</p>
                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : solBalance} SOL</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">⛏️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mining Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {miningStats.active ? '🟢 Active' : '🔴 Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mining Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 border mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⛏️ Mining System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Mining Stats</h3>
                <div className="space-y-2">
                  <p>🖱️ Clicks: {miningStats.clicks}</p>
                  <p>🪙 Earned: {miningStats.tokensEarned} {tokenInfo.symbol}</p>
                  <p>📊 Status: {miningStats.active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <button
                onClick={handleMine}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {loading ? '⏳ Mining...' : '🖱️ Click to Mine (1 VARD)'}
              </button>
              
              <button
                onClick={handleClaim}
                disabled={loading || !miningStats.canClaim}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold py-3 px-6 rounded-lg hover:from-yellow-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {loading ? '⏳ Claiming...' : `💰 Claim ${miningStats.tokensEarned} VARD`}
              </button>
            </div>
          </div>
        </div>

        {/* Token Management */}
        <div className="mb-8">
          <TokenManagement
            onMint={handleMint}
            onBurn={handleBurn}
            onTransfer={handleTransfer}
            currentBalance={balance}
            loading={loading}
          />
        </div>

        {/* Advanced Features */}
        {showAdvanced && (
          <div className="bg-white rounded-xl shadow-lg p-6 border mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Advanced Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">🔒 Security & Testing</h3>
                <div className="space-y-2">
                  <button className="w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
                    🔍 Run Security Tests
                  </button>
                  <button className="w-full bg-teal-600 text-white font-medium py-2 px-4 rounded-md hover:bg-teal-700 transition-colors">
                    🖼️ Upload Logo
                  </button>
                  <button className="w-full bg-cyan-600 text-white font-medium py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors">
                    📝 Update Metadata
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">🚀 Deployment</h3>
                <div className="space-y-2">
                  <button className="w-full bg-orange-600 text-white font-medium py-2 px-4 rounded-md hover:bg-orange-700 transition-colors">
                    🌐 Configure Mainnet
                  </button>
                  <button className="w-full bg-pink-600 text-white font-medium py-2 px-4 rounded-md hover:bg-pink-700 transition-colors">
                    💰 Create Mainnet Wallet
                  </button>
                  <button className="w-full bg-red-600 text-white font-medium py-2 px-4 rounded-md hover:bg-red-700 transition-colors">
                    🚀 Deploy to Mainnet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-lg p-6 border mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Transaction History</h2>
          <div className="space-y-2">
            {transactionHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions yet. Start mining or managing tokens!</p>
            ) : (
              transactionHistory.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg ${tx.type === 'Mining' ? '⛏️' : tx.type === 'Claim' ? '💰' : tx.type === 'Burn' ? '🔥' : '🪙'}`}></span>
                    <div>
                      <p className="font-medium text-gray-900">{tx.type}</p>
                      <p className="text-sm text-gray-600">{tx.amount}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{tx.timestamp}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tx.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Token Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ℹ️ Token Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Info</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {tokenInfo.name}</p>
                <p><span className="font-medium">Symbol:</span> {tokenInfo.symbol}</p>
                <p><span className="font-medium">Decimals:</span> {tokenInfo.decimals}</p>
                <p><span className="font-medium">Initial Supply:</span> {tokenInfo.initialSupply.toLocaleString()} {tokenInfo.symbol}</p>
                <p><span className="font-medium">Network:</span> {tokenInfo.network}</p>
                <p><span className="font-medium">Created:</span> {new Date(tokenInfo.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Blockchain Info</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Mint Address:</span></p>
                <p className="text-xs bg-gray-100 p-2 rounded break-all font-mono">{tokenInfo.mintAddress}</p>
                <p><span className="font-medium">Token Account:</span></p>
                <p className="text-xs bg-gray-100 p-2 rounded break-all font-mono">{tokenInfo.tokenAccount}</p>
                <p><span className="font-medium">Wallet:</span></p>
                <p className="text-xs bg-gray-100 p-2 rounded break-all font-mono">{tokenInfo.wallet}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-4">
            <a
              href={`https://explorer.solana.com/address/${tokenInfo.mintAddress}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔍 View on Explorer
            </a>
            <a
              href={tokenInfo.metadataUri}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              📄 View Metadata
            </a>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <span className="block sm:inline">❌ {error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
