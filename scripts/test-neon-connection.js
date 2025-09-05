#!/usr/bin/env node

// Neon数据库连接测试脚本
const { Client } = require('pg')

async function testNeonConnection() {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ 错误: 未找到DATABASE_URL环境变量')
    console.log('测试说明:')
    console.log('1. 访问 https://console.neon.tech 创建数据库')
    console.log('2. 复制连接字符串')
    console.log('3. 设置环境变量: export DATABASE_URL="你的连接字符串"')
    console.log('4. 重新运行此测试: node scripts/test-neon-connection.js')
    process.exit(1)
  }

  if (!databaseUrl.includes('neon.tech')) {
    console.warn('⚠️  警告: DATABASE_URL似乎不是Neon数据库连接')
    console.log('确保使用Neon提供的连接字符串，格式类似:')
    console.log('postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require')
  }

  console.log('🧪 开始测试Neon数据库连接...')
  console.log(`🔗 数据库地址: ${databaseUrl.replace(/:[^:]*@/, ':***@')}`)
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  try {
    console.log('🔌 正在连接...')
    await client.connect()
    console.log('✅ 数据库连接成功!')
    
    // 测试基本查询
    console.log('🔍 测试基本查询...')
    const { rows } = await client.query('SELECT version()')
    console.log(`📋 PostgreSQL版本: ${rows[0].version.split(',')[0]}`)
    
    // 检查是否已有表结构
    console.log('🗂️  检查表结构...')
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    if (tables.length === 0) {
      console.log('📋 数据库为空，需要运行迁移脚本')
      console.log('💡 运行迁移: node scripts/migrate-to-neon.js')
    } else {
      console.log('📊 现有数据表:')
      tables.forEach(table => {
        console.log(`   • ${table.table_name}`)
      })
      
      // 检查数据量
      if (tables.some(t => t.table_name === 'users')) {
        const { rows: userCount } = await client.query('SELECT COUNT(*) as count FROM users')
        console.log(`👤 用户数量: ${userCount[0].count}`)
      }
      
      if (tables.some(t => t.table_name === 'appointments')) {
        const { rows: appointmentCount } = await client.query('SELECT COUNT(*) as count FROM appointments')
        console.log(`📅 预约数量: ${appointmentCount[0].count}`)
      }
    }
    
    console.log('🎉 Neon数据库测试完成!')
    
  } catch (error) {
    console.error('❌ 数据库连接测试失败:')
    console.error(`   错误信息: ${error.message}`)
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 可能的解决方案:')
      console.log('   1. 检查网络连接')
      console.log('   2. 确认Neon数据库地址正确')
      console.log('   3. 检查Neon数据库是否处于运行状态')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 可能的解决方案:')
      console.log('   1. 检查数据库端口是否正确')
      console.log('   2. 确认防火墙设置允许连接')
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 可能的解决方案:')
      console.log('   1. 检查用户名和密码是否正确')
      console.log('   2. 确认数据库用户权限')
      console.log('   3. 重新生成数据库密码')
    }
    
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 数据库连接已关闭')
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  testNeonConnection()
}

module.exports = { testNeonConnection }