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
    // Get total materials and available
    const { count: totalMaterials, error: materialsError } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true })

    if (materialsError) {
      console.error('Materials query error:', materialsError)
      return apiError(res, `Database error: ${materialsError.message}`, 500)
    }

    const { data: availableMaterials, error: availableError } = await supabase
      .from('materials')
      .select('quantity_available')

    if (availableError) {
      console.error('Available materials query error:', availableError)
      return apiError(res, `Database error: ${availableError.message}`, 500)
    }

    const totalAvailable = availableMaterials?.reduce(
      (sum, m) => sum + (m.quantity_available || 0),
      0
    ) || 0

    // Get borrowed count
    const { count: borrowedCount, error: borrowedError } = await supabase
      .from('material_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'borrowed')

    if (borrowedError) {
      console.error('Borrowed materials query error:', borrowedError)
      return apiError(res, `Database error: ${borrowedError.message}`, 500)
    }

    // Get overdue count
    const { count: overdueCount, error: overdueError } = await supabase
      .from('material_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')

    if (overdueError) {
      console.error('Overdue materials query error:', overdueError)
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

    // Recent material records
    const { data: recentRecords, error: recentError } = await supabase
      .from('material_records')
      .select(
        `
        *,
        materials(title),
        enrollments(issued_date, students(name))
      `
      )
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('Recent records query error:', recentError)
      return apiError(res, `Database error: ${recentError.message}`, 500)
    }

    return apiResponse(res, true, {
      stats: {
        totalMaterials: totalMaterials || 0,
        availableMaterials: totalAvailable,
        borrowedMaterials: borrowedCount || 0,
        overdueMaterials: overdueCount || 0,
        totalStudents: totalStudents || 0,
      },
      recentRecords,
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return apiError(res, `Server error: ${error.message}`, 500)
  }
}
