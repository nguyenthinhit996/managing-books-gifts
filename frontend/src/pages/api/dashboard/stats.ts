import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabase'
import { apiResponse, apiError } from '@/utils/api-helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return apiError(res, 'Method not allowed', 405)
  }

  try {
    // Get total books and available
    const { count: totalBooks, error: booksError } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })

    if (booksError) {
      console.error('Books query error:', booksError)
      return apiError(res, `Database error: ${booksError.message}`, 500)
    }

    const { data: availableBooks, error: availableError } = await supabase
      .from('books')
      .select('quantity_available')

    if (availableError) {
      console.error('Available books query error:', availableError)
      return apiError(res, `Database error: ${availableError.message}`, 500)
    }

    const totalAvailable = availableBooks?.reduce(
      (sum, b) => sum + (b.quantity_available || 0),
      0
    ) || 0

    // Get borrowed books count
    const { count: borrowedCount, error: borrowedError } = await supabase
      .from('lending_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'borrowed')

    if (borrowedError) {
      console.error('Borrowed books query error:', borrowedError)
      return apiError(res, `Database error: ${borrowedError.message}`, 500)
    }

    // Get overdue books count (simplified - would need better date logic)
    const { count: overdueCount, error: overdueError } = await supabase
      .from('lending_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')

    if (overdueError) {
      console.error('Overdue books query error:', overdueError)
      return apiError(res, `Database error: ${overdueError.message}`, 500)
    }

    // Get total students
    const { count: totalStudents, error: studentsError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    if (studentsError) {
      console.error('Students query error:', studentsError)
      return apiError(res, `Database error: ${studentsError.message}`, 500)
    }

    // Recent lending records
    const { data: recentRecords, error: recentError } = await supabase
      .from('lending_records')
      .select(
        `
        *,
        books(title),
        students(name)
      `
      )
      .order('issued_date', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('Recent records query error:', recentError)
      return apiError(res, `Database error: ${recentError.message}`, 500)
    }

    return apiResponse(res, true, {
      stats: {
        totalBooks: totalBooks || 0,
        availableBooks: totalAvailable,
        borrowedBooks: borrowedCount || 0,
        overdueBooks: overdueCount || 0,
        totalStudents: totalStudents || 0,
      },
      recentRecords,
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return apiError(res, `Server error: ${error.message}`, 500)
  }
}
