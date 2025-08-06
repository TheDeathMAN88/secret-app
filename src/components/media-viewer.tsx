"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  File,
  X,
  Clock
} from "lucide-react"

interface MediaFile {
  id: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  filePath: string
  createdAt: string
  deleteAfter: string
}

interface MediaViewerProps {
  isOpen: boolean
  onClose: () => void
  file: MediaFile | null
}

export function MediaViewer({ isOpen, onClose, file }: MediaViewerProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!file) return null

  const isImage = file.mimeType.startsWith("image/")
  const isPDF = file.mimeType === "application/pdf"
  const isText = file.mimeType.startsWith("text/")
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + " " + 
           new Date(dateString).toLocaleTimeString()
  }

  const getDeleteInDays = (deleteAfter: string) => {
    const now = new Date()
    const deleteDate = new Date(deleteAfter)
    const diffTime = deleteDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/files/${file.filename}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.originalName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Download error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-8 w-8 text-blue-500" />
    if (isPDF) return <FileText className="h-8 w-8 text-red-500" />
    if (isText) return <FileText className="h-8 w-8 text-green-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            <span className="truncate">{file.originalName}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Info */}
          <Card className="bg-gray-50 dark:bg-gray-700">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Size:</span>
                  <div className="font-medium">{formatFileSize(file.fileSize)}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Type:</span>
                  <div className="font-medium">{file.mimeType}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Uploaded:</span>
                  <div className="font-medium">{formatDate(file.createdAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Auto-delete:</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{getDeleteInDays(file.deleteAfter)} days</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Preview */}
          <div className="border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
            {isImage ? (
              <div className="flex items-center justify-center p-4">
                <img
                  src={`/api/files/${file.filename}`}
                  alt={file.originalName}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  onLoad={() => setIsLoading(false)}
                />
              </div>
            ) : isPDF ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    PDF preview is not available in the browser
                  </p>
                  <Button onClick={handleDownload} disabled={isLoading}>
                    {isLoading ? "Loading..." : "Download PDF"}
                  </Button>
                </div>
              </div>
            ) : isText ? (
              <div className="p-4">
                <iframe
                  src={`/api/files/${file.filename}`}
                  className="w-full h-96 border rounded"
                  title="Text file preview"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <File className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Preview not available for this file type
                  </p>
                  <Button onClick={handleDownload} disabled={isLoading}>
                    {isLoading ? "Loading..." : "Download File"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Auto-delete in {getDeleteInDays(file.deleteAfter)} days
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              <Button onClick={handleDownload} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? "Loading..." : "Download"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}