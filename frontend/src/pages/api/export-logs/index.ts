import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: fetch export logs
  if (req.method === 'GET') {
    try {
      const { limit = '200', date_from, date_to } = req.query

      let query = supabase
        .from('export_logs')
        .select('*, materials(id, title, author, level, type)')
        .order('created_at', { ascending: false })
        .limit(Number(limit))

      if (date_from) query = query.gte('created_at', date_from as string)
      if (date_to)   query = query.lte('created_at', (date_to as string) + 'T23:59:59')

      const { data, error } = await query
      if (error) return apiError(res, error.message, 500)

      return apiResponse(res, true, { logs: data })
    } catch (err: any) {
      return apiError(res, err.message, 500)
    }
  }

  // POST: create an export log entry
  if (req.method === 'POST') {
    try {
      const { material_id, material_title, quantity, note, exported_by } = req.body

      if (!material_id || !material_title || !quantity) {
        return apiError(res, 'Missing required fields', 400)
      }

      const { data, error } = await supabase
        .from('export_logs')
        .insert([{ material_id, material_title, quantity, note: note || null, exported_by: exported_by || null }])
        .select()

      if (error) return apiError(res, error.message, 500)

      return apiResponse(res, true, { log: data?.[0] })
    } catch (err: any) {
      return apiError(res, err.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
