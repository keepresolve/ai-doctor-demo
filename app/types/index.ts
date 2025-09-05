export type UserRole = 'patient' | 'doctor' | 'admin'

export interface User {
  id: number
  phone: string
  password: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface PatientProfile {
  id: number
  user_id: number
  gender?: 'male' | 'female'
  birth_date?: string
  emergency_contact?: string
  medical_history?: string
  created_at: string
  updated_at: string
}

export interface DoctorProfile {
  id: number
  user_id: number
  specialty: string
  license_number: string
  description?: string
  experience_years: number
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

export interface Appointment {
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
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  phone: string
  password: string
}

export interface RegisterRequest {
  phone: string
  password: string
  name: string
  gender?: 'male' | 'female'
  birth_date?: string
  emergency_contact?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: {
    id: number
    phone: string
    name: string
    role: UserRole
  }
  token?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}