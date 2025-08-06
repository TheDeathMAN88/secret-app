import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    // Find the connection code
    const connection = await db.connection.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        creator: true
      }
    })

    if (!connection) {
      return NextResponse.json({ error: 'Invalid connection code' }, { status: 404 })
    }

    // Check if code is expired
    if (new Date() > connection.expiresAt) {
      return NextResponse.json({ error: 'Connection code has expired' }, { status: 400 })
    }

    // Check if code is already used
    if (connection.status === 'used') {
      return NextResponse.json({ error: 'Connection code has already been used' }, { status: 400 })
    }

    // Check if user is trying to connect with themselves
    if (connection.createdBy === session.user.id) {
      return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 })
    }

    // Check if users are already connected
    const existingConversation = await db.conversation.findFirst({
      where: {
        OR: [
          {
            user1Id: connection.createdBy,
            user2Id: session.user.id
          },
          {
            user1Id: session.user.id,
            user2Id: connection.createdBy
          }
        ]
      }
    })

    if (existingConversation) {
      return NextResponse.json({ error: 'Already connected with this user' }, { status: 400 })
    }

    // Mark code as used
    await db.connection.update({
      where: { id: connection.id },
      data: {
        status: 'used',
        usedBy: session.user.id,
        usedAt: new Date()
      }
    })

    // Create conversation between users
    const conversation = await db.conversation.create({
      data: {
        user1Id: connection.createdBy,
        user2Id: session.user.id
      }
    })

    // Get both users' information
    const [creator, user] = await Promise.all([
      db.user.findUnique({
        where: { id: connection.createdBy },
        select: { id: true, name: true, username: true, avatar: true }
      }),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, username: true, avatar: true }
      })
    ])

    return NextResponse.json({
      message: 'Successfully connected with your partner'
    })

  } catch (error) {
    console.error('Error using connection code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}