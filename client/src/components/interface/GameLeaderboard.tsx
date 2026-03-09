import { useState, useEffect } from 'react'
import { animated } from '@react-spring/web'
import { createPortal } from 'react-dom'
import api from '../../api/client'

interface ScoreEntry {
  id: number
  user_id: number
  username: string
  score: number
  fish_count: number
  duration: number
  created_at: string
}

export default function GameLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
    const interval = setInterval(loadLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadLeaderboard = async () => {
    const result = await api.getLeaderboard(5)
    if (result.success && result.data) {
      setLeaderboard(result.data.leaderboard)
    }
    setLoading(false)
  }

  const getRankIcon = (index: number) => {
    const icons = ['🥇', '🥈', '🥉', '🏅', '🏅']
    return icons[index] || `#${index + 1}`
  }

  return createPortal(
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40">
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 min-w-[260px] border border-white/5 shadow-2xl">
        <div className="text-xl font-bold text-white mb-3 text-center">🏆 排行榜</div>
        
        {loading ? (
          <div className="text-center text-gray-400 py-4 text-sm">加载中...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center text-gray-400 py-4 text-sm">暂无记录</div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <animated.div
                key={entry.id}
                className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                    : index === 1
                    ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30'
                    : index === 2
                    ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30'
                    : 'bg-white/5'
                }`}
              >
                <span className="text-xl w-8 text-center">{getRankIcon(index)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-xs truncate">{entry.username}</div>
                  <div className="text-xs text-gray-400">{entry.fish_count}条鱼</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-cyan-400">{entry.score}</div>
                </div>
              </animated.div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
