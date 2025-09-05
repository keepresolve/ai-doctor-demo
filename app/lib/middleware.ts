import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload } from '@/app/lib/auth'
import { UserRole } from '@/app/types'

export function requireAuth(allowedRoles?: UserRole[]) {
  return async function(request: NextRequest, handler: Function) {
    try {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({
          success: false,
          message: '未提供认证令牌'
        }, { status: 401 })
      }

      const token = authHeader.substring(7)
      const payload = verifyToken(token)
      
      if (!payload) {
        return NextResponse.json({
          success: false,
          message: '无效的认证令牌'
        }, { status: 401 })
      }

      if (allowedRoles && !allowedRoles.includes(payload.role)) {
        return NextResponse.json({
          success: false,
          message: '权限不足'
        }, { status: 403 })
      }

      // 将用户信息添加到请求中
      (request as any).user = payload
      return handler(request)
      
    } catch (error) {
      console.error('认证中间件错误:', error)
      return NextResponse.json({
        success: false,
        message: '认证失败'
      }, { status: 500 })
    }
  }
}

export function getAuthUser(request: NextRequest): JWTPayload | null {
  return (request as any).user || null
}