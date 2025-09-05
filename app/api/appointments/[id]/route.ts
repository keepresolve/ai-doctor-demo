import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/app/lib/database'
import { verifyToken } from '@/app/lib/auth'
import { ApiResponse } from '@/app/types'

async function handleUpdateAppointment(request: NextRequest, { params }: { params: { id: string } }) {
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
    const body = await request.json()
    const { status, diagnosis, prescription, notes } = body
    const appointmentId = params.id

    const db = getDatabase()

    // 获取现有预约信息
    const appointment = await db.get(`
      SELECT * FROM appointments WHERE id = ?
    `, [appointmentId])

    if (!appointment) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '预约不存在'
      }, { status: 404 })
    }

    // 权限检查
    if (user.role === 'patient' && appointment.patient_id !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '权限不足'
      }, { status: 403 })
    }

    if (user.role === 'doctor' && appointment.doctor_id !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '权限不足'
      }, { status: 403 })
    }

    // 更新预约
    let updateFields: string[] = []
    let updateParams: any[] = []

    if (status) {
      updateFields.push('status = ?')
      updateParams.push(status)
    }

    if (diagnosis !== undefined) {
      updateFields.push('diagnosis = ?')
      updateParams.push(diagnosis)
    }

    if (prescription !== undefined) {
      updateFields.push('prescription = ?')
      updateParams.push(prescription)
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?')
      updateParams.push(notes)
    }

    if (updateFields.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '没有需要更新的字段'
      }, { status: 400 })
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateParams.push(appointmentId)

    await db.run(`
      UPDATE appointments 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateParams)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '预约更新成功'
    })

  } catch (error) {
    console.error('更新预约错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

async function handleGetAppointment(request: NextRequest, { params }: { params: { id: string } }) {
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
    const appointmentId = params.id
    const db = getDatabase()

    const appointment = await db.get(`
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
      WHERE a.id = ?
    `, [appointmentId])

    if (!appointment) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '预约不存在'
      }, { status: 404 })
    }

    // 权限检查
    if (user.role === 'patient' && appointment.patient_id !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '权限不足'
      }, { status: 403 })
    }

    if (user.role === 'doctor' && appointment.doctor_id !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '权限不足'
      }, { status: 403 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: appointment
    })

  } catch (error) {
    console.error('获取预约详情错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

async function handleDeleteAppointment(request: NextRequest, { params }: { params: { id: string } }) {
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
    const appointmentId = params.id
    const db = getDatabase()

    // 获取预约信息
    const appointment = await db.get(`
      SELECT * FROM appointments WHERE id = ?
    `, [appointmentId])

    if (!appointment) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '预约不存在'
      }, { status: 404 })
    }

    // 权限检查
    if (user.role === 'patient' && appointment.patient_id !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '权限不足'
      }, { status: 403 })
    }

    if (user.role === 'doctor' && appointment.doctor_id !== user.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '权限不足'
      }, { status: 403 })
    }

    if (user.role !== 'admin' && user.role !== 'doctor') {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '权限不足'
      }, { status: 403 })
    }

    // 更新为取消状态而不是删除
    await db.run(`
      UPDATE appointments 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [appointmentId])

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '预约已取消'
    })

  } catch (error) {
    console.error('取消预约错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest, context: any) {
  return handleGetAppointment(request, context)
}

export async function PUT(request: NextRequest, context: any) {
  return handleUpdateAppointment(request, context)
}

export async function DELETE(request: NextRequest, context: any) {
  return handleDeleteAppointment(request, context)
}