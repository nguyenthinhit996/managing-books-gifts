import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Fetch all students
  if (req.method === 'GET') {
    try {
      const { level, student_type, search, limit = '50', offset = '0' } = req.query

      let query = supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)

      if (level && level !== 'all') {
        query = query.eq('level', level)
      }

      if (student_type && student_type !== 'all') {
        query = query.eq('student_type', student_type)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, error, count } = await query

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, { students: data, total: count })
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // POST: Create new student
  if (req.method === 'POST') {
    try {
      const { name, email, phone, level, student_type } = req.body

      if (!name || !email || !level || !student_type) {
        return apiError(res, 'Missing required fields', 400)
      }

      const { data, error } = await supabase
        .from('students')
        .insert([
          {
            name,
            email,
            phone,
            level,
            student_type,
          },
        ])
        .select()

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, data?.[0], undefined, 201)
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
