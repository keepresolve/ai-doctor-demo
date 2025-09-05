'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminImport() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.db')) {
        setMessage('只支持.db格式的SQLite数据库文件')
        setMessageType('error')
        return
      }
      setSelectedFile(file)
      setMessage('')
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setMessage('请选择要导入的数据库文件')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('database', selectedFile)
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage(result.message)
        setMessageType('success')
        setSelectedFile(null)
        // 重置文件输入
        const fileInput = document.getElementById('database') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setMessage(result.message || '导入失败')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('导入失败，请重试')
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
              <Link href="/admin/dashboard" className="text-primary-600 hover:text-primary-700 mr-4">
                ← 返回
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">数据导入</h1>
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
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
              {message}
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                导入SQLite数据库文件
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                上传新的数据库文件来替换当前数据库。原数据库会自动备份。
              </p>
            </div>
            
            <div className="px-6 py-4">
              <form onSubmit={handleImport} className="space-y-6">
                <div>
                  <label className="form-label">选择数据库文件</label>
                  <input
                    type="file"
                    id="database"
                    accept=".db"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    只支持.db格式的SQLite数据库文件
                  </p>
                </div>

                {selectedFile && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900">选中文件信息：</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      文件名：{selectedFile.name}
                    </p>
                    <p className="text-sm text-blue-700">
                      大小：{Math.round(selectedFile.size / 1024)} KB
                    </p>
                  </div>
                )}

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-400 text-xl">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-900">
                        重要提醒：
                      </h4>
                      <div className="mt-1 text-sm text-yellow-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>导入操作将完全替换当前数据库</li>
                          <li>原数据库会自动备份到backups目录</li>
                          <li>导入后所有当前用户会话将失效</li>
                          <li>请确保导入的数据库格式正确</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Link
                    href="/admin/dashboard"
                    className="btn-secondary"
                  >
                    取消
                  </Link>
                  <button
                    type="submit"
                    disabled={loading || !selectedFile}
                    className="btn-danger"
                  >
                    {loading ? '导入中...' : '确认导入'}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}