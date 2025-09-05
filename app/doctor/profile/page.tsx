'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DoctorProfile {
  id: number
  phone: string
  name: string
  specialty: string
  license_number: string
  description: string
  experience_years: number
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    description: '',
    experience_years: 0
  })
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/doctor/login')
        return
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setProfile(data.data)
        setFormData({
          name: data.data.name,
          specialty: data.data.specialty,
          description: data.data.description || '',
          experience_years: data.data.experience_years || 0
        })
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('获取个人资料失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        setProfile({
          ...profile!,
          ...formData
        })
        setEditing(false)
        alert('保存成功')
      } else {
        alert('保存失败: ' + data.message)
      }
    } catch (error) {
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        specialty: profile.specialty,
        description: profile.description || '',
        experience_years: profile.experience_years || 0
      })
    }
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || '无法加载个人资料'}</div>
          <button 
            onClick={() => router.push('/doctor/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            返回工作台
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">个人资料</h1>
            <button 
              onClick={() => router.push('/doctor/dashboard')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
            >
              返回工作台
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">基本信息</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  编辑资料
                </button>
              ) : (
                <div className="space-x-3">
                  <button
                    onClick={handleCancel}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-gray-900">{profile.name}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    手机号
                  </label>
                  <div className="text-gray-900">{profile.phone}</div>
                  <div className="text-xs text-gray-500 mt-1">手机号无法修改</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    专业科室
                  </label>
                  {editing ? (
                    <select
                      value={formData.specialty}
                      onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择专业</option>
                      <option value="内科">内科</option>
                      <option value="外科">外科</option>
                      <option value="儿科">儿科</option>
                      <option value="妇产科">妇产科</option>
                      <option value="眼科">眼科</option>
                      <option value="耳鼻喉科">耳鼻喉科</option>
                      <option value="皮肤科">皮肤科</option>
                      <option value="心理科">心理科</option>
                      <option value="中医科">中医科</option>
                    </select>
                  ) : (
                    <div className="text-gray-900">{profile.specialty}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    从业年限
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-gray-900">{profile.experience_years} 年</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    执业证号
                  </label>
                  <div className="text-gray-900">{profile.license_number}</div>
                  <div className="text-xs text-gray-500 mt-1">执业证号无法修改</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  个人简介
                </label>
                {editing ? (
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="请输入个人简介，让患者更好地了解您..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {profile.description || '暂无个人简介'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">工作统计</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">-</div>
                <div className="text-sm text-gray-500">总预约数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">-</div>
                <div className="text-sm text-gray-500">已完成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">-</div>
                <div className="text-sm text-gray-500">待处理</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}