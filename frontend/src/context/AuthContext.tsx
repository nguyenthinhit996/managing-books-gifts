import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase'
import { AuthUser, getCurrentUser } from '@/utils/auth'

interface AuthContextType {
  session: Session | null
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from sessionStorage on page load
    const sessionData = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
    if (sessionData) {
      try {
        setUser(JSON.parse(sessionData))
      } catch (e) {
        sessionStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Email hoặc mật khẩu không đúng')
    }
    const authedUser: AuthUser = await res.json()
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user', JSON.stringify(authedUser))
    }
    setUser(authedUser)
  }

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('user')
    }
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
