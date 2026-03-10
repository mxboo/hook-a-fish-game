import { CameraControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Outline } from '@react-three/postprocessing'
import { useDebug } from '../hooks/use-debug'
import { useIsTouch } from '../hooks/use-is-touch'
import Environment from './Environment'
import CameraRig from './helpers/CameraRig'
import Canvas from './helpers/Canvas'
import Helpers from './helpers/Helpers'
import SoundBooard from './helpers/SoundBoard'
import World from './World'
import GameLeaderboard from './interface/GameLeaderboard'
import GameTutorial from './interface/GameTutorial'
import useGame from '../stores/use-game'

export default function Experience() {
  const isTouch = useIsTouch()
  const debug = useDebug()
  const phase = useGame(state => state.phase)
  const isPlaying = phase === 'started' || phase === 'hooked' || phase === 'unhooked'
  const isEnded = phase === 'ended'

  return (
    <>
      {(isPlaying || isEnded) && (
        <>
          <GameTutorial />
          <GameLeaderboard />
        </>
      )}
      
      <Canvas
        gl={{ debug: { checkShaderErrors: debug, onShaderError: console.error } }}
        shadows
        camera={{
          fov: 45,
          near: 0.1,
          far: 100,
          position: [0, 10, 10],
        }}
      >
        <Environment />

        <CameraControls enabled={debug && !isTouch} makeDefault minDistance={1} maxDistance={20} />

        <Physics debug={false} paused={false}>
          <World />
          <Helpers />
        </Physics>

        <SoundBooard />
        <CameraRig />

        {/* 后处理描边效果 */}
        <EffectComposer disableNormalPass>
          <Outline
            threshold={0.5}
            strength={0.3}
            color="#000000"
            blur={0.5}
            opacity={0.8}
            renderToScreen
          />
        </EffectComposer>
      </Canvas>
    </>
  )
}
