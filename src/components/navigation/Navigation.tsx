'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, MessageSquare, Users, LogOut } from 'lucide-react'

export default function Navigation() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return null
  }

  return (
    <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors">
            <Home className="h-5 w-5" />
            <span className="font-semibold">Home</span>
          </Link>
          
          {session && (
            <>
              <Link href="/connect" className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors">
                <Users className="h-5 w-5" />
                <span>Connect</span>
              </Link>
              
              <Link href="/chat" className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors">
                <MessageSquare className="h-5 w-5" />
                <span>Chat</span>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {session ? (
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">
                Welcome, {session.user?.name || session.user?.email}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/signin">
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}