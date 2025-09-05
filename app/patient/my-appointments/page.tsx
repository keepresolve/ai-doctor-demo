'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Appointment {
  id: number
  doctor_name: string
  doctor_specialty: string
  appointment_date: string
  appointment_time: string
  status: string
  symptoms?: string
  diagnosis?: string
  prescription?: string
  notes?: string
  created_at: string
}

export default function MyAppointmentsPage() {
  const [user, setUser] = useState<any>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  
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
    loadAppointments()
  }, [router])

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setAppointments(result.data || [])
      }
    } catch (error) {
      console.error('加载预约失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatStatus = (status: string) => {
    const statusMap = {
      'pending': { text: '待确认', color: 'bg-yellow-100 text-yellow-800' },
      'confirmed': { text: '已确认', color: 'bg-blue-100 text-blue-800' },
      'completed': { text: '已完成', color: 'bg-green-100 text-green-800' },
      'cancelled': { text: '已取消', color: 'bg-red-100 text-red-800' }
    }
    return statusMap[status as keyof typeof statusMap] || { text: status, color: 'bg-gray-100 text-gray-800' }
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5) // HH:MM
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
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
            <h1 className="text-2xl font-bold text-gray-900">我的预约</h1>
            <Link
              href="/patient/book-appointment"
              className="btn-primary"
            >
              新预约
            </Link>
          </div>
          <p className="text-gray-600">查看您的预约历史和状态</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="text-lg">加载中...</div>
            </div>
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const statusInfo = formatStatus(appointment.status)
              return (
                <div
                  key={appointment.id}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Dr. {appointment.doctor_name}
                      </h3>
                      <p className="text-gray-600">{appointment.doctor_specialty}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">预约日期</p>
                      <p className="font-medium">{formatDate(appointment.appointment_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">预约时间</p>
                      <p className="font-medium">{formatTime(appointment.appointment_time)}</p>
                    </div>
                  </div>

                  {appointment.symptoms && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">症状描述</p>
                      <p className="text-gray-700">{appointment.symptoms}</p>
                    </div>
                  )}

                  {appointment.status === 'completed' && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">诊疗记录</h4>
                      
                      {appointment.diagnosis && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-500">诊断结果</p>
                          <p className="text-gray-700">{appointment.diagnosis}</p>
                        </div>
                      )}

                      {appointment.prescription && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-500">处方建议</p>
                          <p className="text-gray-700">{appointment.prescription}</p>
                        </div>
                      )}

                      {appointment.notes && (
                        <div>
                          <p className="text-sm text-gray-500">医生备注</p>
                          <p className="text-gray-700">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-right text-sm text-gray-500 mt-4">
                    预约时间: {new Date(appointment.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">暂无预约记录</div>
              <Link
                href="/patient/book-appointment"
                className="btn-primary"
              >
                立即预约
              </Link>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/patient/dashboard"
            className="btn-secondary"
          >
            返回主页
          </Link>
        </div>

      </div>
    </div>
  )
}