import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id) {
    return apiError(res, 'Lending record ID is required', 400)
  }

  // PUT: Update lending record status (return/lost/damaged)
  if (req.method === 'PUT') {
    try {
      const { status, return_date } = req.body

      if (!status || !['returned', 'lost', 'damaged', 'overdue'].includes(status)) {
        return apiError(res, 'Invalid status', 400)
      }

      // Get current lending record
      const { data: currentRecord, error: fetchError } = await supabase
        .from('lending_records')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        return apiError(res, fetchError.message, 404)
      }

      // Update lending record
      const { data, error } = await supabase
        .from('lending_records')
        .update({
          status,
          return_date: return_date || new Date().toISOString().split('T')[0],
          updated_at: new Date(),
        })
        .eq('id', id)
        .select()

      if (error) {
        return apiError(res, error.message, 500)
      }

      // If returning, increment book availability
      if (status === 'returned' && currentRecord.status === 'borrowed') {
        const { data: book } = await supabase
          .from('books')
          .select('quantity_available')
          .eq('id', currentRecord.book_id)
          .single()

        if (book) {
          await supabase
            .from('books')
            .update({
              quantity_available: book.quantity_available + 1,
            })
            .eq('id', currentRecord.book_id)
        }
      }

      return apiResponse(res, true, data?.[0])
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
