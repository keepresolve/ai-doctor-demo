#!/bin/bash

# AI医生预约系统 - 初始化安装脚本

echo "🏥 AI医生预约系统 - 项目初始化"
echo "=============================="

# 检查Node.js版本
node_version=$(node -v 2>/dev/null || echo "未安装")
if [[ $node_version == "未安装" ]]; then
    echo "❌ 错误: 未安装Node.js"
    echo "请安装Node.js 18+版本: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js版本: $node_version"

# 检查npm版本
npm_version=$(npm -v 2>/dev/null || echo "未安装")
if [[ $npm_version == "未安装" ]]; then
    echo "❌ 错误: 未安装npm"
    exit 1
fi

echo "✅ npm版本: $npm_version"

# 创建必要目录
echo "📁 创建项目目录..."
mkdir -p logs
mkdir -p data

# 安装依赖
echo "📦 安装项目依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 设置脚本执行权限
echo "🔧 设置脚本权限..."
chmod +x scripts/*.sh

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "📝 创建环境配置文件..."
    cat > .env << EOF
# JWT密钥（生产环境请修改为随机字符串）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 数据库文件路径
DB_PATH=./data.db

# Next.js配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-this-too

# 日志级别
LOG_LEVEL=info
EOF
    echo "✅ 环境配置文件已创建: .env"
else
    echo "✅ 环境配置文件已存在"
fi

echo ""
echo "🎉 项目初始化完成！"
echo ""
echo "📋 可用命令:"
echo "  开发模式:   ./scripts/dev.sh"
echo "  构建项目:   ./scripts/build.sh"
echo "  生产模式:   ./scripts/start.sh"
echo ""
echo "🌐 默认访问地址: http://localhost:3000"
echo ""
echo "👤 默认管理员账号:"
echo "   手机号: 13800138000"
echo "   密码: admin123"
echo ""
echo "💡 提示: 首次运行开发模式时，系统会自动创建数据库和默认管理员账号"