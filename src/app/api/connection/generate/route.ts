import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function POST() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has an active connection
    const existingConnection = await db.conversation.findFirst({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ],
        status: 'active'
      }
    })

    if (existingConnection) {
      return NextResponse.json({ 
        error: 'You already have an active connection' 
      }, { status: 400 })
    }

    // Generate unique connection code
    const connectionCode = nanoid(6).toUpperCase()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create connection record
    const connection = await db.connection.create({
      data: {
        id: nanoid(),
        code: connectionCode,
        createdBy: session.user.id,
        expiresAt,
        status: 'pending'
      }
    })

    return NextResponse.json({
      code: connection.code,
      expiresAt: connection.expiresAt
    })

  } catch (error) {
    console.error('Generate connection error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate connection code' 
    }, { status: 500 })
  }
}