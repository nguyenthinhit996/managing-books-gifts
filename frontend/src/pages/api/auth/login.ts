import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body as { email: string; password: string }

  const correctEmail = process.env.DASHBOARD_EMAIL
  const correctPassword = process.env.DASHBOARD_PASSWORD

  if (
    !correctEmail ||
    !correctPassword ||
    email !== correctEmail ||
    password !== correctPassword
  ) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })
  }

  return res.status(200).json({
    id: 'hcsc',
    email: correctEmail,
    role: 'manager',
    full_name: 'HCSC',
  })
}
