import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/app/lib/database'
import { ApiResponse } from '@/app/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const db = getDatabase()
    
    let sql = `
      SELECT 
        u.id,
        u.name,
        u.phone,
        dp.specialty,
        dp.description,
        dp.experience_years
      FROM users u
      JOIN doctor_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'doctor'
    `
    
    const doctors = await db.query(sql)

    // 如果指定了日期，获取医生的可用时间
    if (date) {
      for (let doctor of doctors) {
        const schedules = await db.query(`
          SELECT id, start_time, end_time, status
          FROM doctor_schedules 
          WHERE doctor_id = ? AND date = ? AND status = 'available'
          ORDER BY start_time
        `, [doctor.id, date])

        // 检查哪些时间段还没有被预约
        const availableSlots = []
        for (let schedule of schedules) {
          const isBooked = await db.get(`
            SELECT id FROM appointments 
            WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
            AND status != 'cancelled'
          `, [doctor.id, date, schedule.start_time])

          if (!isBooked) {
            availableSlots.push(schedule)
          }
        }

        doctor.available_slots = availableSlots
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: doctors
    })

  } catch (error) {
    console.error('获取医生列表错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}