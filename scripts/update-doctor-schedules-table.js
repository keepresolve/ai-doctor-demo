require('dotenv').config({ path: '.env.local' })
const { sql } = require('@vercel/postgres')

async function updateDoctorSchedulesTable() {
  try {
    console.log('开始更新 doctor_schedules 表结构...')

    // 检查现有数据
    const { rows: existingData } = await sql`SELECT COUNT(*) as count FROM doctor_schedules`
    console.log(`现有数据记录数: ${existingData[0].count}`)

    // 备份现有数据（如果有）
    if (parseInt(existingData[0].count) > 0) {
      console.log('备份现有数据...')
      await sql`
        CREATE TEMP TABLE doctor_schedules_backup AS 
        SELECT * FROM doctor_schedules
      `
      console.log('✅ 数据备份完成')
    }

    // 删除现有表
    console.log('删除现有 doctor_schedules 表...')
    await sql`DROP TABLE IF EXISTS doctor_schedules CASCADE`

    // 创建新的表结构
    console.log('创建新的 doctor_schedules 表...')
    await sql`
      CREATE TABLE doctor_schedules (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'break')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `

    // 创建索引
    await sql`CREATE INDEX idx_doctor_schedules_doctor_date ON doctor_schedules(doctor_id, date)`
    await sql`CREATE INDEX idx_doctor_schedules_date_time ON doctor_schedules(date, start_time, end_time)`

    console.log('✅ 新的 doctor_schedules 表创建成功')

    // 验证新表结构
    const { rows: newColumns } = await sql`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'doctor_schedules' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    
    console.log('\n📅 新的 doctor_schedules 表结构:')
    newColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    console.log('\n🎉 doctor_schedules 表更新完成！')

  } catch (error) {
    console.error('❌ 更新表结构失败:', error)
    process.exit(1)
  }
}

updateDoctorSchedulesTable()
  .then(() => {
    console.log('表结构更新脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('表结构更新脚本执行失败:', error)
    process.exit(1)
  })