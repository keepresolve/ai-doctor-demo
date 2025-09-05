// 模拟数据库，专门用于Vercel部署
class MockDatabase {
  private data: {
    users: any[]
    appointments: any[]
    doctorProfiles: any[]
    patientProfiles: any[]
    doctorSchedules: any[]
  } = {
    users: [],
    appointments: [],
    doctorProfiles: [],
    patientProfiles: [],
    doctorSchedules: []
  }

  constructor() {
    this.initData()
  }

  private async initData() {
    // 添加示例数据
    const bcrypt = await import('bcryptjs')
    
    // 管理员
    this.data.users.push({
      id: 1,
      phone: '13800138000',
      password: await bcrypt.hash('admin123', 12),
      name: '系统管理员',
      role: 'admin'
    })

    // 医生
    this.data.users.push({
      id: 2,
      phone: '13800138001',
      password: await bcrypt.hash('doctor123', 12),
      name: '张医生',
      role: 'doctor'
    })

    this.data.doctorProfiles.push({
      id: 1,
      user_id: 2,
      specialty: '内科',
      license_number: 'DOC001',
      description: '经验丰富的内科医生',
      experience_years: 10
    })

    // 患者
    this.data.users.push({
      id: 3,
      phone: '13800138002',
      password: await bcrypt.hash('patient123', 12),
      name: '李患者',
      role: 'patient'
    })

    this.data.patientProfiles.push({
      id: 1,
      user_id: 3,
      gender: 'male',
      birth_date: '1990-01-01',
      emergency_contact: '13900139000'
    })

    // 医生排班
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    this.data.doctorSchedules.push({
      id: 1,
      doctor_id: 2,
      date: tomorrow.toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '17:00',
      status: 'available'
    })
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    // 简单的SQL模拟
    if (sql.includes('SELECT') && sql.includes('users')) {
      return this.data.users
    }
    if (sql.includes('SELECT') && sql.includes('doctor_profiles')) {
      return this.data.doctorProfiles
    }
    if (sql.includes('SELECT') && sql.includes('patient_profiles')) {
      return this.data.patientProfiles
    }
    if (sql.includes('SELECT') && sql.includes('doctor_schedules')) {
      return this.data.doctorSchedules
    }
    if (sql.includes('SELECT') && sql.includes('appointments')) {
      return this.data.appointments
    }
    return []
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const results = await this.query(sql, params)
    return results[0] || null
  }

  async run(sql: string, params: any[] = []): Promise<{ id?: number, changes: number }> {
    return { id: Date.now(), changes: 1 }
  }

  close() {
    // 空实现
  }
}

let mockDatabase: MockDatabase

export function getDatabase() {
  if (!mockDatabase) {
    mockDatabase = new MockDatabase()
  }
  return mockDatabase
}