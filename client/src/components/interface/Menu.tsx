import { animated, useSpring, useTransition, type UseSpringProps } from '@react-spring/web'
import { Html } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import { useIsTouch } from '../../hooks/use-is-touch'
import useGame from '../../stores/use-game'
import useAuth from '../../stores/use-auth'
import api from '../../api/client'
import { randomInt, randomOneOf } from '../../utils/random'
import { LOST_MESSAGES, WIN_MESSAGES } from '../data/messages'
import AuthModal from './AuthModal'
import GameLeaderboard from './GameLeaderboard'

const getButtonSpringConfig = () =>
  ({
    from: { x: 0, y: 0 },
    to: async next => {
      while (true) {
        await next({
          x: Math.random() * randomInt(5, 8),
          y: Math.random() * randomInt(5, 8),
          velocity: 0,
        })
      }
    },
    config: { damping: 0, frequency: 4 },
  }) as UseSpringProps

export default function Menu() {
  const menu = useGame(state => state.menu)

  const sections = useMemo(() => (menu ? [menu] : []), [menu])
  const transitions = useTransition(sections, {
    from: { scale: 0 },
    enter: { scale: 1 },
    leave: { scale: 0 },
    config: { tension: 120, friction: 14 },
  })

  return (
    <Html center className="menu">
      {transitions((style, item) => {
        //prettier-ignore
        switch (item) {
              case 'main': return <MainMenu style={style} />
              case 'tutorial': return <Tutorial style={style} />
              case 'game-over': return <End style={style} />
            }
      })}
    </Html>
  )
}

const MainMenu = animated(props => {
  const start = useGame(state => state.start)
  const setMenu = useGame(state => state.setMenu)
  const auth = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  const logoSpring = useSpring({
    from: { rotate: -5 },
    to: { rotate: 5 },
    loop: { reverse: true },
    config: { damping: 0, frequency: 3, bounce: 1 },
  })

  const buttonStartSpring = useSpring(getButtonSpringConfig())
  const buttonTutorialSpring = useSpring(getButtonSpringConfig())

  const handleAuthSuccess = () => {
    setShowAuth(false)
    auth.checkAuth()
  }

  const handleStart = () => {
    if (!auth.isAuthenticated) {
      setShowAuth(true)
      return
    }
    start()
  }

  return (
    <div {...props} className="menu-section">
      <h1 className="font-title flex flex-col items-center gap-0 relative">
        <span className="text-7xl leading-8">绝不</span>
        <span className="text-2xl">-</span>
        <span className="text-7xl">空军</span>
        <animated.div
          style={logoSpring}
          className="absolute size-100 -top-[191px] -left-22 rotate-15"
        >
          <span className="absolute left-14 top-33 icon-[mdi--hook] text-[250px] text-white/20" />
        </animated.div>
      </h1>
      
      {auth.isAuthenticated && auth.user && (
        <div className="mb-4 text-center">
          <div className="text-sm text-cyan-400">欢迎，{auth.user.username}!</div>
        </div>
      )}
      
      {/* 未登录时只显示登录按钮 */}
      {!auth.isAuthenticated && (
        <>
          <div className="mb-4 text-center text-yellow-400 text-sm">
            ⚠️ 请先登录后开始游戏
          </div>
          <animated.button 
            onClick={() => setShowAuth(true)} 
            style={buttonStartSpring}
          >
            <span className="icon-[solar--login-bold]" />
            <span>登录/注册</span>
          </animated.button>
        </>
      )}
      
      {/* 登录后显示开始游戏和登出按钮，隐藏玩法按钮 */}
      {auth.isAuthenticated && (
        <>
          <animated.button onClick={handleStart} style={buttonStartSpring}>
            <span className="icon-[solar--play-bold]" />
            <span>开始游戏</span>
          </animated.button>
          
          <animated.button 
            onClick={() => auth.logout()} 
            style={buttonTutorialSpring}
            className="backdrop-blur-sm"
          >
            <span className="icon-[solar--logout-bold]" />
            <span>登出</span>
          </animated.button>
        </>
      )}
      
      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)} 
          onAuthSuccess={handleAuthSuccess} 
        />
      )}
    </div>
  )
})

