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
