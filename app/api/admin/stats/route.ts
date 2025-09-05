import { NextRequest, NextResponse } from 'next/server'
import { getStats } from '@/app/lib/database'
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
  
  if (!user || user.role !== 'admin') {
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '权限不足'
    }, { status: 403 })
  }

  try {
    const stats = await getStats()

    return NextResponse.json<ApiResponse>({
      success: true,
      message: '获取成功',
      data: stats
    })

  } catch (error) {
    console.error('获取统计数据错误:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 })
  }
}