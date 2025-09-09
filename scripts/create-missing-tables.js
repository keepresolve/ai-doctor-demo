require('dotenv').config({ path: '.env.local' })
const { sql } = require('@vercel/postgres')

async function createMissingTables() {
  try {
    console.log('开始检查和创建缺少的数据库表...')

    // 检查现有表
    const { rows: existingTables } = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    
    const tableNames = existingTables.map(row => row.table_name)
    console.log('现有表:', tableNames)

    // 创建 doctor_schedules 表（如果不存在）
    if (!tableNames.includes('doctor_schedules')) {
      console.log('创建 doctor_schedules 表...')
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
      
      console.log('✅ doctor_schedules 表创建成功')
    } else {
      console.log('✓ doctor_schedules 表已存在')
    }

    // 检查 appointments 表是否有所需字段
    const { rows: appointmentColumns } = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'appointments' AND table_schema = 'public'
    `
    
    const columnNames = appointmentColumns.map(row => row.column_name)
    console.log('appointments 表字段:', columnNames)

    // 添加缺少的字段到 appointments 表
    const requiredFields = [
      { name: 'symptoms', type: 'TEXT' },
      { name: 'diagnosis', type: 'TEXT' },
      { name: 'prescription', type: 'TEXT' },
      { name: 'duration', type: 'INTEGER DEFAULT 30' }
    ]

    for (const field of requiredFields) {
      if (!columnNames.includes(field.name)) {
        console.log(`添加字段 ${field.name} 到 appointments 表...`)
        await sql.query(`ALTER TABLE appointments ADD COLUMN ${field.name} ${field.type}`)
        console.log(`✅ 字段 ${field.name} 添加成功`)
      } else {
        console.log(`✓ 字段 ${field.name} 已存在`)
      }
    }

    // 检查 patient_profiles 表（如果不存在则创建）
    if (!tableNames.includes('patient_profiles')) {
      console.log('创建 patient_profiles 表...')
      await sql`
        CREATE TABLE patient_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
          birth_date DATE,
          emergency_contact VARCHAR(100),
          medical_history TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `
      console.log('✅ patient_profiles 表创建成功')
    } else {
      console.log('✓ patient_profiles 表已存在')
    }

    console.log('\n🎉 数据库表检查和创建完成！')

  } catch (error) {
    console.error('❌ 创建表时出错:', error)
    process.exit(1)
  }
}

// 运行脚本
createMissingTables()
  .then(() => {
    console.log('脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('脚本执行失败:', error)
    process.exit(1)
  })