import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Discreet notification messages that don't reveal the app's purpose
const DISCREET_NOTIFICATIONS = [
  "System update available",
  "Sync completed",
  "New content available",
  "Backup completed",
  "Security scan finished",
  "Update ready to install",
  "Data synchronized",
  "Maintenance completed",
  "Performance optimized",
  "Cache cleared"
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      )
    }

    // Get user's notifications
    const notifications = await db.notification.findMany({
      where: {
        userId,
        isRead: false
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({
      notifications: notifications.map(notif => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.disguiseText, // Return disguised text
        createdAt: notif.createdAt
      }))
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, type, title, message } = await request.json()

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Select a discreet notification message
    const disguiseText = DISCREET_NOTIFICATIONS[
      Math.floor(Math.random() * DISCREET_NOTIFICATIONS.length)
    ]

    // Create notification
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        disguiseText
      }
    })

    // In a real app, you would also send push notifications here
    // For now, we'll just return the created notification

    return NextResponse.json({
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        disguiseText: notification.disguiseText,
        createdAt: notification.createdAt
      }
    })
  } catch (error) {
    console.error("Create notification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { notificationId, isRead } = await request.json()

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 }
      )
    }

    // Mark notification as read/unread
    const notification = await db.notification.update({
      where: { id: notificationId },
      data: { isRead: isRead || true }
    })

    return NextResponse.json({
      notification: {
        id: notification.id,
        isRead: notification.isRead
      }
    })
  } catch (error) {
    console.error("Update notification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}