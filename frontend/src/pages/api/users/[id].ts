import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return apiError(res, 'User ID is required', 400)
  }

  // GET: Fetch single user with lending stats
  if (req.method === 'GET') {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, full_name, email, role, is_active, created_at')
        .eq('id', id)
        .single()

      if (error) {
        return apiError(res, 'User not found', 404)
      }

      // Fetch lending records for this staff
      const { data: lendingRecords, error: lendingError } = await supabase
        .from('lending_records')
        .select('id, book_id, status, issued_date, books(title, author)')
        .eq('sales_staff_id', id)
        .order('issued_date', { ascending: false })
        .limit(20)

      return apiResponse(res, true, {
        ...user,
        lending_records: lendingRecords || [],
      })
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // PUT: Update user
  if (req.method === 'PUT') {
    try {
      const { full_name, email, is_active } = req.body

      const updateData: any = { updated_at: new Date() }
      if (full_name !== undefined) updateData.full_name = full_name
      if (email !== undefined) updateData.email = email
      if (is_active !== undefined) updateData.is_active = is_active

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()

      if (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          return apiError(res, 'Email already exists', 400)
        }
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, data?.[0])
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
