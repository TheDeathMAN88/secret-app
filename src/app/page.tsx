'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Layout from '@/components/layout/Layout'
import { 
  Lock, 
  MessageCircle, 
  Image, 
  FileText, 
  Shield, 
  Timer, 
  Eye,
  Sparkles,
  ArrowRight,
  Heart,
  Mail,
  Key
} from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/connect')
    }
  }, [status, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })
      
      if (result?.error) {
        console.error('Sign in error:', result.error)
      } else {
        router.push('/connect')
      }
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return null
  }

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-300 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-pink-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-300 rounded-full opacity-10 animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6">
              <Heart className="h-8 w-8 text-purple-400" />
              <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Secret Chat
              </h1>
              <Heart className="h-8 w-8 text-pink-400" />
            </div>
            <p className="text-xl md:text-2xl text-blue-200 mb-8 max-w-3xl mx-auto">
              The most secure and private messaging platform for your special connections. 
              Messages vanish after 30 days, leaving no trace behind.
            </p>
            
            {!showAuth ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg"
                  onClick={() => setShowAuth(true)}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-center">Sign In</CardTitle>
                  <CardDescription className="text-blue-200 text-center">
                    Enter your email and password to continue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-blue-200">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-300" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-blue-300 pl-10"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-blue-200">Password</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-blue-300" />
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-blue-300 pl-10"
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      size="lg" 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                  <p className="text-xs text-blue-300 text-center mt-4">
                    New users will be automatically created
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-xl hover:scale-105 transition-transform duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">End-to-End Encryption</CardTitle>
                <CardDescription className="text-blue-200">
                  Your messages are secured with military-grade encryption. Only you and your partner can read them.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-xl hover:scale-105 transition-transform duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Timer className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Auto-Delete Messages</CardTitle>
                <CardDescription className="text-blue-200">
                  All messages and files automatically delete after 30 days. No traces, no evidence.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-xl hover:scale-105 transition-transform duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Discreet Notifications</CardTitle>
                <CardDescription className="text-blue-200">
                  Notifications appear as generic system alerts. No one will suspect your secret conversations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-xl hover:scale-105 transition-transform duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Real-time Messaging</CardTitle>
                <CardDescription className="text-blue-200">
                  Instant messaging with real-time sync. Your conversations flow seamlessly across devices.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-xl hover:scale-105 transition-transform duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Image className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Media Sharing</CardTitle>
                <CardDescription className="text-blue-200">
                  Share photos and files securely. View them in-app without downloading to your device.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-xl hover:scale-105 transition-transform duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Complete Privacy</CardTitle>
                <CardDescription className="text-blue-200">
                  No data collection, no tracking, no ads. Your privacy is our highest priority.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">100%</div>
              <div className="text-blue-200">Encrypted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-400 mb-2">30 Days</div>
              <div className="text-blue-200">Auto-Delete</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">0</div>
              <div className="text-blue-200">Data Tracked</div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <Badge variant="secondary" className="text-purple-400 bg-white/10">
                2025 Design
              </Badge>
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">Ready to Start Your Secret Journey?</h2>
            <p className="text-blue-200 mb-8 max-w-2xl mx-auto">
              Join thousands of couples who trust Secret Chat for their private conversations. 
              Your secrets are safe with us.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-12 py-6 text-xl"
              onClick={() => setShowAuth(true)}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}