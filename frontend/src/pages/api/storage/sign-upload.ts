import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiError } from '@/utils/api-helpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return apiError(res, 'Method not allowed', 405)
  }

  const { path } = req.body as { path: string }

  if (!path) {
    return apiError(res, 'Path is required', 400)
  }

  const { data, error } = await supabase.storage
    .from('enrollment-images')
    .createSignedUploadUrl(path)

  if (error) {
    console.error('Signed URL error:', error)
    return apiError(res, error.message, 500)
  }

  return res.status(200).json({ signedUrl: data.signedUrl, token: data.token, path: data.path })
}
