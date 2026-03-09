# 🚀 Hook-A-Fish 快速部署指南

## 方式一：一键脚本部署 (推荐)

### 1. 上传部署脚本到服务器
```bash
# SSH 登录服务器
ssh root@你的服务器 IP

# 上传 deploy.sh (方式任选其一)

# 方式 A: 使用 scp 从本地上传
scp deploy.sh root@你的服务器 IP:/root/

# 方式 B: 在服务器上 wget (如果已上传到 Git)
cd /root
wget https://raw.githubusercontent.com/你的仓库/hook-a-fish/main/deploy.sh
```

### 2. 执行部署脚本
```bash
# 赋予执行权限
chmod +x deploy.sh

# 运行脚本
bash deploy.sh
```

### 3. 按提示操作
脚本会引导您完成：
- ✅ 检查宝塔和 Node.js
- ✅ 创建项目目录
- ✅ 上传代码 (Git 或 手动)
- ✅ 配置数据库
- ✅ 安装依赖并构建
- ✅ 启动 PM2 服务

### 4. 配置 Nginx
在宝塔面板配置网站和反向代理 (脚本会提示)

---

## 方式二：手动部署

### 步骤 1: 连接服务器
```bash
ssh root@你的服务器 IP
```

### 步骤 2: 安装环境
```bash
# 安装 Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# 安装 PM2
npm install -g pm2

# 创建项目目录
mkdir -p /www/wwwroot/hook-a-fish
chown -R www:www /www/wwwroot/hook-a-fish
```

### 步骤 3: 上传代码
```bash
cd /www/wwwroot/hook-a-fish

# Git 克隆
git clone <你的仓库地址> .

# 或者上传 zip 包后解压
```

### 步骤 4: 创建数据库
在宝塔面板 → 数据库 → 添加数据库
- 数据库名：`hook_a_fish`
- 用户名：`hook_a_fish_user`
- 记录密码

然后导入 SQL：
```bash
# 在宝塔 phpMyAdmin 中导入 docs/database.sql
```

### 步骤 5: 配置后端
```bash
cd /www/wwwroot/hook-a-fish/server

# 安装依赖
npm install

# 创建 .env 文件
cat > .env << EOF
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_USER=hook_a_fish_user
DB_PASSWORD=你的数据库密码
DB_NAME=hook_a_fish
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://你的域名，https://你的域名
EOF

# 构建并启动
npm run build
pm2 start dist/index.js --name hook-a-fish-api
pm2 save
pm2 startup
```

### 步骤 6: 配置前端
```bash
cd /www/wwwroot/hook-a-fish/client

# 创建 .env.production
cat > .env.production << EOF
VITE_API_BASE_URL=https://你的域名/api
EOF

# 安装依赖并构建
npm install
npm run build
```

### 步骤 7: 配置 Nginx
在宝塔面板 → 网站 → 添加站点
- 域名：你的域名
- 根目录：`/www/wwwroot/hook-a-fish/client/dist`
- 数据库：选择 `hook_a_fish`

然后配置反向代理 (网站设置 → 反向代理)：
- 代理名称：`api`
- 目标 URL：`http://localhost:3001`
- 代理目录：`/api`

或编辑 Nginx 配置添加：
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
}

location /ws {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}
```

### 步骤 8: 配置 HTTPS
在宝塔面板 → 网站 → SSL → 申请 Let's Encrypt 证书

---

## 📝 部署后检查

### 检查服务状态
```bash
# 查看 PM2 进程
pm2 status

# 查看后端日志
pm2 logs hook-a-fish-api

# 检查端口
netstat -tlnp | grep 3001
```

### 测试 API
```bash
# 测试登录接口
curl -X POST https://你的域名/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# 测试排行榜
curl https://你的域名/api/leaderboard?limit=5
```

### 检查数据库
```bash
# 登录 MySQL
mysql -u hook_a_fish_user -p hook_a_fish

# 查看表
SHOW TABLES;
SELECT * FROM users LIMIT 5;
```

---

## 🔧 常用命令

```bash
# 重启后端
pm2 restart hook-a-fish-api

# 停止后端
pm2 stop hook-a-fish-api

# 查看日志
pm2 logs hook-a-fish-api --lines 100

# 更新代码
cd /www/wwwroot/hook-a-fish
git pull
cd client && npm run build
cd ../server && npm run build && pm2 restart hook-a-fish-api

# 备份数据库
mysqldump -u hook_a_fish_user -p hook_a_fish > backup_$(date +%Y%m%d).sql
```

---

## 🐛 遇到问题？

### 1. 后端启动失败
```bash
# 查看错误日志
pm2 logs hook-a-fish-api --err

# 检查端口占用
netstat -tlnp | grep 3001

# 检查 Node 版本
node -v  # 应该是 18.x 或 20.x
```

### 2. 前端无法访问
- 检查 Nginx 配置：`nginx -t`
- 检查文件权限：`ls -la /www/wwwroot/hook-a-fish/client/dist`
- 查看 Nginx 日志：`tail -f /www/wwwlogs/你的域名.log`

### 3. 数据库连接失败
- 检查 `.env` 中的数据库密码
- 测试 MySQL 连接：`mysql -u hook_a_fish_user -p`
- 检查 MySQL 服务：`systemctl status mysqld`

---

**部署完成后访问 `https://你的域名` 即可开始游戏！** 🎮✨
