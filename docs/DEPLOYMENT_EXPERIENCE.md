# Hook-A-Fish 钓鱼去！- 部署经验总结

> 2026-03-10 阿里云 CentOS 7 + 宝塔面板 完整部署记录

---

## 📋 项目信息

- **游戏名称**：Hook-A-Fish!（绝不空军）
- **技术栈**：
  - 前端：React 19 + Three.js + Vite
  - 后端：Node.js + Express + Colyseus + MySQL
  - 服务器：阿里云 CentOS 7 + 宝塔面板
  - 服务器配置：2GB 内存

---

## 🎮 游戏功能

### 核心玩法
- 60 秒限时钓鱼挑战
- 鼠标/触摸控制鱼竿
- 瞄准鱼嘴钓鱼
- 成功钓起放入桶中
- 每条鱼奖励 +3 秒

### 已实现功能
- ✅ 用户登录/注册系统
- ✅ 在线排行榜（前 5 名）
- ✅ 鱼模型（fish2.glb，默认材质，嘴部向上）
- ✅ 2000 株草（茂密）
- ✅ 100 棵树（森林感）
- ✅ 水面浮沫效果（200 个粒子）
- ✅ 鱼跃水面涟漪效果
- ✅ UI 白色圆角边框
- ✅ 主菜单标题"绝不空军"
- ✅ 网页标题"绝不空军"

---

## 🔧 部署流程

### 第 1 步：本地构建前端

```bash
cd C:\Users\abee\.openclaw\workspace\hook-a-fish\client

# 创建 .env.production
cat > .env.production << EOF
VITE_API_URL=http://47.86.170.101/api
EOF

# 构建前端
npm run build
```

**输出**：`client/dist/` 目录

---

### 第 2 步：本地构建后端

```bash
cd C:\Users\abee\.openclaw\workspace\hook-a-fish\server

# 安装依赖
npm install

# 安装类型定义
npm install --save-dev @types/cors

# 构建后端
npm run build
```

**输出**：`server/dist/` 目录

---

### 第 3 步：上传到服务器

**前端**：
- 上传 `dist` 文件夹到 `/www/wwwroot/hook-a-fish/client/dist/`

**后端**：
- 上传 `dist` 文件夹到 `/www/wwwroot/hook-a-fish/server/dist/`

**或使用 Git**：
```bash
cd /www/wwwroot/hook-a-fish
git pull
```

---

### 第 4 步：创建数据库

**在宝塔面板操作**：
1. 数据库 → 添加数据库
2. 数据库名：`hook_a_fish`
3. 用户名：`hook_a_fish_user`
4. 密码：**生成并保存**
5. 权限：本地服务器
6. 点击提交

---

### 第 5 步：配置后端环境变量

**在服务器上创建 .env 文件**：

```bash
cd /www/wwwroot/hook-a-fish/server

cat > .env << EOF
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_USER=hook_a_fish_user
DB_PASSWORD=从宝塔面板复制的密码
DB_NAME=hook_a_fish
JWT_SECRET=hook_a_fish_secret_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=*
EOF
```

**⚠️ 重要**：`DB_PASSWORD` 必须是从宝塔面板复制的真实密码！

---

### 第 6 步：安装后端依赖

```bash
cd /www/wwwroot/hook-a-fish/server

# 安装生产依赖
npm install --production

# 或者单独安装核心依赖
npm install cors @colyseus/core @colyseus/tools express mysql2 bcryptjs jsonwebtoken
```

---

### 第 7 步：启动后端服务

```bash
# 使用 PM2 启动
pm2 start dist/index.js --name hook-a-fish-api

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

---

### 第 8 步：配置 Nginx

**在宝塔面板操作**：
1. 网站 → 添加站点
2. 域名：`www.bobocatai.com`（或服务器 IP）
3. 根目录：`/www/wwwroot/hook-a-fish/client/dist`
4. 数据库：选择 `hook_a_fish`
5. 点击提交

**配置反向代理**：
1. 网站设置 → 反向代理 → 添加反向代理
2. 代理名称：`api`
3. 目标 URL：`http://localhost:3001`
4. 发送域名：`$host`
5. 代理目录：`/api`

**或手动编辑 Nginx 配置**：

