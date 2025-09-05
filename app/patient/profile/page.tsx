'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PatientProfile {
  id: number
  phone: string
  name: string
  role: string
  created_at: string
  profile?: {
    gender?: 'male' | 'female'
    birth_date?: string
    emergency_contact?: string
    medical_history?: string
  }
}

export default function PatientProfile() {
  const [user, setUser] = useState<PatientProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birth_date: '',
    emergency_contact: '',
    medical_history: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/patient/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'patient') {
      router.push('/')
      return
    }
    
    loadProfile()
  }, [router])

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result.data)
        setFormData({
          name: result.data.name || '',
          gender: result.data.profile?.gender || '',
          birth_date: result.data.profile?.birth_date || '',
          emergency_contact: result.data.profile?.emergency_contact || '',
          medical_history: result.data.profile?.medical_history || ''
        })
      }
    } catch (error) {
      console.error('加载资料失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage('资料更新成功')
        setMessageType('success')
        setIsEditing(false)
        
        // 更新localStorage中的用户信息
        if (formData.name !== user?.name) {
          const userData = localStorage.getItem('user')
          if (userData) {
            const updatedUser = { ...JSON.parse(userData), name: formData.name }
            localStorage.setItem('user', JSON.stringify(updatedUser))
          }
        }
        
        loadProfile()
      } else {
        setMessage(result.message || '更新失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('更新失败，请重试')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">加载用户信息失败</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/patient/dashboard" className="text-primary-600 hover:text-primary-700 mr-4">
                ← 返回
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">个人资料</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎，{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  基本信息
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary"
                  >
                    编辑资料
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-4">
              {!isEditing ? (
                // 显示模式
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">姓名</label>
                      <p className="text-sm text-gray-900">{user.name}</p>
                    </div>
                    <div>
                      <label className="form-label">手机号</label>
                      <p className="text-sm text-gray-900">{user.phone}</p>
                    </div>
                    <div>
                      <label className="form-label">性别</label>
                      <p className="text-sm text-gray-900">
                        {user.profile?.gender === 'male' ? '男' : 
                         user.profile?.gender === 'female' ? '女' : '未设置'}
                      </p>
                    </div>
                    <div>
                      <label className="form-label">出生日期</label>
                      <p className="text-sm text-gray-900">
                        {user.profile?.birth_date || '未设置'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">紧急联系人</label>
                    <p className="text-sm text-gray-900">
                      {user.profile?.emergency_contact || '未设置'}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">病史信息</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {user.profile?.medical_history || '无'}
                    </p>
                  </div>
                </div>
              ) : (
                // 编辑模式
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">姓名</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">手机号</label>
                      <input
                        type="text"
                        value={user.phone}
                        className="form-input bg-gray-100"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">手机号不可修改</p>
                    </div>
                    <div>
                      <label className="form-label">性别</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="">请选择</option>
                        <option value="male">男</option>
                        <option value="female">女</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">出生日期</label>
                      <input
                        type="date"
                        name="birth_date"
                        value={formData.birth_date}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">紧急联系人电话</label>
                    <input
                      type="tel"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="请输入紧急联系人电话"
                    />
                  </div>
                  <div>
                    <label className="form-label">病史信息</label>
                    <textarea
                      name="medical_history"
                      value={formData.medical_history}
                      onChange={handleInputChange}
                      rows={4}
                      className="form-textarea"
                      placeholder="请描述既往病史、过敏史等医疗相关信息"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                      disabled={saving}
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={saving}
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* 账户信息 */}
          <div className="bg-white shadow rounded-lg mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                账户信息
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">注册时间</label>
                  <p className="text-sm text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div>
                  <label className="form-label">账户类型</label>
                  <p className="text-sm text-gray-900">患者账户</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}