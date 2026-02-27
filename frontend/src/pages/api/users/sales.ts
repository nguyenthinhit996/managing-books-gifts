import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return apiError(res, 'Method not allowed', 405)
  }

  try {
    const { search } = req.query

    let query = supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'sales')
      .eq('is_active', true)
      .order('full_name')

    if (search && typeof search === 'string') {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Sales staff query error:', error)
      return apiError(res, error.message, 500)
    }

    return apiResponse(res, true, { staff: data || [] })
  } catch (error: any) {
    console.error('Sales staff error:', error)
    return apiError(res, error.message, 500)
  }
}
