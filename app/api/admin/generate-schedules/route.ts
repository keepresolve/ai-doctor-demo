import { NextRequest, NextResponse } from 'next/server'
import { getEnabledAutoScheduleConfigs, generateAutoSchedules } from '@/app/lib/database'
import { verifyToken } from '@/app/lib/auth'
import { ApiResponse } from '@/app/types'

// 生成指定日期范围的自动日程
async function handleGenerateSchedules(request: NextRequest) {
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
      message: '权限不足，仅管理员可访问'
    }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const daysAhead = parseInt(searchParams.get('days') || '7') // 默认生成7天
    
    if (daysAhead < 1 || daysAhead > 90) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '天数参数应在1-90之间'
      }, { status: 400 })
    }

    // 获取所有启用自动日程的医生配置
    const configs = await getEnabledAutoScheduleConfigs()
    
    if (configs.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: '没有启用自动日程的医生',
        data: { generated: 0, doctors: 0 }
      })
    }

    let totalGenerated = 0
    const results = []

    // 为每个启用的医生生成日程
    for (const config of configs) {
      let doctorGenerated = 0
      
      // 为接下来的N天生成日程
      for (let i = 1; i <= daysAhead; i++) {
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
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `自动日程生成完成，共生成${totalGenerated}个时间段`,
      data: {
        generated: totalGenerated,
        doctors: configs.length,
        details: results
      }
    })

  } catch (error) {
    console.error('生成自动日程错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

// 单独为某个医生生成日程
async function handleGenerateForDoctor(request: NextRequest) {
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
  
  if (!user || (user.role !== 'admin' && user.role !== 'doctor')) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '权限不足'
    }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { doctor_id, days = 7 } = body
    
    // 如果是医生角色，只能为自己生成
    if (user.role === 'doctor' && user.userId !== doctor_id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '医生只能为自己生成日程'
      }, { status: 403 })
    }

    if (!doctor_id || days < 1 || days > 90) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '参数错误'
      }, { status: 400 })
    }

    // 获取医生的自动日程配置
    const configs = await getEnabledAutoScheduleConfigs()
    const config = configs.find(c => c.doctor_id === doctor_id)
    
    if (!config) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '该医生未启用自动日程或配置不存在'
      }, { status: 404 })
    }

    let totalGenerated = 0
    
    // 为接下来的N天生成日程
    for (let i = 1; i <= days; i++) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + i)
      
      const generated = await generateAutoSchedules(config, targetDate)
      totalGenerated += generated
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `为医生生成${totalGenerated}个时间段`,
      data: { 
        doctor_id,
        generated: totalGenerated 
      }
    })

  } catch (error) {
    console.error('为医生生成日程错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleGenerateSchedules(request)
}

export async function POST(request: NextRequest) {
  return handleGenerateForDoctor(request)
}