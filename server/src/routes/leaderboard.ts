import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { db } from '../db/database'

const router = Router()

// 获取排行榜（前 100 名）
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000)
    const leaderboard = await db.getLeaderboard(limit)

    res.json({
      success: true,
      data: {
        leaderboard,
        total: Array.isArray(leaderboard) ? leaderboard.length : 0,
      },
    })
  } catch (error: any) {
    console.error('获取排行榜失败:', error)
    res.status(500).json({ 
      error: '获取排行榜失败', 
      message: error.message || '服务器内部错误' 
    })
  }
})

// 提交分数（需要登录）
router.post('/score', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { score, fish_count, duration } = req.body
    const userId = req.user!.id

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ 
        error: '无效的分数', 
        message: '分数必须是正整数' 
      })
    }

    await db.createScore(userId, score, fish_count || 0, duration || 0)

    const bestScore = await db.getUserBestScore(userId)
    const rank = await db.getUserRank(userId)

    res.json({
      success: true,
      message: '分数已提交',
      data: {
        score,
        fish_count,
        duration,
        best_score: bestScore?.best_score || score,
        total_games: bestScore?.total_games || 1,
        rank: rank || 0,
      },
    })
  } catch (error: any) {
    console.error('提交分数失败:', error)
    res.status(500).json({ 
      error: '提交分数失败', 
      message: error.message || '服务器内部错误' 
    })
  }
})

// 获取我的分数（需要登录）
router.get('/my-scores', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100)
    
    const scores = await db.getUserScores(userId, limit)
    const bestScore = await db.getUserBestScore(userId)
    const rank = await db.getUserRank(userId)

    res.json({
      success: true,
      data: {
        scores,
        best_score: bestScore?.best_score || 0,
        total_games: bestScore?.total_games || 0,
        rank: rank || 0,
      },
    })
  } catch (error: any) {
    console.error('获取我的分数失败:', error)
    res.status(500).json({ 
      error: '获取分数失败', 
      message: error.message || '服务器内部错误' 
    })
  }
})

// 获取我的排名（需要登录）
router.get('/my-rank', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const rank = await db.getUserRank(userId)
    const bestScore = await db.getUserBestScore(userId)

    res.json({
      success: true,
      data: {
        rank: rank || 0,
        best_score: bestScore?.best_score || 0,
        total_games: bestScore?.total_games || 0,
      },
    })
  } catch (error: any) {
    console.error('获取排名失败:', error)
    res.status(500).json({ 
      error: '获取排名失败', 
      message: error.message || '服务器内部错误' 
    })
  }
})

export default router
