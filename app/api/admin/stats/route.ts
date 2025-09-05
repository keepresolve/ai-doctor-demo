import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/app/lib/database'
import { verifyToken } from '@/app/lib/auth'
import { ApiResponse } from '@/app/types'

export async function GET(request: NextRequest) {
  // 认证检查
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '未提供认证令牌'
    }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const user = verifyToken(token)
  
  if (!user || user.role !== 'admin') {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '权限不足'
    }, { status: 403 })
  }

  try {
    const db = getDatabase()
    
    // 获取患者总数
    const patientsCount = await db.get(`
      SELECT COUNT(*) as count FROM users WHERE role = 'patient'
    `)

    // 获取医生总数
    const doctorsCount = await db.get(`
      SELECT COUNT(*) as count FROM users WHERE role = 'doctor'
    `)

    // 获取预约总数
    const appointmentsCount = await db.get(`
      SELECT COUNT(*) as count FROM appointments
    `)

    // 获取今日预约数量
    const todayAppointments = await db.get(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE DATE(appointment_date) = DATE('now', 'localtime')
    `)

    // 获取各状态预约数量
    const appointmentsByStatus = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM appointments 
      GROUP BY status
    `)

    // 获取最近7天的预约趋势
    const appointmentTrend = await db.query(`
      SELECT 
        DATE(appointment_date) as date,
        COUNT(*) as count
      FROM appointments 
      WHERE appointment_date >= DATE('now', '-7 days', 'localtime')
      GROUP BY DATE(appointment_date)
      ORDER BY date
    `)

    // 获取医生预约排行
    const doctorStats = await db.query(`
      SELECT 
        u.name,
        dp.specialty,
        COUNT(a.id) as appointment_count
      FROM users u
      LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
      LEFT JOIN appointments a ON u.id = a.doctor_id
      WHERE u.role = 'doctor'
      GROUP BY u.id, u.name, dp.specialty
      ORDER BY appointment_count DESC
      LIMIT 10
    `)

    const stats = {
      totalPatients: patientsCount.count,
      totalDoctors: doctorsCount.count,
      totalAppointments: appointmentsCount.count,
      todayAppointments: todayAppointments.count,
      appointmentsByStatus: appointmentsByStatus.reduce((acc: any, item) => {
        acc[item.status] = item.count
        return acc
      }, {}),
      appointmentTrend,
      doctorStats
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: stats
    })

  } catch (error) {
    console.error('获取统计数据错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}