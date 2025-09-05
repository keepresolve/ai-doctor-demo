'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FormInput from '@/app/components/FormInput'

interface Doctor {
  id: number
  name: string
  specialty: string
  description?: string
  experience_years: number
  available_slots?: Array<{
    id: number
    start_time: string
    end_time: string
    status: string
  }>
}

export default function BookAppointmentPage() {
  const [user, setUser] = useState<any>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    // 检查登录状态
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
    
    setUser(parsedUser)
  }, [router])

  const loadDoctors = async (date: string) => {
    try {
      const response = await fetch(`/api/doctors?date=${date}`)
      if (response.ok) {
        const result = await response.json()
        setDoctors(result.data || [])
      }
    } catch (error) {
      console.error('加载医生列表失败:', error)
    }
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedDoctor(null)
    setSelectedTime('')
    if (date) {
      loadDoctors(date)
    } else {
      setDoctors([])
    }
  }

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setSelectedTime('')
  }

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedTime || !selectedDate) {
      setError('请选择医生、日期和时间')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          symptoms
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('预约成功！请等待医生确认。')
        setTimeout(() => {
          router.push('/patient/my-appointments')
        }, 2000)
      } else {
        setError(result.message || '预约失败')
      }
    } catch (error) {
      console.error('预约错误:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5) // HH:MM
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
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
          <h1 className="text-2xl font-bold text-gray-900">预约医生</h1>
          <p className="text-gray-600">选择日期和医生进行预约</p>
        </div>

        {/* 日期选择 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">选择日期</h3>
          <FormInput
            label="预约日期"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            required
          />
          <p className="text-sm text-gray-500 mt-2">
            请选择明天及以后的日期
          </p>
        </div>

        {/* 医生列表 */}
        {selectedDate && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">选择医生</h3>
            {doctors.length > 0 ? (
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleDoctorSelect(doctor)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          Dr. {doctor.name}
                        </h4>
                        <p className="text-gray-600">{doctor.specialty}</p>
                        {doctor.description && (
                          <p className="text-gray-500 text-sm mt-1">
                            {doctor.description}
                          </p>
                        )}
                        <p className="text-gray-500 text-sm">
                          从业经验: {doctor.experience_years} 年
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-2">
                          可预约时段 ({doctor.available_slots?.length || 0})
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                当日暂无医生可预约
              </p>
            )}
          </div>
        )}

        {/* 时间选择 */}
        {selectedDoctor && selectedDoctor.available_slots && selectedDoctor.available_slots.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">选择时间</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {selectedDoctor.available_slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedTime(slot.start_time)}
                  className={`py-2 px-4 rounded-md text-center transition-colors ${
                    selectedTime === slot.start_time
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 症状描述 */}
        {selectedTime && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">症状描述</h3>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                请简单描述您的症状（可选）
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="例如：头痛、发烧、咳嗽等..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
              />
            </div>
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

        {/* 预约确认 */}
        {selectedDoctor && selectedTime && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">确认预约信息</h3>
            <div className="space-y-2 mb-6">
              <p><span className="font-medium">医生:</span> Dr. {selectedDoctor.name}</p>
              <p><span className="font-medium">专科:</span> {selectedDoctor.specialty}</p>
              <p><span className="font-medium">日期:</span> {selectedDate}</p>
              <p><span className="font-medium">时间:</span> {formatTime(selectedTime)}</p>
              {symptoms && (
                <p><span className="font-medium">症状:</span> {symptoms}</p>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleBookAppointment}
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? '预约中...' : '确认预约'}
              </button>
              <button
                onClick={() => router.push('/patient/dashboard')}
                className="btn-secondary"
              >
                返回
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}