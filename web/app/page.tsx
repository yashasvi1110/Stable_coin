'use client'

import { useEffect, useState } from 'react'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount, getMint } from '@solana/spl-token'

export default function Home() {
  const [info, setInfo] = useState<any>(null)
  const [balance, setBalance] = useState<string>('')
  const [sol, setSol] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [clicks, setClicks] = useState<number>(0)
  const [canClaim, setCanClaim] = useState<boolean>(false)
  const [claiming, setClaiming] = useState<boolean>(false)

  useEffect(() => {
    const run = async () => {
      const res = await fetch('/api/token-info')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setInfo(data)
      const conn = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('devnet'), 'confirmed')
      const wallet = new PublicKey(data.wallet)
      const mint = new PublicKey(data.mintAddress)
      const ata = await getAssociatedTokenAddress(mint, wallet)
      const acct = await getAccount(conn, ata)
      const mintInfo = await getMint(conn, mint)
      const human = Number(acct.amount) / 10 ** mintInfo.decimals
      setBalance(human.toLocaleString())
      const lamports = await conn.getBalance(wallet)
      setSol((lamports / 1e9).toFixed(4))
    }
    run().catch((e) => setError(e.message || 'failed'))
  }, [])

  const click = async () => {
    const res = await fetch('/api/mining/click', { method: 'POST' })
    const data = await res.json()
    if (data.error) return alert(data.error)
    setClicks(data.tokensEarned)
    setCanClaim(data.canClaim)
  }

  const claim = async () => {
    setClaiming(true)
    try {
      const res = await fetch('/api/mining/claim', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      alert('Claimed! TX: ' + data.tx)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setClaiming(false)
    }
  }

  if (error) return <main className="p-6">Error: {error}</main>
  if (!info) return <main className="p-6">Loading...</main>
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Vardiano Dashboard</h1>
      <div className="space-y-1">
        <div>Mint: {info.mintAddress}</div>
        <div>Wallet: {info.wallet}</div>
        <div>SOL: {sol}</div>
        <div>Balance: {balance} {info.symbol || 'VARD'}</div>
        <div>Explorer: <a className="text-blue-600 underline" href={`https://explorer.solana.com/address/${info.mintAddress}?cluster=devnet`} target="_blank">View</a></div>
      </div>
      <div className="pt-4 space-x-2">
        <button onClick={click} className="px-3 py-1 bg-blue-600 text-white rounded">Mine +1</button>
        <button onClick={claim} disabled={!canClaim || claiming} className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50">Claim</button>
        <span className="ml-2">Mined: {clicks}</span>
      </div>
    </main>
  )
}

