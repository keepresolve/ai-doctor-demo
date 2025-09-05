'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FormInput from '@/app/components/FormInput'
import { ApiResponse } from '@/app/types'

export default function CreateDoctorPage() {
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    specialty: '',
    license_number: '',
    description: '',
    experience_years: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/admin/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin') {
      router.push('/')
      return
    }
    
    setUser(parsedUser)
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // 验证密码确认
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const submitData = {
        phone: formData.phone,
        password: formData.password,
        name: formData.name,
        role: 'doctor',
        specialty: formData.specialty,
        license_number: formData.license_number,
        description: formData.description || undefined,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : 0
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData),
      })

      const result: ApiResponse = await response.json()

      if (result.success) {
        setSuccess('医生账号创建成功')
        setFormData({
          phone: '',
          password: '',
          confirmPassword: '',
          name: '',
          specialty: '',
          license_number: '',
          description: '',
          experience_years: ''
        })
      } else {
        setError(result.message || '创建失败')
      }
    } catch (error) {
      console.error('创建医生错误:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">创建医生账号</h1>
          <p className="text-gray-600">为医生创建新的登录账号</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 基本信息 */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="请输入医生姓名"
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
              </div>
            </div>

            {/* 专业信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">专业信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="专科"
                  value={formData.specialty}
                  onChange={(value) => handleInputChange('specialty', value)}
                  placeholder="如：内科、外科、儿科等"
                  required
                />

                <FormInput
                  label="执业证书号"
                  value={formData.license_number}
                  onChange={(value) => handleInputChange('license_number', value)}
                  placeholder="请输入执业证书号"
                  required
                />

                <FormInput
                  label="从业年限"
                  type="number"
                  value={formData.experience_years}
                  onChange={(value) => handleInputChange('experience_years', value)}
                  placeholder="请输入从业年数"
                />
              </div>

              <div className="mt-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    个人简介
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="请输入医生的个人简介和专业背景（可选）"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* 消息提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            {/* 提交按钮 */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? '创建中...' : '创建医生账号'}
              </button>
              <Link
                href="/admin/dashboard"
                className="btn-secondary"
              >
                返回
              </Link>
            </div>

          </form>
        </div>

        {/* 使用提示 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-md text-sm">
          <h4 className="font-medium mb-2">使用说明:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>创建的医生账号可以立即使用手机号和密码登录</li>
            <li>医生登录后需要在时间管理中设置可预约的时间段</li>
            <li>患者可以查看医生信息并预约相应时间段</li>
          </ul>
        </div>

      </div>
    </div>
  )
}