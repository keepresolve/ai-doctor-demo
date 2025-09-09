'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoScheduleConfig {
  id?: number
  doctor_id: number
  enabled: boolean
  work_days: number[]
  work_start_time: string
  work_end_time: string
  slot_duration: number
  break_start_time: string
  break_end_time: string
  advance_days: number
}

const WEEKDAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
]

export default function DoctorAutoSchedulePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [config, setConfig] = useState<AutoScheduleConfig>({
    doctor_id: 0,
    enabled: false,
    work_days: [1, 2, 3, 4, 5],
    work_start_time: '09:00',
    work_end_time: '17:00',
    slot_duration: 30,
    break_start_time: '12:00',
    break_end_time: '13:00',
    advance_days: 30
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/doctor/login')
        return
      }

      const response = await fetch('/api/doctor/auto-schedule', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      
      if (result.success && result.data) {
        setConfig(result.data)
      }
    } catch (error) {
      console.error('获取配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/doctor/login')
        return
      }

      const response = await fetch('/api/doctor/auto-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      })

      const result = await response.json()
      
      if (result.success) {
        alert('配置保存成功！')
        setConfig(result.data)
      } else {
        alert(`保存失败：${result.message}`)
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const generateSchedules = async () => {
    setGenerating(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/doctor/login')
        return
      }

      const response = await fetch('/api/admin/generate-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctor_id: config.doctor_id || JSON.parse(atob(token.split('.')[1])).userId,
          days: config.advance_days
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`日程生成成功！生成了${result.data.generated}个时间段`)
      } else {
        alert(`生成失败：${result.message}`)
      }
    } catch (error) {
      console.error('生成日程失败:', error)
      alert('生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  const updateConfig = (field: keyof AutoScheduleConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const toggleWorkDay = (day: number) => {
    setConfig(prev => ({
      ...prev,
      work_days: prev.work_days.includes(day)
        ? prev.work_days.filter(d => d !== day)
        : [...prev.work_days, day].sort()
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">自动日程配置</h1>
          <p className="text-gray-600">配置系统自动为您创建可预约的时间段</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* 启用开关 */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">启用自动日程</h3>
              <p className="text-sm text-gray-500">系统将根据您的设置自动创建可预约时间段</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 工作日设置 */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">工作日设置</h3>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWorkDay(day.value)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    config.work_days.includes(day.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* 工作时间设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">工作开始时间</label>
              <input
                type="time"
                value={config.work_start_time}
                onChange={(e) => updateConfig('work_start_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">工作结束时间</label>
              <input
                type="time"
                value={config.work_end_time}
                onChange={(e) => updateConfig('work_end_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 休息时间设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">休息开始时间</label>
              <input
                type="time"
                value={config.break_start_time}
                onChange={(e) => updateConfig('break_start_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">休息结束时间</label>
              <input
                type="time"
                value={config.break_end_time}
                onChange={(e) => updateConfig('break_end_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 时间段设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">时间段长度（分钟）</label>
              <select
                value={config.slot_duration}
                onChange={(e) => updateConfig('slot_duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15分钟</option>
                <option value={30}>30分钟</option>
                <option value={45}>45分钟</option>
                <option value={60}>60分钟</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">提前创建天数</label>
              <select
                value={config.advance_days}
                onChange={(e) => updateConfig('advance_days', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>7天</option>
                <option value={14}>14天</option>
                <option value={30}>30天</option>
                <option value={60}>60天</option>
                <option value={90}>90天</option>
              </select>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-4 pt-6">
            <button
              onClick={saveConfig}
              disabled={saving}
              className={`px-6 py-2 rounded-md text-white font-medium ${
                saving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? '保存中...' : '保存配置'}
            </button>
            
            {config.enabled && (
              <button
                onClick={generateSchedules}
                disabled={generating}
                className={`px-6 py-2 rounded-md text-white font-medium ${
                  generating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {generating ? '生成中...' : '立即生成日程'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}