#!/bin/bash

# AI医生预约系统 - 生产环境启动脚本

echo "🏥 启动AI医生预约系统 - 生产模式"
echo "=================================="

# 检查是否已构建
if [ ! -d ".next" ]; then
    echo "❌ 错误: 项目未构建"
    echo "请先运行构建脚本: ./scripts/build.sh"
    exit 1
fi

# 检查Node.js版本
node_version=$(node -v 2>/dev/null || echo "未安装")
if [[ $node_version == "未安装" ]]; then
    echo "❌ 错误: 未安装Node.js"
    echo "请安装Node.js 18+版本"
    exit 1
fi

echo "✅ Node.js版本: $node_version"

# 创建日志目录
mkdir -p logs

# 启动生产服务器
echo "🚀 启动生产服务器..."
echo "📝 日志将输出到 logs/production.log"
echo "🌐 访问地址: http://localhost:3000"
echo ""
echo "管理员登录信息:"
echo "手机号: 13800138000"
echo "密码: admin123"

# 启动并记录日志
npm run start 2>&1 | tee logs/production.log