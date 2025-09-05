import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/app/lib/database'
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
    const db = getDatabase()
    
    // 获取基础用户信息
    const userInfo = await db.get(`
      SELECT id, phone, name, role, created_at FROM users WHERE id = ?
    `, [user.userId])

    if (!userInfo) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '用户不存在'
      }, { status: 404 })
    }

    let profile = null

    // 获取扩展信息
    if (user.role === 'patient') {
      profile = await db.get(`
        SELECT * FROM patient_profiles WHERE user_id = ?
      `, [user.userId])
    } else if (user.role === 'doctor') {
      profile = await db.get(`
        SELECT * FROM doctor_profiles WHERE user_id = ?
      `, [user.userId])
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: {
        ...userInfo,
        profile
      }
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
    const db = getDatabase()

    // 更新基础用户信息
    if (body.name) {
      await db.run(`
        UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [body.name, user.userId])
    }

    // 更新扩展信息
    if (user.role === 'patient') {
      const { gender, birth_date, emergency_contact, medical_history } = body

      // 检查患者资料是否存在
      const existingProfile = await db.get(`
        SELECT id FROM patient_profiles WHERE user_id = ?
      `, [user.userId])

      if (existingProfile) {
        // 更新现有资料
        let updateFields: string[] = []
        let updateParams: any[] = []

        if (gender !== undefined) {
          updateFields.push('gender = ?')
          updateParams.push(gender)
        }

        if (birth_date !== undefined) {
          updateFields.push('birth_date = ?')
          updateParams.push(birth_date)
        }

        if (emergency_contact !== undefined) {
          updateFields.push('emergency_contact = ?')
          updateParams.push(emergency_contact)
        }

        if (medical_history !== undefined) {
          updateFields.push('medical_history = ?')
          updateParams.push(medical_history)
        }

        if (updateFields.length > 0) {
          updateFields.push('updated_at = CURRENT_TIMESTAMP')
          updateParams.push(user.userId)

          await db.run(`
            UPDATE patient_profiles 
            SET ${updateFields.join(', ')}
            WHERE user_id = ?
          `, updateParams)
        }
      } else {
        // 创建新的患者资料
        await db.run(`
          INSERT INTO patient_profiles (user_id, gender, birth_date, emergency_contact, medical_history)
          VALUES (?, ?, ?, ?, ?)
        `, [user.userId, gender || null, birth_date || null, emergency_contact || null, medical_history || null])
      }

    } else if (user.role === 'doctor') {
      const { specialty, license_number, description, experience_years } = body

      // 检查医生资料是否存在
      const existingProfile = await db.get(`
        SELECT id FROM doctor_profiles WHERE user_id = ?
      `, [user.userId])

      if (existingProfile) {
        // 更新现有资料
        let updateFields: string[] = []
        let updateParams: any[] = []

        if (specialty !== undefined) {
          updateFields.push('specialty = ?')
          updateParams.push(specialty)
        }

        if (license_number !== undefined) {
          updateFields.push('license_number = ?')
          updateParams.push(license_number)
        }

        if (description !== undefined) {
          updateFields.push('description = ?')
          updateParams.push(description)
        }

        if (experience_years !== undefined) {
          updateFields.push('experience_years = ?')
          updateParams.push(experience_years)
        }

        if (updateFields.length > 0) {
          updateFields.push('updated_at = CURRENT_TIMESTAMP')
          updateParams.push(user.userId)

          await db.run(`
            UPDATE doctor_profiles 
            SET ${updateFields.join(', ')}
            WHERE user_id = ?
          `, updateParams)
        }
      } else {
        // 创建新的医生资料
        if (specialty && license_number) {
          await db.run(`
            INSERT INTO doctor_profiles (user_id, specialty, license_number, description, experience_years)
            VALUES (?, ?, ?, ?, ?)
          `, [user.userId, specialty, license_number, description || null, experience_years || 0])
        }
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '资料更新成功'
    })

  } catch (error) {
    console.error('更新用户资料错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}