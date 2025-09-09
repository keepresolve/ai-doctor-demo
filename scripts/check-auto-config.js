require('dotenv').config({ path: '.env.local' })
const { sql } = require('@vercel/postgres')

async function checkAutoConfig() {
  try {
    console.log('检查自动日程配置...')

    // 检查所有配置
    const { rows: allConfigs } = await sql`
      SELECT * FROM doctor_auto_schedule_configs
    `
    
    console.log(`\n总配置数: ${allConfigs.length}`)
    allConfigs.forEach(config => {
      console.log(`医生ID ${config.doctor_id}: ${config.enabled ? '启用' : '禁用'}`)
    })

    // 检查启用的配置
    const { rows: enabledConfigs } = await sql`
      SELECT * FROM doctor_auto_schedule_configs WHERE enabled = true
    `
    
    console.log(`\n启用配置数: ${enabledConfigs.length}`)
    
    if (enabledConfigs.length > 0) {
      console.log('\n启用的配置详情:')
      enabledConfigs.forEach(config => {
        console.log(`- 医生ID: ${config.doctor_id}`)
        console.log(`  工作日: ${config.work_days}`)
        console.log(`  工作时间: ${config.work_start_time} - ${config.work_end_time}`)
        console.log(`  时间段: ${config.slot_duration}分钟`)
        console.log(`  休息时间: ${config.break_start_time} - ${config.break_end_time}`)
        console.log(`  提前天数: ${config.advance_days}天`)
        console.log('')
      })
    }

  } catch (error) {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  }
}

checkAutoConfig()
  .then(() => {
    console.log('检查完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('检查失败:', error)
    process.exit(1)
  })