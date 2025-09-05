import { NextRequest, NextResponse } from 'next/server'
import { getUserById, getDoctorProfile, updateDoctorProfile } from '@/app/lib/database'
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
  
  if (!user) {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '认证失败'
    }, { status: 401 })
  }

  try {
    // 获取基础用户信息
    const userInfo = await getUserById(user.userId)

    if (!userInfo) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '用户不存在'
      }, { status: 404 })
    }

    let profile = null

    // 获取扩展信息（目前主要支持医生）
    if (user.role === 'doctor') {
      profile = await getDoctorProfile(user.userId)
    }

    // 合并用户信息和扩展信息
    const responseData = profile ? { ...userInfo, ...profile } : userInfo

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: responseData
    })

  } catch (error) {
    console.error('获取用户资料错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    // 目前主要支持医生资料更新
    if (user.role === 'doctor') {
      const success = await updateDoctorProfile(user.userId, body)
      
      if (success) {
        return NextResponse.json<ApiResponse>({
          success: true,
          message: '资料更新成功'
        })
      } else {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: '更新失败'
        }, { status: 400 })
      }
    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '暂不支持此角色的资料更新'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('更新用户资料错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}