import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { readFile, unlink } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const results = {
      messagesDeleted: 0,
      filesDeleted: 0,
      errors: [] as string[]
    }

    const now = new Date()

    // Delete expired messages
    try {
      const expiredMessages = await db.message.findMany({
        where: {
          deleteAfter: {
            lt: now
          },
          isDeleted: false
        }
      })

      for (const message of expiredMessages) {
        await db.message.update({
          where: { id: message.id },
          data: { isDeleted: true }
        })
        results.messagesDeleted++
      }
    } catch (error) {
      console.error("Error deleting messages:", error)
      results.errors.push("Failed to delete expired messages")
    }

    // Delete expired files
    try {
      const expiredFiles = await db.mediaFile.findMany({
        where: {
          deleteAfter: {
            lt: now
          },
          isDeleted: false
        }
      })

      for (const file of expiredFiles) {
        try {
          // Delete file from disk
          const filePath = path.join(process.cwd(), "uploads", file.filename)
          await unlink(filePath)
          
          // Mark as deleted in database
          await db.mediaFile.update({
            where: { id: file.id },
            data: { isDeleted: true }
          })
          results.filesDeleted++
        } catch (fileError) {
          console.error(`Error deleting file ${file.filename}:`, fileError)
          // Still mark as deleted in database even if file deletion failed
          await db.mediaFile.update({
            where: { id: file.id },
            data: { isDeleted: true }
          })
          results.filesDeleted++
        }
      }
    } catch (error) {
      console.error("Error deleting files:", error)
      results.errors.push("Failed to delete expired files")
    }

    // Clean up old notifications (older than 30 days)
    try {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const oldNotifications = await db.notification.findMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      })

      for (const notification of oldNotifications) {
        await db.notification.delete({
          where: { id: notification.id }
        })
      }
    } catch (error) {
      console.error("Error cleaning up notifications:", error)
      results.errors.push("Failed to clean up old notifications")
    }

    return NextResponse.json({
      message: "Cleanup completed",
      results,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint for manual cleanup trigger
export async function GET() {
  try {
    // For security, this should be protected in production
    // For demo purposes, we'll allow GET requests
    return NextResponse.json({
      message: "Cleanup endpoint available. Use POST to trigger cleanup.",
      instructions: "Send POST request to /api/cleanup to trigger cleanup process"
    })
  } catch (error) {
    console.error("Cleanup GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}