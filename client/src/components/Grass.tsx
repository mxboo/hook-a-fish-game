import { Base, Geometry, Subtraction } from '@react-three/csg'
import { GradientTexture, GradientType, Sparkles } from '@react-three/drei'
import { useMemo } from 'react'
import { Euler, Vector3 } from 'three'
import useGame from '../stores/use-game'
import { random, randomAngle } from '../utils/random'
import Bucket from './Bucket'
import type { GrassInstanceProps } from './models/InstancedGrass'
import InstancedGrass from './models/InstancedGrass'
import Tree from './models/Tree'
import Tools from './Tools'

interface TreeInstanceProps {
  position: Vector3
  rotation: Euler
  scale: number
}

export default function Grass() {
  const radius = useGame(state => state.radius)

  const grassInstancesCount = 2000
  const grassInstances: GrassInstanceProps[] = useMemo(
    () =>
      Array.from({ length: grassInstancesCount }).map(() => {
        const r = random(radius + 0.75, radius + 4)
        const angle = randomAngle()
        const position = new Vector3(r * Math.cos(angle), 0.17, r * Math.sin(angle))
        const rotation = new Euler(0, randomAngle(), 0)
        const scale = random(0.001, 0.002)

        return { position, rotation, scale }
      }),
    [radius],
  )

  // 生成 100 棵树，营造森林感觉
  const treeCount = 100
  const treeInstances: TreeInstanceProps[] = useMemo(
    () =>
      Array.from({ length: treeCount }).map(() => {
        const r = random(radius + 2, radius + 6)
        const angle = randomAngle()
        const position = new Vector3(r * Math.cos(angle), 0, r * Math.sin(angle))
        const rotation = new Euler(0, randomAngle(), 0)
        const scale = random(0.35, 0.55)

        return { position, rotation, scale }
      }),
    [radius],
  )

  return (
    <>
      <mesh receiveShadow>
        <meshStandardMaterial>
          <GradientTexture
            stops={[0, 1]}
            colors={['#9BC45E', '#598719']}
            size={512}
            width={512}
            type={GradientType.Radial}
            innerCircleRadius={10}
            outerCircleRadius={100}
          />
        </meshStandardMaterial>
        <Geometry>
          <Base rotation-x={-Math.PI * 0.5}>
            <planeGeometry args={[50, 50]} />
          </Base>
          <Subtraction scale={radius - 0.5}>
            <icosahedronGeometry args={[1, 4]} />
          </Subtraction>
        </Geometry>
      </mesh>

      <InstancedGrass count={grassInstancesCount} instances={grassInstances} />

      {/* 渲染森林 */}
      {treeInstances.map((tree, index) => (
        <Tree
          key={`tree-${index}`}
          scale={tree.scale}
          position={tree.position}
          rotation-y={tree.rotation.y}
        />
      ))}

      <Bucket />
      <Tools />

      <Sparkles size={5} scale={[10, 2, 10]} position-y={1} speed={0.5} count={20} color="white" />
    </>
  )
}
