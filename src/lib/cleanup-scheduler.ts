// This service sets up automatic cleanup of expired messages and files
// In production, you might want to use a proper job scheduler like Bull, Agenda, or cron jobs

class CleanupScheduler {
  private interval: NodeJS.Timeout | null = null
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

  start() {
    if (this.interval) {
      console.log("Cleanup scheduler already running")
      return
    }

    console.log("Starting cleanup scheduler...")
    
    // Run cleanup immediately on start
    this.runCleanup()
    
    // Set up periodic cleanup
    this.interval = setInterval(() => {
      this.runCleanup()
    }, this.CLEANUP_INTERVAL)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
      console.log("Cleanup scheduler stopped")
    }
  }

  private async runCleanup() {
    try {
      console.log("Running cleanup task...")
      
      const response = await fetch(`${process.env.BASE_URL || "http://localhost:3000"}/api/cleanup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Cleanup completed:", result.results)
      } else {
        console.error("Cleanup failed:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Cleanup task error:", error)
    }
  }
}

// Export singleton instance
export const cleanupScheduler = new CleanupScheduler()

// Auto-start scheduler in production
if (process.env.NODE_ENV === "production") {
  cleanupScheduler.start()
}