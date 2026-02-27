import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase'
import { AuthUser, getCurrentUser } from '@/utils/auth'

interface AuthContextType {
  session: Session | null
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
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
    // No login required — auto-set a default manager user
    const sessionData = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null
    if (sessionData) {
      try {
        setUser(JSON.parse(sessionData))
      } catch (e) {
        console.error('Failed to parse session user:', e)
      }
    } else {
      // Default user — always logged in as manager
      const defaultUser: AuthUser = {
        id: 'default',
        email: 'manager@englishcenter.com',
        role: 'manager',
        full_name: 'Manager',
      }
      setUser(defaultUser)
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Demo mode - accept any credentials
    const demoUser: AuthUser = {
      id: Date.now().toString(),
      email,
      role: email.includes('manager') ? 'manager' : 'sales',
      full_name: email.split('@')[0],
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user', JSON.stringify(demoUser))
    }
    setUser(demoUser)
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    // Demo mode - accept any credentials
    const demoUser: AuthUser = {
      id: Date.now().toString(),
      email,
      role: 'sales',
      full_name: fullName,
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user', JSON.stringify(demoUser))
    }
    setUser(demoUser)
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
        signUp,
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
