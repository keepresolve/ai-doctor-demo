import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/app/lib/database'
import { verifyToken } from '@/app/lib/auth'
import { ApiResponse } from '@/app/types'

async function handleGetAppointments(request: NextRequest) {
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
  
  if (!user) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '认证失败'
    }, { status: 401 })
  }

  try {
    const db = getDatabase()
    let sql = `
      SELECT 
        a.*,
        p.name as patient_name,
        p.phone as patient_phone,
        d.name as doctor_name,
        dp.specialty as doctor_specialty
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
      WHERE 1=1
    `
    const params: any[] = []

    if (user.role === 'patient') {
      sql += ' AND a.patient_id = ?'
      params.push(user.userId)
    } else if (user.role === 'doctor') {
      sql += ' AND a.doctor_id = ?'
      params.push(user.userId)
    }

    sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC'

    const appointments = await db.query(sql, params)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: appointments
    })

  } catch (error) {
    console.error('获取预约错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

async function handleCreateAppointment(request: NextRequest) {
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
  
  if (!user || user.role !== 'patient') {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '只有患者可以创建预约'
    }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { doctor_id, appointment_date, appointment_time, symptoms } = body

    if (!doctor_id || !appointment_date || !appointment_time) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '医生、日期和时间不能为空'
      }, { status: 400 })
    }

    const db = getDatabase()

    // 检查医生是否存在且可用
    const doctorSchedule = await db.get(`
      SELECT id FROM doctor_schedules 
      WHERE doctor_id = ? AND date = ? AND start_time = ? AND status = 'available'
    `, [doctor_id, appointment_date, appointment_time])

    if (!doctorSchedule) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '该时间段不可预约'
      }, { status: 400 })
    }

    // 检查时间冲突
    const conflict = await db.get(`
      SELECT id FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
      AND status != 'cancelled'
    `, [doctor_id, appointment_date, appointment_time])

    if (conflict) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '该时间段已被预约'
      }, { status: 409 })
    }

    // 检查患者是否有重复预约
    const patientConflict = await db.get(`
      SELECT id FROM appointments 
      WHERE patient_id = ? AND appointment_date = ? AND appointment_time = ?
      AND status != 'cancelled'
    `, [user.userId, appointment_date, appointment_time])

    if (patientConflict) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '您在该时间段已有预约'
      }, { status: 409 })
    }

    // 创建预约
    const result = await db.run(`
      INSERT INTO appointments 
      (patient_id, doctor_id, appointment_date, appointment_time, symptoms, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [user.userId, doctor_id, appointment_date, appointment_time, symptoms || null])

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '预约创建成功',
      data: { id: result.id }
    })

  } catch (error) {
    console.error('创建预约错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleGetAppointments(request)
}

export async function POST(request: NextRequest) {
  return handleCreateAppointment(request)
}