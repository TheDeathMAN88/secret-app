import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()
    if (!code) {
      return NextResponse.json({ 
        error: 'Connection code is required' 
      }, { status: 400 })
    }

    // Find the connection
    const connection = await db.connection.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        creator: true
      }
    })

    if (!connection) {
      return NextResponse.json({ 
        error: 'Invalid connection code' 
      }, { status: 404 })
    }

    if (connection.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Connection code already used or expired' 
      }, { status: 400 })
    }

    if (new Date() > connection.expiresAt) {
      return NextResponse.json({ 
        error: 'Connection code expired' 
      }, { status: 400 })
    }

    if (connection.createdBy === session.user.id) {
      return NextResponse.json({ 
        error: 'Cannot connect with your own code' 
      }, { status: 400 })
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

    // Create conversation between users
    const conversation = await db.conversation.create({
      data: {
        id: nanoid(),
        user1Id: connection.createdBy,
        user2Id: session.user.id,
        status: 'active'
      }
    })

    // Update connection status
    await db.connection.update({
      where: { id: connection.id },
      data: { 
        status: 'used',
        usedBy: session.user.id,
        usedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      partnerName: connection.creator.name || connection.creator.email,
      conversationId: conversation.id
    })

  } catch (error) {
    console.error('Verify connection error:', error)
    return NextResponse.json({ 
      error: 'Failed to verify connection code' 
    }, { status: 500 })
  }
}