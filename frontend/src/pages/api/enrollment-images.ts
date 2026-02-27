import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiError, apiResponse } from '@/utils/api-helpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: fetch images for an enrollment
  if (req.method === 'GET') {
    const { enrollment_id } = req.query
    if (!enrollment_id || typeof enrollment_id !== 'string') {
      return apiError(res, 'enrollment_id is required', 400)
    }

    const { data, error } = await supabase
      .from('enrollment_images')
      .select('id, storage_path, file_name')
      .eq('enrollment_id', enrollment_id)

    if (error) {
      console.error('enrollment_images fetch error:', error)
      return apiError(res, error.message, 500)
    }

    return apiResponse(res, true, data || [])
  }

  // POST: insert image records
  if (req.method === 'POST') {
    const records = req.body
    if (!Array.isArray(records) || records.length === 0) {
      return apiError(res, 'Records are required', 400)
    }

    const { data, error } = await supabase
      .from('enrollment_images')
      .insert(records)
      .select()

    if (error) {
      console.error('enrollment_images insert error:', error)
      return apiError(res, error.message, 500)
    }

    return apiResponse(res, true, data)
  }

  return apiError(res, 'Method not allowed', 405)
}
