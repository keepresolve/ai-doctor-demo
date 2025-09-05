#!/bin/bash

# AI医生预约系统 - 开发环境启动脚本

echo "🏥 启动AI医生预约系统 - 开发模式"
echo "=================================="

# 检查Node.js版本
node_version=$(node -v 2>/dev/null || echo "未安装")
if [[ $node_version == "未安装" ]]; then
    echo "❌ 错误: 未安装Node.js"
    echo "请安装Node.js 18+版本"
    exit 1
fi

echo "✅ Node.js版本: $node_version"

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: .env文件不存在，使用默认配置"
fi

# 创建日志目录
mkdir -p logs

# 启动开发服务器
echo "🚀 启动开发服务器..."
echo "📝 日志将输出到 logs/dev.log"

# 启动并记录日志
npm run dev 2>&1 | tee logs/dev.log