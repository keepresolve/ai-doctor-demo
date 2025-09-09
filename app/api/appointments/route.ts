import { NextRequest, NextResponse } from 'next/server'
import { getAppointmentsWithDetails, createAppointment, checkAppointmentConflict } from '@/app/lib/database'
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
    const appointments = await getAppointmentsWithDetails(user.userId, user.role)

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

    // 检查时间冲突
    const conflicts = await checkAppointmentConflict(doctor_id, user.userId, appointment_date, appointment_time)

    if (!conflicts.scheduleAvailable) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '该时间段不可预约'
      }, { status: 400 })
    }

    if (conflicts.doctorConflict) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '该时间段已被预约'
      }, { status: 409 })
    }

    if (conflicts.patientConflict) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '您在该时间段已有预约'
      }, { status: 409 })
    }

    // 创建预约
    const appointment = await createAppointment(user.userId, doctor_id, appointment_date, appointment_time, symptoms || '')

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '预约创建成功',
      data: appointment
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