```nginx
server {
    listen 80;
    server_name www.bobocatai.com;
    
    location / {
        root /www/wwwroot/hook-a-fish/client/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
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

### 第 9 步：验证部署

```bash
# 1. 查看服务状态
pm2 status

# 2. 查看日志
pm2 logs hook-a-fish-api --lines 20

# 3. 测试 API
curl http://localhost:3001/api/auth/me

# 4. 访问网站
# 浏览器访问 http://www.bobocatai.com
```

---

## ❌ 遇到的问题和解决方案

### 问题 1：内存不足无法构建

**错误**：服务器只有 2GB 内存，无法运行 `npm run build`

**解决方案**：
- ✅ **在本地构建**，然后上传 dist 到服务器
- ✅ 只安装生产依赖：`npm install --production`

---

### 问题 2：CORS 跨域错误

**错误**：
```
Access to fetch at 'http://localhost:2567/api/auth/login' from origin 'http://www.bobocatai.com'
```

**原因**：前端 API 地址配置错误

**解决方案**：
```bash
# 在本地创建 .env.production
cat > .env.production << EOF
VITE_API_URL=http://47.86.170.101/api
EOF

# 重新构建前端
npm run build
```

---

### 问题 3：后端 CORS 配置

**错误**：
```
Access-Control-Allow-Origin' header has a value 'http://localhost:5173'
```

**原因**：后端只允许开发环境访问

**解决方案**：
```bash
# 在 .env 中添加
CLIENT_URL=*

# 或者修改 dist/app.config.js
sed -i "s|origin: 'http://localhost:5173'|origin: '*'|g" dist/app.config.js
```

---

### 问题 4：数据库密码错误

**错误**：
```
Access denied for user 'hook_a_fish_user'@'localhost' (using password: YES)
```

**原因**：`.env` 文件中的数据库密码不正确

**解决方案**：
1. 在宝塔面板 → 数据库 → 找到 `hook_a_fish`
2. 点击 **密码** 列的眼睛图标 👁️
3. **复制真实密码**
4. 修改 `.env` 文件：
   ```bash
   DB_PASSWORD=复制的真实密码
   ```
5. 重启服务：`pm2 restart hook-a-fish-api`

---

### 问题 5：缺少依赖包

**错误**：
```
Error: Cannot find module '@colyseus/core'
Error: Cannot find module 'cors'
```

**原因**：只上传了 dist，没有安装 node_modules

**解决方案**：
```bash
cd /www/wwwroot/hook-a-fish/server
npm install --production
pm2 restart hook-a-fish-api
```

---

### 问题 6：数据库用户权限不足

**错误**：
```
Access denied for user 'hook_a_fish_user'@'localhost'
```

**原因**：数据库用户没有足够权限

**解决方案**：
1. 宝塔面板 → 数据库 → 找到 `hook_a_fish`
2. 点击 **权限** 按钮
3. 勾选所有权限（SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX）
4. 保存

---

### 问题 7：TypeScript 构建错误

**错误**：
```
Property 'length' does not exist on type 'QueryResult'.
Could not find a declaration file for module 'cors'.
```

**解决方案**：
```bash
# 修复代码中的类型错误
# 安装类型定义
npm install --save-dev @types/cors

