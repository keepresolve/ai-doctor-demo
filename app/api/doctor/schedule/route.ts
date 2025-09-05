import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/app/lib/database'
import { verifyToken } from '@/app/lib/auth'
import { ApiResponse } from '@/app/types'

async function handleGetSchedule(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const month = searchParams.get('month')

  try {
    const db = getDatabase()
    let sql = 'SELECT * FROM doctor_schedules WHERE doctor_id = ?'
    const params: any[] = [user.userId]

    if (date) {
      sql += ' AND date = ?'
      params.push(date)
    } else if (month) {
      sql += ' AND strftime("%Y-%m", date) = ?'
      params.push(month)
    }

    sql += ' ORDER BY date, start_time'

    const schedules = await db.query(sql, params)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: schedules
    })

  } catch (error) {
    console.error('获取日程错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

async function handleCreateSchedule(request: NextRequest) {
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
  
  if (!user || user.role !== 'doctor') {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '权限不足'
    }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { date, start_time, end_time, status } = body

    if (!date || !start_time || !end_time) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '日期、开始时间和结束时间不能为空'
      }, { status: 400 })
    }

    const db = getDatabase()
    
    // 检查时间冲突
    const conflict = await db.get(`
      SELECT id FROM doctor_schedules 
      WHERE doctor_id = ? AND date = ? 
      AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `, [user.userId, date, start_time, start_time, end_time, end_time, start_time, end_time])

    if (conflict) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '时间段冲突'
      }, { status: 409 })
    }

    const result = await db.run(`
      INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, status)
      VALUES (?, ?, ?, ?, ?)
    `, [user.userId, date, start_time, end_time, status || 'available'])

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '创建成功',
      data: { id: result.id }
    })

  } catch (error) {
    console.error('创建日程错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleGetSchedule(request)
}

export async function POST(request: NextRequest) {
  return handleCreateSchedule(request)
}