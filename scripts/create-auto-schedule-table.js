require('dotenv').config({ path: '.env.local' })
const { sql } = require('@vercel/postgres')

async function createAutoScheduleTable() {
  try {
    console.log('开始创建医生自动日程配置表...')

    // 创建 doctor_auto_schedule_configs 表
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_auto_schedule_configs (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER NOT NULL UNIQUE,
        enabled BOOLEAN DEFAULT false,
        work_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 周一到周五，1=周一, 7=周日
        work_start_time TIME DEFAULT '09:00',
        work_end_time TIME DEFAULT '17:00',
        slot_duration INTEGER DEFAULT 30, -- 时间段长度（分钟）
        break_start_time TIME DEFAULT '12:00',
        break_end_time TIME DEFAULT '13:00',
        advance_days INTEGER DEFAULT 30, -- 提前创建多少天的日程
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_auto_config_doctor ON doctor_auto_schedule_configs(doctor_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_auto_config_enabled ON doctor_auto_schedule_configs(enabled)`

    console.log('✅ doctor_auto_schedule_configs 表创建成功')

    // 验证表结构
    const { rows: columns } = await sql`
      SELECT column_name, data_type, column_default FROM information_schema.columns 
      WHERE table_name = 'doctor_auto_schedule_configs' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    
    console.log('\n📋 doctor_auto_schedule_configs 表结构:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.column_default ? `(默认: ${col.column_default})` : ''}`)
    })

    console.log('\n🎉 医生自动日程配置表创建完成！')

  } catch (error) {
    console.error('❌ 创建表失败:', error)
    process.exit(1)
  }
}

createAutoScheduleTable()
  .then(() => {
    console.log('脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('脚本执行失败:', error)
    process.exit(1)
  })