// 数据库连接层 - 统一使用PostgreSQL (Neon)
import * as postgres from './postgres-database'

// 导出PostgreSQL类型
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

// 直接导出PostgreSQL函数
export const createUser = postgres.createUser
export const getUserByPhone = postgres.getUserByPhone
export const getUserById = postgres.getUserById
export const getAllUsers = postgres.getAllUsers
export const getUsersByRole = postgres.getUsersByRole
export const deleteUser = postgres.deleteUser

export const createDoctorProfile = postgres.createDoctorProfile
export const getDoctorProfile = postgres.getDoctorProfile
export const updateDoctorProfile = postgres.updateDoctorProfile

export const createAppointment = postgres.createAppointment
export const getAppointmentsByDoctorId = postgres.getAppointmentsByDoctorId
export const getAppointmentsByPatientId = postgres.getAppointmentsByPatientId
export const getAllAppointments = postgres.getAllAppointments
export const updateAppointmentStatus = postgres.updateAppointmentStatus

export const getStats = postgres.getStats
export const initDatabase = postgres.initDatabase

// 检查数据库连接
console.log('数据库连接: 使用PostgreSQL (Neon)')

// 兼容性函数（保留用于向后兼容）
export function getDatabase() {
  console.warn('getDatabase() 已废弃，请直接使用导出的数据库函数')
  
  // 返回一个兼容对象，包装PostgreSQL函数
  return {
    async query(sql: string, params: any[] = []): Promise<any[]> {
      throw new Error('直接使用SQL查询已废弃，请使用导出的数据库函数')
    },
    async get(sql: string, params: any[] = []): Promise<any> {
      throw new Error('直接使用SQL查询已废弃，请使用导出的数据库函数')
    },
    async run(sql: string, params: any[] = []): Promise<{ id?: number, changes: number }> {
      throw new Error('直接使用SQL查询已废弃，请使用导出的数据库函数')
    }
  }
}