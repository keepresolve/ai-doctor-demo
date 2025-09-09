require('dotenv').config({ path: '.env.local' })
const { sql } = require('@vercel/postgres')

async function checkGeneratedSchedules() {
  try {
    console.log('检查生成的日程...')

    // 检查生成的日程
    const { rows: schedules } = await sql`
      SELECT 
        date, 
        start_time, 
        end_time, 
        status,
        COUNT(*) as count
      FROM doctor_schedules 
      WHERE doctor_id = 2
      GROUP BY date, start_time, end_time, status
      ORDER BY date, start_time
      LIMIT 20
    `
    
    console.log(`\n找到 ${schedules.length} 个不同的时间段配置`)
    console.log('\n前20个时间段:')
    schedules.forEach(schedule => {
      console.log(`${schedule.date} ${schedule.start_time}-${schedule.end_time} (${schedule.status}) x${schedule.count}`)
    })

    // 统计按日期
    const { rows: dateStats } = await sql`
      SELECT 
        date,
        COUNT(*) as slot_count
      FROM doctor_schedules 
      WHERE doctor_id = 2
      GROUP BY date
      ORDER BY date
      LIMIT 10
    `
    
    console.log('\n按日期统计:')
    dateStats.forEach(stat => {
      const date = new Date(stat.date)
      const weekday = ['周日','周一','周二','周三','周四','周五','周六'][date.getDay()]
      console.log(`${stat.date} (${weekday}): ${stat.slot_count} 个时间段`)
    })

    // 总计
    const { rows: total } = await sql`
      SELECT COUNT(*) as total FROM doctor_schedules WHERE doctor_id = 2
    `
    
    console.log(`\n总计: ${total[0].total} 个时间段`)

  } catch (error) {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  }
}

checkGeneratedSchedules()
  .then(() => {
    console.log('\n检查完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n检查失败:', error)
    process.exit(1)
  })