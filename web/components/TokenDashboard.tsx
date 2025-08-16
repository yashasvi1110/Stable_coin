'use client'

import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount, getMint } from '@solana/spl-token'

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

  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('devnet'), 'confirmed')

  useEffect(() => {
    if (connected && publicKey) {
      loadTokenData()
    }
  }, [connected, publicKey])

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
      
    } catch (err: any) {
      setError(err.message || 'Failed to load token data')
    } finally {
      setLoading(false)
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
      
      setMiningStats(prev => ({
        ...prev,
        clicks: data.tokensEarned,
        canClaim: data.canClaim
      }))
      
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

  const handleRefresh = () => {
    loadTokenData()
  }

  if (!connected) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
        <WalletMultiButton />
        <p className="text-gray-600 mt-4">Connect to view your Vardiano tokens</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tokenInfo.name} Dashboard</h1>
          <p className="text-gray-600">Manage your {tokenInfo.symbol} tokens</p>
        </div>
        <WalletMultiButton />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Token Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Token Balance</h3>
          <p className="text-3xl font-bold text-blue-600">
            {loading ? '...' : balance} {tokenInfo.symbol}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">SOL Balance</h3>
          <p className="text-3xl font-bold text-green-600">
            {loading ? '...' : solBalance} SOL
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Supply</h3>
          <p className="text-3xl font-bold text-purple-600">
            {tokenInfo.initialSupply.toLocaleString()} {tokenInfo.symbol}
          </p>
        </div>
      </div>

      {/* Token Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Token Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Mint Address</p>
            <p className="font-mono text-sm break-all">{tokenInfo.mintAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Symbol</p>
            <p className="font-semibold">{tokenInfo.symbol}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Decimals</p>
            <p className="font-semibold">{tokenInfo.decimals}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Network</p>
            <p className="font-semibold">Devnet</p>
          </div>
        </div>
        
        {/* Logo Display */}
        {tokenInfo.logo && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Logo</p>
            <div className="flex space-x-4">
              {tokenInfo.logo.ipfs && (
                <a 
                  href={tokenInfo.logo.ipfs} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View IPFS Logo
                </a>
              )}
              {tokenInfo.logo.arweave && (
                <a 
                  href={tokenInfo.logo.arweave} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Arweave Logo
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mining Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Mining System</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleMine}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Mining...' : 'Mine +1 Token'}
          </button>
          
          <button
            onClick={handleClaim}
            disabled={!miningStats.canClaim || loading || miningStats.claiming}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {miningStats.claiming ? 'Claiming...' : 'Claim Tokens'}
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Mined: {miningStats.clicks} tokens</p>
          <p>Can Claim: {miningStats.canClaim ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Explorer Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Blockchain Explorer</h3>
        <div className="space-y-2">
          <a
            href={`https://explorer.solana.com/address/${tokenInfo.mintAddress}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:underline"
          >
            View Token on Solana Explorer
          </a>
          {publicKey && (
            <a
              href={`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              View Wallet on Solana Explorer
            </a>
          )}
        </div>
      </div>
    </div>
  )
} 