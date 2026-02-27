import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id) {
    return apiError(res, 'Material record ID is required', 400)
  }

  // PUT: Update material record status (return/lost/damaged)
  if (req.method === 'PUT') {
    try {
      const { status, return_date } = req.body

      if (!status || !['returned', 'lost', 'damaged', 'overdue'].includes(status)) {
        return apiError(res, 'Invalid status', 400)
      }

      // Get current record
      const { data: currentRecord, error: fetchError } = await supabase
        .from('material_records')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        return apiError(res, fetchError.message, 404)
      }

      // Update record
      const { data, error } = await supabase
        .from('material_records')
        .update({
          status,
          return_date: return_date || new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()

      if (error) {
        return apiError(res, error.message, 500)
      }

      // If returning, increment material availability
      if (status === 'returned' && currentRecord.status === 'borrowed') {
        const { data: material } = await supabase
          .from('materials')
          .select('quantity_available')
          .eq('id', currentRecord.material_id)
          .single()

        if (material) {
          await supabase
            .from('materials')
            .update({
              quantity_available: material.quantity_available + 1,
            })
            .eq('id', currentRecord.material_id)
        }
      }

      return apiResponse(res, true, data?.[0])
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
