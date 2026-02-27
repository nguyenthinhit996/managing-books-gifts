import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'PATCH') {
    try {
      const fields = req.body
      const { data, error } = await supabase
        .from('export_logs')
        .update(fields)
        .eq('id', id as string)
        .select()

      if (error) return apiError(res, error.message, 500)
      return apiResponse(res, true, { log: data?.[0] })
    } catch (err: any) {
      return apiError(res, err.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
