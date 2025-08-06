import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function GET(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ 
        error: 'Conversation ID is required' 
      }, { status: 400 })
    }

    // Verify user is part of the conversation
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ],
        status: 'active'
      }
    })

    if (!conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found or access denied' 
      }, { status: 404 })
    }

    // Get messages with sender info
    const messages = await db.message.findMany({
      where: {
        conversationId,
        isDeleted: false
      },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Mark messages as read
    await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        isRead: false
      },
      data: { isRead: true }
    })

    return NextResponse.json(messages)

  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch messages' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, conversationId } = await request.json()

    if (!content || !conversationId) {
      return NextResponse.json({ 
        error: 'Content and conversation ID are required' 
      }, { status: 400 })
    }

    // Verify user is part of the conversation
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ],
        status: 'active'
      }
    })

    if (!conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found or access denied' 
      }, { status: 404 })
    }

    // Create message with auto-delete after 30 days
    const deleteAfter = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    
    const message = await db.message.create({
      data: {
        id: nanoid(),
        content,
        conversationId,
        senderId: session.user.id,
        deleteAfter
      },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(message)

  } catch (error) {
    console.error('Create message error:', error)
    return NextResponse.json({ 
      error: 'Failed to create message' 
    }, { status: 500 })
  }
}