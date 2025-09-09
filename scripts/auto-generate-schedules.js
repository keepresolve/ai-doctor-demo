require('dotenv').config({ path: '.env.local' })
const { sql } = require('@vercel/postgres')

// 从postgres-database.js复制的必要函数
async function getEnabledAutoScheduleConfigs() {
  const { rows } = await sql`
    SELECT * FROM doctor_auto_schedule_configs WHERE enabled = true
  `
  return rows
}

async function generateAutoSchedules(config, targetDate) {
  try {
    const dayOfWeek = targetDate.getDay() || 7 // 将周日从0转为7
    
    // 检查是否为工作日
    if (!config.work_days.includes(dayOfWeek)) {
      return 0 // 非工作日，跳过
    }

    const dateStr = targetDate.toISOString().split('T')[0]
    
    // 检查该日期是否已有日程
    const { rows: existingSchedules } = await sql`
      SELECT COUNT(*) as count FROM doctor_schedules 
      WHERE doctor_id = ${config.doctor_id} AND date = ${dateStr}
    `
    
    if (parseInt(existingSchedules[0].count) > 0) {
      return 0 // 已有日程，跳过
    }

    // 生成时间段
    const schedules = []
    const workStart = parseTime(config.work_start_time)
    const workEnd = parseTime(config.work_end_time)
    const breakStart = parseTime(config.break_start_time)
    const breakEnd = parseTime(config.break_end_time)
    
    let currentTime = workStart
    while (currentTime + config.slot_duration <= workEnd) {
      // 跳过休息时间
      if (!(currentTime >= breakStart && currentTime < breakEnd)) {
        const startTime = formatMinutesToTime(currentTime)
        const endTime = formatMinutesToTime(currentTime + config.slot_duration)
        
        schedules.push({
          doctor_id: config.doctor_id,
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          status: 'available'
        })
      }
      currentTime += config.slot_duration
    }

    // 批量插入日程
    for (const schedule of schedules) {
      await sql`
        INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, status)
        VALUES (${schedule.doctor_id}, ${schedule.date}, ${schedule.start_time}, ${schedule.end_time}, ${schedule.status})
      `
    }

    return schedules.length
  } catch (error) {
    console.error('生成自动日程失败:', error)
    return 0
  }
}

// 辅助函数：将时间字符串转换为分钟数
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// 辅助函数：将分钟数转换为时间字符串
function formatMinutesToTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

async function runAutoScheduleGeneration() {
  try {
    console.log('开始自动生成医生日程...')
    
    // 获取所有启用自动日程的医生配置
    const configs = await getEnabledAutoScheduleConfigs()
    
    if (configs.length === 0) {
      console.log('没有启用自动日程的医生')
      return
    }

    console.log(`找到 ${configs.length} 个启用自动日程的医生`)

    let totalGenerated = 0
    const results = []

    // 为每个启用的医生生成日程
    for (const config of configs) {
      let doctorGenerated = 0
      
      // 为接下来的advance_days天生成日程
      for (let i = 1; i <= config.advance_days; i++) {
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + i)
        
        const generated = await generateAutoSchedules(config, targetDate)
        doctorGenerated += generated
      }
      
      totalGenerated += doctorGenerated
      results.push({
        doctor_id: config.doctor_id,
        generated: doctorGenerated
      })
      
      console.log(`医生 ID ${config.doctor_id}: 生成了 ${doctorGenerated} 个时间段`)
    }

    console.log(`\n🎉 自动日程生成完成！`)
    console.log(`- 处理医生数: ${configs.length}`)
    console.log(`- 总生成时间段数: ${totalGenerated}`)
    
    return {
      success: true,
      generated: totalGenerated,
      doctors: configs.length,
      details: results
    }

  } catch (error) {
    console.error('❌ 自动生成日程失败:', error)
    throw error
  }
}

// 运行脚本
if (require.main === module) {
  runAutoScheduleGeneration()
    .then((result) => {
      console.log('\n脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { runAutoScheduleGeneration }