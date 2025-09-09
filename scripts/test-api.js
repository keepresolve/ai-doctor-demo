require('dotenv').config({ path: '.env.local' })
const { sql } = require('@vercel/postgres')

async function testDatabase() {
  try {
    console.log('测试数据库连接...')

    // 测试基本查询
    const { rows: tables } = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    console.log('✅ 数据库连接成功')
    console.log('现有表:', tables.map(row => row.table_name))

    // 测试 doctor_schedules 表结构
    const { rows: scheduleColumns } = await sql`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'doctor_schedules' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    
    console.log('\n📅 doctor_schedules 表结构:')
    scheduleColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    // 测试 appointments 表结构
    const { rows: appointmentColumns } = await sql`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'appointments' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    
    console.log('\n📝 appointments 表结构:')
    appointmentColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    console.log('\n🎉 数据库测试完成！')

  } catch (error) {
    console.error('❌ 数据库测试失败:', error)
    process.exit(1)
  }
}

testDatabase()
  .then(() => {
    console.log('测试脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('测试脚本执行失败:', error)
    process.exit(1)
  })