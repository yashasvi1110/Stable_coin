'use client'

import { useEffect, useState } from 'react'
import WalletProvider from '../components/WalletProvider'
import EnhancedTokenDashboard from '../components/EnhancedTokenDashboard'

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl">🪙</div>
            </div>
          </div>
          <p className="mt-6 text-xl font-semibold text-gray-700 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-full">
            Loading Vardiano Dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 text-8xl mb-6 animate-bounce">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Token Not Found</h1>
          <p className="text-gray-600 mb-8 text-lg">{error}</p>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 text-left shadow-lg">
            <h3 className="font-semibold text-yellow-800 mb-4 text-lg">🚀 To get started:</h3>
            <ol className="text-sm text-yellow-700 space-y-3">
              <li className="flex items-center">
                <span className="bg-yellow-100 text-yellow-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">1</span>
                Create a token: <code className="bg-yellow-100 px-2 py-1 rounded ml-2 font-mono">npm run create-freezable-classic</code>
              </li>
              <li className="flex items-center">
                <span className="bg-yellow-100 text-yellow-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">2</span>
                Upload logo: <code className="bg-yellow-100 px-2 py-1 rounded ml-2 font-mono">npm run upload-logo</code>
              </li>
              <li className="flex items-center">
                <span className="bg-yellow-100 text-yellow-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">3</span>
                Run security tests: <code className="bg-yellow-100 px-2 py-1 rounded ml-2 font-mono">npm run security-tests</code>
              </li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-10"></div>
          <div className="relative z-10">
            <EnhancedTokenDashboard tokenInfo={tokenInfo!} />
          </div>
        </div>
      </div>
    </WalletProvider>
  )
}

