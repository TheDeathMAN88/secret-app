import { db } from "@/lib/db"
import { encryptionService, generateConversationKey } from "./encryption"

export interface SecureMessageData {
  content?: string
  conversationId: string
  senderId: string
  type: "text" | "file"
  fileId?: string
}

export class SecureMessageService {
  // Create and encrypt a new message
  async createMessage(data: SecureMessageData & { receiverId: string }) {
    try {
      // Generate conversation-specific encryption key
      const encryptionKey = generateConversationKey(data.senderId, data.receiverId)
      
      // Encrypt message content if it exists
      let encryptedContent: string | undefined
      if (data.content) {
        encryptedContent = await encryptionService.encrypt(data.content, encryptionKey)
      }

      // Calculate delete after date (30 days from now)
      const deleteAfter = new Date()
      deleteAfter.setDate(deleteAfter.getDate() + 30)

      // Create message in database
      const message = await db.message.create({
        data: {
          content: encryptedContent,
          conversationId: data.conversationId,
          senderId: data.senderId,
          deleteAfter
        }
      })

      // Return decrypted message for immediate use
      return {
        ...message,
        content: data.content // Return original content for immediate display
      }
    } catch (error) {
      console.error("Error creating secure message:", error)
      throw new Error("Failed to create secure message")
    }
  }

  // Get and decrypt messages for a conversation
  async getConversationMessages(
    conversationId: string,
    userId: string,
    partnerId: string
  ) {
    try {
      // Generate encryption key for this conversation
      const encryptionKey = generateConversationKey(userId, partnerId)

      // Get messages from database
      const messages = await db.message.findMany({
        where: {
          conversationId,
          isDeleted: false
        },
        orderBy: {
          createdAt: "asc"
        }
      })

      // Decrypt messages
      const decryptedMessages = await Promise.all(
        messages.map(async (message) => {
          let decryptedContent: string | undefined
          
          if (message.content) {
            try {
              decryptedContent = await encryptionService.decrypt(message.content, encryptionKey)
            } catch (error) {
              console.error("Failed to decrypt message:", error)
              decryptedContent = "[Encrypted message - unable to decrypt]"
            }
          }

          return {
            ...message,
            content: decryptedContent
          }
        })
      )

      return decryptedMessages
    } catch (error) {
      console.error("Error getting conversation messages:", error)
      throw new Error("Failed to get messages")
    }
  }

  // Mark messages as read
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
    excludeSenderId?: string
  ) {
    try {
      await db.message.updateMany({
        where: {
          conversationId,
          senderId: { not: excludeSenderId },
          isRead: false
        },
        data: {
          isRead: true
        }
      })
    } catch (error) {
      console.error("Error marking messages as read:", error)
      throw new Error("Failed to mark messages as read")
    }
  }

  // Delete a message securely
  async deleteMessage(messageId: string, userId: string) {
    try {
      const message = await db.message.findUnique({
        where: { id: messageId }
      })

      if (!message) {
        throw new Error("Message not found")
      }

      // Check if user is the sender
      if (message.senderId !== userId) {
        throw new Error("Unauthorized to delete this message")
      }

      // Mark as deleted
      await db.message.update({
        where: { id: messageId },
        data: { isDeleted: true }
      })

      return true
    } catch (error) {
      console.error("Error deleting message:", error)
      throw error
    }
  }

  // Get unread message count for a user
  async getUnreadCount(userId: string) {
    try {
      const count = await db.message.count({
        where: {
          isDeleted: false,
          isRead: false,
          senderId: { not: userId }
        }
      })

      return count
    } catch (error) {
      console.error("Error getting unread count:", error)
      throw new Error("Failed to get unread count")
    }
  }
}

// Export singleton instance
export const secureMessageService = new SecureMessageService()