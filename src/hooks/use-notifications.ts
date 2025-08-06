"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  disguiseText: string
  createdAt: string
}

export function useNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/notifications?userId=${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.length)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  // Create a new notification
  const createNotification = async (data: {
    type: string
    title: string
    message: string
  }) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: session.user.id,
          ...data
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Show disguised toast notification
        toast(result.notification.disguiseText, {
          description: "Tap to view details",
          action: {
            label: "View",
            onClick: () => fetchNotifications()
          }
        })
        fetchNotifications() // Refresh notifications
      }
    } catch (error) {
      console.error("Failed to create notification:", error)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          notificationId,
          isRead: true
        })
      })

      if (response.ok) {
        fetchNotifications() // Refresh notifications
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const promises = notifications.map(notif => 
      fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          notificationId: notif.id,
          isRead: true
        })
      })
    )

    try {
      await Promise.all(promises)
      fetchNotifications() // Refresh notifications
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  // Auto-fetch notifications when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
      // Set up periodic fetching
      const interval = setInterval(fetchNotifications, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [session])

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead
  }
}