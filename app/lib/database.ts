import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data.db')

class Database {
  private db: sqlite3.Database

  constructor() {
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

      console.log('数据库初始化完成')
    } catch (error) {
      console.error('数据库初始化失败:', error)
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  }

  async run(sql: string, params: any[] = []): Promise<{ id?: number, changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
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
  if (!database) {
    database = new Database()
  }
  return database
}