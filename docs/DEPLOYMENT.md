# Hook-A-Fish 钓鱼去 - 阿里云 CentOS 部署指南

## 📋 部署架构

```
用户访问 → Nginx (宝塔) → 前端静态文件 (Vite 构建)
                    ↓
              反向代理 → Node.js 后端 (Express + Colyseus)
                    ↓
              MySQL 数据库 (存储用户和排行榜)
```

---

## 🚀 部署步骤

### 第一步：服务器环境准备

#### 1.1 宝塔面板基础配置
1. 登录宝塔面板 (通常是 `http://你的服务器 IP:8888`)
2. 安装以下软件：
   - **Nginx** (1.20+)
   - **MySQL** (5.7+)
   - **PHP** (可选，本项目不需要)
   - **Node.js** (18.x 或 20.x) - 通过宝塔应用商店安装

#### 1.2 安装 Node.js (如果宝塔没有)
```bash
# SSH 登录服务器后执行
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v  # 应该显示 v20.x.x
npm -v   # 应该显示 10.x.x
```

#### 1.3 安装 PM2 (进程管理)
```bash
sudo npm install -g pm2
```

---

### 第二步：数据库配置

#### 2.1 在宝塔中创建数据库
1. 进入宝塔面板 → 数据库
2. 添加数据库：
   - 数据库名：`hook_a_fish`
   - 用户名：`hook_a_fish_user`
   - 密码：(生成强密码并保存)
   - 权限：`本地服务器`

#### 2.2 导入数据库结构
```sql
-- 在宝塔 phpMyAdmin 中执行以下 SQL

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 分数表
CREATE TABLE IF NOT EXISTS scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  username VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  fish_count INT NOT NULL,
  duration INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_score (score DESC),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 第三步：上传项目代码

#### 3.1 创建项目目录
```bash
# SSH 登录服务器
sudo mkdir -p /www/wwwroot/hook-a-fish
sudo chown -R www:www /www/wwwroot/hook-a-fish
```

#### 3.2 上传代码
方式一：**Git 克隆** (推荐)
```bash
cd /www/wwwroot/hook-a-fish
git clone <你的仓库地址> .
```

方式二：**宝塔文件管理器上传**
1. 在本地打包项目：
   ```bash
   cd C:\Users\abee\.openclaw\workspace\hook-a-fish
   tar -czf hook-a-fish.tar.gz .
   ```
2. 通过宝塔文件管理器上传 `hook-a-fish.tar.gz`
3. 解压到 `/www/wwwroot/hook-a-fish`

---

### 第四步：配置后端

#### 4.1 安装后端依赖
```bash
cd /www/wwwroot/hook-a-fish/server
npm install
```

#### 4.2 配置环境变量
创建 `/www/wwwroot/hook-a-fish/server/.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_USER=hook_a_fish_user
DB_PASSWORD=你的数据库密码
DB_NAME=hook_a_fish

# JWT 配置
JWT_SECRET=你的 JWT 密钥 (生成一个随机字符串)
JWT_EXPIRES_IN=7d

# CORS 配置 (生产环境改为你的域名)
ALLOWED_ORIGINS=http://你的域名，https://你的域名
```

生成 JWT 密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4.3 构建后端
```bash
cd /www/wwwroot/hook-a-fish/server
npm run build
```

#### 4.4 启动后端 (PM2)
```bash
cd /www/wwwroot/hook-a-fish/server
pm2 start dist/index.js --name hook-a-fish-api
pm2 save
pm2 startup
```

---

### 第五步：配置前端

#### 5.1 修改 API 配置
编辑 `/www/wwwroot/hook-a-fish/client/src/api/client.ts`：

```typescript
// 修改 API_BASE_URL 为你的服务器地址
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://你的域名/api' 
  : 'http://localhost:3001'
```

或者创建 `/www/wwwroot/hook-a-fish/client/.env.production`：
```env
VITE_API_BASE_URL=https://你的域名/api
```

#### 5.2 构建前端
```bash
cd /www/wwwroot/hook-a-fish/client
npm install
npm run build
```

构建完成后会在 `client/dist` 目录生成静态文件。

---

### 第六步：配置 Nginx (宝塔)

#### 6.1 创建网站
1. 进入宝塔面板 → 网站 → 添加站点
2. 填写信息：
   - 域名：`你的域名`
   - 根目录：`/www/wwwroot/hook-a-fish/client/dist`
   - PHP 版本：`纯静态`
   - 数据库：`MySQL` (选择之前创建的)

#### 6.2 配置 Nginx 反向代理
1. 进入网站设置 → 反向代理
2. 添加反向代理：
   - 代理名称：`api`
   - 目标 URL：`http://localhost:3001`
   - 发送域名：`$host`
   - 代理目录：`/api`

或者手动编辑 Nginx 配置：

```nginx
server {
    listen 80;
    server_name 你的域名;
    
    # 前端静态文件
    location / {
        root /www/wwwroot/hook-a-fish/client/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端 API 反向代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket 支持 (Colyseus)
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

### 第七步：配置 HTTPS (推荐)

1. 进入宝塔面板 → 网站 → SSL
2. 申请免费 Let's Encrypt 证书
3. 强制 HTTPS 重定向

---

### 第八步：防火墙配置

#### 阿里云安全组
在阿里云控制台 → 安全组配置：
- ✅ 放行 80 端口 (HTTP)
- ✅ 放行 443 端口 (HTTPS)
- ❌ 不要放行 3001 端口 (内部使用)

#### 宝塔防火墙
- 确保 80/443 端口已放行
- 确保 SSH (22) 端口安全

---

## 🔧 日常运维

### 查看日志
```bash
# 后端日志
pm2 logs hook-a-fish-api

# Nginx 日志
tail -f /www/wwwlogs/你的域名.log
```

### 重启服务
```bash
# 重启后端
pm2 restart hook-a-fish-api

# 重启 Nginx
bt restart
```

### 更新代码
```bash
cd /www/wwwroot/hook-a-fish
git pull

# 重新构建
cd client && npm run build
cd ../server && npm run build

# 重启后端
pm2 restart hook-a-fish-api
```

### 数据库备份
在宝塔面板 → 数据库 → 备份

---

## 🐛 常见问题

### 1. 后端启动失败
```bash
# 检查端口占用
netstat -tlnp | grep 3001

# 检查 Node 版本
node -v

# 查看 PM2 日志
pm2 logs hook-a-fish-api
```

### 2. 前端无法连接 API
- 检查 Nginx 反向代理配置
- 检查 `.env.production` 中的 API 地址
- 检查浏览器控制台是否有 CORS 错误

### 3. WebSocket 连接失败
- 确保 Nginx 配置了 WebSocket 支持
- 检查阿里云安全组是否放行相应端口
- 检查后端 Colyseus 配置

---

## 📝 部署检查清单

- [ ] 宝塔面板已安装 Nginx + MySQL + Node.js
- [ ] 数据库已创建并导入表结构
- [ ] 后端 `.env` 文件已配置
- [ ] 后端已构建并启动 (PM2)
- [ ] 前端已构建到 `dist` 目录
- [ ] Nginx 配置了反向代理
- [ ] HTTPS 证书已配置
- [ ] 阿里云安全组已放行 80/443
- [ ] 测试登录功能正常
- [ ] 测试排行榜功能正常
- [ ] 测试 WebSocket 连接正常

---

**部署完成后，访问 `https://你的域名` 即可玩游戏！** 🎮✨
