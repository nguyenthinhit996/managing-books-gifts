import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Fetch all lending records
  if (req.method === 'GET') {
    try {
      const { status, limit = '50', offset = '0' } = req.query

      let query = supabase
        .from('lending_records')
        .select(
          `
          *,
          books(id, title, author, level),
          students(id, name, email),
          users:sales_staff_id(id, full_name)
        `
        )
        .order('issued_date', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error, count } = await query

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, { records: data, total: count })
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // POST: Create new lending record
  if (req.method === 'POST') {
    try {
      const { book_id, student_id, sales_staff_id, due_date } = req.body

      if (!book_id || !student_id || !sales_staff_id || !due_date) {
        return apiError(res, 'Missing required fields', 400)
      }

      // Start transaction: create lending & update book quantity
      const { data: lending, error: lendingError } = await supabase
        .from('lending_records')
        .insert([
          {
            book_id,
            student_id,
            sales_staff_id,
            issued_date: new Date().toISOString().split('T')[0],
            due_date,
            status: 'borrowed',
          },
        ])
        .select()

      if (lendingError) {
        return apiError(res, lendingError.message, 500)
      }

      // Decrement book availability
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('quantity_available')
        .eq('id', book_id)
        .single()

      if (!bookError && book) {
        await supabase
          .from('books')
          .update({
            quantity_available: Math.max(0, book.quantity_available - 1),
          })
          .eq('id', book_id)
      }

      return apiResponse(res, true, lending?.[0], undefined, 201)
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
