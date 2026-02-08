import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Fetch all books with optional filters
  if (req.method === 'GET') {
    try {
      const { level, search, limit = '50', offset = '0' } = req.query

      let query = supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)

      if (level && level !== 'all') {
        query = query.eq('level', level)
      }

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,author.ilike.%${search}%`
        )
      }

      const { data, error, count } = await query

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, { books: data, total: count })
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // POST: Create new book
  if (req.method === 'POST') {
    try {
      const { isbn, title, author, level, quantity_total } = req.body

      if (!title || !author || !level) {
        return apiError(res, 'Missing required fields', 400)
      }

      const { data, error } = await supabase
        .from('books')
        .insert([
          {
            isbn,
            title,
            author,
            level,
            quantity_total: quantity_total || 1,
            quantity_available: quantity_total || 1,
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
