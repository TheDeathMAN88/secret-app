'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Copy, Share2, Users, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { signIn, useSession } from 'next-auth/react'
import Layout from '@/components/layout/Layout'

interface ConnectionStatus {
  isConnected: boolean
  partner?: {
    id: string
    name?: string
    avatar?: string
    isOnline: boolean
    lastSeen?: string
  }
  connectionDate?: string
  conversationId?: string
  status: 'no_connection' | 'connected'
}

export default function ConnectPage() {
  const [connectionCode, setConnectionCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    status: 'no_connection'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { data: session, status } = useSession()

  // Check connection status on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      checkConnectionStatus()
    } else {
      setIsLoading(false)
    }
  }, [status])

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/connection/status')
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data)
      }
    } catch (error) {
      console.error('Error checking connection status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate a unique connection code
  const generateConnectionCode = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate a connection code",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/connection/generate', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to generate code')
      }

      const data = await response.json()
      setConnectionCode(data.code)
      
      toast({
        title: "Connection Code Generated",
        description: "Share this code with your partner securely",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate connection code",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy connection code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectionCode)
    toast({
      title: "Copied!",
      description: "Connection code copied to clipboard",
    })
  }

  // Share connection code
  const shareConnectionCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Secret Connection Code',
          text: `Connect with me using this code: ${connectionCode}`,
        })
      } catch (error) {
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  // Connect with partner using code
  const connectWithPartner = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect with a partner",
        variant: "destructive"
      })
      return
    }

    if (!inputCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a connection code",
        variant: "destructive"
      })
      return
    }

    setIsConnecting(true)
    try {
      const response = await fetch('/api/connection/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: inputCode })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect')
      }

      // Refresh connection status
      await checkConnectionStatus()
      
      toast({
        title: "Connected!",
        description: data.message || "You are now connected with your partner",
      })
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect with partner",
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-md mx-auto space-y-6 pt-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-white">Welcome</h1>
            <p className="text-blue-200">Sign in to connect with your partner</p>
          </div>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Authentication Required</CardTitle>
              <CardDescription className="text-blue-200">
                You need to be signed in to create or use connection codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                onClick={() => signIn()}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Connect with Your Partner</h1>
          <p className="text-blue-200">Create a secure, private connection</p>
        </div>

        {/* Connection Status Card */}
        {connectionStatus.isConnected ? (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <CardTitle className="text-white">Connected</CardTitle>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                  Active
                </Badge>
              </div>
              <CardDescription className="text-blue-200">
                You are securely connected with your partner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-black/20 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  {connectionStatus.partner?.avatar ? (
                    <img 
                      src={connectionStatus.partner.avatar} 
                      alt={connectionStatus.partner.name || 'Partner'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">
                    {connectionStatus.partner?.name || 'Partner'}
                  </h3>
                  <p className="text-sm text-blue-200">
                    {connectionStatus.partner?.isOnline ? 'Online now' : 'Offline'}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${connectionStatus.partner?.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-blue-200">Connected Since</Label>
                  <p className="text-white font-medium">
                    {connectionStatus.connectionDate ? 
                      new Date(connectionStatus.connectionDate).toLocaleDateString() : 
                      'Unknown'
                    }
                  </p>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                onClick={() => window.location.href = '/chat'}
              >
                Go to Chat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Generate Code Section */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Create Connection Code
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Generate a unique code to share with your partner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!connectionCode ? (
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={generateConnectionCode}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Connection Code'
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-black/20 rounded-lg p-4 text-center">
                      <Label className="text-blue-200 text-sm">Your Connection Code</Label>
                      <div className="text-3xl font-mono font-bold text-white tracking-wider mt-2">
                        {connectionCode}
                      </div>
                      <p className="text-xs text-blue-300 mt-2">
                        This code will expire in 24 hours
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                        onClick={copyToClipboard}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                        onClick={shareConnectionCode}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Or Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-blue-200">OR</span>
              </div>
            </div>

            {/* Enter Code Section */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Enter Partner's Code
                </CardTitle>
                <CardDescription className="text-blue-200">
                  If you received a connection code from your partner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="connectionCode" className="text-blue-200">
                    Connection Code
                  </Label>
                  <Input
                    id="connectionCode"
                    placeholder="Enter 6-character code"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-300"
                    maxLength={6}
                  />
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  onClick={connectWithPartner}
                  disabled={isConnecting || inputCode.length !== 6}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect with Partner'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Info */}
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-white font-medium">Security Information</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Connection codes expire after 24 hours</li>
                  <li>• Only one partner can connect per code</li>
                  <li>• All messages are end-to-end encrypted</li>
                  <li>• Messages auto-delete after 30 days</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}