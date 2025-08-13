import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    const root = path.resolve(process.cwd(), '..')
    const sessionsPath = path.join(root, 'mining-sessions.json')
    const tokenInfoPath = path.join(root, 'token-info.json')

    if (!fs.existsSync(tokenInfoPath)) return NextResponse.json({ error: 'token not initialized' }, { status: 400 })

    const userId = 'web-user'
    const now = new Date()

    const sessions = fs.existsSync(sessionsPath) ? JSON.parse(fs.readFileSync(sessionsPath, 'utf-8')) : {}
    let s = sessions[userId]
    if (!s) {
      s = { userId, startTime: now.toISOString(), clicks: 0, tokensEarned: 0, lastClickTime: now.toISOString(), isActive: true }
    }

    const cooldownSeconds = 3
    const last = new Date(s.lastClickTime)
    if ((now.getTime() - last.getTime()) / 1000 < cooldownSeconds) {
      return NextResponse.json({ error: 'Cooldown active', tokensEarned: s.tokensEarned, canClaim: s.tokensEarned >= 10 }, { status: 429 })
    }

    s.clicks += 1
    s.tokensEarned += 1
    s.lastClickTime = now.toISOString()
    sessions[userId] = s
    fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2))

    return NextResponse.json({ success: true, tokensEarned: s.tokensEarned, canClaim: s.tokensEarned >= 10 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}
