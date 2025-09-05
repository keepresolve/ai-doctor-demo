// 数据库连接层 - 自动选择PostgreSQL或SQLite/Mock
import { promisify } from 'util'
import path from 'path'

// 检测是否有PostgreSQL连接
const hasPostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production'

console.log('数据库连接检测:', { hasPostgres: !!hasPostgres, isVercel })

// 用户管理
export interface User {
  id: number
  phone: string
  password_hash?: string
  password?: string
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

let sqlite3: any
if (!isVercel && !hasPostgres) {
  try {
    sqlite3 = require('sqlite3')
  } catch (e) {
    console.warn('SQLite3 not available, using mock database')
  }
}

const DB_PATH = isVercel ? ':memory:' : path.join(process.cwd(), 'data.db')

class Database {
  private db: any

  constructor() {
    if (!sqlite3) {
      throw new Error('SQLite3 not available in this environment')
    }
    this.db = new sqlite3.Database(DB_PATH)
    this.init()
  }

  private async init() {
    
    try {
      // 用户表
      await this.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone VARCHAR(11) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(50) NOT NULL,
          role TEXT CHECK(role IN ('patient', 'doctor', 'admin')) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // 患者扩展信息表
      await this.run(`
        CREATE TABLE IF NOT EXISTS patient_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          gender TEXT CHECK(gender IN ('male', 'female')) DEFAULT NULL,
          birth_date DATE DEFAULT NULL,
          emergency_contact VARCHAR(11) DEFAULT NULL,
          medical_history TEXT DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `)

      // 医生扩展信息表
      await this.run(`
        CREATE TABLE IF NOT EXISTS doctor_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          specialty VARCHAR(100) NOT NULL,
          license_number VARCHAR(50) NOT NULL,
          description TEXT DEFAULT NULL,
          experience_years INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `)

      // 医生可用时间表
      await this.run(`
        CREATE TABLE IF NOT EXISTS doctor_schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          doctor_id INTEGER NOT NULL,
          date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          status TEXT CHECK(status IN ('available', 'busy', 'break')) DEFAULT 'available',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (doctor_id) REFERENCES users (id),
          UNIQUE(doctor_id, date, start_time)
        )
      `)

      // 预约表
      await this.run(`
        CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER NOT NULL,
          doctor_id INTEGER NOT NULL,
          appointment_date DATE NOT NULL,
          appointment_time TIME NOT NULL,
          duration INTEGER DEFAULT 30,
          status TEXT CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
          symptoms TEXT DEFAULT NULL,
          diagnosis TEXT DEFAULT NULL,
          prescription TEXT DEFAULT NULL,
          notes TEXT DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES users (id),
          FOREIGN KEY (doctor_id) REFERENCES users (id),
          UNIQUE(doctor_id, appointment_date, appointment_time)
        )
      `)

      // 创建默认管理员账户
      const checkAdmin = promisify(this.db.get.bind(this.db))
      const adminExists = await checkAdmin("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
      
      if (!adminExists) {
        const bcrypt = await import('bcryptjs')
        const hashedPassword = await bcrypt.hash('admin123', 12)
        
        await this.run(
          `INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)`,
          ['13800138000', hashedPassword, '系统管理员', 'admin']
        )
      }

      // 如果是 Vercel 环境（内存数据库），添加一些示例数据
      if (isVercel) {
        await this.addSampleData()
      }

      console.log('数据库初始化完成')
    } catch (error) {
      console.error('数据库初始化失败:', error)
    }
  }

  private async addSampleData() {
    const bcrypt = await import('bcryptjs')
    
    try {
      // 添加示例医生
      const doctorPassword = await bcrypt.hash('doctor123', 12)
      await this.run(
        `INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)`,
        ['13800138001', doctorPassword, '张医生', 'doctor']
      )
      
      await this.run(
        `INSERT INTO doctor_profiles (user_id, specialty, license_number, description, experience_years) VALUES (?, ?, ?, ?, ?)`,
        [2, '内科', 'DOC001', '经验丰富的内科医生', 10]
      )

      // 添加示例患者
      const patientPassword = await bcrypt.hash('patient123', 12)
      await this.run(
        `INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)`,
        ['13800138002', patientPassword, '李患者', 'patient']
      )

      await this.run(
        `INSERT INTO patient_profiles (user_id, gender, birth_date, emergency_contact) VALUES (?, ?, ?, ?)`,
        [3, 'male', '1990-01-01', '13900139000']
      )

      // 添加医生排班
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      
      await this.run(
        `INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)`,
        [2, tomorrow.toISOString().split('T')[0], '09:00', '17:00', 'available']
      )

      console.log('示例数据添加完成')
    } catch (error) {
      console.error('示例数据添加失败:', error)
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err: any, rows: any[]) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err: any, row: any) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  }

  async run(sql: string, params: any[] = []): Promise<{ id?: number, changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(this: any, err: any) {
        if (err) reject(err)
        else resolve({ id: this.lastID, changes: this.changes })
      })
    })
  }

  close() {
    this.db.close()
  }
}

let database: Database

export function getDatabase() {
  // 在 Vercel 环境中使用模拟数据库
  if (isVercel && !hasPostgres) {
    const { getDatabase: getMockDatabase } = require('./mock-database')
    return getMockDatabase()
  }
  
  if (!hasPostgres && !database) {
    database = new Database()
  }
  return database
}

