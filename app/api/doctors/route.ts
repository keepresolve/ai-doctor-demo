import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { ApiResponse } from '@/app/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    const { rows: doctors } = await sql`
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

    // 如果指定了日期，获取医生的可用时间
    if (date) {
      for (let doctor of doctors) {
        const { rows: schedules } = await sql`
          SELECT id, start_time, end_time, is_available
          FROM doctor_schedules 
          WHERE doctor_id = ${doctor.id} 
            AND day_of_week = EXTRACT(DOW FROM ${date}::date)
            AND is_available = true
          ORDER BY start_time
        `

        // 检查哪些时间段还没有被预约
        const availableSlots = []
        for (let schedule of schedules) {
          const { rows: bookings } = await sql`
            SELECT id FROM appointments 
            WHERE doctor_id = ${doctor.id} 
              AND appointment_date = ${date}
              AND appointment_time = ${schedule.start_time}
              AND status != 'cancelled'
            LIMIT 1
          `

          if (bookings.length === 0) {
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