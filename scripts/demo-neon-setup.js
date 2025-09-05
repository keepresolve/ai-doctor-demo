#!/usr/bin/env node

// Neon数据库设置演示脚本
console.log('🚀 === Neon数据库迁移设置演示 ===')
console.log('')

console.log('📝 设置步骤:')
console.log('')

console.log('1️⃣ 创建Neon数据库:')
console.log('   • 访问: https://console.neon.tech')
console.log('   • 使用GitHub账号登录')
console.log('   • 点击 "Create Project"')
console.log('   • 项目名称: ai-doctor-demo')
console.log('   • 选择区域: US East (N. Virginia)')
console.log('   • 点击 "Create Project"')
console.log('')

console.log('2️⃣ 获取连接字符串:')
console.log('   • 在Neon Dashboard中点击项目名称')
console.log('   • 找到 "Connection Details" 部分')
console.log('   • 复制 "Connection string" (类似下面格式):')
console.log('   postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require')
console.log('')

console.log('3️⃣ 本地测试连接:')
console.log('   export DATABASE_URL="你的Neon连接字符串"')
console.log('   node scripts/test-neon-connection.js')
console.log('')

console.log('4️⃣ 运行数据库迁移:')
console.log('   node scripts/migrate-to-neon.js')
console.log('')

console.log('5️⃣ 在Vercel中设置环境变量:')
console.log('   • 登录 Vercel Dashboard')
console.log('   • 进入项目 -> Settings -> Environment Variables')
console.log('   • 添加: DATABASE_URL = 你的Neon连接字符串')
console.log('   • 环境: Production, Preview, Development 都勾选')
console.log('')

console.log('6️⃣ 重新部署Vercel:')
console.log('   git commit --allow-empty -m "Enable Neon database"')
console.log('   git push origin main')
console.log('')

console.log('📱 迁移完成后的测试账号:')
console.log('   管理员: 13800000001 / admin123')
console.log('   医生:   13800000002 / doctor123')  
console.log('   患者:   13800000003 / patient123')
console.log('')

console.log('✨ Neon数据库优势:')
console.log('   ✅ 免费额度: 3GB存储 + 100小时计算时间/月')
console.log('   ✅ 自动暂停节省成本')
console.log('   ✅ 分支功能便于开发')
console.log('   ✅ 数据持久化不丢失')
console.log('   ✅ 企业级PostgreSQL性能')
console.log('')

console.log('🔧 可用的迁移工具:')
console.log('   node scripts/test-neon-connection.js    - 测试数据库连接')
console.log('   node scripts/migrate-to-neon.js         - 运行完整迁移')
console.log('   node scripts/demo-neon-setup.js         - 显示此设置指南')
console.log('')

console.log('🎉 准备开始迁移到Neon? 按照上述步骤操作即可!')