import { NextRequest, NextResponse } from 'next/server'
import { getUserByPhone, createUser } from '@/app/lib/database'
import { hashPassword, generateToken, validatePhone, validatePassword } from '@/app/lib/auth'
import { AuthResponse, RegisterRequest } from '@/app/types'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    const { phone, password, name, gender, birth_date, emergency_contact } = body

    if (!phone || !password || !name) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: '手机号、密码和姓名不能为空'
      }, { status: 400 })
    }

    if (!validatePhone(phone)) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: '手机号格式不正确'
      }, { status: 400 })
    }

    if (!validatePassword(password)) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: '密码至少6位'
      }, { status: 400 })
    }

    if (emergency_contact && !validatePhone(emergency_contact)) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: '紧急联系人手机号格式不正确'
      }, { status: 400 })
    }

    // 检查用户是否已存在
    const existingUser = await getUserByPhone(phone)

    if (existingUser) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: '该手机号已注册'
      }, { status: 409 })
    }

    // 创建用户
    const hashedPassword = await hashPassword(password)
    const user = await createUser(phone, hashedPassword, name, 'patient')

    const token = generateToken({
      id: user.id,
      phone,
      password_hash: hashedPassword,
      name,
      role: 'patient',
      created_at: user.created_at
    })

    return NextResponse.json<AuthResponse>({
      success: true,
      message: '注册成功',
      user: {
        id: user.id,
        phone,
        name,
        role: 'patient'
      },
      token
    })

  } catch (error) {
    console.error('注册错误:', error)
    return NextResponse.json<AuthResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}