import { sql } from '@vercel/postgres'

// 检查环境变量

if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL 环境变量未设置')
  console.log('当前环境变量:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '已设置' : '未设置',
    POSTGRES_URL: process.env.POSTGRES_URL ? '已设置' : '未设置'
  })
}

// 用户管理
export interface User {
  id: number
  phone: string
  password_hash: string
  name: string
  role: 'admin' | 'doctor' | 'patient'
  created_at: string
}

export interface DoctorProfile {
  id: number
  user_id: number
  specialty: string
  license_number: string
  description: string
  experience_years: number
  created_at: string
}

export interface Appointment {
  id: number
  patient_id: number
  doctor_id: number
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  reason: string
  notes: string
  created_at: string
  updated_at: string
}

// 用户操作
export async function createUser(phone: string, passwordHash: string, name: string, role: string): Promise<User> {
  const { rows } = await sql`
    INSERT INTO users (phone, password_hash, name, role) 
    VALUES (${phone}, ${passwordHash}, ${name}, ${role})
    RETURNING *
  `
  return rows[0] as User
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { rows } = await sql`
    SELECT * FROM users WHERE phone = ${phone} LIMIT 1
  `
  return rows.length > 0 ? rows[0] as User : null
}

export async function getUserById(id: number): Promise<User | null> {
  const { rows } = await sql`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  `
  return rows.length > 0 ? rows[0] as User : null
}

export async function getAllUsers(): Promise<User[]> {
  const { rows } = await sql`
    SELECT * FROM users ORDER BY created_at DESC
  `
  return rows as User[]
}

export async function getUsersByRole(role: string): Promise<User[]> {
  const { rows } = await sql`
    SELECT * FROM users WHERE role = ${role} ORDER BY created_at DESC
  `
  return rows as User[]
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    await sql`DELETE FROM users WHERE id = ${id} AND role != 'admin'`
    return true
  } catch (error) {
    console.error('删除用户失败:', error)
    return false
  }
}

// 医生信息操作
export async function createDoctorProfile(userId: number, specialty: string, licenseNumber: string, description?: string, experienceYears?: number): Promise<DoctorProfile> {
  const { rows } = await sql`
    INSERT INTO doctor_profiles (user_id, specialty, license_number, description, experience_years) 
    VALUES (${userId}, ${specialty}, ${licenseNumber}, ${description || ''}, ${experienceYears || 0})
    RETURNING *
  `
  return rows[0] as DoctorProfile
}

export async function getDoctorProfile(userId: number): Promise<DoctorProfile | null> {
  const { rows } = await sql`
    SELECT * FROM doctor_profiles WHERE user_id = ${userId} LIMIT 1
  `
  return rows.length > 0 ? rows[0] as DoctorProfile : null
}

export async function updateDoctorProfile(userId: number, data: Partial<DoctorProfile>): Promise<boolean> {
  try {
    const updateFields = []
    const updateValues = []
    
    if (data.specialty) {
      updateFields.push('specialty = $' + (updateValues.length + 1))
      updateValues.push(data.specialty)
    }
    if (data.description !== undefined) {
      updateFields.push('description = $' + (updateValues.length + 1))
      updateValues.push(data.description)
    }
    if (data.experience_years !== undefined) {
      updateFields.push('experience_years = $' + (updateValues.length + 1))
      updateValues.push(data.experience_years)
    }
    
    if (updateFields.length === 0) return true
    
    updateValues.push(userId)
    const query = `UPDATE doctor_profiles SET ${updateFields.join(', ')} WHERE user_id = $${updateValues.length}`
    
    await sql.query(query, updateValues)
    return true
  } catch (error) {
    console.error('更新医生信息失败:', error)
    return false
  }
}

// 预约操作
export async function createAppointment(patientId: number, doctorId: number, date: string, time: string, reason?: string): Promise<Appointment> {
  const { rows } = await sql`
    INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status) 
    VALUES (${patientId}, ${doctorId}, ${date}, ${time}, ${reason || ''}, 'pending')
    RETURNING *
  `
  return rows[0] as Appointment
}

export async function getAppointmentsByDoctorId(doctorId: number): Promise<Appointment[]> {
  const { rows } = await sql`
    SELECT * FROM appointments WHERE doctor_id = ${doctorId} ORDER BY appointment_date DESC, appointment_time DESC
  `
  return rows as Appointment[]
}

export async function getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
  const { rows } = await sql`
    SELECT * FROM appointments WHERE patient_id = ${patientId} ORDER BY appointment_date DESC, appointment_time DESC
  `
  return rows as Appointment[]
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const { rows } = await sql`
    SELECT * FROM appointments ORDER BY appointment_date DESC, appointment_time DESC
  `
  return rows as Appointment[]
}

export async function updateAppointmentStatus(id: number, status: string): Promise<boolean> {
  try {
    await sql`
      UPDATE appointments 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${id}
    `
    return true
  } catch (error) {
    console.error('更新预约状态失败:', error)
    return false
  }
}

// 统计数据
export async function getStats() {
  try {
    const { rows: patientsCount } = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'patient'`
    const { rows: doctorsCount } = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'doctor'`
    const { rows: appointmentsCount } = await sql`SELECT COUNT(*) as count FROM appointments`
    const { rows: todayAppointmentsCount } = await sql`SELECT COUNT(*) as count FROM appointments WHERE appointment_date = CURRENT_DATE`
    
    // 按状态统计预约
    const { rows: appointmentsByStatus } = await sql`
      SELECT status, COUNT(*) as count 
      FROM appointments 
      GROUP BY status
    `
    
    // 医生预约排行
    const { rows: doctorStats } = await sql`
      SELECT u.name, dp.specialty, COUNT(a.id) as appointment_count
      FROM users u
      JOIN doctor_profiles dp ON u.id = dp.user_id
      LEFT JOIN appointments a ON u.id = a.doctor_id
      WHERE u.role = 'doctor'
      GROUP BY u.id, u.name, dp.specialty
      ORDER BY appointment_count DESC
      LIMIT 10
    `
    
    // 最近7天预约趋势
    const { rows: appointmentTrend } = await sql`
      SELECT 
        appointment_date::text as date, 
        COUNT(*) as count
      FROM appointments 
      WHERE appointment_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY appointment_date
      ORDER BY appointment_date
    `
    
    const statusMap = appointmentsByStatus.reduce((acc: any, curr: any) => {
      acc[curr.status] = parseInt(curr.count)
      return acc
    }, { pending: 0, confirmed: 0, cancelled: 0, completed: 0 })
    
    return {
      totalPatients: parseInt(patientsCount[0].count),
      totalDoctors: parseInt(doctorsCount[0].count),
      totalAppointments: parseInt(appointmentsCount[0].count),
      todayAppointments: parseInt(todayAppointmentsCount[0].count),
      appointmentsByStatus: statusMap,
      appointmentTrend: appointmentTrend,
      doctorStats: doctorStats
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return {
      totalPatients: 0,
      totalDoctors: 0,
      totalAppointments: 0,
      todayAppointments: 0,
      appointmentsByStatus: { pending: 0, confirmed: 0, cancelled: 0, completed: 0 },
      appointmentTrend: [],
      doctorStats: []
    }
  }
}

// 数据库初始化检查
export async function initDatabase() {
  try {
    // 检查用户表是否存在
    const { rows } = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `
    
    if (rows.length === 0) {
      console.log('数据库表不存在，需要运行迁移脚本')
      return false
    }
    
    return true
  } catch (error) {
    console.error('数据库初始化检查失败:', error)
    return false
  }
}