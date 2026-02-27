import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return apiError(res, 'Method not allowed', 405)
  }

  try {
    const { phone } = req.query

    if (!phone || typeof phone !== 'string') {
      return apiError(res, 'Phone number is required', 400)
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error && error.code === 'PGRST116') {
      // Not found - this is expected
      return apiResponse(res, true, { student: null, borrowed_materials: [] })
    }

    if (error) {
      console.error('Check phone error:', error)
      return apiError(res, error.message, 500)
    }

    // Fetch currently borrowed materials for this student (via enrollments)
    let borrowed_materials: any[] = []
    if (student) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_phone', student.phone)

      const enrollmentIds = enrollments?.map((e: any) => e.id) || []

      if (enrollmentIds.length > 0) {
        const { data: records, error: recordsError } = await supabase
          .from('material_records')
          .select('id, material_id, enrollment_id, materials(id, title, author, level)')
          .in('enrollment_id', enrollmentIds)
          .eq('status', 'borrowed')

        if (!recordsError && records) {
          borrowed_materials = records
        }
      }
    }

    return apiResponse(res, true, { student, borrowed_materials })
  } catch (error: any) {
    console.error('Check phone error:', error)
    return apiError(res, error.message, 500)
  }
}
