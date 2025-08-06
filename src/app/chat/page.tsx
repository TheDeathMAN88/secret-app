'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Search, 
  Phone, 
  Video, 
  Smile,
  Check,
  CheckCheck,
  File,
  Image,
  Download,
  AlertCircle
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import Layout from '@/components/layout/Layout'

interface Message {
  id: string
  content?: string
  senderId: string
  sender: {
    id: string
    name: string
  }
  createdAt: string
  isRead: boolean
}

interface MediaFile {
  id: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  filePath: string
  uploadedBy: {
    id: string
    name: string
  }
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  isOnline: boolean
}

interface ConnectionStatus {
  isConnected: boolean
  partnerName?: string
  partnerId?: string
  conversationId?: string
}

export default function Chat() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [partnerUser, setPartnerUser] = useState<User | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }

    if (status === 'authenticated' && session?.user) {
      checkConnectionStatus()
    }
  }, [status, session, router])

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/connection/status')
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data)
        
        if (data.isConnected) {
          setCurrentUser({
            id: session?.user?.id || '',
            name: session?.user?.name || '',
            email: session?.user?.email || '',
            isOnline: true
          })
          
          setPartnerUser({
            id: data.partnerId || '',
            name: data.partnerName || '',
            email: '',
            isOnline: false // Will be updated by socket
          })
          
          await loadMessages(data.conversationId)
          setupSocket(data.conversationId)
        } else {
          // No connection, redirect to connect page
          router.push('/connect')
        }
      }
    } catch (error) {
      console.error('Failed to check connection status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        scrollToBottom()
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const setupSocket = (conversationId: string) => {
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')
    
    const socket = socketRef.current

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('authenticate', {
        userId: session?.user?.id,
        conversationId
      })
    })

    socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data)
    })

    socket.on('partner_online', (data) => {
      setPartnerUser(prev => prev ? { ...prev, isOnline: true } : null)
    })

    socket.on('partner_offline', (data) => {
      setPartnerUser(prev => prev ? { ...prev, isOnline: false } : null)
    })

    socket.on('receive_message', (data: Message) => {
      setMessages(prev => [...prev, data])
      scrollToBottom()
    })

    socket.on('file_received', (data: MediaFile) => {
      setMediaFiles(prev => [...prev, data])
    })

    socket.on('user_typing', (data) => {
      setTypingUser(data.userName)
      setTimeout(() => setTypingUser(null), 3000)
    })

    socket.on('user_stopped_typing', () => {
      setTypingUser(null)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !connectionStatus?.conversationId) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          conversationId: connectionStatus.conversationId
        })
      })

      if (response.ok) {
        const message = await response.json()
        setMessages(prev => [...prev, message])
        setNewMessage('')
        scrollToBottom()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!connectionStatus?.conversationId) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversationId', connectionStatus.conversationId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const mediaFile = await response.json()
        setMediaFiles(prev => [...prev, mediaFile])
        
        // Notify socket about file upload
        if (socketRef.current) {
          socketRef.current.emit('file_uploaded', {
            conversationId: connectionStatus.conversationId,
            fileId: mediaFile.id,
            senderId: session?.user?.id
          })
        }
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
    } finally {
      setIsUploading(false)
      setSelectedFile(null)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      handleFileUpload(file)
    }
  }

  const handleTyping = () => {
    if (!socketRef.current || !connectionStatus?.conversationId || !session?.user?.id) return

    if (!isTyping) {
      setIsTyping(true)
      socketRef.current.emit('typing', {
        conversationId: connectionStatus.conversationId,
        userId: session.user.id,
        userName: session.user.name || 'User'
      })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socketRef.current?.emit('stop_typing', {
        conversationId: connectionStatus.conversationId
      })
    }, 1000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!connectionStatus?.isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Active Connection</h3>
            <p className="text-blue-200 mb-4">You need to connect with a partner to start chatting</p>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => router.push('/connect')}
            >
              Connect with Partner
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Layout>
      <div className="h-[85vh] flex items-center justify-center">
        <Card className="w-full max-w-4xl h-full border-0 shadow-2xl bg-white/10 backdrop-blur-xl">
          {/* Chat Header */}
          <CardHeader className="border-b border-white/20 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={partnerUser?.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {partnerUser?.name?.charAt(0) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    partnerUser?.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div>
                  <CardTitle className="text-lg text-white">{partnerUser?.name || 'Partner'}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={partnerUser?.isOnline ? 'default' : 'secondary'} className="text-xs">
                      {partnerUser?.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                    {typingUser && (
                      <span className="text-sm text-blue-200">
                        {typingUser} is typing...
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[50vh] p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.senderId === currentUser?.id ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`text-xs ${
                        message.senderId === currentUser?.id 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      } text-white`}>
                        {message.sender.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[70%] ${
                      message.senderId === currentUser?.id ? 'text-right' : 'text-left'
                    }`}>
                      {message.content && (
                        <div className={`rounded-2xl px-4 py-2 inline-block ${
                          message.senderId === currentUser?.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-white/20 text-white'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <span className="text-xs text-blue-200">
                          {formatTime(message.createdAt)}
                        </span>
                        {message.senderId === currentUser?.id && (
                          message.isRead ? (
                            <CheckCheck className="h-3 w-3 text-blue-400" />
                          ) : (
                            <Check className="h-3 w-3 text-blue-200" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {mediaFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`flex gap-3 ${
                      file.uploadedBy.id === currentUser?.id ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`text-xs ${
                        file.uploadedBy.id === currentUser?.id 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      } text-white`}>
                        {file.uploadedBy.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[70%] ${
                      file.uploadedBy.id === currentUser?.id ? 'text-right' : 'text-left'
                    }`}>
                      <div className={`rounded-2xl p-3 inline-block ${
                        file.uploadedBy.id === currentUser?.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {file.mimeType.startsWith('image/') ? (
                            <Image className="h-5 w-5" />
                          ) : (
                            <File className="h-5 w-5" />
                          )}
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {file.originalName}
                          </span>
                        </div>
                        <div className="text-xs opacity-75">
                          {formatFileSize(file.fileSize)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-6 text-xs text-white hover:bg-white/20"
                          onClick={() => window.open(file.filePath, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <span className="text-xs text-blue-200">
                          {formatTime(file.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <div className="border-t border-white/20 p-4">
            {isUploading && (
              <div className="mb-2 text-sm text-blue-200">
                Uploading file...
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onInput={handleTyping}
                placeholder="Type a message..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-blue-300"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isUploading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}