import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, getUsersByRole, getUserByPhone, createUser, createDoctorProfile, deleteUser } from '@/app/lib/database'
import { verifyToken } from '@/app/lib/auth'
import { hashPassword } from '@/app/lib/auth'
import { ApiResponse } from '@/app/types'

async function handleGetUsers(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    let users
    if (role) {
      users = await getUsersByRole(role)
    } else {
      users = await getAllUsers()
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: users
    })

  } catch (error) {
    console.error('获取用户列表错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

async function handleCreateUser(request: NextRequest) {
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
    const body = await request.json()
    const { 
      phone, 
      password, 
      name, 
      role, 
      specialty, 
      license_number, 
      description, 
      experience_years 
    } = body

    if (!phone || !password || !name || !role) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '手机号、密码、姓名和角色不能为空'
      }, { status: 400 })
    }

    if (role === 'doctor' && (!specialty || !license_number)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '医生角色需要专科和执业证书号'
      }, { status: 400 })
    }

    // 检查用户是否已存在
    const existingUser = await getUserByPhone(phone)

    if (existingUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '该手机号已注册'
      }, { status: 409 })
    }

    // 创建用户
    const hashedPassword = await hashPassword(password)
    const newUser = await createUser(phone, hashedPassword, name, role)

    // 创建角色相关信息
    if (role === 'doctor') {
      await createDoctorProfile(
        newUser.id, 
        specialty, 
        license_number, 
        description || '', 
        experience_years || 0
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '用户创建成功',
      data: { id: newUser.id }
    })

  } catch (error) {
    console.error('创建用户错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

async function handleDeleteUser(request: NextRequest) {
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
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '用户ID不能为空'
      }, { status: 400 })
    }

    const success = await deleteUser(userId)

    if (success) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: '用户删除成功'
      })
    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '用户删除失败'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('删除用户错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleGetUsers(request)
}

export async function POST(request: NextRequest) {
  return handleCreateUser(request)
}

export async function DELETE(request: NextRequest) {
  return handleDeleteUser(request)
}