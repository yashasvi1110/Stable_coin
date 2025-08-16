'use client'

import { useEffect, useState } from 'react'
import WalletProvider from '../components/WalletProvider'
import TokenDashboard from '../components/TokenDashboard'

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

export default function Home() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadTokenInfo()
  }, [])

  const loadTokenInfo = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/token-info')
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setTokenInfo(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load token information')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Vardiano Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Token Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-yellow-800 mb-2">To get started:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Create a token: <code className="bg-yellow-100 px-1 rounded">npm run create-freezable-classic</code></li>
              <li>2. Upload logo: <code className="bg-yellow-100 px-1 rounded">npm run upload-logo</code></li>
              <li>3. Run security tests: <code className="bg-yellow-100 px-1 rounded">npm run security-tests</code></li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50">
        <TokenDashboard tokenInfo={tokenInfo!} />
      </div>
    </WalletProvider>
  )
}

