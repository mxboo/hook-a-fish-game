import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db/database'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'hook-a-fish-secret-key-change-in-production'
const JWT_EXPIRES_IN = '30d'

// 用户注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ 
        error: '输入不完整', 
        message: '请提供用户名和密码' 
      })
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ 
        error: '用户名格式错误', 
        message: '用户名长度必须在 3-20 个字符之间' 
      })
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: '密码格式错误', 
        message: '密码长度必须至少 6 个字符' 
      })
    }

    const existingUser = await db.findUserByUsername(username)
    if (existingUser) {
      return res.status(409).json({ 
        error: '用户名已存在', 
        message: '该用户名已被注册，请选择其他用户名' 
      })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    await db.createUser(username, `${username}@local.dev`, passwordHash)

    const user = await db.findUserByUsername(username)

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      },
    })
  } catch (error: any) {
    console.error('注册错误:', error)
    res.status(500).json({ 
      error: '注册失败', 
      message: error.message || '服务器内部错误' 
    })
  }
})

// 用户登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ 
        error: '输入不完整', 
        message: '请提供用户名和密码' 
      })
    }

    const user = await db.findUserByUsername(username)
    if (!user) {
      return res.status(401).json({ 
        error: '登录失败', 
        message: '用户名或密码错误' 
      })
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: '登录失败', 
        message: '用户名或密码错误' 
      })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      },
    })
  } catch (error: any) {
    console.error('登录错误:', error)
    res.status(500).json({ 
      error: '登录失败', 
      message: error.message || '服务器内部错误' 
    })
  }
})

// 获取当前用户信息
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权访问' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    const user = await db.findUserById(decoded.id)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    res.json({
      success: true,
      data: { user },
    })
  } catch (error: any) {
    res.status(401).json({ 
      error: '认证失败', 
      message: error.message || '无效的令牌' 
    })
  }
})

export default router
