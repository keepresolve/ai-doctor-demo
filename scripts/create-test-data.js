require('dotenv').config({ path: '.env.local' })
const { sql } = require('@vercel/postgres')
const bcrypt = require('bcryptjs')

async function createTestData() {
  try {
    console.log('开始创建测试数据...')

    // 创建测试医生账号
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    let doctorId
    try {
      const { rows: userRows } = await sql`
        INSERT INTO users (phone, password_hash, name, role)
        VALUES ('13800000001', ${hashedPassword}, '测试医生', 'doctor')
        RETURNING id
      `
      doctorId = userRows[0].id
      console.log(`✅ 创建测试医生账号，ID: ${doctorId}`)
    } catch (error) {
      // 可能账号已存在，尝试获取
      const { rows: existingUser } = await sql`
        SELECT id FROM users WHERE phone = '13800000001' AND role = 'doctor'
      `
      if (existingUser.length > 0) {
        doctorId = existingUser[0].id
        console.log(`✓ 测试医生账号已存在，ID: ${doctorId}`)
      } else {
        throw error
      }
    }

    // 创建医生资料
    try {
      await sql`
        INSERT INTO doctor_profiles (user_id, specialty, license_number, description, experience_years)
        VALUES (${doctorId}, '内科', 'DOC001', '测试医生，专业可靠', 5)
      `
      console.log('✅ 创建医生资料')
    } catch (error) {
      console.log('✓ 医生资料已存在')
    }

    // 创建自动日程配置
    try {
      await sql.query(`
        INSERT INTO doctor_auto_schedule_configs 
        (doctor_id, enabled, work_days, work_start_time, work_end_time, slot_duration, break_start_time, break_end_time, advance_days)
        VALUES ($1, $2, $3::integer[], $4, $5, $6, $7, $8, $9)
      `, [
        doctorId,
        true, // 启用自动日程
        '[1,2,3,4,5]', // 周一到周五
        '09:00',
        '17:00',
        30, // 30分钟一个时间段
        '12:00',
        '13:00',
        7 // 提前7天创建日程
      ])
      console.log('✅ 创建自动日程配置')
    } catch (error) {
      console.log('✓ 自动日程配置已存在')
    }

    // 创建测试患者账号
    let patientId
    try {
      const { rows: patientRows } = await sql`
        INSERT INTO users (phone, password_hash, name, role)
        VALUES ('13800000002', ${hashedPassword}, '测试患者', 'patient')
        RETURNING id
      `
      patientId = patientRows[0].id
      console.log(`✅ 创建测试患者账号，ID: ${patientId}`)
    } catch (error) {
      const { rows: existingPatient } = await sql`
        SELECT id FROM users WHERE phone = '13800000002' AND role = 'patient'
      `
      if (existingPatient.length > 0) {
        patientId = existingPatient[0].id
        console.log(`✓ 测试患者账号已存在，ID: ${patientId}`)
      }
    }

    // 创建患者资料
    if (patientId) {
      try {
        await sql`
          INSERT INTO patient_profiles (user_id, gender, birth_date, emergency_contact, medical_history)
          VALUES (${patientId}, 'male', '1990-01-01', '13900000000', '无特殊病史')
        `
        console.log('✅ 创建患者资料')
      } catch (error) {
        console.log('✓ 患者资料已存在')
      }
    }

    console.log('\n🎉 测试数据创建完成！')
    console.log('\n登录信息:')
    console.log('医生账号: 13800000001 / 123456')
    console.log('患者账号: 13800000002 / 123456')

  } catch (error) {
    console.error('❌ 创建测试数据失败:', error)
    process.exit(1)
  }
}

createTestData()
  .then(() => {
    console.log('\n脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n脚本执行失败:', error)
    process.exit(1)
  })