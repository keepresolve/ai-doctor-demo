'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Appointment {
  id: number
  patient_id: number
  doctor_id: number
  appointment_date: string
  appointment_time: string
  duration: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  symptoms?: string
  diagnosis?: string
  prescription?: string
  notes?: string
  patient_name: string
  patient_phone: string
  doctor_name: string
  doctor_specialty: string
}

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [formData, setFormData] = useState({
    status: '',
    diagnosis: '',
    prescription: '',
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
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
      console.error('加载预约列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setFormData({
      status: appointment.status,
      diagnosis: appointment.diagnosis || '',
      prescription: appointment.prescription || '',
      notes: appointment.notes || ''
    })
    setShowModal(true)
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
    if (!selectedAppointment) return

    setUpdating(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage('预约更新成功')
        setMessageType('success')
        setShowModal(false)
        loadAppointments()
      } else {
        setMessage(result.message || '更新失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('更新失败，请重试')
      setMessageType('error')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待确认'
      case 'confirmed': return '已确认'
      case 'cancelled': return '已取消'
      case 'completed': return '已完成'
      default: return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending'
      case 'confirmed': return 'status-confirmed'
      case 'cancelled': return 'status-cancelled'
      case 'completed': return 'status-completed'
      default: return 'status-pending'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/doctor/dashboard" className="text-primary-600 hover:text-primary-700 mr-4">
                ← 返回
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">患者预约管理</h1>
            </div>
            <div className="flex items-center space-x-4">
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                预约列表
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>患者姓名</th>
                    <th>联系电话</th>
                    <th>预约日期</th>
                    <th>预约时间</th>
                    <th>症状描述</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        暂无预约记录
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{appointment.patient_name}</td>
                        <td>{appointment.patient_phone}</td>
                        <td>{appointment.appointment_date}</td>
                        <td>{appointment.appointment_time}</td>
                        <td className="max-w-xs truncate">
                          {appointment.symptoms || '-'}
                        </td>
                        <td>
                          <span className={getStatusClass(appointment.status)}>
                            {getStatusText(appointment.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleAppointmentClick(appointment)}
                            className="text-primary-600 hover:text-primary-700 text-sm"
                          >
                            详情/处理
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                预约详情
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* 患者信息 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">患者信息</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">姓名：</span>
                  <span>{selectedAppointment.patient_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">电话：</span>
                  <span>{selectedAppointment.patient_phone}</span>
                </div>
                <div>
                  <span className="text-gray-500">预约日期：</span>
                  <span>{selectedAppointment.appointment_date}</span>
                </div>
                <div>
                  <span className="text-gray-500">预约时间：</span>
                  <span>{selectedAppointment.appointment_time}</span>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <span className="text-gray-500">症状描述：</span>
                <p className="mt-1">{selectedAppointment.symptoms || '无'}</p>
              </div>
            </div>

            {/* 处理表单 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">预约状态</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="pending">待确认</option>
                  <option value="confirmed">已确认</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>

              <div>
                <label className="form-label">诊断结果</label>
                <textarea
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-textarea"
                  placeholder="请输入诊断结果"
                />
              </div>

              <div>
                <label className="form-label">处方建议</label>
                <textarea
                  name="prescription"
                  value={formData.prescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-textarea"
                  placeholder="请输入处方建议"
                />
              </div>

              <div>
                <label className="form-label">备注信息</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="form-textarea"
                  placeholder="其他备注信息"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={updating}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updating}
                >
                  {updating ? '更新中...' : '更新预约'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}