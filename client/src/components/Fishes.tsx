import { Center } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  BallCollider,
  RapierRigidBody,
  RigidBody,
  type CollisionEnterPayload,
  type RigidBodyTypeString,
} from '@react-three/rapier'
import { useMemo, useRef, useState } from 'react'
import { Euler, Quaternion, Vector3 } from 'three'
import useGame from '../stores/use-game'
import { random, randomAngle, randomColor } from '../utils/random'
import FishModel from './models/Fish2'
import Ripple from './Ripple'

interface FishProps {
  id: string
}

export function Fish({ id }: FishProps) {
  const radius = useGame(state => state.radius)
  const phase = useGame(state => state.phase)
  const hook = useGame(state => state.hook)
  const unhook = useGame(state => state.unhook)
  const lastHooked = useGame(state => state.lastHooked)
  const bucketPosition = useGame(state => state.bucketPosition)
  const paused = useGame(state => state.paused)

  const bodyRadius = 0.25
  const targetRadius = 0.075
  const targetOffsetY = -0.2
  const targetOffsetZ = 0.1
  const colorA = useMemo(randomColor, [])
  const colorB = useMemo(randomColor, [])
  const colorC = useMemo(randomColor, [])

  const position = useMemo(
    () =>
      new Vector3(
        random(-0.5 * radius, 0.5 * radius),
        random(-1, -0.5),
        random(-0.5 * radius, 0.5 * radius),
      ),
    [radius],
  )
  const rotation = useMemo(() => new Euler(0, randomAngle(), 0), [])

  const moveFrequency = useMemo(() => random(1, 3), [])
  const lastMove = useRef(0)

  const floatFrequency = useMemo(() => random(1, 3), [])
  const lastFloat = useRef(0)
  const lastRippleTime = useRef(0)

  const body = useRef<RapierRigidBody>(null!)
  const [bodyType, setBodyType] = useState<RigidBodyTypeString>('kinematicPosition')
  const [hookBody, setHookBody] = useState<RapierRigidBody>()
  const [showRipple, setShowRipple] = useState(false)
  const [ripplePosition, setRipplePosition] = useState<Vector3>(new Vector3())

  const onCollisionEnter = ({ other }: CollisionEnterPayload) => {
    // @ts-expect-error `userData` is of type `Record<string, any>`
    if (phase !== 'hooked' && other.rigidBody?.userData.name === 'hook') {
      setHookBody(other.rigidBody)
      hook(id)
    }
  }

  useFrame(({ clock }, delta) => {
    if (phase === 'ended' || !bucketPosition || !body.current) return

    const now = clock.elapsedTime
    const currentPosition = body.current.translation()

    // Emerge on start
    if (bodyType === 'kinematicPosition') {
      if (currentPosition.y >= 0) {
        setBodyType('dynamic')
        // 产生涟漪
        if (now - lastRippleTime.current > 0.5) {
          setRipplePosition(new Vector3(currentPosition.x, 0.02, currentPosition.z))
          setShowRipple(true)
          lastRippleTime.current = now
        }
        return
      }

      currentPosition.y += delta
      body.current.setTranslation(currentPosition, false)
      return
    }

    // Stay in bucket
    if (id === lastHooked) {
      const position = bucketPosition.clone()
      position.y = 0.5
      body.current.setTranslation(position, false)
      body.current.setRotation(new Quaternion(), false)
      return
    }

    // Follow hook
    if (hookBody) {
      body.current.setBodyType(2, false)
      body.current.setLinvel(new Vector3(), false)
      body.current.setAngvel(new Vector3(), false)

      const { x, y, z } = hookBody.translation()
      const position = new Vector3(x, y - targetRadius + targetOffsetY, z - targetOffsetZ)
      body.current.setTranslation(position, false)
      body.current.setRotation(new Quaternion(), false)

      if (position.distanceTo(bucketPosition) < 0.8) unhook(id)
      return
    }

    if (paused) return

    // 检测鱼是否接触水面，产生涟漪
    if (currentPosition.y > -0.1 && currentPosition.y < 0.1) {
      if (now - lastRippleTime.current > 1.0) { // 每 1 秒最多产生一次涟漪
        setRipplePosition(new Vector3(currentPosition.x, 0.02, currentPosition.z))
        setShowRipple(true)
        lastRippleTime.current = now
      }
    }

    // Move
    const impulse = new Vector3()

    if (now - lastFloat.current >= floatFrequency) {
      impulse.y = 0.1
      lastFloat.current = now
    }

    if (now - lastMove.current >= moveFrequency) {
      impulse.x = random(-0.1, 0.1)
      impulse.z = random(-0.1, 0.1)
      lastMove.current = now
    }

    body.current.applyImpulse(impulse, true)
  })

  return (
    <>
      {showRipple && (
        <Ripple
          position={ripplePosition}
          onFadeOut={() => setShowRipple(false)}
        />
      )}
      <RigidBody
        type={bodyType}
        ref={body}
        position={position}
        rotation={rotation}
        colliders={false}
        enabledRotations={[false, true, false]}
        gravityScale={0.5}
        friction={0.2}
        restitution={0.2}
        angularDamping={0.5}
      >
        <Center rotation-x={-Math.PI * 0.5} scale={1.5}>
          <FishModel colorA={colorA} colorB={colorB} colorC={colorC} />
        </Center>
        {!hookBody && (
          <>
            <BallCollider args={[bodyRadius]} />
            <BallCollider
              args={[targetRadius]}
              position={[0, bodyRadius, targetOffsetZ]}
              onCollisionEnter={onCollisionEnter}
            />
          </>
        )}
      </RigidBody>
    </>
  )
}

export default function Fishes() {
  const fishes = useGame(state => state.fishes)
  return fishes.map(id => <Fish key={`fish-${id}`} id={id} />)
}
