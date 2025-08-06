// Simple encryption utility for securing messages
// In production, you should use more robust encryption libraries like crypto

class EncryptionService {
  private readonly ALGORITHM = "AES-GCM"
  private readonly KEY_LENGTH = 256

  // Generate a random encryption key
  generateKey(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("")
  }

  // Simple XOR-based encryption for demo purposes
  // In production, use Web Crypto API or proper encryption libraries
  async encrypt(text: string, key: string): Promise<string> {
    try {
      // For demo purposes, we'll use a simple XOR cipher
      // In production, use proper encryption like AES-GCM
      const textBytes = new TextEncoder().encode(text)
      const keyBytes = new TextEncoder().encode(key.padEnd(32, "0").slice(0, 32))
      
      const encryptedBytes = new Uint8Array(textBytes.length)
      for (let i = 0; i < textBytes.length; i++) {
        encryptedBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length]
      }
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...encryptedBytes))
    } catch (error) {
      console.error("Encryption error:", error)
      throw new Error("Failed to encrypt message")
    }
  }

  async decrypt(encryptedText: string, key: string): Promise<string> {
    try {
      // Decode from base64
      const encryptedBytes = new Uint8Array(
        atob(encryptedText).split("").map(char => char.charCodeAt(0))
      )
      
      const keyBytes = new TextEncoder().encode(key.padEnd(32, "0").slice(0, 32))
      
      const decryptedBytes = new Uint8Array(encryptedBytes.length)
      for (let i = 0; i < encryptedBytes.length; i++) {
        decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length]
      }
      
      return new TextDecoder().decode(decryptedBytes)
    } catch (error) {
      console.error("Decryption error:", error)
      throw new Error("Failed to decrypt message")
    }
  }

  // Hash a password or key
  async hash(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  }

  // Generate a secure random token
  generateToken(length: number = 32): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("")
  }

  // Validate data integrity
  async validateIntegrity(data: string, expectedHash: string): Promise<boolean> {
    const actualHash = await this.hash(data)
    return actualHash === expectedHash
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService()

// Utility function to generate a conversation-specific encryption key
export function generateConversationKey(user1Id: string, user2Id: string): string {
  // Sort IDs to ensure consistent key generation
  const sortedIds = [user1Id, user2Id].sort()
  return `conv_${sortedIds[0]}_${sortedIds[1]}_${Date.now()}`
}