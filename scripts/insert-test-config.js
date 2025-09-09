require('dotenv').config({ path: '.env.local' })
const { sql } = require('@vercel/postgres')

async function insertTestConfig() {
  try {
    console.log('插入测试配置...')

    // 获取医生ID
    const { rows: doctors } = await sql`
      SELECT id FROM users WHERE role = 'doctor' LIMIT 1
    `
    
    if (doctors.length === 0) {
      console.log('❌ 没有找到医生账号')
      return
    }

    const doctorId = doctors[0].id
    console.log(`找到医生ID: ${doctorId}`)

    // 插入配置
    await sql.query(`
      INSERT INTO doctor_auto_schedule_configs 
      (doctor_id, enabled, work_days, work_start_time, work_end_time, slot_duration, break_start_time, break_end_time, advance_days)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (doctor_id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        work_days = EXCLUDED.work_days,
        work_start_time = EXCLUDED.work_start_time,
        work_end_time = EXCLUDED.work_end_time,
        slot_duration = EXCLUDED.slot_duration,
        break_start_time = EXCLUDED.break_start_time,
        break_end_time = EXCLUDED.break_end_time,
        advance_days = EXCLUDED.advance_days,
        updated_at = CURRENT_TIMESTAMP
    `, [
      doctorId,
      true, // 启用
      [1,2,3,4,5], // 周一到周五
      '09:00',
      '17:00', 
      30,
      '12:00',
      '13:00',
      7
    ])

    console.log('✅ 测试配置插入成功')

    // 验证插入
    const { rows: configs } = await sql`
      SELECT * FROM doctor_auto_schedule_configs WHERE doctor_id = ${doctorId}
    `
    
    if (configs.length > 0) {
      const config = configs[0]
      console.log('\n配置详情:')
      console.log(`- 医生ID: ${config.doctor_id}`)
      console.log(`- 启用状态: ${config.enabled}`)
      console.log(`- 工作日: ${config.work_days}`)
      console.log(`- 工作时间: ${config.work_start_time} - ${config.work_end_time}`)
    }

  } catch (error) {
    console.error('❌ 插入失败:', error)
    process.exit(1)
  }
}

insertTestConfig()
  .then(() => {
    console.log('\n脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n脚本执行失败:', error)
    process.exit(1)
  })