'use client'
import React, { useState } from 'react'

interface TokenManagementProps {
  onMint: (amount: number) => void
  onBurn: (amount: number) => void
  onTransfer: (to: string, amount: number) => void
  currentBalance: string
  loading: boolean
}

export default function TokenManagement({ onMint, onBurn, onTransfer, currentBalance, loading }: TokenManagementProps) {
  const [mintAmount, setMintAmount] = useState('100')
  const [burnAmount, setBurnAmount] = useState('50')
  const [transferAmount, setTransferAmount] = useState('25')
  const [transferAddress, setTransferAddress] = useState('')
  const [activeTab, setActiveTab] = useState<'mint' | 'burn' | 'transfer'>('mint')

  const handleMint = () => {
    const amount = parseInt(mintAmount)
    if (amount > 0) {
      onMint(amount)
      setMintAmount('100')
    }
  }

  const handleBurn = () => {
    const amount = parseInt(burnAmount)
    if (amount > 0 && amount <= parseFloat(currentBalance)) {
      onBurn(amount)
      setBurnAmount('50')
    }
  }

  const handleTransfer = () => {
    const amount = parseInt(transferAmount)
    if (amount > 0 && amount <= parseFloat(currentBalance) && transferAddress.trim()) {
      onTransfer(transferAddress, amount)
      setTransferAmount('25')
      setTransferAddress('')
    }
  }

  const quickAmounts = [10, 25, 50, 100, 250, 500]

  return (
    <div className="bg-white rounded-xl shadow-lg border">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'mint', name: '🪙 Mint', icon: '🪙' },
            { id: 'burn', name: '🔥 Burn', icon: '🔥' },
            { id: 'transfer', name: '📤 Transfer', icon: '📤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Current Balance Display */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Current Balance</p>
              <p className="text-2xl font-bold text-blue-900">{currentBalance} VARD</p>
            </div>
            <div className="text-4xl">🪙</div>
          </div>
        </div>

        {/* Mint Tab */}
        {activeTab === 'mint' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mint New Tokens</h3>
              <p className="text-gray-600 mb-4">Create new VARD tokens and add them to your balance.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Mint</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter amount"
                      min="1"
                    />
                    <button
                      onClick={handleMint}
                      disabled={loading || !mintAmount || parseInt(mintAmount) <= 0}
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? '⏳ Minting...' : 'Mint'}
                    </button>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Quick Amounts</p>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setMintAmount(amount.toString())}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Burn Tab */}
        {activeTab === 'burn' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Burn Tokens</h3>
              <p className="text-gray-600 mb-4">Permanently remove VARD tokens from circulation. This action cannot be undone.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Burn</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={burnAmount}
                      onChange={(e) => setBurnAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter amount"
                      min="1"
                      max={currentBalance}
                    />
                    <button
                      onClick={handleBurn}
                      disabled={loading || !burnAmount || parseInt(burnAmount) <= 0 || parseInt(burnAmount) > parseFloat(currentBalance)}
                      className="px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? '⏳ Burning...' : 'Burn'}
                    </button>
                  </div>
                  {parseInt(burnAmount) > parseFloat(currentBalance) && (
                    <p className="text-sm text-red-600 mt-1">Amount exceeds your balance</p>
                  )}
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Quick Amounts</p>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setBurnAmount(amount.toString())}
                        disabled={amount > parseFloat(currentBalance)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Tab */}
        {activeTab === 'transfer' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Tokens</h3>
              <p className="text-gray-600 mb-4">Send VARD tokens to another wallet address.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter Solana wallet address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Transfer</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter amount"
                      min="1"
                      max={currentBalance}
                    />
                    <button
                      onClick={handleTransfer}
                      disabled={loading || !transferAmount || !transferAddress.trim() || parseInt(transferAmount) <= 0 || parseInt(transferAmount) > parseFloat(currentBalance)}
                      className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? '⏳ Transferring...' : 'Transfer'}
                    </button>
                  </div>
                  {parseInt(transferAmount) > parseFloat(currentBalance) && (
                    <p className="text-sm text-red-600 mt-1">Amount exceeds your balance</p>
                  )}
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Quick Amounts</p>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setTransferAmount(amount.toString())}
                        disabled={amount > parseFloat(currentBalance)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-lg">💡</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>All transactions are processed on Solana blockchain</li>
                  <li>Transaction fees are paid in SOL</li>
                  <li>Burning tokens permanently removes them from circulation</li>
                  <li>Double-check recipient addresses before transferring</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
