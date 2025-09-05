import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/app/lib/database'
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

    const db = getDatabase()
    let sql = 'SELECT id, phone, name, role, created_at FROM users WHERE 1=1'
    const params: any[] = []

    if (role) {
      sql += ' AND role = ?'
      params.push(role)
    }

    sql += ' ORDER BY created_at DESC'

    const users = await db.query(sql, params)

    // 获取扩展信息
    for (let user of users) {
      if (user.role === 'doctor') {
        const profile = await db.get(
          'SELECT * FROM doctor_profiles WHERE user_id = ?',
          [user.id]
        )
        user.profile = profile
      } else if (user.role === 'patient') {
        const profile = await db.get(
          'SELECT * FROM patient_profiles WHERE user_id = ?',
          [user.id]
        )
        user.profile = profile
      }
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

    const db = getDatabase()

    // 检查用户是否已存在
    const existingUser = await db.get(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    )

    if (existingUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '该手机号已注册'
      }, { status: 409 })
    }

    // 创建用户
    const hashedPassword = await hashPassword(password)
    const userResult = await db.run(
      'INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)',
      [phone, hashedPassword, name, role]
    )

    // 创建角色相关信息
    if (role === 'doctor') {
      await db.run(`
        INSERT INTO doctor_profiles (user_id, specialty, license_number, description, experience_years)
        VALUES (?, ?, ?, ?, ?)
      `, [userResult.id, specialty, license_number, description || null, experience_years || 0])
    } else if (role === 'patient') {
      await db.run(`
        INSERT INTO patient_profiles (user_id)
        VALUES (?)
      `, [userResult.id])
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '用户创建成功',
      data: { id: userResult.id }
    })

  } catch (error) {
    console.error('创建用户错误:', error)
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