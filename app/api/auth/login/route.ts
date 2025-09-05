import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/app/lib/database'
import { comparePassword, generateToken, validatePhone } from '@/app/lib/auth'
import { AuthResponse, LoginRequest, User } from '@/app/types'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: '手机号和密码不能为空'
      }, { status: 400 })
    }

    if (!validatePhone(phone)) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: '手机号格式不正确'
      }, { status: 400 })
    }

    const db = getDatabase()
    const user = await db.get(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    ) as User

    if (!user) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: '用户不存在'
      }, { status: 404 })
    }

    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: '密码不正确'
      }, { status: 401 })
    }

    const token = generateToken(user)

    return NextResponse.json<AuthResponse>({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role
      },
      token
    })

  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json<AuthResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}