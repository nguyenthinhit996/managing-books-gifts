import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id) {
    return apiError(res, 'Student ID is required', 400)
  }

  // GET: Fetch single student with borrowing history
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(
          `
          *,
          material_records(
            id,
            material_id,
            issued_date,
            due_date,
            return_date,
            status,
            materials(title, author, level)
          )
        `
        )
        .eq('id', id)
        .single()

      if (error) {
        return apiError(res, error.message, 404)
      }

      return apiResponse(res, true, data)
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // PUT: Update student
  if (req.method === 'PUT') {
    try {
      const { name, email, phone, level } = req.body

      const { data, error } = await supabase
        .from('students')
        .update({
          name,
          email,
          phone,
          level,
          updated_at: new Date(),
        })
        .eq('id', id)
        .select()

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, data?.[0])
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
