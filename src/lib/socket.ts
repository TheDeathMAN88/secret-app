import { Server } from 'socket.io'
import { db } from '@/lib/db'

interface ConnectedUser {
  id: string
  name: string
  socketId: string
  conversationId?: string
}

const connectedUsers = new Map<string, ConnectedUser>()

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)
    
    // Handle user authentication and connection
    socket.on('authenticate', async (data: { userId: string; conversationId: string }) => {
      try {
        // Verify user exists and is part of the conversation
        const conversation = await db.conversation.findFirst({
          where: {
            id: data.conversationId,
            OR: [
              { user1Id: data.userId },
              { user2Id: data.userId }
            ],
            status: 'active'
          }
        })

        if (!conversation) {
          socket.emit('authentication_error', { message: 'Invalid conversation or user' })
          return
        }

        // Get user info
        const user = await db.user.findUnique({
          where: { id: data.userId },
          select: { id: true, name: true, email: true }
        })

        if (!user) {
          socket.emit('authentication_error', { message: 'User not found' })
          return
        }

        // Add to connected users
        const connectedUser: ConnectedUser = {
          id: user.id,
          name: user.name || user.email,
          socketId: socket.id,
          conversationId: data.conversationId
        }
        
        connectedUsers.set(user.id, connectedUser)
        
        // Join conversation room
        socket.join(data.conversationId)
        
        // Update user online status
        await db.user.update({
          where: { id: user.id },
          data: { isOnline: true, lastSeen: new Date() }
        })

        // Send confirmation
        socket.emit('authenticated', {
          success: true,
          user: { id: user.id, name: user.name || user.email }
        })

        // Notify partner that user is online
        const partnerId = conversation.user1Id === user.id ? conversation.user2Id : conversation.user1Id
        const partnerSocket = connectedUsers.get(partnerId)
        
        if (partnerSocket) {
          io.to(partnerSocket.socketId).emit('partner_online', {
            userId: user.id,
            name: user.name || user.email
          })
        }

        console.log('User authenticated:', user.name)
        
      } catch (error) {
        console.error('Authentication error:', error)
        socket.emit('authentication_error', { message: 'Authentication failed' })
      }
    })

    // Handle sending messages
    socket.on('send_message', async (data: {
      conversationId: string
      content: string
      senderId: string
    }) => {
      try {
        // Verify user is part of conversation
        const conversation = await db.conversation.findFirst({
          where: {
            id: data.conversationId,
            OR: [
              { user1Id: data.senderId },
              { user2Id: data.senderId }
            ],
            status: 'active'
          }
        })

        if (!conversation) {
          socket.emit('message_error', { message: 'Conversation not found' })
          return
        }

        // Create message in database
        const deleteAfter = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        
        const message = await db.message.create({
          data: {
            id: Math.random().toString(36).substring(2, 15),
            content: data.content,
            conversationId: data.conversationId,
            senderId: data.senderId,
            deleteAfter
          },
          include: {
            sender: {
              select: { id: true, name: true }
            }
          }
        })

        // Broadcast to conversation room
        io.to(data.conversationId).emit('receive_message', message)
        
        console.log('Message sent:', message.id)
        
      } catch (error) {
        console.error('Send message error:', error)
        socket.emit('message_error', { message: 'Failed to send message' })
      }
    })

    // Handle file upload notification
    socket.on('file_uploaded', async (data: {
      conversationId: string
      fileId: string
      senderId: string
    }) => {
      try {
        // Get file details
        const file = await db.mediaFile.findUnique({
          where: { id: data.fileId },
          include: {
            uploadedBy: {
              select: { id: true, name: true }
            }
          }
        })

        if (file) {
          // Broadcast to conversation room
          io.to(data.conversationId).emit('file_received', file)
        }
        
      } catch (error) {
        console.error('File upload notification error:', error)
      }
    })

    // Handle typing indicators
    socket.on('typing', (data: { conversationId: string; userId: string; userName: string }) => {
      socket.to(data.conversationId).emit('user_typing', {
        userId: data.userId,
        userName: data.userName
      })
    })

    socket.on('stop_typing', (data: { conversationId: string }) => {
      socket.to(data.conversationId).emit('user_stopped_typing')
    })

    // Handle message read receipts
    socket.on('mark_read', async (data: { conversationId: string; userId: string }) => {
      try {
        // Mark messages as read
        await db.message.updateMany({
          where: {
            conversationId: data.conversationId,
            senderId: { not: data.userId },
            isRead: false
          },
          data: { isRead: true }
        })

        // Notify sender
        socket.to(data.conversationId).emit('messages_read', {
          byUserId: data.userId
        })
        
      } catch (error) {
        console.error('Mark read error:', error)
      }
    })

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id)
      
      // Find and remove user from connected users
      for (const [userId, user] of connectedUsers.entries()) {
        if (user.socketId === socket.id) {
          connectedUsers.delete(userId)
          
          // Update user online status
          await db.user.update({
            where: { id: userId },
            data: { isOnline: false, lastSeen: new Date() }
          })

          // Notify partner that user is offline
          if (user.conversationId) {
            socket.to(user.conversationId).emit('partner_offline', {
              userId: userId,
              name: user.name
            })
          }
          
          break
        }
      }
    })
  })
}