import axios from 'axios'
import { supabase } from './supabase'

const apiClient = axios.create({
  // Empty string = relative URL, works on both localhost and Vercel
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
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
