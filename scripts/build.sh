#!/bin/bash

# AI医生预约系统 - 构建脚本

echo "🏥 构建AI医生预约系统"
echo "====================="

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

# 创建日志目录
mkdir -p logs

# 类型检查
echo "🔍 执行类型检查..."
npm run typecheck 2>&1 | tee logs/typecheck.log
if [ $? -ne 0 ]; then
    echo "❌ 类型检查失败，请查看 logs/typecheck.log"
    exit 1
fi

# 代码风格检查
echo "📝 执行代码风格检查..."
npm run lint 2>&1 | tee logs/lint.log
if [ $? -ne 0 ]; then
    echo "⚠️  代码风格检查有警告，请查看 logs/lint.log"
fi

# 构建项目
echo "🚀 开始构建项目..."
npm run build 2>&1 | tee logs/build.log

if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo "📁 构建文件位于 .next/ 目录"
else
    echo "❌ 构建失败，请查看 logs/build.log"
    exit 1
fi