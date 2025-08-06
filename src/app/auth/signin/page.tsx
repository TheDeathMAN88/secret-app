'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        alert('Invalid credentials')
      } else {
        router.push('/connect')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-white text-2xl">Welcome Back</CardTitle>
          <CardDescription className="text-blue-200">
            Sign in to your secret messaging account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-blue-300"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-200">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-blue-300"
                placeholder="Enter your password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}