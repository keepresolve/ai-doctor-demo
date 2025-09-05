import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/app/lib/database'
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

    const db = getDatabase()

    // 检查用户是否已存在
    const existingUser = await db.get(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    )

    if (existingUser) {
      return NextResponse.json<AuthResponse>({
        success: false,
        message: '该手机号已注册'
      }, { status: 409 })
    }

    // 创建用户
    const hashedPassword = await hashPassword(password)
    const userResult = await db.run(
      'INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)',
      [phone, hashedPassword, name, 'patient']
    )

    // 创建患者扩展信息
    await db.run(`
      INSERT INTO patient_profiles (user_id, gender, birth_date, emergency_contact)
      VALUES (?, ?, ?, ?)
    `, [userResult.id, gender || null, birth_date || null, emergency_contact || null])

    const token = generateToken({
      id: userResult.id!,
      phone,
      password: hashedPassword,
      name,
      role: 'patient',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    return NextResponse.json<AuthResponse>({
      success: true,
      message: '注册成功',
      user: {
        id: userResult.id!,
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