# 在本地构建后上传 dist
npm run build
```

---

## 📝 关键配置文件

### 前端 .env.production
```env
VITE_API_URL=http://47.86.170.101/api
```

### 后端 .env
```env
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_USER=hook_a_fish_user
DB_PASSWORD=从宝塔面板复制的密码
DB_NAME=hook_a_fish
JWT_SECRET=hook_a_fish_secret_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=*
```

### Nginx 配置
```nginx
server {
    listen 80;
    server_name www.bobocatai.com;
    
    location / {
        root /www/wwwroot/hook-a-fish/client/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

---

## 🔍 常用诊断命令

### 查看服务状态
```bash
pm2 status
pm2 list
```

### 查看日志
```bash
pm2 logs hook-a-fish-api --lines 50
tail -f /root/.pm2/logs/hook-a-fish-api-error.log
```

### 重启服务
```bash
pm2 restart hook-a-fish-api
pm2 stop hook-a-fish-api
pm2 delete hook-a-fish-api
```

### 检查数据库
```bash
# 登录 MySQL
mysql -u root -p

# 查看数据库
SHOW DATABASES LIKE 'hook_a_fish';

# 查看表
USE hook_a_fish;
SHOW TABLES;

# 查看用户权限
SHOW GRANTS FOR 'hook_a_fish_user'@'localhost';
```

### 检查文件
```bash
# 前端文件
ls -la /www/wwwroot/hook-a-fish/client/dist/index.html

# 后端文件
ls -la /www/wwwroot/hook-a-fish/server/dist/index.js
ls -la /www/wwwroot/hook-a-fish/server/.env
```

---

## ✅ 成功标志

### 后端日志
```
✅ 数据库连接成功！
✅ 用户表创建成功
✅ 分数表创建成功
✅ 服务器初始化完成
⚔️ Listening on http://localhost:3001
```

### PM2 状态
```
┌────┬─────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name                │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼─────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ hook-a-fish-api     │ fork     │ 0    │ online    │ 0%       │ 50.0mb   │
└────┴─────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

### 前端访问
- 访问 `http://www.bobocatai.com` 显示游戏页面
- 可以点击登录/注册
- 登录成功后显示用户名
- 可以开始游戏

---

## 💡 经验教训

### 1. 本地构建，服务器部署
- ✅ **2GB 内存服务器无法构建大型项目**
- ✅ 在本地构建 dist，然后上传到服务器
- ✅ 服务器只安装生产依赖

### 2. 数据库密码管理
- ✅ **从宝塔面板复制真实密码**，不要手动输入
- ✅ 密码可能包含特殊字符，用单引号包裹
- ✅ 保存好密码，记录在安全位置

### 3. CORS 配置
- ✅ 前端 `.env.production` 设置正确的 API 地址
- ✅ 后端 `.env` 设置 `CLIENT_URL=*` 允许所有来源
- ✅ Nginx 反向代理配置 WebSocket 支持

### 4. 环境变量
- ✅ `.env` 文件不会被 Git 追踪，需要手动创建
- ✅ 修改 `.env` 后必须重启 PM2 服务
- ✅ 使用 `cat .env` 验证配置是否正确

### 5. 权限问题
- ✅ 数据库用户需要所有权限（CREATE, ALTER, DROP 等）
- ✅ npm 安装失败时尝试 `--unsafe-perm` 参数
- ✅ 文件权限问题使用 `chown -R www:www` 修复

### 6. 日志诊断
- ✅ PM2 保留历史日志，看到的不一定是当前错误
- ✅ 使用 `pm2 logs --lines 20` 查看最近日志
- ✅ 查看 `error.log` 和 `out.log` 两个文件

### 7. 依赖管理
- ✅ 使用 `npm install --production` 只安装生产依赖
- ✅ 缺少模块时单独安装：`npm install 模块名`
- ✅ 使用淘宝镜像加速：`npm config set registry https://registry.npmmirror.com`

---

## 📚 参考资源

- **GitHub 仓库**：https://github.com/mxboo/hook-a-fish-game
- **SDD 文档**：`docs/SDD.md`
- **部署脚本**：`auto-deploy.sh`, `deploy.sh`
- **数据库脚本**：`docs/database.sql`

---

## 🎉 部署完成检查清单

- [ ] 前端 dist 已上传到 `/www/wwwroot/hook-a-fish/client/dist/`
- [ ] 后端 dist 已上传到 `/www/wwwroot/hook-a-fish/server/dist/`
- [ ] 数据库 `hook_a_fish` 已创建
- [ ] 用户 `hook_a_fish_user` 已创建并授权
- [ ] 后端 `.env` 文件已配置（特别是 `DB_PASSWORD`）
- [ ] 后端依赖已安装：`npm install --production`
- [ ] PM2 服务已启动：`pm2 status` 显示 online
- [ ] Nginx 反向代理已配置
- [ ] 后端日志显示 "✅ 数据库连接成功！"
- [ ] 前端页面可以正常访问
- [ ] 登录功能正常工作
- [ ] 排行榜可以正常显示

---

**最后更新**：2026-03-10  
**部署状态**：✅ 成功运行  
**访问地址**：http://www.bobocatai.com
