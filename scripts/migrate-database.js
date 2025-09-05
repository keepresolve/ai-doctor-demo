#!/usr/bin/env node

// 数据库迁移脚本 - 从SQLite迁移到PostgreSQL
const { sql } = require('@vercel/postgres')

async function createTables() {
  console.log('开始创建数据表...')
  
  try {
    // 创建用户表
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✓ 用户表创建成功')

    // 创建医生信息表
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        specialty VARCHAR(50),
        license_number VARCHAR(50) UNIQUE,
        description TEXT,
        experience_years INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✓ 医生信息表创建成功')

    // 创建预约表
    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✓ 预约表创建成功')

    // 创建医生时间安排表
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_schedules (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✓ 医生时间安排表创建成功')

  } catch (error) {
    console.error('创建数据表失败:', error)
    process.exit(1)
  }
}

async function insertSampleData() {
  console.log('插入示例数据...')
  
  try {
    // 检查是否已有数据
    const { rows: existingUsers } = await sql`SELECT COUNT(*) as count FROM users`
    if (parseInt(existingUsers[0].count) > 0) {
      console.log('数据表已有数据，跳过示例数据插入')
      return
    }

    // 插入管理员用户
    const { rows: adminUser } = await sql`
      INSERT INTO users (phone, password_hash, name, role) 
      VALUES ('13800000001', '$2b$10$1g9z.qR6J6i7eXX6M.UO0e8yZ7QT.2qA6kI1L3nN4pV5uU9wW1uWy', '系统管理员', 'admin')
      RETURNING id
    `
    console.log('✓ 管理员用户创建成功')

    // 插入示例医生
    const { rows: doctorUser } = await sql`
      INSERT INTO users (phone, password_hash, name, role) 
      VALUES ('13800000002', '$2b$10$1g9z.qR6J6i7eXX6M.UO0e8yZ7QT.2qA6kI1L3nN4pV5uU9wW1uWy', '张医生', 'doctor')
      RETURNING id
    `
    
    // 插入医生详细信息
    await sql`
      INSERT INTO doctor_profiles (user_id, specialty, license_number, description, experience_years) 
      VALUES (${doctorUser[0].id}, '内科', 'DOC20240001', '经验丰富的内科医生，专长于常见疾病诊疗', 10)
    `
    console.log('✓ 示例医生创建成功')

    // 插入示例患者
    await sql`
      INSERT INTO users (phone, password_hash, name, role) 
      VALUES ('13800000003', '$2b$10$1g9z.qR6J6i7eXX6M.UO0e8yZ7QT.2qA6kI1L3nN4pV5uU9wW1uWy', '患者李四', 'patient')
    `
    console.log('✓ 示例患者创建成功')

    // 插入医生工作时间安排
    const workDays = [1, 2, 3, 4, 5] // 周一到周五
    for (const day of workDays) {
      await sql`
        INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time) 
        VALUES (${doctorUser[0].id}, ${day}, '09:00', '17:00')
      `
    }
    console.log('✓ 医生工作时间安排创建成功')

  } catch (error) {
    console.error('插入示例数据失败:', error)
    process.exit(1)
  }
}

async function runMigration() {
  try {
    console.log('=== 开始数据库迁移 ===')
    await createTables()
    await insertSampleData()
    console.log('=== 数据库迁移完成 ===')
    process.exit(0)
  } catch (error) {
    console.error('数据库迁移失败:', error)
    process.exit(1)
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  runMigration()
}

module.exports = { createTables, insertSampleData }