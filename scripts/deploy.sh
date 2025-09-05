#!/bin/bash

# AI医生预约系统 - Vercel部署脚本

echo "🏥 AI医生预约系统 - Vercel部署"
echo "=============================="

# 检查Vercel CLI是否安装
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI未安装"
    echo "正在安装Vercel CLI..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "❌ Vercel CLI安装失败"
        exit 1
    fi
fi

echo "✅ Vercel CLI已安装"

# 检查是否已登录Vercel
vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "📝 请先登录Vercel..."
    vercel login
    if [ $? -ne 0 ]; then
        echo "❌ Vercel登录失败"
        exit 1
    fi
fi

echo "✅ 已登录Vercel"

# 创建日志目录
mkdir -p logs

# 执行构建前检查
echo "🔍 执行构建前检查..."
npm run typecheck 2>&1 | tee logs/pre-deploy-typecheck.log
if [ $? -ne 0 ]; then
    echo "❌ 类型检查失败，请修复后再部署"
    exit 1
fi

echo "✅ 类型检查通过"

# 部署到Vercel
echo "🚀 开始部署到Vercel..."
echo "📝 部署日志将记录到 logs/deploy.log"

vercel --prod 2>&1 | tee logs/deploy.log

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 部署成功！"
    echo ""
    echo "📋 重要信息:"
    echo "   • 生产环境已部署完成"
    echo "   • 数据库将在首次访问时自动初始化"
    echo "   • 默认管理员账号: 13800138000 / admin123"
    echo ""
    echo "⚠️  注意事项:"
    echo "   • 首次访问可能需要等待服务启动"
    echo "   • 建议立即修改管理员默认密码"
    echo "   • 生产环境建议设置自定义JWT密钥"
    echo ""
    echo "📊 后续操作:"
    echo "   1. 访问部署的网站"
    echo "   2. 使用管理员账号登录"
    echo "   3. 创建医生账号"
    echo "   4. 设置医生的可预约时间"
else
    echo "❌ 部署失败，请查看 logs/deploy.log"
    exit 1
fi