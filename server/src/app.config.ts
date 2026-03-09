import { monitor } from '@colyseus/monitor'
import { playground } from '@colyseus/playground'
import config from '@colyseus/tools'
import basicAuth from 'express-basic-auth'
import cors from 'cors'
import express from 'express'
import { MyRoom } from './rooms/MyRoom'
import { initializeDatabase, testConnection } from './db/database'
import authRoutes from './routes/auth'
import leaderboardRoutes from './routes/leaderboard'

export default config({
  initializeGameServer: gameServer => {
    gameServer.define('my_room', MyRoom)
  },

  initializeExpress: app => {
    app.use(cors({
      origin: process.env.CLIENT_URL === '*' ? true : (process.env.CLIENT_URL || 'http://localhost:5173'),
      credentials: true,
    }))

    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    if (process.env.NODE_ENV !== 'production') {
      app.use('/', playground())
    }

    app.use(
      '/monitor',
      basicAuth({
        users: { admin: process.env.MONITOR_PASSWORD },
        challenge: true,
      }),
      monitor(),
    )

    app.use('/api/auth', authRoutes)
    app.use('/api/leaderboard', leaderboardRoutes)

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
    })
  },

  beforeListen: async () => {
    console.log('🚀 初始化数据库连接...')
    await testConnection()
    await initializeDatabase()
    console.log('✅ 服务器初始化完成')
  },
})
