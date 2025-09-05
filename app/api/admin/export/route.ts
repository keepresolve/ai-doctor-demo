import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { verifyToken } from '@/app/lib/auth'
import { ApiResponse } from '@/app/types'
import path from 'path'

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
    // 获取查询参数
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'db'

    if (format === 'db') {
      // 导出SQLite数据库文件
      const dbPath = path.join(process.cwd(), 'data.db')
      
      if (!existsSync(dbPath)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          message: '数据库文件不存在'
        }, { status: 404 })
      }

      // 读取数据库文件
      const dbBuffer = readFileSync(dbPath)
      
      // 生成文件名（包含时间戳）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `ai-doctor-demo-${timestamp}.db`

      // 返回数据库文件
      return new NextResponse(dbBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': dbBuffer.length.toString(),
        },
      })
    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: '不支持的导出格式'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('数据导出错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '数据导出失败'
    }, { status: 500 })
  }
}