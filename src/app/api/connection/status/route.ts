import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find active conversation
    const conversation = await db.conversation.findFirst({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ],
        status: 'active'
      },
      include: {
        user1: {
          select: { id: true, name: true, email: true }
        },
        user2: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({
        isConnected: false,
        status: 'pending'
      })
    }

    // Determine partner info
    const partner = conversation.user1Id === session.user.id ? conversation.user2 : conversation.user1

    return NextResponse.json({
      isConnected: true,
      partner: {
        id: partner.id,
        name: partner.name || partner.email,
        isOnline: false // TODO: Implement online status tracking
      },
      connectionDate: conversation.createdAt,
      conversationId: conversation.id,
      status: 'connected'
    })

  } catch (error) {
    console.error('Check connection status error:', error)
    return NextResponse.json({ 
      error: 'Failed to check connection status' 
    }, { status: 500 })
  }
}