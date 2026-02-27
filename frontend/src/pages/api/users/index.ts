import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Fetch all sales staff
  if (req.method === 'GET') {
    try {
      const { search, role = 'sales', limit = '50', offset = '0' } = req.query

      let query = supabase
        .from('users')
        .select('id, full_name, email, role, is_active, created_at')
        .order('full_name')
        .range(Number(offset), Number(offset) + Number(limit) - 1)

      if (role && role !== 'all') {
        query = query.eq('role', role)
      }

      if (search && typeof search === 'string') {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Users query error:', error)
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, { users: data || [] })
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // POST: Create new sales staff
  if (req.method === 'POST') {
    try {
      const { full_name, email, role = 'sales' } = req.body

      if (!full_name || !email) {
        return apiError(res, 'Name and email are required', 400)
      }

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            full_name,
            email,
            role,
            is_active: true,
          },
        ])
        .select()

      if (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          return apiError(res, 'Email already exists', 400)
        }
        console.error('User creation error:', error)
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, data?.[0], undefined, 201)
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
