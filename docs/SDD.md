# Hook-A-Fish 钓鱼去！- 软件设计文档 (SDD)

> 基于实际项目代码编写的软件设计文档  
> 版本：1.0  
> 最后更新：2026-03-10

---

## 📋 目录

1. [游戏概述](#1-游戏概述)
2. [玩法设计](#2-玩法设计)
3. [技术选型](#3-技术选型)
4. [项目结构](#4-项目结构)
5. [系统架构](#5-系统架构)
6. [核心模块设计](#6-核心模块设计)
7. [美术资源映射](#7-美术资源映射)
8. [数据设计](#8-数据设计)
9. [UI/UX 设计](#9-ux 设计)
10. [部署配置](#10-部署配置)

---

## 1. 游戏概述

### 1.1 游戏名称
- **中文**：钓鱼去！
- **英文**：Hook-A-Fish!

### 1.2 游戏类型
3D 休闲钓鱼挑战游戏

### 1.3 游戏简介
灵感来自童年回忆的限时钓鱼挑战游戏。玩家需要在 60 秒内使用鱼竿钓起尽可能多的鱼，并将鱼放入桶中。

### 1.4 核心玩法循环
```
瞄准鱼嘴 → 钩住鱼 → 放入桶中 → 获得时间奖励 → 继续钓鱼
```

### 1.5 游戏特色
- ⏱️ 60 秒限时挑战
- 🎯 精准瞄准鱼嘴
- 🐟 动态鱼类生成系统
- 📸 游戏结束拍照分享
- 🏆 在线排行榜
- 🔐 用户登录/注册系统

---

## 2. 玩法设计

### 2.1 游戏流程

#### 2.1.1 游戏阶段 (GamePhase)
```typescript
type GamePhase = 
  | 'ready'      // 准备阶段（主菜单）
  | 'started'    // 游戏进行中
  | 'hooked'     // 鱼已上钩
  | 'unhooked'   // 鱼已放入桶中
  | 'ended'      // 游戏结束
```

#### 2.1.2 游戏流程
```
主菜单 → 登录 → 开始游戏 → 60 秒倒计时 → 钓鱼 → 时间到 → 结算 → 排行榜
```

### 2.2 核心机制

#### 2.2.1 钓鱼机制
- **鱼竿控制**：鼠标/触摸控制鱼竿方向和角度
- **鱼钩物理**：使用 Rapier 物理引擎模拟鱼钩重力和摆动
- **碰撞检测**：鱼嘴碰撞区域检测（targetRadius: 0.075）
- **钓鱼流程**：
  1. 鱼钩接触鱼嘴触发 `onCollisionEnter`
  2. 调用 `hook(id)` 改变游戏状态为 `hooked`
  3. 鱼跟随鱼钩移动
  4. 鱼距离桶 < 0.8 时触发 `unhook(id)`
  5. 鱼放入桶中，分数 +1，时间 +3 秒

#### 2.2.2 鱼类生成机制
```typescript
// 初始生成 20 条鱼
total: 20
fishes: string[] // 鱼 ID 数组

// 动态生成逻辑
const spawnThreshold = Math.max(state.total / 2, 2) // 10 条
const remaining = fishes.length

if (remaining <= spawnThreshold) {
  const toSpawn = randomInt(remaining === 2 ? 1 : 0, 5)
  const newFishes = Array.from({ length: toSpawn }, generateId)
  fishes = [...fishes, ...newFishes]
}
```

#### 2.2.3 时间系统
- **初始时间**：60 秒
- **成功奖励**：每条鱼 +3 秒
- **时间警告**：≤10 秒时显示红色警报
- **时间到**：触发 `end()` 进入结算界面

### 2.3 计分规则
- **基础分**：每条鱼 = 1 分
- **时间奖励**：每条鱼 +3 秒（间接增加得分机会）
- **最终得分**：钓到的鱼总数

### 2.4 菜单系统 (MenuSection)
```typescript
type MenuSection = 
  | 'main'       // 主菜单
  | 'tutorial'   // 玩法说明
  | 'credits'    // 制作人员
  | 'game-over'  // 结算界面
  | 'pause'      // 暂停菜单
```

---

## 3. 技术选型

### 3.1 前端技术栈

#### 3.1.1 核心框架
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.1.1 | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 7.1.2 | 构建工具 |

#### 3.1.2 3D 渲染
| 技术 | 版本 | 用途 |
|------|------|------|
| Three.js | 0.179.1 | 3D 引擎 |
| @react-three/fiber | 9.3.0 | React Three.js 渲染器 |
| @react-three/drei | 10.7.2 | Three.js 辅助工具 |
| @react-three/rapier | 2.1.0 | 物理引擎 |

#### 3.1.3 动画
| 技术 | 版本 | 用途 |
|------|------|------|
| @react-spring/three | 10.0.1 | 3D 动画 |
| @react-spring/web | 10.0.1 | Web 动画 |

#### 3.1.4 状态管理
| 技术 | 版本 | 用途 |
|------|------|------|
| Zustand | 5.0.7 | 全局状态管理 |

#### 3.1.5 UI 样式
| 技术 | 版本 | 用途 |
|------|------|------|
| Tailwind CSS | 4.1.12 | CSS 框架 |
| @iconify/json | 2.2.376 | 图标库 |

#### 3.1.6 音频
| 技术 | 版本 | 用途 |
|------|------|------|
| use-sound | 5.0.0 | 音效管理 |
| howler | (隐式依赖) | 音频播放 |

#### 3.1.7 多人游戏（预留）
| 技术 | 版本 | 用途 |
|------|------|------|
| colyseus.js | 0.16.19 | 多人游戏客户端 |

#### 3.1.8 PWA
| 技术 | 版本 | 用途 |
|------|------|------|
| vite-plugin-pwa | 1.0.3 | 渐进式 Web 应用 |

### 3.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 16.x | 运行时 |
| Express | 5.1.0 | Web 框架 |
| TypeScript | 5.x | 类型系统 |
| Colyseus | 0.16.4 | 多人游戏服务器 |
| MySQL | 8.x | 数据库 |
| mysql2 | 3.19.1 | MySQL 驱动 |
| bcryptjs | 3.0.3 | 密码加密 |
| jsonwebtoken | 9.0.3 | JWT 认证 |
| CORS | 2.8.6 | 跨域支持 |

### 3.3 开发工具

| 工具 | 用途 |
|------|------|
| Leva | 调试面板 |
| r3f-perf | 性能监控 |
| ESLint | 代码检查 |
| Prettier | 代码格式化 |

---

## 4. 项目结构

### 4.1 根目录结构
```
hook-a-fish/
├── client/                 # 前端项目
├── server/                 # 后端项目
├── docs/                   # 文档
├── auto-deploy.sh          # 自动部署脚本
├── deploy.sh               # 部署脚本
├── fix-build.sh            # 构建修复脚本
├── package.json            # 根配置
└── tsconfig.json           # TypeScript 配置
```

### 4.2 前端目录结构
```
client/
├── public/                 # 静态资源
│   ├── cursors/           # 鼠标指针图标
│   │   ├── auto.png
│   │   ├── grab.png
│   │   ├── grabbing.png
│   │   └── pointer.png
│   ├── favicon/           # 网站图标
│   ├── models/            # 3D 模型
│   │   ├── bucket.glb     # 鱼桶模型
│   │   ├── fish.glb       # 鱼模型
│   │   ├── fishing-hook.glb  # 鱼钩模型
│   │   ├── fishing-pole.glb  # 鱼竿模型
│   │   ├── grass.glb      # 草模型
│   │   ├── stand.glb      # 支架模型
│   │   └── tree.glb       # 树模型
│   ├── bmc.png            # 封面图
│   └── cover.png          # 分享封面
├── src/                   # 源代码
│   ├── api/               # API 客户端
│   │   └── client.ts      # API 封装
│   ├── components/        # React 组件
│   │   ├── data/          # 数据
│   │   │   └── messages.ts  # 游戏消息文本
│   │   ├── helpers/       # 辅助组件
│   │   │   ├── CameraRig.tsx    # 相机控制
│   │   │   ├── Canvas.tsx       # Canvas 封装
│   │   │   ├── Helpers.tsx      # 调试工具
│   │   │   ├── PhotoCamera.tsx  # 拍照功能
│   │   │   ├── PointerControls.tsx # 指针控制
│   │   │   ├── RayToFloor.tsx   # 射线检测
│   │   │   └── SoundBoard.tsx   # 音效管理
│   │   ├── interface/     # UI 界面
│   │   │   ├── AuthModal.tsx     # 登录弹窗
│   │   │   ├── BonusTime.tsx     # 奖励时间显示
│   │   │   ├── Countdown.tsx     # 倒计时
│   │   │   ├── FlipButton.tsx    # 翻转按钮
│   │   │   ├── GameLeaderboard.tsx # 排行榜
│   │   │   ├── GameTutorial.tsx  # 玩法说明
│   │   │   ├── Menu.tsx          # 主菜单
│   │   │   ├── MuteButton.tsx    # 静音按钮
│   │   │   ├── PauseButton.tsx   # 暂停按钮
│   │   │   └── Score.tsx         # 分数显示
│   │   ├── models/        # 3D 模型组件
│   │   │   ├── Bucket.tsx        # 鱼桶
│   │   │   ├── Fish.tsx          # 鱼
│   │   │   ├── FishingHook.tsx   # 鱼钩
│   │   │   ├── FishingPole.tsx   # 鱼竿
│   │   │   ├── InstancedGrass.tsx # 实例化草
│   │   │   ├── Stand.tsx         # 支架
│   │   │   └── Tree.tsx          # 树
│   │   ├── Bucket.tsx     # 鱼桶容器
│   │   ├── Controller.tsx # 输入控制
│   │   ├── Environment.tsx # 环境
│   │   ├── Experience.tsx # 主场景
│   │   ├── Fishes.tsx     # 鱼群
│   │   ├── FishingRod.tsx # 鱼竿
│   │   ├── Grass.tsx      # 草地
│   │   ├── Rope.tsx       # 鱼线
│   │   ├── Target.tsx     # 目标
│   │   ├── Tools.tsx      # 工具
│   │   ├── Water.tsx      # 水面
│   │   └── World.tsx      # 游戏世界
│   ├── hooks/             # 自定义 Hooks
│   │   ├── use-debug.tsx       # 调试模式
│   │   ├── use-hide-on-resize.ts # 窗口大小变化
│   │   └── use-is-touch.tsx    # 触摸设备检测
│   ├── i18n/              # 国际化
│   │   └── zh-CN.ts       # 中文翻译
│   ├── stores/            # Zustand 状态管理
│   │   ├── use-auth.tsx   # 认证状态
│   │   ├── use-colyseus.tsx # 多人游戏状态
│   │   ├── use-game.tsx   # 游戏状态
│   │   └── use-sound-board.tsx # 音效状态
│   ├── utils/             # 工具函数
│   │   ├── position.ts    # 位置解析
│   │   ├── random.ts      # 随机数生成
│   │   └── rotation.ts    # 旋转解析
│   ├── App.tsx            # 应用入口
│   ├── main.tsx           # React 入口
│   └── vite-env.d.ts      # Vite 类型声明
├── index.html             # HTML 模板
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript 配置
├── tsconfig.app.json      # 应用 TS 配置
├── tsconfig.node.json     # Node TS 配置
└── vite.config.ts         # Vite 配置
```

### 4.3 后端目录结构
```
server/
├── src/
│   ├── db/
│   │   └── database.ts    # 数据库配置
│   ├── middleware/
│   │   └── auth.ts        # 认证中间件
│   ├── routes/
│   │   ├── auth.ts        # 认证路由
│   │   └── leaderboard.ts # 排行榜路由
│   └── index.ts           # 服务器入口
├── dist/                  # 编译输出
├── package.json           # 依赖配置
└── tsconfig.json          # TypeScript 配置
```

---

## 5. 系统架构

### 5.1 整体架构
```
┌─────────────────────────────────────────┐
│            用户浏览器                    │
│  ┌─────────────────────────────────┐   │
│  │      React + Three.js 前端       │   │
│  │  - 3D 渲染 (Fiber)               │   │
│  │  - 物理模拟 (Rapier)             │   │
│  │  - 状态管理 (Zustand)            │   │
│  └─────────────┬───────────────────┘   │
└────────────────┼───────────────────────┘
                 │ HTTP/WebSocket
                 ▼
┌─────────────────────────────────────────┐
│         Nginx 反向代理                   │
│  - 静态文件：/www/wwwroot/.../dist      │
│  - API 代理：/api → localhost:3001      │
│  - WebSocket: /ws → localhost:3001      │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Node.js 后端 (Express)           │
│  - 用户认证 (JWT)                        │
│  - 排行榜 API                            │
│  - 数据库操作 (MySQL)                    │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│            MySQL 数据库                  │
│  - users 表 (用户)                       │
│  - scores 表 (分数)                      │
└─────────────────────────────────────────┘
```

### 5.2 前端架构
```
┌─────────────────────────────────────────┐
│           App.tsx                        │
│           └─ Experience.tsx              │
│              ├─ Canvas (R3F)             │
│              │  ├─ Environment           │
│              │  ├─ World                 │
│              │  │  ├─ Menu               │
│              │  │  ├─ Countdown          │
│              │  │  ├─ Controller         │
│              │  │  ├─ Fishes             │
│              │  │  ├─ Water              │
│              │  │  └─ Grass              │
│              │  ├─ Helpers               │
│              │  └─ CameraRig             │
│              └─ UI Portal                │
│                 ├─ GameTutorial          │
│                 └─ GameLeaderboard       │
└─────────────────────────────────────────┘
```

### 5.3 状态管理架构 (Zustand)
```
┌─────────────────────────────────────────┐
│              useGame Store              │
│  - phase: GamePhase                     │
│  - score: number                        │
│  - fishes: string[]                     │
│  - start/hook/unhook/end                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│             useAuth Store               │
│  - user: User | null                    │
│  - token: string | null                 │
│  - isAuthenticated: boolean             │
│  - login/register/logout                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           useSoundBoard Store           │
│  - sounds: { tick: Howl, ... }          │
│  - load/play/stop                       │
└─────────────────────────────────────────┘
```

---

## 6. 核心模块设计

### 6.1 游戏状态模块 (use-game.tsx)

#### 6.1.1 状态定义
```typescript
interface GameStore {
  // 游戏配置
  startedAt: number        // 游戏开始时间戳
  radius: number           // 游戏区域半径 (3.5)
  total: number            // 初始鱼数量 (20)
  
  // 游戏状态
  phase: GamePhase         // 游戏阶段
  score: number            // 当前分数
  fishes: string[]         // 鱼 ID 数组
  lastHooked?: string      // 最后钓到的鱼 ID
  
  // 拍照功能
  photo?: string           // 当前照片
  lastPhoto?: string       // 最后一张照片
  
  // 位置信息
  bucketPosition?: Vector3 // 鱼桶位置
  toolsPosition?: Vector3  // 工具位置
  
  // 控制状态
  paused: boolean          // 是否暂停
  menu?: MenuSection       // 当前菜单
  
  // 操作方法
  start: () => void        // 开始游戏
  hook: (fish: string) => void    // 钩住鱼
  unhook: (fish: string) => void  // 放入桶中
  end: () => void          // 结束游戏
  pause: () => void        // 暂停
  resume: () => void       // 恢复
}
```

#### 6.1.2 状态流转
```
ready → started → hooked → unhooked → (循环) → ended
  ↑        ↑         ↑          ↑           ↑
  └────────┴─────────┴──────────┴───────────┘
              菜单操作/时间到
```

### 6.2 钓鱼竿模块 (FishingRod.tsx)

#### 6.2.1 组件结构
```tsx
<FishingRod>
  <RigidBody type="kinematicPosition">
    <CuboidCollider />
    <FishingPole />
  </RigidBody>
  
  <RigidBody 
    gravityScale={5/15}
    onCollisionEnter={onHook}
  >
    <FishingHook />
  </RigidBody>
  
  <Rope start={pole} end={hook} />
</FishingRod>
```

#### 6.2.2 物理参数
| 参数 | 值 | 说明 |
|------|-----|------|
| poleColliderArgs | [0.3, 1, 0.1] | 鱼竿碰撞体尺寸 |
| ropeLength | 1.5 | 鱼线长度 |
| ropeRadius | 0.005 | 鱼线半径 |
| gravityScale | 5/15 | 鱼钩重力 (钓鱼时 15) |
| linearDamping | 2 | 线性阻尼 |
| angularDamping | 8 | 角阻尼 |

### 6.3 鱼类模块 (Fishes.tsx)

#### 6.3.1 鱼的行为状态
```typescript
// 1. 入场动画 (kinematicPosition)
if (bodyType === 'kinematicPosition') {
  position.y += delta  // 从水下升起
}

// 2. 在桶中 (lastHooked)
if (id === lastHooked) {
  position = bucketPosition
}

// 3. 跟随鱼钩 (hookBody)
if (hookBody) {
  position = hookBody.position - offset
  if (distance(bucket) < 0.8) unhook(id)
}

// 4. 自由游动 (dynamic)
impulse.y = 0.1  // 浮动
impulse.x/z = random(-0.1, 0.1)  // 随机移动
```

#### 6.3.2 鱼的物理参数
| 参数 | 值 | 说明 |
|------|-----|------|
| bodyRadius | 0.25 | 鱼身体碰撞半径 |
| targetRadius | 0.075 | 鱼嘴碰撞半径 |
| targetOffsetY | -0.2 | 鱼嘴 Y 轴偏移 |
| targetOffsetZ | 0.1 | 鱼嘴 Z 轴偏移 |
| moveFrequency | 1-3 | 移动频率 (秒) |
| floatFrequency | 1-3 | 浮动频率 (秒) |
| gravityScale | 0.5 | 重力比例 |
| friction | 0.2 | 摩擦力 |
| restitution | 0.2 | 弹性 |

### 6.4 倒计时模块 (Countdown.tsx)

#### 6.4.1 核心逻辑
```typescript
// 倒计时逻辑
useEffect(() => {
  if (timeLeft <= 0) {
    end()  // 结束游戏
    return
  }
  
  const interval = setInterval(() => {
    setTimeLeft(t => t - 1)
  }, 1000)
  
  return () => clearInterval(interval)
}, [timeLeft])

// 时间奖励
useEffect(() => {
  if (phase === 'unhooked') {
    setTimeLeft(t => t + 3)  // +3 秒奖励
  }
}, [phase])

// 警报效果
setAlarm(timeLeft <= 10)  // 最后 10 秒警报
```

### 6.5 API 客户端模块 (api/client.ts)

#### 6.5.1 API 端点
| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| /api/auth/register | POST | 否 | 用户注册 |
| /api/auth/login | POST | 否 | 用户登录 |
| /api/auth/me | GET | 是 | 获取当前用户 |
| /api/leaderboard | GET | 否 | 获取排行榜 |
| /api/leaderboard/score | POST | 是 | 提交分数 |
| /api/leaderboard/my-scores | GET | 是 | 我的分数 |
| /api/leaderboard/my-rank | GET | 是 | 我的排名 |

#### 6.5.2 数据结构
```typescript
// 用户
interface User {
  id: number
  username: string
  email: string
  created_at?: string
}

// 分数记录
interface ScoreData {
  id: number
  user_id: number
  username: string
  score: number
  fish_count: number
  duration: number
  created_at: string
}

// 排行榜响应
interface LeaderboardResponse {
  leaderboard: ScoreData[]
  total: number
}
```

---

## 7. 美术资源映射

### 7.1 3D 模型资源

| 模型文件 | 用途 | 使用组件 | 缩放比例 |
|---------|------|---------|---------|
| `bucket.glb` | 鱼桶 | `<Bucket />` | 0.001 |
| `fish.glb` | 鱼 | `<FishModel />` | 1.5 |
| `fishing-hook.glb` | 鱼钩 | `<FishingHook />` | 0.001 |
| `fishing-pole.glb` | 鱼竿 | `<FishingPole />` | 0.01 |
| `grass.glb` | 草 | `<Grass />` / `<InstancedGrass />` | - |
| `stand.glb` | 支架 | `<Stand />` | - |
| `tree.glb` | 树 | `<Tree />` | - |

### 7.2 UI 图标资源

| 图标 | 来源 | 用途 |
|------|------|------|
| `mdi--hook` | Iconify | 鱼钩图标/Logo |
| `mdi--bucket` | Iconify | 鱼桶图标 |
| `solar--play-bold` | Iconify | 开始按钮 |
| `solar--login-bold` | Iconify | 登录按钮 |
| `solar--logout-bold` | Iconify | 登出按钮 |
| `solar--close-circle-bold` | Iconify | 关闭按钮 |
| `stash--arrow-retry` | Iconify | 重试按钮 |
| `solar--share-bold` | Iconify | 分享按钮 |
| `solar--clock-circle-bold` | Iconify | 时钟图标 |

### 7.3 鼠标指针资源

| 文件 | 用途 | CSS 类 |
|------|------|--------|
| `auto.png` | 默认指针 | `cursor-auto` |
| `pointer.png` | 可点击元素 | `cursor-pointer` |
| `grab.png` | 抓取状态 | `cursor-grab` |
| `grabbing.png` | 抓取中 | `cursor-grabbing` |

### 7.4 其他资源

| 资源 | 用途 |
|------|------|
| `bmc.png` | Buy Me a Coffee 赞助按钮 |
| `cover.png` | 游戏封面/分享图 |
| `favicon/*` | 网站图标集合 |

### 7.5 颜色配置

#### 7.5.1 Tailwind 主题色
```css
--color-primary: #7cad33  /* 绿色主题 */
--color-menu: #0094a5     /* 菜单蓝色 */
```

#### 7.5.2 模型颜色
```typescript
// 鱼竿
colorA: string  // 主色
colorB: string  // 副色

// 鱼
colorA: string  // 身体颜色 A
colorB: string  // 身体颜色 B
colorC: string  // 身体颜色 C

// 鱼钩
color: "darkred"  // 固定深红色
```

---

## 8. 数据设计

### 8.1 数据库表结构

#### 8.1.1 users 表
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 8.1.2 scores 表
```sql
CREATE TABLE scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  username VARCHAR(50) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  fish_count INT NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_score (score DESC),
  INDEX idx_created_at (created_at DESC),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 8.2 本地存储 (LocalStorage)

| 键名 | 类型 | 用途 |
|------|------|------|
| `hookafish-flip` | boolean | 菜单翻转状态 |
| `auth_token` | string | JWT 认证令牌 |

### 8.3 游戏运行时数据

```typescript
// 游戏状态快照
interface GameSnapshot {
  phase: 'ready' | 'started' | 'hooked' | 'unhooked' | 'ended'
  score: number
  fishes: string[]  // 鱼 ID 列表
  timeLeft: number
  lastHooked?: string
  bucketPosition?: Vector3
}
```

---

## 9. UI/UX 设计

### 9.1 界面布局

```
┌────────────────────────────────────────────┐
│  [左上] 玩法说明    [中上] 倒计时    [右上] 排行榜 │
├────────────────────────────────────────────┤
│                                            │
│                                            │
│              3D 游戏场景                     │
│                                            │
│                                            │
├────────────────────────────────────────────┤
│              [底部] 菜单 UI                   │
│        (登录/开始游戏/玩法/登出)              │
└────────────────────────────────────────────┘
```

### 9.2 菜单界面

#### 9.2.1 主菜单 (MainMenu)
- **未登录状态**：
  - Logo（钓鱼 -A- 去！+ 鱼钩图标）
  - 提示："⚠️ 请先登录后开始游戏"
  - 按钮：登录/注册
  
- **已登录状态**：
  - Logo
  - 欢迎信息："欢迎，{username}!"
  - 按钮：开始游戏、登出

#### 9.2.2 玩法说明 (Tutorial)
```
🎮 游戏玩法

🎯 控制鱼竿
   移动鼠标控制鱼竿的方向和角度

🪝 瞄准鱼嘴
   当鱼跳出水面时，将鱼钩对准鱼嘴

🐟 钓起鱼
   成功钩住鱼后，将它放入桶中

⏱️ 时间挑战
   在 60 秒内钓到尽可能多的鱼！

[返回按钮]
```

#### 9.2.3 结算界面 (End)
- **胜利状态**：
  - "游戏结束"
  - "钓到 {score} 条鱼"
  - 游戏截图
  - 随机胜利消息
  - 按钮：再来一次、分享
  
- **失败状态**：
  - "游戏结束"
  - 随机失败消息
  - 按钮：再来一次

### 9.3 HUD 界面

#### 9.3.1 倒计时 (Countdown)
- 位置：场景中上方 [0, 2, -2]
- 格式：mm:ss
- 警报：≤10 秒时红色闪烁
- 效果：Float 动画（警报时）

#### 9.3.2 玩法提示 (GameTutorial)
- 位置：屏幕左侧固定
- 背景：半透明黑色 (bg-black/40)
- 内容：4 条玩法说明

#### 9.3.3 排行榜 (GameLeaderboard)
- 位置：屏幕右侧固定
- 显示：前 5 名
- 更新：每 30 秒自动刷新
- 样式：金银铜牌图标

### 9.4 交互设计

#### 9.4.1 鼠标控制
- **移动**：控制鱼竿方向
- **点击**：无（自动钓鱼）

#### 9.4.2 触摸控制
- **触摸移动**：控制鱼竿方向
- **优化**：移动端隐藏部分 UI

#### 9.4.3 响应式设计
- **横屏检测**：屏幕高度 < 600px 时提示竖屏
- **UI 隐藏**：窗口大小变化时自动隐藏 UI

---

## 10. 部署配置

### 10.1 服务器环境

| 组件 | 版本 | 配置 |
|------|------|------|
| OS | CentOS 7 | 64 位 |
| Nginx | 1.20+ | 反向代理 |
| Node.js | 16.20.2 | LTS |
| MySQL | 5.7+ | 数据库 |
| PM2 | latest | 进程管理 |

### 10.2 目录结构

```
/www/wwwroot/hook-a-fish/
├── client/
│   └── dist/           # 前端构建输出 (Nginx 根目录)
└── server/
    ├── .env            # 环境变量
    └── dist/           # 后端编译输出 (PM2 启动)
```

### 10.3 Nginx 配置

```nginx
server {
    listen 80;
    server_name 47.86.170.101;
    
    # 前端静态文件
    location / {
        root /www/wwwroot/hook-a-fish/client/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    # 后端 API 反向代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### 10.4 环境变量

#### 10.4.1 后端 .env
```env
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_USER=hook_a_fish_user
DB_PASSWORD=<数据库密码>
DB_NAME=hook_a_fish
JWT_SECRET=<JWT 密钥>
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://47.86.170.101,https://47.86.170.101
```

#### 10.4.2 前端 .env.production
```env
VITE_API_BASE_URL=http://47.86.170.101/api
```

### 10.5 PM2 配置

```bash
# 启动命令
pm2 start dist/index.js --name hook-a-fish-api

# 进程名称
hook-a-fish-api

# 端口
3001
```

### 10.6 构建命令

#### 10.6.1 前端构建
```bash
cd client
npm install
npm run build
# 输出：client/dist/
```

#### 10.6.2 后端构建
```bash
cd server
npm install
npm run build
# 输出：server/dist/
```

---

## 📝 附录

### A. 关键依赖版本锁定

```json
{
  "react": "^19.1.1",
  "three": "^0.179.1",
  "@react-three/fiber": "^9.3.0",
  "@react-three/rapier": "^2.1.0",
  "zustand": "^5.0.7",
  "vite": "^7.1.2",
  "tailwindcss": "^4.1.12"
}
```

### B. 构建注意事项

1. **Node.js 版本**：必须使用 v16.x（CentOS 7 兼容）
2. **内存限制**：构建时需要 `NODE_OPTIONS="--max-old-space-size=4096"`
3. **Tailwind CSS**：使用 v3.x 版本（v4 与 Vite 不兼容）
4. **TypeScript**：构建前执行 `tsc -b` 类型检查

### C. 性能优化

1. **实例化渲染**：草地使用 `InstancedGrass` 批量渲染
2. **物理休眠**：鱼钩 `canSleep={!makeDefault}`
3. **LOD**：未实现（可优化）
4. **资源懒加载**：未实现（可优化）

---

**文档结束**

> 本 SDD 文档完全基于 `hook-a-fish` 项目实际代码编写  
> 所有技术参数、文件路径、配置项均来自真实项目文件  
> 最后更新：2026-03-10
