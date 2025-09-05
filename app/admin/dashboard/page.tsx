'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    todayAppointments: 0
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [backups, setBackups] = useState<any[]>([])
  
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
    loadStats()
    loadBackups()
  }, [router])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // 获取患者数量
      const patientsResponse = await fetch('/api/admin/users?role=patient', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (patientsResponse.ok) {
        const result = await patientsResponse.json()
        setStats(prev => ({ ...prev, totalPatients: result.data?.length || 0 }))
      }

      // 获取医生数量
      const doctorsResponse = await fetch('/api/admin/users?role=doctor', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (doctorsResponse.ok) {
        const result = await doctorsResponse.json()
        setStats(prev => ({ ...prev, totalDoctors: result.data?.length || 0 }))
      }

      // 获取预约数量 (这里暂时用模拟数据，因为还没有统计API)
      setStats(prev => ({ 
        ...prev, 
        totalAppointments: 0,
        todayAppointments: 0
      }))

    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  const loadBackups = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/backup', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const result = await response.json()
        setBackups(result.data || [])
      }
    } catch (error) {
      console.error('加载备份列表失败:', error)
    }
  }

  const handleExportDatabase = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/export?format=db', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        // 创建下载链接
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        
        // 从响应头获取文件名
        const contentDisposition = response.headers.get('Content-Disposition')
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
        const filename = filenameMatch ? filenameMatch[1] : `ai-doctor-demo-${new Date().toISOString().slice(0, 10)}.db`
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        setMessage('数据库导出成功')
        setMessageType('success')
      } else {
        const errorData = await response.json()
        setMessage(errorData.message || '导出失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('导出失败，请重试')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleBackupDatabase = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const result = await response.json()
        setMessage('数据库备份成功')
        setMessageType('success')
        loadBackups() // 刷新备份列表
      } else {
        const errorData = await response.json()
        setMessage(errorData.message || '备份失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('备份失败，请重试')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                管理员后台
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">管理员: {user.name}</span>
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
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
              {message}
            </div>
          )}
          
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 truncate">
                      患者总数
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalPatients}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg">👨‍⚕️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 truncate">
                      医生总数
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalDoctors}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg">📅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 truncate">
                      预约总数
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalAppointments}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg">📋</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 truncate">
                      今日预约
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.todayAppointments}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 功能菜单 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 用户管理 */}
            <Link
              href="/admin/users"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      用户管理
                    </h3>
                    <p className="text-sm text-gray-500">
                      管理患者和医生账号
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 创建医生 */}
            <Link
              href="/admin/create-doctor"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg">➕</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      创建医生账号
                    </h3>
                    <p className="text-sm text-gray-500">
                      添加新的医生用户
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 系统统计 */}
            <Link
              href="/admin/stats"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      系统统计
                    </h3>
                    <p className="text-sm text-gray-500">
                      查看详细统计数据
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 数据导出 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg">💾</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      数据管理
                    </h3>
                    <p className="text-sm text-gray-500">
                      导出和备份数据库
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={handleExportDatabase}
                    disabled={loading}
                    className="w-full btn-primary text-sm"
                  >
                    {loading ? '导出中...' : '导出数据库'}
                  </button>
                  <button
                    onClick={handleBackupDatabase}
                    disabled={loading}
                    className="w-full btn-secondary text-sm"
                  >
                    {loading ? '备份中...' : '创建备份'}
                  </button>
                  <Link
                    href="/admin/import"
                    className="block w-full text-center btn-outline text-sm"
                  >
                    导入数据库
                  </Link>
                </div>
              </div>
            </div>

            {/* 系统设置 */}
            <Link
              href="/admin/settings"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg">⚙️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      系统设置
                    </h3>
                    <p className="text-sm text-gray-500">
                      系统配置和管理
                    </p>
                  </div>
                </div>
              </div>
            </Link>

          </div>

          {/* 备份列表 */}
          {backups.length > 0 && (
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    数据库备份列表
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>文件名</th>
                        <th>文件大小</th>
                        <th>创建时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((backup, index) => (
                        <tr key={index}>
                          <td className="font-mono text-sm">{backup.filename}</td>
                          <td>{Math.round(backup.size / 1024)} KB</td>
                          <td>{new Date(backup.created).toLocaleString('zh-CN')}</td>
                          <td>
                            <span className="text-sm text-gray-500">本地备份</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}