import { NextRequest, NextResponse } from 'next/server'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
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
    const dbPath = path.join(process.cwd(), 'data.db')
    
    if (!existsSync(dbPath)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '数据库文件不存在'
      }, { status: 404 })
    }

    // 创建备份目录
    const backupDir = path.join(process.cwd(), 'backups')
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true })
    }

    // 生成备份文件名（包含时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupFilename = `data-backup-${timestamp}.db`
    const backupPath = path.join(backupDir, backupFilename)

    // 复制数据库文件到备份目录
    copyFileSync(dbPath, backupPath)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '数据备份成功',
      data: {
        backupFile: backupFilename,
        backupPath: backupPath,
        timestamp: timestamp
      }
    })

  } catch (error) {
    console.error('数据备份错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '数据备份失败'
    }, { status: 500 })
  }
}

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
  
  if (!user || user.role !== 'admin') {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '权限不足，需要管理员权限'
    }, { status: 403 })
  }

  try {
    const backupDir = path.join(process.cwd(), 'backups')
    
    if (!existsSync(backupDir)) {
      return NextResponse.json<ApiResponse>({
        success: true,
        message: '获取成功',
        data: []
      })
    }

    // 读取备份目录中的所有文件
    const files = readdirSync(backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file)
        const stats = statSync(filePath)
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString()
        }
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: files
    })

  } catch (error) {
    console.error('获取备份列表错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '获取备份列表失败'
    }, { status: 500 })
  }
}