const Tutorial = animated(props => {
  const isTouch = useIsTouch()
  const setMenu = useGame(state => state.setMenu)

  const buttonBackSpring = useSpring(getButtonSpringConfig())

  return (
    <div {...props} className="menu-section text-2xl md:text-3xl text-center px-5 gap-2">
      <span className="icon-[mdi--hook] text-4xl md:text-5xl" />
      <p className="mb-5 md:mb-10">
        用你的{' '}
        <span className="font-extrabold">{isTouch ? '手指' : '鼠标'}</span> 控制鱼竿，
        <br className="max-md:hidden" />
        瞄准鱼嘴，在它们跳跃时钓起它们
      </p>
      <span className="icon-[mdi--bucket] text-4xl md:text-5xl" />
      <p className="mb-5 md:mb-10">
        <span className="font-extrabold">钓到鱼后</span>，<br />
        把鱼放进你的桶里
      </p>
      <span className="icon-[solar--clock-circle-bold] text-4xl md:text-5xl" />
      <p className="mb-5 md:mb-10">
        尽可能快地钓到它们！<br />
        每条鱼都会给你<span className="font-extrabold">额外时间奖励</span>
      </p>
      <animated.button style={buttonBackSpring} onClick={() => setMenu('main')} className="sm">
        <span className="icon-[solar--alt-arrow-left-linear]" /> <span>返回</span>
      </animated.button>
      {/* <p className="text-2xl mt-5 animate-pulse uppercase font-extrabold">
        Power-ups are coming soon!
        <br />
        Stay tuned!
      </p> */}
    </div>
  )
})

const End = animated(props => {
  const start = useGame(state => state.start)
  const lastScore = useGame(state => state.lastScore)
  const lastPhoto = useGame(state => state.lastPhoto)
  const auth = useAuth()

  const win = useMemo(() => !!lastScore, [lastScore])
  const winMessage = useMemo(() => randomOneOf(WIN_MESSAGES), [])
  const lostMessage = useMemo(() => randomOneOf(LOST_MESSAGES), [])
  const [scoreSubmitted, setScoreSubmitted] = useState(false)

  const submitScore = async () => {
    if (!auth.isAuthenticated || !lastScore) return
    
    const duration = 60
    try {
      const result = await api.submitScore(lastScore, lastScore, duration)
      if (result.success) {
        setScoreSubmitted(true)
        console.log('分数已提交:', result.data)
      }
    } catch (error) {
      console.error('分数提交失败:', error)
    }
  }

  // 使用 useEffect 来执行副作用
  useEffect(() => {
    if (win && auth.isAuthenticated && !scoreSubmitted && lastScore) {
      submitScore()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win, auth.isAuthenticated, scoreSubmitted, lastScore])

  const share = async () => {
    const filename = `${Date.now()}_hook-a-fish_${lastScore}.png`
    const res = await fetch(lastPhoto!)
    const blob = await res.blob()
    const file = new File([blob], filename, { type: 'image/png' })

    const toShare = {
      files: [file],
      text: `${winMessage}
      
我刚刚在钓鱼去游戏中钓到了 ${lastScore} 条鱼！
你能打破我的记录吗？

🎣 https://hook-a-fish.dammafra.dev

#hookafish #indiegame #indiedev #fishinggame #webgame #threejs`,
    }

    if (navigator.canShare(toShare)) {
      await navigator.share(toShare)
    } else {
      const link = document.createElement('a')
      link.href = lastPhoto!
      link.download = filename
      link.click()
    }
  }

  const imgSprings = useSpring({
    from: { transform: 'scale(0) rotate(0deg)' },
    to: { transform: 'scale(1) rotate(355deg)' },
    config: { tension: 120, friction: 14 },
  })

  const buttonBackSpring = useSpring(getButtonSpringConfig())
  const buttonShareSpring = useSpring(getButtonSpringConfig())

  return (
    <div {...props} className="menu-section">
      <p className="font-title text-6xl">游戏结束</p>
      {win ? (
        <>
          <p className="text-4xl uppercase -mt-4">钓到 {lastScore} 条鱼</p>
          
          {auth.isAuthenticated && (
            <div className="text-center mt-2">
              {scoreSubmitted ? (
                <p className="text-green-400 text-sm">✅ 分数已保存到排行榜</p>
              ) : (
                <p className="text-yellow-400 text-sm">⏳ 正在提交分数...</p>
              )}
            </div>
          )}
          
          <animated.div className="relative" style={imgSprings}>
            <img
              src={lastPhoto}
              className="w-64 md:w-80 border-15 border-b-80 md:border-20 md:border-b-110 border-white"
            />
            <p className="text-shadow-none absolute h-16 md:h-20 inline-flex items-center justify-center top-62 md:top-78 w-full text-2xl md:text-3xl text-black text-center">
              {winMessage}
            </p>
          </animated.div>
        </>
      ) : (
        <p className="text-3xl md:text-5xl text-center">{lostMessage}</p>
      )}

      <div className="flex max-md:flex-col gap-4 mt-4">
        <animated.button style={buttonBackSpring} onClick={start} className="backdrop-blur-sm">
          <span className="icon-[stash--arrow-retry] -scale-x-100" />
          <span>再来一次</span>
        </animated.button>

        {win && (
          <animated.button style={buttonShareSpring} onClick={share} className="backdrop-blur-sm">
            <span className="icon-[solar--share-bold]" />
            <span>分享</span>
          </animated.button>
        )}
      </div>
      
      {win && !auth.isAuthenticated && (
        <div className="mt-4 text-center text-sm text-gray-400">
          登录以保存分数并参与排行榜竞争
        </div>
      )}
    </div>
  )
})
