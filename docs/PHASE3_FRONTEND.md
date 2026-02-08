# Phase 3: Frontend Setup & Authentication

## Overview

In this phase, we'll:
1. Setup Supabase client configuration
2. Create authentication context
3. Build login/signup pages
4. Create protected routes
5. Build layout and navigation components

---

## Step 1: Create Configuration Files

### 1.1 Update Next.js Configuration

Create/Update `frontend/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
```

### 1.2 Update Package.json

Update `frontend/package.json` with complete dependencies:

```json
{
  "name": "books-management-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "react-hot-toast": "^2.4.0",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

---

## Step 2: Create Utilities

### 2.1 Supabase Client

Create `frontend/src/utils/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
```

### 2.2 Authentication Utilities

Create `frontend/src/utils/auth.ts`:

```typescript
import { supabase } from './supabase'

export interface AuthUser {
  id: string
  email: string
  role: 'manager' | 'sales' | 'admin'
  full_name: string
}

export async function signUp(
  email: string,
  password: string,
  fullName: string
) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) return null

    // Get user role from database
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('email', session.user.email)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function getUserRole() {
  const user = await getCurrentUser()
  return user?.role || null
}
```

### 2.3 API Service Utilities

Create `frontend/src/utils/api.ts`:

```typescript
import axios from 'axios'
import { supabase } from './supabase'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
})

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }

  return config
})

export default apiClient
```

---

## Step 3: Create Authentication Context

Create `frontend/src/context/AuthContext.tsx`:

```typescript
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)

      if (session?.user) {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    const checkUser = async () => {
      if (session?.user) {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      }
      setLoading(false)
    }

    checkUser()

    return () => {
      subscription?.unsubscribe()
    }
  }, [session])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    // Note: In a real app, you'd create the user profile in the users table here
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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
```

---

## Step 4: Create Protected Route Component

Create `frontend/src/components/ProtectedRoute.tsx`:

```typescript
import { ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  if (requiredRole && user.role !== requiredRole) {
    router.push('/unauthorized')
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
```

---

## Step 5: Create Layout Components

### 5.1 Navigation Bar

Create `frontend/src/components/Navbar.tsx`:

```typescript
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/router'

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 font-bold text-2xl">
            <span>📚</span>
            <span>Book Center</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <>
                <span className="text-sm">{user.full_name}</span>
                <span className="text-xs bg-blue-500 px-2 py-1 rounded">
                  {user.role}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>

        {isOpen && user && (
          <div className="md:hidden pb-4 space-y-2">
            <div className="text-sm">{user.full_name}</div>
            <div className="text-xs bg-blue-500 inline-block px-2 py-1 rounded">
              {user.role}
            </div>
            <button
              onClick={handleSignOut}
              className="block w-full text-left bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
```

### 5.2 Sidebar (for Dashboard)

Create `frontend/src/components/Sidebar.tsx`:

```typescript
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'

export const Sidebar: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()

  const isActive = (path: string) => router.pathname === path

  const getMenuItems = () => {
    const commonItems = [
      { href: '/dashboard', label: '📊 Dashboard', roles: ['manager', 'admin'] },
      { href: '/dashboard/books', label: '📚 Books', roles: ['manager', 'admin'] },
      { href: '/dashboard/students', label: '👥 Students', roles: ['manager', 'admin'] },
      { href: '/dashboard/lending', label: '🔄 Lending Records', roles: ['manager', 'admin'] },
    ]

    return commonItems.filter((item) =>
      item.roles.includes(user?.role || '')
    )
  }

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">📚 Book Manager</h2>
      </div>

      <nav className="space-y-2">
        {getMenuItems().map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded transition ${
              isActive(item.href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 pt-8 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          Logged in as: <strong>{user?.full_name}</strong>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Role: <strong>{user?.role}</strong>
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
```

### 5.3 Layout Component

Create `frontend/src/components/DashboardLayout.tsx`:

```typescript
import { ReactNode } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
```

---

## Step 6: Create Authentication Pages

### 6.1 Login Page

Create `frontend/src/pages/login.tsx`:

```typescript
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import Link from 'next/link'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      toast.success('Logged in successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📚</h1>
          <h2 className="text-2xl font-bold text-gray-800">Book Manager</h2>
          <p className="text-gray-600 mt-2">English Learning Center</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Test Accounts:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Manager: <code className="bg-gray-200 px-2 py-1">manager@englishcenter.com</code></p>
            <p>Sales: <code className="bg-gray-200 px-2 py-1">sales1@englishcenter.com</code></p>
            <p>Password: Any password (demo mode)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
```

### 6.2 Home Page (Updated)

Update `frontend/src/pages/index.tsx`:

```typescript
import type { NextPage } from 'next'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const Home: NextPage = () => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">📚 Book Management System</h1>
        <p className="text-xl mb-8">English Learning Center</p>
        <div className="space-x-4">
          <a
            href="/login"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Manager Login
          </a>
          <a
            href="/enrollment"
            className="inline-block bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white hover:text-blue-600 transition"
          >
            Student Enrollment
          </a>
        </div>
      </div>
    </div>
  )
}

export default Home
```

### 6.3 Update _app.tsx

Update `frontend/src/pages/_app.tsx`:

```typescript
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from 'react-hot-toast'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}
```

---

## Step 7: Install New Dependencies

Run in `frontend` folder:

```bash
npm install react-hot-toast
```

---

## ✅ Phase 3 Checklist

- [ ] Created Supabase client (`src/utils/supabase.ts`)
- [ ] Created auth utilities (`src/utils/auth.ts`)
- [ ] Created API client (`src/utils/api.ts`)
- [ ] Created AuthContext (`src/context/AuthContext.tsx`)
- [ ] Created ProtectedRoute component
- [ ] Created Navbar component
- [ ] Created Sidebar component
- [ ] Created DashboardLayout component
- [ ] Created Login page
- [ ] Updated Home page
- [ ] Updated _app.tsx with AuthProvider
- [ ] Updated _document.tsx
- [ ] Created global styles (globals.css)
- [ ] Installed dependencies (npm install react-hot-toast)
- [ ] Tested login flow

---

## 🧪 Testing Phase 3

### Test 1: Start Dev Server

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` - should see home page

### Test 2: Try Login

1. Click "Manager Login"
2. Use test account:
   - Email: `manager@englishcenter.com`
   - Password: `any password` (demo mode, we'll fix authentication later)
3. Should redirect to `/dashboard`

---

## Next Steps

After Phase 3:
1. ✅ Authentication setup complete
2. Move to **Phase 4: Backend API Setup**
3. Create API routes for books, students, lending, etc.

Ready for Phase 4?

