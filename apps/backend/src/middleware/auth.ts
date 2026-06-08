import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/db'

export interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string; persona: string }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing or invalid authorization header' })

  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, persona: true },
    })
    if (!user) return res.status(401).json({ error: 'User not found' })
    req.user = user
    next()
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError)
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
    return res.status(401).json({ error: 'Invalid token' })
  }
}
