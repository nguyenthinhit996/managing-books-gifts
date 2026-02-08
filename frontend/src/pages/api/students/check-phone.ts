import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return apiError(res, 'Method not allowed', 405)
  }

  try {
    const { phone } = req.query

    if (!phone || typeof phone !== 'string') {
      return apiError(res, 'Phone number is required', 400)
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error && error.code === 'PGRST116') {
      // Not found - this is expected
      return apiResponse(res, true, { student: null, borrowed_books: [] })
    }

    if (error) {
      console.error('Check phone error:', error)
      return apiError(res, error.message, 500)
    }

    // Fetch currently borrowed books for this student
    let borrowed_books: any[] = []
    if (student) {
      const { data: lending, error: lendingError } = await supabase
        .from('lending_records')
        .select('id, book_id, books(id, title, author, level)')
        .eq('student_phone', student.phone)
        .eq('status', 'borrowed')

      if (!lendingError && lending) {
        borrowed_books = lending
      }
    }

    return apiResponse(res, true, { student, borrowed_books })
  } catch (error: any) {
    console.error('Check phone error:', error)
    return apiError(res, error.message, 500)
  }
}
