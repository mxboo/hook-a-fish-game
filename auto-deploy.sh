#!/bin/bash

################################################################################
# Hook-A-Fish 钓鱼去 - 一键完整部署脚本
# 使用方法：bash auto-deploy.sh
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Hook-A-Fish 钓鱼去 - 一键部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 配置变量
PROJECT_DIR="/www/wwwroot/hook-a-fish"
SERVER_PORT=3001
DB_NAME="hook_a_fish"
DB_USER="hook_a_fish_user"
GITHUB_REPO="https://github.com/mxboo/hook-a-fish-game.git"

# 提示输入
echo -e "${YELLOW}请输入以下信息：${NC}"
read -p "服务器公网 IP 或域名：" SERVER_IP
read -p "数据库密码（从宝塔获取）：" -s DB_PASS
echo ""
read -p "MySQL root 密码（用于导入数据库）：" -s MYSQL_ROOT_PASS
echo ""

# 步骤 1: 创建项目目录并克隆代码
echo -e "${YELLOW}[1/6] 克隆代码...${NC}"

# 彻底清空并重建目录
if [ -d "$PROJECT_DIR" ]; then
  rm -rf "$PROJECT_DIR"
fi
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 克隆代码
git clone $GITHUB_REPO .
echo -e "${GREEN}✓ 代码克隆完成${NC}"

# 步骤 2: 配置后端
echo -e "${YELLOW}[2/6] 配置后端...${NC}"
cd $PROJECT_DIR/server

# 生成 JWT 密钥
JWT_SECRET=$(openssl rand -hex 32)

# 创建 .env 文件
cat > .env << EOF
PORT=${SERVER_PORT}
NODE_ENV=production
DB_HOST=localhost
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_NAME=${DB_NAME}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://${SERVER_IP},https://${SERVER_IP}
EOF

echo -e "${GREEN}✓ 后端配置完成${NC}"

# 步骤 3: 安装后端依赖并启动
echo -e "${YELLOW}[3/6] 安装后端依赖并启动...${NC}"
npm install
npm run build

# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start dist/index.js --name hook-a-fish-api
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

echo -e "${GREEN}✓ 后端服务已启动${NC}"

# 步骤 4: 导入数据库
echo -e "${YELLOW}[4/6] 导入数据库...${NC}"
mysql -u root -p${MYSQL_ROOT_PASS} ${DB_NAME} < docs/database.sql 2>/dev/null || {
  echo -e "${YELLOW}数据库导入跳过（请手动在宝塔 phpMyAdmin 中导入 docs/database.sql）${NC}"
}
echo -e "${GREEN}✓ 数据库配置完成${NC}"

# 步骤 5: 配置前端
echo -e "${YELLOW}[5/6] 配置前端...${NC}"
cd $PROJECT_DIR/client

# 创建生产环境变量
cat > .env.production << EOF
VITE_API_BASE_URL=http://${SERVER_IP}/api
EOF

# 安装依赖并构建
npm install
npm run build

echo -e "${GREEN}✓ 前端构建完成${NC}"

# 步骤 6: 显示 Nginx 配置说明
echo -e "${YELLOW}[6/6] Nginx 配置说明...${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  部署完成！接下来配置 Nginx${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "请在宝塔面板中配置网站："
echo "  1. 进入 宝塔面板 → 网站 → 添加站点"
echo "  2. 域名：${SERVER_IP}"
echo "  3. 根目录：${PROJECT_DIR}/client/dist"
echo "  4. 数据库：选择 ${DB_NAME}"
echo ""
echo "然后配置反向代理："
echo "  1. 进入网站设置 → 反向代理 → 添加反向代理"
echo "  2. 代理名称：api"
echo "  3. 目标 URL：http://localhost:${SERVER_PORT}"
echo "  4. 代理目录：/api"
echo ""
echo "或者手动编辑 Nginx 配置，添加以下内容："
echo ""
cat << 'NGINX_CONFIG'
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
NGINX_CONFIG

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "查看后端日志：pm2 logs hook-a-fish-api"
echo "重启后端：pm2 restart hook-a-fish-api"
echo "查看状态：pm2 status"
echo ""
echo "访问地址：http://${SERVER_IP}"
echo ""
