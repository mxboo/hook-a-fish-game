import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    id: number
    username: string
    email: string
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权访问', message: '请提供有效的认证令牌' })
    }

    const token = authHeader.substring(7)
    const secret = process.env.JWT_SECRET || 'hook-a-fish-secret-key-change-in-production'
    
    const decoded = jwt.verify(token, secret) as any
    req.user = decoded
    
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: '令牌已过期', message: '请重新登录' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: '无效的令牌', message: '认证失败' })
    }
    return res.status(500).json({ error: '认证错误', message: '服务器内部错误' })
  }
}
