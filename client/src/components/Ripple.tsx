import { useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import { RingGeometry, Vector3 } from 'three'

interface RippleProps {
  position: Vector3
  onFadeOut?: () => void
}

export default function Ripple({ position, onFadeOut }: RippleProps) {
  const meshRef = useRef<any>(null)
  const opacity = useRef(1)
  const scale = useRef(1)
  
  const geometry = useMemo(() => {
    const geo = new RingGeometry(0.1, 0.15, 32)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    
    // 涟漪扩散
    scale.current += delta * 0.5
    meshRef.current.scale.set(scale.current, scale.current, scale.current)
    
    // 透明度衰减
    opacity.current -= delta * 0.8
    meshRef.current.material.opacity = opacity.current
    
    // 完全透明后移除
    if (opacity.current <= 0) {
      onFadeOut?.()
    }
  })

  return (
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <meshBasicMaterial
        color="white"
        transparent
        opacity={0.3}
        side={2}
        depthWrite={false}
      />
    </mesh>
  )
}
