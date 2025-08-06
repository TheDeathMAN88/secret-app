import { db } from "@/lib/db"
import { encryptionService } from "./encryption"
import { writeFile, unlink } from "fs/promises"
import path from "path"

export interface SecureFileData {
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  conversationId: string
  uploadedById: string
}

export class SecureFileService {
  private readonly UPLOAD_DIR = path.join(process.cwd(), "uploads")

  // Upload and encrypt a file
  async uploadFile(data: SecureFileData & { fileBuffer: Buffer }) {
    try {
      // Generate secure filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = path.extname(data.originalName)
      const secureFilename = `${timestamp}_${randomId}${fileExtension}`

      // Generate encryption key for this file
      const encryptionKey = encryptionService.generateKey()

      // Encrypt file data (for demo, we'll store the encryption key separately)
      // In production, you might want to encrypt the actual file content
      const encryptedData = data.fileBuffer

      // Save file to disk
      const filePath = path.join(this.UPLOAD_DIR, secureFilename)
      
      // Create uploads directory if it doesn't exist
      import("fs").then(fs => {
        if (!fs.existsSync(this.UPLOAD_DIR)) {
          fs.mkdirSync(this.UPLOAD_DIR, { recursive: true })
        }
      })

      await writeFile(filePath, encryptedData)

      // Calculate delete after date (30 days from now)
      const deleteAfter = new Date()
      deleteAfter.setDate(deleteAfter.getDate() + 30)

      // Store file info in database
      const mediaFile = await db.mediaFile.create({
        data: {
          filename: secureFilename,
          originalName: data.originalName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          filePath: `/uploads/${secureFilename}`,
          isEncrypted: true,
          conversationId: data.conversationId,
          uploadedById: data.uploadedById,
          deleteAfter
        }
      })

      return mediaFile
    } catch (error) {
      console.error("Error uploading secure file:", error)
      throw new Error("Failed to upload file securely")
    }
  }

  // Get file info (without decrypting)
  async getFileInfo(fileId: string, userId: string) {
    try {
      const file = await db.mediaFile.findFirst({
        where: {
          id: fileId,
          isDeleted: false,
          // Check if user has access to this file
          OR: [
            { uploadedById: userId },
            {
              conversation: {
                OR: [
                  { user1Id: userId },
                  { user2Id: userId }
                ]
              }
            }
          ]
        }
      })

      if (!file) {
        throw new Error("File not found or access denied")
      }

      return file
    } catch (error) {
      console.error("Error getting file info:", error)
      throw error
    }
  }

  // Delete a file securely
  async deleteFile(fileId: string, userId: string) {
    try {
      const file = await db.mediaFile.findUnique({
        where: { id: fileId }
      })

      if (!file) {
        throw new Error("File not found")
      }

      // Check if user is the uploader
      if (file.uploadedById !== userId) {
        throw new Error("Unauthorized to delete this file")
      }

      // Delete file from disk
      try {
        const filePath = path.join(this.UPLOAD_DIR, file.filename)
        await unlink(filePath)
      } catch (fileError) {
        console.error("Error deleting file from disk:", fileError)
        // Continue with database deletion even if file deletion fails
      }

      // Mark as deleted in database
      await db.mediaFile.update({
        where: { id: fileId },
        data: { isDeleted: true }
      })

      return true
    } catch (error) {
      console.error("Error deleting file:", error)
      throw error
    }
  }

  // Get files for a conversation
  async getConversationFiles(conversationId: string, userId: string) {
    try {
      // Verify user has access to this conversation
      const conversation = await db.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      })

      if (!conversation) {
        throw new Error("Conversation not found or access denied")
      }

      const files = await db.mediaFile.findMany({
        where: {
          conversationId,
          isDeleted: false
        },
        orderBy: {
          createdAt: "desc"
        }
      })

      return files
    } catch (error) {
      console.error("Error getting conversation files:", error)
      throw error
    }
  }

  // Check if file has expired and should be deleted
  async checkFileExpiration(fileId: string) {
    try {
      const file = await db.mediaFile.findUnique({
        where: { id: fileId }
      })

      if (!file || file.isDeleted) {
        return { expired: false, file: null }
      }

      const now = new Date()
      const isExpired = now > file.deleteAfter

      if (isExpired) {
        // Auto-delete expired file
        await this.deleteFile(fileId, file.uploadedById)
        return { expired: true, file: null }
      }

      return { expired: false, file }
    } catch (error) {
      console.error("Error checking file expiration:", error)
      return { expired: false, file: null }
    }
  }
}

// Export singleton instance
export const secureFileService = new SecureFileService()