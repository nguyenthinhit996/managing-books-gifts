import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Fetch all material records
  if (req.method === 'GET') {
    try {
      const { status, limit = '200', offset = '0', date_from, date_to } = req.query

      // PostgREST cannot filter on nested join columns directly.
      // When date filters are present, first resolve matching enrollment IDs,
      // then filter material_records by those IDs.
      let enrollmentIdFilter: string[] | null = null
      if (date_from || date_to) {
        let enrollmentQuery = supabase
          .from('enrollments')
          .select('id')
        if (date_from) enrollmentQuery = enrollmentQuery.gte('issued_date', date_from as string)
        if (date_to) enrollmentQuery = enrollmentQuery.lte('issued_date', date_to as string)
        const { data: matchingEnrollments, error: enrollmentError } = await enrollmentQuery
        if (enrollmentError) return apiError(res, enrollmentError.message, 500)
        enrollmentIdFilter = (matchingEnrollments || []).map((e: any) => e.id)
        // If no enrollments match the date range, return empty immediately
        if (enrollmentIdFilter.length === 0) {
          return apiResponse(res, true, { records: [], total: 0 })
        }
      }

      let query = supabase
        .from('material_records')
        .select(
          `
          *,
          materials(id, title, author, level, type),
          enrollments!inner(
            id,
            issued_date,
            due_date,
            student_phone,
            notes,
            erp_updated,
            students(id, name, email),
            users:sales_staff_id(id, full_name)
          )
        `
        )
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      if (enrollmentIdFilter !== null) {
        query = query.in('enrollment_id', enrollmentIdFilter)
      }

      const { data, error, count } = await query

      if (error) {
        return apiError(res, error.message, 500)
      }

      return apiResponse(res, true, { records: data, total: count })
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  // POST: Create new material record
  if (req.method === 'POST') {
    try {
      const { enrollment_id, material_id } = req.body

      if (!enrollment_id || !material_id) {
        return apiError(res, 'Missing required fields: enrollment_id and material_id', 400)
      }

      // Create material record
      const { data: record, error: recordError } = await supabase
        .from('material_records')
        .insert([{ enrollment_id, material_id, status: 'borrowed' }])
        .select()

      if (recordError) {
        return apiError(res, recordError.message, 500)
      }

      // Decrement material availability
      const { data: material, error: materialError } = await supabase
        .from('materials')
        .select('quantity_available')
        .eq('id', material_id)
        .single()

      if (!materialError && material) {
        await supabase
          .from('materials')
          .update({
            quantity_available: Math.max(0, material.quantity_available - 1),
          })
          .eq('id', material_id)
      }

      return apiResponse(res, true, record?.[0], undefined, 201)
    } catch (error: any) {
      return apiError(res, error.message, 500)
    }
  }

  return apiError(res, 'Method not allowed', 405)
}