// 统一的数据库函数接口
export async function getUserByPhone(phone: string): Promise<User | null> {
  if (hasPostgres) {
    const { getUserByPhone: pgGetUserByPhone } = require('./postgres-database')
    return await pgGetUserByPhone(phone)
  } else {
    const db = getDatabase()
    return await db.get('SELECT * FROM users WHERE phone = ?', [phone])
  }
}

export async function createUser(phone: string, passwordHash: string, name: string, role: string): Promise<User> {
  if (hasPostgres) {
    const { createUser: pgCreateUser } = require('./postgres-database')
    return await pgCreateUser(phone, passwordHash, name, role)
  } else {
    const db = getDatabase()
    const result = await db.run('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)', [phone, passwordHash, name, role])
    return await db.get('SELECT * FROM users WHERE id = ?', [result.id])
  }
}

export async function getUserById(id: number): Promise<User | null> {
  if (hasPostgres) {
    const { getUserById: pgGetUserById } = require('./postgres-database')
    return await pgGetUserById(id)
  } else {
    const db = getDatabase()
    return await db.get('SELECT * FROM users WHERE id = ?', [id])
  }
}

export async function getAllUsers(): Promise<User[]> {
  if (hasPostgres) {
    const { getAllUsers: pgGetAllUsers } = require('./postgres-database')
    return await pgGetAllUsers()
  } else {
    const db = getDatabase()
    return await db.query('SELECT * FROM users ORDER BY created_at DESC')
  }
}

export async function getUsersByRole(role: string): Promise<User[]> {
  if (hasPostgres) {
    const { getUsersByRole: pgGetUsersByRole } = require('./postgres-database')
    return await pgGetUsersByRole(role)
  } else {
    const db = getDatabase()
    return await db.query('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC', [role])
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  if (hasPostgres) {
    const { deleteUser: pgDeleteUser } = require('./postgres-database')
    return await pgDeleteUser(id)
  } else {
    const db = getDatabase()
    try {
      await db.run('DELETE FROM users WHERE id = ? AND role != "admin"', [id])
      return true
    } catch (error) {
      console.error('删除用户失败:', error)
      return false
    }
  }
}

export async function getDoctorProfile(userId: number): Promise<DoctorProfile | null> {
  if (hasPostgres) {
    const { getDoctorProfile: pgGetDoctorProfile } = require('./postgres-database')
    return await pgGetDoctorProfile(userId)
  } else {
    const db = getDatabase()
    return await db.get('SELECT * FROM doctor_profiles WHERE user_id = ?', [userId])
  }
}

export async function createDoctorProfile(userId: number, specialty: string, licenseNumber: string, description?: string, experienceYears?: number): Promise<DoctorProfile> {
  if (hasPostgres) {
    const { createDoctorProfile: pgCreateDoctorProfile } = require('./postgres-database')
    return await pgCreateDoctorProfile(userId, specialty, licenseNumber, description, experienceYears)
  } else {
    const db = getDatabase()
    const result = await db.run('INSERT INTO doctor_profiles (user_id, specialty, license_number, description, experience_years) VALUES (?, ?, ?, ?, ?)', 
      [userId, specialty, licenseNumber, description || '', experienceYears || 0])
    return await db.get('SELECT * FROM doctor_profiles WHERE id = ?', [result.id])
  }
}

export async function updateDoctorProfile(userId: number, data: Partial<DoctorProfile>): Promise<boolean> {
  if (hasPostgres) {
    const { updateDoctorProfile: pgUpdateDoctorProfile } = require('./postgres-database')
    return await pgUpdateDoctorProfile(userId, data)
  } else {
    const db = getDatabase()
    try {
      const updates = []
      const values = []
      
      if (data.specialty) {
        updates.push('specialty = ?')
        values.push(data.specialty)
      }
      if (data.description !== undefined) {
        updates.push('description = ?')
        values.push(data.description)
      }
      if (data.experience_years !== undefined) {
        updates.push('experience_years = ?')
        values.push(data.experience_years)
      }
      
      if (updates.length === 0) return true
      
      values.push(userId)
      await db.run(`UPDATE doctor_profiles SET ${updates.join(', ')} WHERE user_id = ?`, values)
      return true
    } catch (error) {
      console.error('更新医生信息失败:', error)
      return false
    }
  }
}

export async function getStats() {
  if (hasPostgres) {
    const { getStats: pgGetStats } = require('./postgres-database')
    return await pgGetStats()
  } else {
    const db = getDatabase()
    try {
      const totalPatients = await db.get('SELECT COUNT(*) as count FROM users WHERE role = "patient"')
      const totalDoctors = await db.get('SELECT COUNT(*) as count FROM users WHERE role = "doctor"')
      const totalAppointments = await db.get('SELECT COUNT(*) as count FROM appointments')
      const todayAppointments = await db.get('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = DATE("now")')
      
      return {
        totalPatients: totalPatients?.count || 0,
        totalDoctors: totalDoctors?.count || 0,
        totalAppointments: totalAppointments?.count || 0,
        todayAppointments: todayAppointments?.count || 0,
        appointmentsByStatus: { pending: 0, confirmed: 0, cancelled: 0, completed: 0 },
        appointmentTrend: [],
        doctorStats: []
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
}

export async function initDatabase(): Promise<boolean> {
  if (hasPostgres) {
    const { initDatabase: pgInitDatabase } = require('./postgres-database')
    return await pgInitDatabase()
  }
  return true
}