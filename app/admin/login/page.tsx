'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FormInput from '@/app/components/FormInput'
import { AuthResponse } from '@/app/types'

export default function AdminLoginPage() {
  const [phone, setPhone] = useState('13800000001')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      })

      const result: AuthResponse = await response.json()

      if (result.success && result.user && result.token) {
        // 检查用户角色
        if (result.user.role !== 'admin') {
          setError('请使用管理员身份登录')
          return
        }

        // 保存token和用户信息
        localStorage.setItem('token', result.token)
        localStorage.setItem('user', JSON.stringify(result.user))
        
        // 跳转到管理员主页
        router.push('/admin/dashboard')
      } else {
        setError(result.message || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            管理员登录
          </h1>
          <p className="text-gray-600">
            请输入管理员账号信息
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="手机号"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="请输入手机号"
            required
          />

          <FormInput
            label="密码"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="请输入密码"
            required
          />

          <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-md text-sm">
            <p>默认管理员账号:</p>
            <p>手机号: 13800000001</p>
            <p>密码: admin123</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}