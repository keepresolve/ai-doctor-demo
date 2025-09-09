import { sql } from '@vercel/postgres'

// 检查环境变量

if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL 环境变量未设置')

}

console.log('当前环境变量:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? '已设置' : '未设置',
  POSTGRES_URL: process.env.POSTGRES_URL ? '已设置' : '未设置'
})
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

export interface DoctorSchedule {
  id: number
  doctor_id: number
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'busy' | 'break'
  created_at: string
  updated_at: string
}

export interface DoctorAutoScheduleConfig {
  id: number
  doctor_id: number
  enabled: boolean
  work_days: number[] // 1=周一, 7=周日
  work_start_time: string
  work_end_time: string
  slot_duration: number // 分钟
  break_start_time: string
  break_end_time: string
  advance_days: number
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

export async function getAppointmentById(id: number): Promise<any> {
  const { rows } = await sql`
    SELECT 
      a.*,
      p.name as patient_name,
      p.phone as patient_phone,
      d.name as doctor_name,
      dp.specialty as doctor_specialty
    FROM appointments a
    JOIN users p ON a.patient_id = p.id
    JOIN users d ON a.doctor_id = d.id
    LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
    WHERE a.id = ${id}
    LIMIT 1
  `
  return rows.length > 0 ? rows[0] : null
}

export async function getAppointmentsWithDetails(userId?: number, role?: string): Promise<any[]> {
  let rows

  if (role === 'patient' && userId) {
    const result = await sql`
      SELECT 
        a.*,
        p.name as patient_name,
        p.phone as patient_phone,
        d.name as doctor_name,
        dp.specialty as doctor_specialty
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
      WHERE a.patient_id = ${userId}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `
    rows = result.rows
  } else if (role === 'doctor' && userId) {
    const result = await sql`
      SELECT 
        a.*,
        p.name as patient_name,
        p.phone as patient_phone,
        d.name as doctor_name,
        dp.specialty as doctor_specialty
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
      WHERE a.doctor_id = ${userId}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `
    rows = result.rows
  } else {
    const result = await sql`
      SELECT 
        a.*,
        p.name as patient_name,
        p.phone as patient_phone,
        d.name as doctor_name,
        dp.specialty as doctor_specialty
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `
    rows = result.rows
  }

  return rows
}

export async function updateAppointmentDetails(id: number, data: any): Promise<boolean> {
  try {
    const updateFields = []
    const updateValues = []
    
    if (data.status) {
      updateFields.push(`status = $${updateValues.length + 1}`)
      updateValues.push(data.status)
    }
    if (data.diagnosis !== undefined) {
      updateFields.push(`diagnosis = $${updateValues.length + 1}`)
      updateValues.push(data.diagnosis)
    }
    if (data.prescription !== undefined) {
      updateFields.push(`prescription = $${updateValues.length + 1}`)
      updateValues.push(data.prescription)
    }
    if (data.notes !== undefined) {
      updateFields.push(`notes = $${updateValues.length + 1}`)
      updateValues.push(data.notes)
    }
    
    if (updateFields.length === 0) return true
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(id)
    const query = `UPDATE appointments SET ${updateFields.join(', ')} WHERE id = $${updateValues.length}`
    
    await sql.query(query, updateValues)
    return true
  } catch (error) {
    console.error('更新预约详情失败:', error)
    return false
  }
}

export async function checkAppointmentConflict(doctorId: number, patientId: number, date: string, time: string): Promise<{ doctorConflict?: boolean, patientConflict?: boolean, scheduleAvailable?: boolean }> {
  try {
    // 检查医生是否在该时间段有可用的时间表
    const { rows: scheduleRows } = await sql`
      SELECT id FROM doctor_schedules 
      WHERE doctor_id = ${doctorId} AND date = ${date} 
      AND start_time <= ${time} AND end_time > ${time} AND status = 'available'
    `
    
    const scheduleAvailable = scheduleRows.length > 0

    // 检查医生时间冲突
    const { rows: doctorConflictRows } = await sql`
      SELECT id FROM appointments 
      WHERE doctor_id = ${doctorId} AND appointment_date = ${date} AND appointment_time = ${time}
      AND status != 'cancelled'
    `
    
    // 检查患者时间冲突
    const { rows: patientConflictRows } = await sql`
      SELECT id FROM appointments 
      WHERE patient_id = ${patientId} AND appointment_date = ${date} AND appointment_time = ${time}
      AND status != 'cancelled'
    `
    
    return {
      scheduleAvailable,
      doctorConflict: doctorConflictRows.length > 0,
      patientConflict: patientConflictRows.length > 0
    }
  } catch (error) {
    console.error('检查预约冲突失败:', error)
    return { doctorConflict: true, patientConflict: true, scheduleAvailable: false }
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

// 医生日程操作
export async function createDoctorSchedule(doctorId: number, date: string, startTime: string, endTime: string, status?: string): Promise<DoctorSchedule> {
  const { rows } = await sql`
    INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, status) 
    VALUES (${doctorId}, ${date}, ${startTime}, ${endTime}, ${status || 'available'})
    RETURNING *
  `
  return rows[0] as DoctorSchedule
}

export async function getDoctorSchedulesByDoctorId(doctorId: number, date?: string, month?: string): Promise<DoctorSchedule[]> {
  let rows
  
  if (date) {
    const result = await sql`SELECT * FROM doctor_schedules WHERE doctor_id = ${doctorId} AND date = ${date} ORDER BY date, start_time`
    rows = result.rows
  } else if (month) {
    const result = await sql`SELECT * FROM doctor_schedules WHERE doctor_id = ${doctorId} AND DATE_TRUNC('month', date::date) = DATE_TRUNC('month', ${month}::date) ORDER BY date, start_time`
    rows = result.rows
  } else {
    const result = await sql`SELECT * FROM doctor_schedules WHERE doctor_id = ${doctorId} ORDER BY date, start_time`
    rows = result.rows
  }
  
  return rows as DoctorSchedule[]
}

export async function updateDoctorSchedule(id: number, data: Partial<DoctorSchedule>): Promise<boolean> {
  try {
    const updateFields = []
    const updateValues = []
    
    if (data.date) {
      updateFields.push(`date = $${updateValues.length + 1}`)
      updateValues.push(data.date)
    }
    if (data.start_time) {
      updateFields.push(`start_time = $${updateValues.length + 1}`)
      updateValues.push(data.start_time)
    }
    if (data.end_time) {
      updateFields.push(`end_time = $${updateValues.length + 1}`)
      updateValues.push(data.end_time)
    }
    if (data.status) {
      updateFields.push(`status = $${updateValues.length + 1}`)
      updateValues.push(data.status)
    }
    
    if (updateFields.length === 0) return true
    
    updateValues.push(id)
    const query = `UPDATE doctor_schedules SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${updateValues.length}`
    
    await sql.query(query, updateValues)
    return true
  } catch (error) {
    console.error('更新医生日程失败:', error)
    return false
  }
}

export async function deleteDoctorSchedule(id: number, doctorId: number): Promise<boolean> {
  try {
    await sql`DELETE FROM doctor_schedules WHERE id = ${id} AND doctor_id = ${doctorId}`
    return true
  } catch (error) {
    console.error('删除医生日程失败:', error)
    return false
  }
}

export async function checkScheduleConflict(doctorId: number, date: string, startTime: string, endTime: string, excludeId?: number): Promise<boolean> {
  try {
    let query = sql`
      SELECT id FROM doctor_schedules 
      WHERE doctor_id = ${doctorId} AND date = ${date} 
      AND (
        (start_time <= ${startTime} AND end_time > ${startTime}) OR
        (start_time < ${endTime} AND end_time >= ${endTime}) OR
        (start_time >= ${startTime} AND end_time <= ${endTime})
      )
    `
    
    if (excludeId) {
      query = sql`
        SELECT id FROM doctor_schedules 
        WHERE doctor_id = ${doctorId} AND date = ${date} AND id != ${excludeId}
        AND (
          (start_time <= ${startTime} AND end_time > ${startTime}) OR
          (start_time < ${endTime} AND end_time >= ${endTime}) OR
          (start_time >= ${startTime} AND end_time <= ${endTime})
        )
      `
    }
    
    const { rows } = await query
    return rows.length > 0
  } catch (error) {
    console.error('检查时间冲突失败:', error)
    return true // 出错时假设有冲突，更安全
  }
}

// 医生自动日程配置操作
export async function getDoctorAutoScheduleConfig(doctorId: number): Promise<DoctorAutoScheduleConfig | null> {
  const { rows } = await sql`
    SELECT * FROM doctor_auto_schedule_configs WHERE doctor_id = ${doctorId} LIMIT 1
  `
  return rows.length > 0 ? rows[0] as DoctorAutoScheduleConfig : null
}

export async function createDoctorAutoScheduleConfig(doctorId: number, config: Partial<DoctorAutoScheduleConfig>): Promise<DoctorAutoScheduleConfig> {
  const workDays = JSON.stringify(config.work_days || [1,2,3,4,5])
  const query = `
    INSERT INTO doctor_auto_schedule_configs 
    (doctor_id, enabled, work_days, work_start_time, work_end_time, slot_duration, break_start_time, break_end_time, advance_days)
    VALUES ($1, $2, $3::integer[], $4, $5, $6, $7, $8, $9)
    RETURNING *
  `
  
  const { rows } = await sql.query(query, [
    doctorId,
    config.enabled || false,
    workDays,
    config.work_start_time || '09:00',
    config.work_end_time || '17:00',
    config.slot_duration || 30,
    config.break_start_time || '12:00',
    config.break_end_time || '13:00',
    config.advance_days || 30
  ])
  
  return rows[0] as DoctorAutoScheduleConfig
}

export async function updateDoctorAutoScheduleConfig(doctorId: number, config: Partial<DoctorAutoScheduleConfig>): Promise<boolean> {
  try {
    const updateFields = []
    const updateValues = []
    
    if (config.enabled !== undefined) {
      updateFields.push(`enabled = $${updateValues.length + 1}`)
      updateValues.push(config.enabled)
    }
    if (config.work_days) {
      updateFields.push(`work_days = $${updateValues.length + 1}::integer[]`)
      updateValues.push(JSON.stringify(config.work_days))
    }
    if (config.work_start_time) {
      updateFields.push(`work_start_time = $${updateValues.length + 1}`)
      updateValues.push(config.work_start_time)
    }
    if (config.work_end_time) {
      updateFields.push(`work_end_time = $${updateValues.length + 1}`)
      updateValues.push(config.work_end_time)
    }
    if (config.slot_duration) {
      updateFields.push(`slot_duration = $${updateValues.length + 1}`)
      updateValues.push(config.slot_duration)
    }
    if (config.break_start_time) {
      updateFields.push(`break_start_time = $${updateValues.length + 1}`)
      updateValues.push(config.break_start_time)
    }
    if (config.break_end_time) {
      updateFields.push(`break_end_time = $${updateValues.length + 1}`)
      updateValues.push(config.break_end_time)
    }
    if (config.advance_days) {
      updateFields.push(`advance_days = $${updateValues.length + 1}`)
      updateValues.push(config.advance_days)
    }
    
    if (updateFields.length === 0) return true
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(doctorId)
    const query = `UPDATE doctor_auto_schedule_configs SET ${updateFields.join(', ')} WHERE doctor_id = $${updateValues.length}`
    
    await sql.query(query, updateValues)
    return true
  } catch (error) {
    console.error('更新医生自动日程配置失败:', error)
    return false
  }
}

export async function getEnabledAutoScheduleConfigs(): Promise<DoctorAutoScheduleConfig[]> {
  const { rows } = await sql`
    SELECT * FROM doctor_auto_schedule_configs WHERE enabled = true
  `
  return rows as DoctorAutoScheduleConfig[]
}

// 自动创建日程的核心函数
export async function generateAutoSchedules(config: DoctorAutoScheduleConfig, targetDate: Date): Promise<number> {
  try {
    const dayOfWeek = targetDate.getDay() || 7 // 将周日从0转为7
    
    // 检查是否为工作日
    if (!config.work_days.includes(dayOfWeek)) {
      return 0 // 非工作日，跳过
    }

    const dateStr = targetDate.toISOString().split('T')[0]
    
    // 检查该日期是否已有日程
    const { rows: existingSchedules } = await sql`
      SELECT COUNT(*) as count FROM doctor_schedules 
      WHERE doctor_id = ${config.doctor_id} AND date = ${dateStr}
    `
    
    if (parseInt(existingSchedules[0].count) > 0) {
      return 0 // 已有日程，跳过
    }

    // 生成时间段
    const schedules = []
    const workStart = parseTime(config.work_start_time)
    const workEnd = parseTime(config.work_end_time)
    const breakStart = parseTime(config.break_start_time)
    const breakEnd = parseTime(config.break_end_time)
    
    let currentTime = workStart
    while (currentTime + config.slot_duration <= workEnd) {
      // 跳过休息时间
      if (!(currentTime >= breakStart && currentTime < breakEnd)) {
        const startTime = formatMinutesToTime(currentTime)
        const endTime = formatMinutesToTime(currentTime + config.slot_duration)
        
        schedules.push({
          doctor_id: config.doctor_id,
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          status: 'available'
        })
      }
      currentTime += config.slot_duration
    }

    // 批量插入日程
    for (const schedule of schedules) {
      await sql`
        INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, status)
        VALUES (${schedule.doctor_id}, ${schedule.date}, ${schedule.start_time}, ${schedule.end_time}, ${schedule.status})
      `
    }

    return schedules.length
  } catch (error) {
    console.error('生成自动日程失败:', error)
    return 0
  }
}

// 辅助函数：将时间字符串转换为分钟数
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// 辅助函数：将分钟数转换为时间字符串
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
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