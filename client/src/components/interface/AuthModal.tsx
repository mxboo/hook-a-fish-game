import { useState } from 'react'
import { animated, useTransition } from '@react-spring/web'
import { createPortal } from 'react-dom'
import api from '../../api/client'

interface AuthModalProps {
  onClose: () => void
  onAuthSuccess: () => void
}

export default function AuthModal({ onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const transitions = useTransition(isLogin ? ['login'] : ['register'], {
    from: { opacity: 0, transform: 'translateX(20px)' },
    enter: { opacity: 1, transform: 'translateX(0px)' },
    leave: { opacity: 0, transform: 'translateX(-20px)' },
    config: { tension: 300, friction: 20 },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let result
      if (isLogin) {
        result = await api.login(username, password)
      } else {
        result = await api.register(username, password)
      }

      if (result.success) {
        setSuccess(isLogin ? '登录成功！' : '注册成功！')
        setTimeout(() => {
          onAuthSuccess()
        }, 1000)
      } else {
        setError(result.error || result.message || '操作失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 pointer-events-auto shadow-2xl border border-white/20 relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isLogin ? '欢迎回来' : '创建账号'}
          </h2>
          <p className="text-gray-400 text-sm">
            {isLogin ? '登录以保存你的钓鱼记录' : '注册账号开始钓鱼挑战'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
            {success}
          </div>
        )}

        {transitions((style) => (
          <animated.form
            style={style}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-gray-300 text-sm mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="请输入用户名"
                required
                minLength={3}
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="请输入密码"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </animated.form>
        ))}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setSuccess('')
            }}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            {isLogin ? '还没有账号？立即注册' : '已有账号？返回登录'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
