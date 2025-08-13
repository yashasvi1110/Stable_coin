import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Keypair, PublicKey, Connection, clusterApiUrl } from '@solana/web3.js'
import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token'

export async function POST() {
  try {
    const root = path.resolve(process.cwd(), '..')
    const sessionsPath = path.join(root, 'mining-sessions.json')
    const tokenInfoPath = path.join(root, 'token-info.json')
    const keypairPath = path.join(root, 'keypairs', 'wallet.json')

    if (!fs.existsSync(tokenInfoPath) || !fs.existsSync(keypairPath)) return NextResponse.json({ error: 'setup incomplete' }, { status: 400 })

    const info = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8'))
    const sessions = fs.existsSync(sessionsPath) ? JSON.parse(fs.readFileSync(sessionsPath, 'utf-8')) : {}

    const userId = 'web-user'
    const s = sessions[userId]
    if (!s || s.tokensEarned < 10) return NextResponse.json({ error: 'Need at least 10 tokens to claim' }, { status: 400 })

    const secret = new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')))
    const payer = Keypair.fromSecretKey(secret)

    const conn = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('devnet'), 'confirmed')
    const mint = new PublicKey(info.mintAddress)
    const dest = new PublicKey(info.wallet)

    const fromAta = await getOrCreateAssociatedTokenAccount(conn, payer, mint, payer.publicKey)
    const toAta = await getOrCreateAssociatedTokenAccount(conn, payer, mint, dest)

    const amountBase = BigInt(s.tokensEarned) * 10n ** BigInt(info.decimals || 9)
    const sig = await transfer(conn, payer, fromAta.address, toAta.address, payer.publicKey, Number(amountBase))

    s.tokensEarned = 0
    s.clicks = 0
    sessions[userId] = s
    fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2))

    return NextResponse.json({ success: true, tx: sig })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}
