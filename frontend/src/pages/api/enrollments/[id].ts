import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'PATCH') {
    try {
      // Whitelist allowed fields to prevent overwriting sensitive columns
      const ALLOWED_FIELDS = ['notes', 'due_date', 'erp_updated']
      const safeFields = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => ALLOWED_FIELDS.includes(key))
      )
      if (Object.keys(safeFields).length === 0) {
        return apiError(res, 'No valid fields to update', 400)
      }
      const { data, error } = await supabase
        .from('enrollments')
        .update(safeFields)
        .eq('id', id as string)
        .select()

      if (error) return apiError(res, error.message, 500)
      return apiResponse(res, true, { enrollment: data?.[0] })
    } catch (err: any) {
      return apiError(res, err.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
