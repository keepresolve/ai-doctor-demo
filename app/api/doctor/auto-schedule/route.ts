import { NextRequest, NextResponse } from 'next/server'
import { 
  getDoctorAutoScheduleConfig, 
  createDoctorAutoScheduleConfig, 
  updateDoctorAutoScheduleConfig 
} from '@/app/lib/database'
import { verifyToken } from '@/app/lib/auth'
import { ApiResponse } from '@/app/types'

async function handleGetAutoScheduleConfig(request: NextRequest) {
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
    const config = await getDoctorAutoScheduleConfig(user.userId)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: config
    })

  } catch (error) {
    console.error('获取自动日程配置错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

async function handleCreateOrUpdateAutoScheduleConfig(request: NextRequest) {
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
    const { 
      enabled, 
      work_days, 
      work_start_time, 
      work_end_time, 
      slot_duration, 
      break_start_time, 
      break_end_time, 
      advance_days 
    } = body

    // 基本验证
    if (work_days && (!Array.isArray(work_days) || work_days.some(day => day < 1 || day > 7))) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '工作日设置不正确，应为1-7的数组'
      }, { status: 400 })
    }

    if (slot_duration && (slot_duration < 10 || slot_duration > 120)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '时间段长度应在10-120分钟之间'
      }, { status: 400 })
    }

    // 检查是否已有配置
    const existingConfig = await getDoctorAutoScheduleConfig(user.userId)
    
    let result
    if (existingConfig) {
      // 更新现有配置
      const success = await updateDoctorAutoScheduleConfig(user.userId, {
        enabled,
        work_days,
        work_start_time,
        work_end_time,
        slot_duration,
        break_start_time,
        break_end_time,
        advance_days
      })
      
      if (!success) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: '更新配置失败'
        }, { status: 500 })
      }
      
      result = await getDoctorAutoScheduleConfig(user.userId)
    } else {
      // 创建新配置
      result = await createDoctorAutoScheduleConfig(user.userId, {
        enabled,
        work_days,
        work_start_time,
        work_end_time,
        slot_duration,
        break_start_time,
        break_end_time,
        advance_days
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: existingConfig ? '配置更新成功' : '配置创建成功',
      data: result
    })

  } catch (error) {
    console.error('保存自动日程配置错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleGetAutoScheduleConfig(request)
}

export async function POST(request: NextRequest) {
  return handleCreateOrUpdateAutoScheduleConfig(request)
}

export async function PUT(request: NextRequest) {
  return handleCreateOrUpdateAutoScheduleConfig(request)
}