import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase-server'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return apiError(res, 'Method not allowed', 405)
  }

  try {
    const {
      type, // 'borrow' or 'return'
      student_name,
      email,
      phone,
      level,
      sales_staff_id,
      material_id,
      material_ids,
      notes,
    } = req.body

    // Support both single material_id and array material_ids
    const ids: string[] = material_ids || (material_id ? [material_id] : [])

    // Validate required fields
    if (!type || !phone || ids.length === 0) {
      return apiError(res, 'Missing required fields', 400)
    }

    if (type === 'borrow') {
      // BORROW LOGIC
      if (!student_name || !sales_staff_id) {
        return apiError(res, 'Missing required fields for borrowing', 400)
      }

      // Check if phone already exists and get student details
      const { data: existingStudent, error: checkError } = await supabase
        .from('students')
        .select('id, phone, name, email, level')
        .eq('phone', phone)
        .single()

      let student_phone = phone

      // If student doesn't exist, create them
      if (!existingStudent) {
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert([
            {
              name: student_name,
              email,
              phone,
              level,
              student_type: 'new',
            },
          ])
          .select()

        if (createError) {
          if (createError.message.includes('unique')) {
            return apiError(res, 'Phone number already registered', 400)
          }
          console.error('Student creation error:', createError)
          return apiError(res, createError.message, 500)
        }

        student_phone = newStudent?.[0]?.phone || phone
      } else {
        // Update existing student — only overwrite fields that are actually provided
        const updates: Record<string, string> = {}
        if (student_name) updates.name = student_name
        if (email) updates.email = email
        if (level) updates.level = level

        if (Object.keys(updates).length > 0) {
          await supabase.from('students').update(updates).eq('phone', phone)
        }
      }

      // Check all materials availability
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('id, title, quantity_available')
        .in('id', ids)

      if (materialsError || !materialsData || materialsData.length === 0) {
        return apiError(res, 'One or more materials not found', 404)
      }

      // Check each material has availability
      const unavailable = materialsData.filter((m) => m.quantity_available <= 0)
      if (unavailable.length > 0) {
        const titles = unavailable.map((m) => m.title).join(', ')
        return apiError(res, `Not available: ${titles}`, 400)
      }

      // Create enrollment (parent record)
      const due_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert([{
          student_phone,
          sales_staff_id,
          issued_date: new Date().toISOString().split('T')[0],
          due_date,
          notes,
        }])
        .select()
        .single()

      if (enrollmentError || !enrollment) {
        return apiError(res, enrollmentError?.message || 'Failed to create enrollment', 500)
      }

      // Create material_records linked to enrollment
      const records = ids.map((mid) => ({
        enrollment_id: enrollment.id,
        material_id: mid,
        status: 'borrowed',
      }))

      const { data: materialRecords, error: recordError } = await supabase
        .from('material_records')
        .insert(records)
        .select()

      if (recordError) {
        console.error('Material record creation error:', recordError)
        return apiError(res, recordError.message, 500)
      }

      // Decrement availability atomically via RPC to prevent race conditions
      for (const mat of materialsData) {
        await supabase.rpc('decrement_material_quantity', { p_material_id: mat.id })
      }

      const count = ids.length
      return apiResponse(
        res,
        true,
        {
          enrollment_id: enrollment.id,
          student_phone,
          material_record_ids: materialRecords?.map((r) => r.id) || [],
          message: 'Done! Books & gifts assigned.',
        },
        undefined,
        201
      )
    } else if (type === 'return') {
      // RETURN LOGIC - still single material
      const returnId = ids[0]

      // Find enrollments for this student phone
      const { data: studentEnrollments } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_phone', phone)

      if (!studentEnrollments || studentEnrollments.length === 0) {
        return apiError(res, 'No enrollment found for this phone', 404)
      }

      const enrollmentIds = studentEnrollments.map((e: any) => e.id)

      // Find the active material record
      const { data: materialRecord, error: findError } = await supabase
        .from('material_records')
        .select('*')
        .in('enrollment_id', enrollmentIds)
        .eq('material_id', returnId)
        .eq('status', 'borrowed')
        .single()

      if (findError || !materialRecord) {
        return apiError(res, 'No active borrowing found for this material and phone', 404)
      }

      // Update material record status to returned
      const { error: updateError } = await supabase
        .from('material_records')
        .update({
          status: 'returned',
          return_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', materialRecord.id)

      if (updateError) {
        return apiError(res, updateError.message, 500)
      }

      // Increment material availability
      const { data: material, error: materialError } = await supabase
        .from('materials')
        .select('quantity_available')
        .eq('id', returnId)
        .single()

      if (material) {
        // Increment availability atomically via RPC to prevent race conditions
        await supabase.rpc('increment_material_quantity', { p_material_id: returnId })
      }

      return apiResponse(
        res,
        true,
        {
          material_record_id: materialRecord.id,
          message: 'Material returned successfully!',
        },
        undefined,
        200
      )
    } else {
      return apiError(res, 'Invalid type. Use "borrow" or "return"', 400)
    }
  } catch (error: any) {
    console.error('Enrollment error:', error)
    return apiError(res, error.message, 500)
  }
}
