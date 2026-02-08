import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
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
      purpose,
      sales_staff_id,
      book_id,
      notes,
    } = req.body

    // Validate required fields
    if (!type || !phone || !book_id) {
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
              student_type: purpose,
              notes,
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
        // Update existing student if details changed
        await supabase
          .from('students')
          .update({
            name: student_name,
            email,
            level,
            student_type: purpose,
            notes,
            updated_at: new Date(),
          })
          .eq('phone', phone)
      }

      // Check book availability
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('id, quantity_available')
        .eq('id', book_id)
        .single()

      if (bookError || !book) {
        return apiError(res, 'Book not found or unavailable', 404)
      }

      if (book.quantity_available <= 0) {
        return apiError(res, 'Book is not available', 400)
      }

      // Create lending record using phone
      const { data: lendingRecord, error: lendingError } = await supabase
        .from('lending_records')
        .insert([
          {
            book_id,
            student_phone,
            sales_staff_id,
            issued_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            status: 'borrowed',
            notes: notes || `Purpose: ${purpose}`,
          },
        ])
        .select()

      if (lendingError) {
        console.error('Lending record creation error:', lendingError)
        return apiError(res, lendingError.message, 500)
      }

      // Decrement book availability
      await supabase
        .from('books')
        .update({
          quantity_available: Math.max(0, book.quantity_available - 1),
        })
        .eq('id', book_id)

      return apiResponse(
        res,
        true,
        {
          student_phone: student_phone,
          lending_record_id: lendingRecord?.[0]?.id,
          message: existingStudent
            ? 'Book borrowed successfully!'
            : 'Student enrolled and book borrowed!',
        },
        undefined,
        201
      )
    } else if (type === 'return') {
      // RETURN LOGIC
      // Find the lending record by phone and book_id with status 'borrowed'
      const { data: lendingRecord, error: findError } = await supabase
        .from('lending_records')
        .select('*')
        .eq('student_phone', phone)
        .eq('book_id', book_id)
        .eq('status', 'borrowed')
        .single()

      if (findError) {
        console.error('Find lending record error:', findError)
        return apiError(res, 'No active borrowing found for this book and phone', 404)
      }

      if (!lendingRecord) {
        return apiError(res, 'No active borrowing found for this book and phone', 404)
      }

      // Update lending record status to returned
      const { error: updateError } = await supabase
        .from('lending_records')
        .update({
          status: 'returned',
          return_date: new Date().toISOString().split('T')[0],
          notes: notes || lendingRecord.notes,
          updated_at: new Date(),
        })
        .eq('id', lendingRecord.id)

      if (updateError) {
        console.error('Update lending error:', updateError)
        return apiError(res, updateError.message, 500)
      }

      // Increment book availability
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('quantity_available')
        .eq('id', book_id)
        .single()

      if (book) {
        await supabase
          .from('books')
          .update({
            quantity_available: book.quantity_available + 1,
          })
          .eq('id', book_id)
      }

      return apiResponse(
        res,
        true,
        {
          lending_record_id: lendingRecord.id,
          message: 'Book returned successfully!',
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
