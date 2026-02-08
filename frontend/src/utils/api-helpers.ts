import { NextApiRequest, NextApiResponse } from 'next'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function apiResponse<T>(
  res: NextApiResponse,
  success: boolean,
  data?: T,
  error?: string,
  statusCode: number = success ? 200 : 400
) {
  res.status(statusCode).json({
    success,
    data,
    error,
  })
}

export function apiError(
  res: NextApiResponse,
  error: string,
  statusCode: number = 400
) {
  res.status(statusCode).json({
    success: false,
    error,
  })
}

export function validateRequest(
  req: NextApiRequest,
  method: string | string[]
): boolean {
  const methods = Array.isArray(method) ? method : [method]
  return methods.includes(req.method || '')
}
