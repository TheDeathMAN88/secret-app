import { db } from '@/lib/db'

export async function deleteExpiredMessages() {
  try {
    const now = new Date()
    
    // Delete expired messages
    const deletedMessages = await db.message.deleteMany({
      where: {
        deleteAfter: {
          lt: now
        },
        isDeleted: false
      }
    })

    // Delete expired media files
    const deletedFiles = await db.mediaFile.deleteMany({
      where: {
        deleteAfter: {
          lt: now
        },
        isDeleted: false
      }
    })

    // Delete expired connection codes
    const expiredConnections = await db.connection.updateMany({
      where: {
        expiresAt: {
          lt: now
        },
        status: 'pending'
      },
      data: {
        status: 'expired'
      }
    })

    console.log(`Auto-delete completed: ${deletedMessages.count} messages, ${deletedFiles.count} files, ${expiredConnections.count} connections`)
    
    return {
      messagesDeleted: deletedMessages.count,
      filesDeleted: deletedFiles.count,
      connectionsExpired: expiredConnections.count
    }
  } catch (error) {
    console.error('Auto-delete error:', error)
    throw error
  }
}

// Run auto-delete every hour
export function startAutoDeleteCron() {
  const interval = setInterval(async () => {
    try {
      await deleteExpiredMessages()
    } catch (error) {
      console.error('Scheduled auto-delete failed:', error)
    }
  }, 60 * 60 * 1000) // Every hour

  // Initial run
  deleteExpiredMessages()

  return interval
}