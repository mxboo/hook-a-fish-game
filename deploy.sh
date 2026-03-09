#!/bin/bash

################################################################################
# Hook-A-Fish 钓鱼去 - 阿里云 CentOS 一键部署脚本
# 适用于宝塔面板 + CentOS 7/8
# 使用方法：bash deploy.sh
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="hook-a-fish"
PROJECT_DIR="/www/wwwroot/hook-a-fish"
SERVER_PORT=3001
DB_NAME="hook_a_fish"
DB_USER="hook_a_fish_user"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Hook-A-Fish 钓鱼去 - 一键部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}请使用 root 用户运行此脚本 (sudo -i)${NC}"
  exit 1
fi

# 步骤 1: 检查宝塔是否已安装
echo -e "${YELLOW}[1/8] 检查宝塔面板...${NC}"
if [ ! -d "/www/server/panel" ]; then
  echo -e "${RED}未检测到宝塔面板，请先安装宝塔！${NC}"
  echo "安装命令：yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh"
  exit 1
fi
echo -e "${GREEN}✓ 宝塔面板已安装${NC}"

# 步骤 2: 安装 Node.js (如果未安装)
echo -e "${YELLOW}[2/8] 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
  echo "安装 Node.js 20.x..."
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  yum install -y nodejs
else
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}✓ Node.js 已安装：${NODE_VERSION}${NC}"
fi

# 安装 PM2
if ! command -v pm2 &> /dev/null; then
  echo "安装 PM2..."
  npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 已安装${NC}"

# 步骤 3: 创建项目目录
echo -e "${YELLOW}[3/8] 创建项目目录...${NC}"
mkdir -p $PROJECT_DIR
chown -R www:www $PROJECT_DIR
echo -e "${GREEN}✓ 项目目录已创建：${PROJECT_DIR}${NC}"

# 步骤 4: 上传项目代码
echo -e "${YELLOW}[4/8] 准备项目代码...${NC}"
echo "请通过以下方式之一上传代码："
echo "  1. Git 克隆：cd ${PROJECT_DIR} && git clone <仓库地址> ."
echo "  2. 宝塔文件管理器：上传 zip 包并解压到 ${PROJECT_DIR}"
echo ""
read -p "代码上传完成后按回车继续..."

# 步骤 5: 配置数据库
echo -e "${YELLOW}[5/8] 配置数据库...${NC}"
echo "请在宝塔面板中创建数据库："
echo "  1. 进入 宝塔面板 → 数据库 → 添加数据库"
echo "  2. 数据库名：${DB_NAME}"
echo "  3. 用户名：${DB_USER}"
echo "  4. 记录生成的密码"
echo ""
read -p "数据库创建完成后按回车继续..."
echo -e "${GREEN}✓ 数据库已创建${NC}"

# 步骤 6: 配置后端
echo -e "${YELLOW}[6/8] 配置后端...${NC}"
cd ${PROJECT_DIR}/server

echo "安装后端依赖..."
npm install

echo "构建后端..."
npm run build

# 生成环境变量文件
echo ""
echo "请配置后端环境变量 (server/.env)："
read -p "输入数据库密码：" -s DB_PASS
echo ""
read -p "输入域名 (如：example.com)：" DOMAIN
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

cat > .env << EOF
# 服务器配置
PORT=${SERVER_PORT}
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_NAME=${DB_NAME}

# JWT 配置
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# CORS 配置
ALLOWED_ORIGINS=http://${DOMAIN},https://${DOMAIN}
EOF

echo -e "${GREEN}✓ 后端配置完成${NC}"

# 步骤 7: 配置前端
echo -e "${YELLOW}[7/8] 配置前端...${NC}"
cd ${PROJECT_DIR}/client

# 创建生产环境变量
cat > .env.production << EOF
VITE_API_BASE_URL=https://${DOMAIN}/api
EOF

echo "安装前端依赖..."
npm install

echo "构建前端..."
npm run build

echo -e "${GREEN}✓ 前端构建完成${NC}"

# 步骤 8: 启动服务
echo -e "${YELLOW}[8/8] 启动服务...${NC}"

# 启动后端
cd ${PROJECT_DIR}/server
pm2 start dist/index.js --name ${PROJECT_NAME}-api
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

echo -e "${GREEN}✓ 后端服务已启动${NC}"

# 显示 Nginx 配置说明
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  部署完成！接下来配置 Nginx${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "请在宝塔面板中配置网站："
echo "  1. 进入 宝塔面板 → 网站 → 添加站点"
echo "  2. 域名：${DOMAIN}"
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
echo "location /api {"
echo "    proxy_pass http://localhost:${SERVER_PORT};"
echo "    proxy_http_version 1.1;"
echo "    proxy_set_header Upgrade \$http_upgrade;"
echo "    proxy_set_header Connection 'upgrade';"
echo "    proxy_set_header Host \$host;"
echo "    proxy_set_header X-Real-IP \$remote_addr;"
echo "}"
echo ""
echo "location /ws {"
echo "    proxy_pass http://localhost:${SERVER_PORT};"
echo "    proxy_http_version 1.1;"
echo "    proxy_set_header Upgrade \$http_upgrade;"
echo "    proxy_set_header Connection \"Upgrade\";"
echo "    proxy_set_header Host \$host;"
echo "}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "查看后端日志：pm2 logs ${PROJECT_NAME}-api"
echo "重启后端：pm2 restart ${PROJECT_NAME}-api"
echo "查看状态：pm2 status"
echo ""
echo "访问地址：https://${DOMAIN}"
echo ""
