'use client'

import React, { useState, useEffect } from 'react'

interface AdvancedFeaturesProps {
  tokenSymbol: string
  currentPrice: number
}

export default function AdvancedFeatures({ tokenSymbol, currentPrice }: AdvancedFeaturesProps) {
  const [activeTab, setActiveTab] = useState('trading')
  const [tradeAmount, setTradeAmount] = useState('')
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [portfolioValue, setPortfolioValue] = useState(10000)
  const [trades, setTrades] = useState<any[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  const showNotificationMessage = (message: string) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  const handleTrade = () => {
    if (!tradeAmount) return
    
    const amount = parseFloat(tradeAmount)
    const trade = {
      id: Date.now(),
      type: tradeType,
      amount,
      price: currentPrice,
      timestamp: new Date().toLocaleTimeString(),
      total: amount * currentPrice
    }
    
    setTrades(prev => [trade, ...prev.slice(0, 9)])
    setTradeAmount('')
    
    if (tradeType === 'buy') {
      setPortfolioValue(prev => prev - trade.total)
      showNotificationMessage(`Bought ${amount} ${tokenSymbol} for $${trade.total.toFixed(2)}`)
    } else {
      setPortfolioValue(prev => prev + trade.total)
      showNotificationMessage(`Sold ${amount} ${tokenSymbol} for $${trade.total.toFixed(2)}`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl shadow-2xl z-50 animate-bounce-in">
          <p className="font-semibold">{notificationMessage}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-2 bg-white/90 backdrop-blur-md rounded-xl p-2 shadow-lg">
        {[
          { id: 'trading', label: '📈 Trading', icon: '📈' },
          { id: 'portfolio', label: '💼 Portfolio', icon: '💼' },
          { id: 'social', label: '👥 Social', icon: '👥' },
          { id: 'analytics', label: '📊 Analytics', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trading Tab */}
      {activeTab === 'trading' && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 animate-fade-in-up">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📈</span>
            Trading Simulator
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Place Trade</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trade Type</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTradeType('buy')}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                        tradeType === 'buy'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🟢 Buy
                    </button>
                    <button
                      onClick={() => setTradeType('sell')}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                        tradeType === 'sell'
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🔴 Sell
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount ({tokenSymbol})</label>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Price</label>
                  <div className="text-2xl font-bold gradient-text-green">${currentPrice.toFixed(2)}</div>
                </div>
                
                <button
                  onClick={handleTrade}
                  disabled={!tradeAmount}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  {tradeType === 'buy' ? '🟢 Buy' : '🔴 Sell'} {tokenSymbol}
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Recent Trades</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {trades.map(trade => (
                  <div
                    key={trade.id}
                    className={`p-3 rounded-lg border ${
                      trade.type === 'buy'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`font-semibold ${trade.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.type === 'buy' ? '🟢' : '🔴'} {trade.type.toUpperCase()}
                        </span>
                        <p className="text-sm text-gray-600">{trade.amount} {tokenSymbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${trade.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{trade.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {trades.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No trades yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 animate-fade-in-up">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">💼</span>
            Portfolio Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold mb-2">Total Value</h4>
              <p className="text-3xl font-bold gradient-text-blue">${portfolioValue.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Portfolio Balance</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold mb-2">Holdings</h4>
              <p className="text-3xl font-bold gradient-text-green">1,250 {tokenSymbol}</p>
              <p className="text-sm text-gray-600 mt-1">Token Balance</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold mb-2">Performance</h4>
              <p className="text-3xl font-bold gradient-text-purple">+15.4%</p>
              <p className="text-sm text-gray-600 mt-1">This Week</p>
            </div>
          </div>
          
          <div className="mt-8">
            <h4 className="text-lg font-semibold mb-4">Asset Allocation</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                  <span className="font-semibold">{tokenSymbol}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">65%</p>
                  <p className="text-sm text-gray-600">$6,500</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-semibold">SOL</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">25%</p>
                  <p className="text-sm text-gray-600">$2,500</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-semibold">Cash</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">10%</p>
                  <p className="text-sm text-gray-600">$1,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 animate-fade-in-up">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">👥</span>
            Community Hub
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Community Stats</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">👥</span>
                    <div>
                      <p className="font-semibold">Total Holders</p>
                      <p className="text-sm text-gray-600">Active community</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">1,247</p>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💬</span>
                    <div>
                      <p className="font-semibold">Discord Members</p>
                      <p className="text-sm text-gray-600">Join the chat</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600">5,892</p>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🐦</span>
                    <div>
                      <p className="font-semibold">Twitter Followers</p>
                      <p className="text-sm text-gray-600">Stay updated</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">12,456</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Recent Activity</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[
                  { user: 'CryptoWhale', action: 'bought', amount: '500', time: '2m ago' },
                  { user: 'DiamondHands', action: 'held', amount: '1000', time: '5m ago' },
                  { user: 'MoonWalker', action: 'sold', amount: '200', time: '8m ago' },
                  { user: 'HODLer', action: 'bought', amount: '750', time: '12m ago' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {activity.user.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{activity.user}</p>
                      <p className="text-sm text-gray-600">
                        {activity.action} {activity.amount} {tokenSymbol}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 animate-fade-in-up">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Advanced Analytics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Market Metrics</h4>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Market Cap</span>
                    <span className="text-green-600">↗️ +12.5%</span>
                  </div>
                  <p className="text-2xl font-bold">$2.4M</p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">24h Volume</span>
                    <span className="text-blue-600">↗️ +8.3%</span>
                  </div>
                  <p className="text-2xl font-bold">$156K</p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Circulating Supply</span>
                    <span className="text-gray-600">Fixed</span>
                  </div>
                  <p className="text-2xl font-bold">1,000,000</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Technical Indicators</h4>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">RSI</span>
                    <span className="text-green-600">Bullish</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">65 - Neutral</p>
                </div>
                
                <div className="p-4 bg-white rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">MACD</span>
                    <span className="text-green-600">Positive</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Signal: Buy</p>
                </div>
                
                <div className="p-4 bg-white rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Bollinger Bands</span>
                    <span className="text-yellow-600">Neutral</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Mid-band</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
