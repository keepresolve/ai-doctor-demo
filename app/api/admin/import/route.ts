import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, existsSync, copyFileSync } from 'fs'
import { verifyToken } from '@/app/lib/auth'
import { ApiResponse } from '@/app/types'
import path from 'path'

export async function POST(request: NextRequest) {
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
      message: '权限不足，需要管理员权限'
    }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('database') as File
    
    if (!file) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '请选择要导入的数据库文件'
      }, { status: 400 })
    }

    // 检查文件类型
    if (!file.name.endsWith('.db')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '只支持.db格式的SQLite数据库文件'
      }, { status: 400 })
    }

    // 备份当前数据库
    const currentDbPath = path.join(process.cwd(), 'data.db')
    if (existsSync(currentDbPath)) {
      const backupDir = path.join(process.cwd(), 'backups')
      if (!existsSync(backupDir)) {
        require('fs').mkdirSync(backupDir, { recursive: true })
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const backupPath = path.join(backupDir, `data-backup-before-import-${timestamp}.db`)
      copyFileSync(currentDbPath, backupPath)
    }

    // 读取上传的文件内容
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 替换当前数据库文件
    writeFileSync(currentDbPath, buffer)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '数据库导入成功，原数据库已自动备份'
    })

  } catch (error) {
    console.error('数据导入错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '数据导入失败'
    }, { status: 500 })
  }
}