"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  X, 
  CheckCircle,
  AlertCircle,
  Paperclip
} from "lucide-react"

interface UploadedFile {
  id: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  filePath: string
  createdAt: string
  deleteAfter: string
}

interface FileUploadProps {
  conversationId: string
  uploadedById: string
  onFileUploaded: (file: UploadedFile) => void
}

export function FileUpload({ conversationId, uploadedById, onFileUploaded }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = [
    "image/jpeg",
    "image/png", 
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="h-4 w-4" alt="File icon" />
    if (mimeType === "application/pdf") return <FileText className="h-4 w-4" />
    if (mimeType.startsWith("text/")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setError("File type not allowed. Please upload images, PDFs, or text files.")
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError("File size too large. Maximum size is 10MB.")
      return
    }

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("conversationId", conversationId)
      formData.append("uploadedById", uploadedById)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const data = await response.json()
        const uploadedFile = data.file
        
        setUploadedFiles(prev => [...prev, uploadedFile])
        onFileUploaded(uploadedFile)
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError("Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={allowedTypes.join(",")}
          className="hidden"
          disabled={isUploading}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
          ) : (
            <Paperclip className="h-4 w-4 mr-2" />
          )}
          {isUploading ? "Uploading..." : "Attach File"}
        </Button>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Max size: 10MB
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Uploading...
              </span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Successfully Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Files:
          </div>
          {uploadedFiles.map((file) => (
            <Card key={file.id} className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.mimeType)}
                    <div>
                      <div className="text-sm font-medium text-green-800 dark:text-green-200">
                        {file.originalName}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-300">
                        {formatFileSize(file.fileSize)} • Auto-delete in 30 days
                      </div>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* File Type Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <div className="font-medium mb-1">Supported file types:</div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">Images</Badge>
          <Badge variant="outline" className="text-xs">PDF</Badge>
          <Badge variant="outline" className="text-xs">Text</Badge>
          <Badge variant="outline" className="text-xs">Word</Badge>
        </div>
      </div>
    </div>
  )
}