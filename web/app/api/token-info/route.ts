import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Keypair } from '@solana/web3.js'

export async function GET() {
  try {
    const root = path.resolve(process.cwd(), '..')
    const tokenInfoPath = path.join(root, 'token-info.json')
    const keypairPath = path.join(root, 'keypairs', 'wallet.json')

    if (!fs.existsSync(tokenInfoPath)) {
      return NextResponse.json({ error: 'token-info.json not found' }, { status: 404 })
    }
    const info = JSON.parse(fs.readFileSync(tokenInfoPath, 'utf-8'))

    let wallet = ''
    if (fs.existsSync(keypairPath)) {
      const secret = new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')))
      wallet = Keypair.fromSecretKey(secret).publicKey.toBase58()
    }

    return NextResponse.json({ ...info, wallet })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}
