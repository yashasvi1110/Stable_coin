import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Keypair, PublicKey, Connection, clusterApiUrl } from '@solana/web3.js'
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token'

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json()
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    const root = path.resolve(process.cwd(), '..')
    const sessionsPath = path.join(root, 'mining-sessions.json')
    const tokenInfoPath = path.join(root, 'token-info.json')
    const keypairPath = path.join(root, 'keypairs', 'wallet.json') // Use wallet keypair

    if (!fs.existsSync(tokenInfoPath) || !fs.existsSync(keypairPath)) {
      return NextResponse.json({ error: 'setup incomplete' }, { status: 400 })
    }

    const info = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8'))
    const sessions = fs.existsSync(sessionsPath) ? JSON.parse(fs.readFileSync(sessionsPath, 'utf-8')) : {}

    const userId = walletAddress
    const s = sessions[userId]
    if (!s || s.tokensEarned < 10) {
      return NextResponse.json({ error: 'Need at least 10 tokens to claim' }, { status: 400 })
    }

    // Load the mint authority keypair
    const secret = new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')))
    const mintAuthority = Keypair.fromSecretKey(secret)

    const conn = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('devnet'), 'confirmed')
    const mint = new PublicKey(info.mintAddress)
    const userWallet = new PublicKey(walletAddress)

    // Get or create the user's token account
    const userAta = await getOrCreateAssociatedTokenAccount(conn, mintAuthority, mint, userWallet)

    // Calculate the amount to mint (convert to base units)
    const amountBase = BigInt(s.tokensEarned) * BigInt(10) ** BigInt(info.decimals || 9)

    // Mint tokens directly to the user's wallet
    const sig = await mintTo(
      conn,
      mintAuthority, // payer
      mint, // mint
      userAta.address, // destination
      mintAuthority, // authority (mint authority)
      Number(amountBase) // amount
    )

    // Reset the user's mining session
    s.tokensEarned = 0
    s.clicks = 0
    sessions[userId] = s
    fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2))

    return NextResponse.json({ success: true, tx: sig })
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'failed'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
