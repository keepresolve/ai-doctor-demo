'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FormInput from '@/app/components/FormInput'

interface Schedule {
  id: number
  date: string
  start_time: string
  end_time: string
  status: string
}

export default function DoctorSchedulePage() {
  const [user, setUser] = useState<any>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    status: 'available'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/doctor/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'doctor') {
      router.push('/')
      return
    }
    
    setUser(parsedUser)
    loadSchedules()
  }, [router])

  const loadSchedules = async () => {
    try {
      const token = localStorage.getItem('token')
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      
      const response = await fetch(`/api/doctor/schedule?month=${currentMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setSchedules(result.data || [])
      }
    } catch (error) {
      console.error('加载日程失败:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/doctor/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('时间段添加成功')
        setFormData({
          date: '',
          start_time: '',
          end_time: '',
          status: 'available'
        })
        setShowForm(false)
        loadSchedules()
      } else {
        setError(result.message || '添加失败')
      }
    } catch (error) {
      console.error('添加时间段错误:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    const date = new Date(formData.date)
    
    // 上午时段
    for (let hour = 9; hour < 12; hour++) {
      slots.push({
        date: formData.date,
        start_time: `${hour.toString().padStart(2, '0')}:00`,
        end_time: `${hour.toString().padStart(2, '0')}:30`,
        status: 'available'
      })
      slots.push({
        date: formData.date,
        start_time: `${hour.toString().padStart(2, '0')}:30`,
        end_time: `${(hour + 1).toString().padStart(2, '0')}:00`,
        status: 'available'
      })
    }

    // 下午时段
    for (let hour = 14; hour < 17; hour++) {
      slots.push({
        date: formData.date,
        start_time: `${hour.toString().padStart(2, '0')}:00`,
        end_time: `${hour.toString().padStart(2, '0')}:30`,
        status: 'available'
      })
      slots.push({
        date: formData.date,
        start_time: `${hour.toString().padStart(2, '0')}:30`,
        end_time: `${(hour + 1).toString().padStart(2, '0')}:00`,
        status: 'available'
      })
    }

    return slots
  }

  const addDaySchedule = async () => {
    if (!formData.date) {
      setError('请选择日期')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('token')
      const timeSlots = generateTimeSlots()
      
      for (const slot of timeSlots) {
        const response = await fetch('/api/doctor/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(slot)
        })

        if (!response.ok) {
          const result = await response.json()
          console.log(`时段 ${slot.start_time}-${slot.end_time} 添加失败: ${result.message}`)
        }
      }
      
      setSuccess('整日时间段添加成功')
      setFormData({ ...formData, date: '' })
      loadSchedules()
      
    } catch (error) {
      console.error('批量添加错误:', error)
      setError('批量添加失败')
    } finally {
      setLoading(false)
    }
  }

  const formatStatus = (status: string) => {
    const statusMap = {
      'available': '可预约',
      'busy': '忙碌',
      'break': '休息'
    }
    return statusMap[status as keyof typeof statusMap] || status
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
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">时间安排管理</h1>
            <div className="space-x-2">
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-primary"
              >
                添加时间段
              </button>
            </div>
          </div>
        </div>

        {/* 快速添加整日时间段 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">快速添加整日时间段</h3>
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <FormInput
                label="选择日期"
                type="date"
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
                required
              />
            </div>
            <button
              onClick={addDaySchedule}
              disabled={loading || !formData.date}
              className="btn-secondary disabled:opacity-50"
            >
              添加整日时间段
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            将自动添加上午9:00-12:00和下午14:00-17:00的时间段（每30分钟一个）
          </p>
        </div>

        {/* 手动添加表单 */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">添加时间段</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="日期"
                  type="date"
                  value={formData.date}
                  onChange={(value) => setFormData({ ...formData, date: value })}
                  required
                />

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    状态 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-primary w-full"
                    required
                  >
                    <option value="available">可预约</option>
                    <option value="busy">忙碌</option>
                    <option value="break">休息</option>
                  </select>
                </div>

                <FormInput
                  label="开始时间"
                  type="time"
                  value={formData.start_time}
                  onChange={(value) => setFormData({ ...formData, start_time: value })}
                  required
                />

                <FormInput
                  label="结束时间"
                  type="time"
                  value={formData.end_time}
                  onChange={(value) => setFormData({ ...formData, end_time: value })}
                  required
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? '添加中...' : '添加'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 消息提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm mb-4">
            {success}
          </div>
        )}

        {/* 时间段列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">本月时间安排</h3>
          </div>
          <div className="px-6 py-4">
            {schedules.length > 0 ? (
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">{schedule.date}</span>
                      <span>{schedule.start_time} - {schedule.end_time}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        schedule.status === 'available' ? 'bg-green-100 text-green-800' :
                        schedule.status === 'busy' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {formatStatus(schedule.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                暂无时间安排
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}