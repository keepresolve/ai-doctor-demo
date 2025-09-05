'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FormInput from '@/app/components/FormInput'
import { AuthResponse } from '@/app/types'

export default function PatientRegisterPage() {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    gender: '',
    birth_date: '',
    emergency_contact: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 验证密码确认
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      setLoading(false)
      return
    }

    try {
      const submitData = {
        phone: formData.phone,
        password: formData.password,
        name: formData.name,
        gender: formData.gender || undefined,
        birth_date: formData.birth_date || undefined,
        emergency_contact: formData.emergency_contact || undefined
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result: AuthResponse = await response.json()

      if (result.success && result.user && result.token) {
        // 保存token和用户信息
        localStorage.setItem('token', result.token)
        localStorage.setItem('user', JSON.stringify(result.user))
        
        // 跳转到患者主页
        router.push('/patient/dashboard')
      } else {
        setError(result.message || '注册失败')
      }
    } catch (error) {
      console.error('注册错误:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-md mx-auto space-y-8 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            患者注册
          </h1>
          <p className="text-gray-600">
            创建您的患者账号
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="手机号"
            type="tel"
            value={formData.phone}
            onChange={(value) => handleInputChange('phone', value)}
            placeholder="请输入手机号"
            required
          />

          <FormInput
            label="姓名"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            placeholder="请输入真实姓名"
            required
          />

          <FormInput
            label="密码"
            type="password"
            value={formData.password}
            onChange={(value) => handleInputChange('password', value)}
            placeholder="至少6位密码"
            required
          />

          <FormInput
            label="确认密码"
            type="password"
            value={formData.confirmPassword}
            onChange={(value) => handleInputChange('confirmPassword', value)}
            placeholder="再次输入密码"
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              性别
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="input-primary w-full"
            >
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>

          <FormInput
            label="出生日期"
            type="date"
            value={formData.birth_date}
            onChange={(value) => handleInputChange('birth_date', value)}
          />

          <FormInput
            label="紧急联系人手机"
            type="tel"
            value={formData.emergency_contact}
            onChange={(value) => handleInputChange('emergency_contact', value)}
            placeholder="紧急联系人手机号（可选）"
          />

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
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            已有账号？
            <Link href="/patient/login" className="text-primary-600 hover:text-primary-700 ml-1">
              立即登录
            </Link>
          </p>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}