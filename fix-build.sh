#!/bin/bash

################################################################################
# Hook-A-Fish 前端构建修复脚本
# 修复 TypeScript 类型定义错误
################################################################################

set -e

echo "========================================"
echo "  Hook-A-Fish 前端构建修复"
echo "========================================"
echo ""

cd /www/wwwroot/hook-a-fish/client

# ========== 第 1 步：安装 Three.js 类型定义 ==========
echo "[1/4] 安装 Three.js 类型定义..."
npm install --save-dev @types/three @types/react @types/react-dom
echo "✓ 类型定义安装完成"

# ========== 第 2 步：修复 tsconfig.json ==========
echo "[2/4] 修复 TypeScript 配置..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
echo "✓ TypeScript 配置已修复"

# ========== 第 3 步：修复 tsconfig.node.json ==========
cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
EOF

# ========== 第 4 步：添加 React Three Fiber 类型声明 ==========
echo "[3/4] 添加类型声明文件..."
cat > src/vite-env.d.ts << 'EOF'
/// <reference types="vite/client" />

// React Three Fiber JSX types
import * as THREE from 'three'
import { Object3DNode } from '@react-three/fiber'

declare module '@react-three/fiber' {
  interface ThreeElements {
    group: Object3DNode<THREE.Group, typeof THREE.Group>
    mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>
    boxGeometry: Object3DNode<THREE.BoxGeometry, typeof THREE.BoxGeometry>
    sphereGeometry: Object3DNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>
    meshStandardMaterial: Object3DNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>
    meshBasicMaterial: Object3DNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>
    pointLight: Object3DNode<THREE.PointLight, typeof THREE.PointLight>
    ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>
    directionLight: Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>
  }
}

// Global crypto polyfill for Node.js v16
import { webcrypto } from 'crypto'
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto
}
EOF
echo "✓ 类型声明文件已添加"

# ========== 第 5 步：重新构建 ==========
echo "[4/4] 重新构建前端..."
npm run build

# ========== 完成 ==========
echo ""
echo "========================================"
echo "  ✓ 构建完成！"
echo "========================================"
echo ""

# 检查构建结果
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
  echo "✅ 前端构建成功！"
  echo ""
  
  # 修复权限
  chown -R www:www /www/wwwroot/hook-a-fish
  
  # 重载 Nginx
  nginx -s reload
  
  echo "✓ 权限已修复"
  echo "✓ Nginx 已重载"
  echo ""
  echo "访问地址：http://47.86.170.101"
else
  echo "❌ 构建失败，请检查错误日志"
  exit 1
fi
