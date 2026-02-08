import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id) {
    return apiError(res, 'Book ID is required', 400)
  }

  // GET: Fetch single book
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
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

  // PUT: Update book
  if (req.method === 'PUT') {
    try {
      const { title, author, level, quantity_total, quantity_available, condition } = req.body

      const { data, error } = await supabase
        .from('books')
        .update({
          title,
          author,
          level,
          quantity_total,
          quantity_available,
          condition,
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

  // DELETE: Delete book
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id)

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, { id })
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
