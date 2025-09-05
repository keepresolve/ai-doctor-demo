#!/usr/bin/env node

// Neon数据库迁移脚本
const { Client } = require('pg')

async function connectToNeon() {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ 错误: 未找到DATABASE_URL环境变量')
    console.log('请先设置环境变量:')
    console.log('export DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"')
    process.exit(1)
  }

  if (!databaseUrl.includes('neon.tech')) {
    console.warn('⚠️  警告: DATABASE_URL似乎不是Neon数据库连接')
    console.log('确保使用Neon提供的连接字符串')
  }

  console.log('🔌 正在连接Neon数据库...')
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  try {
    await client.connect()
    console.log('✅ 成功连接到Neon数据库')
    return client
  } catch (error) {
    console.error('❌ 连接数据库失败:', error.message)
    process.exit(1)
  }
}

async function createTables(client) {
  console.log('📋 开始创建数据表...')
  
  try {
    // 创建用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('  ✓ 用户表 (users)')

    // 创建医生信息表
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctor_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        specialty VARCHAR(50),
        license_number VARCHAR(50) UNIQUE,
        description TEXT,
        experience_years INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('  ✓ 医生信息表 (doctor_profiles)')

    // 创建预约表
    await client.query(`
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
    `)
    console.log('  ✓ 预约表 (appointments)')

    // 创建医生时间安排表
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctor_schedules (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('  ✓ 医生时间安排表 (doctor_schedules)')

    console.log('✅ 数据表创建完成')
  } catch (error) {
    console.error('❌ 创建数据表失败:', error.message)
    throw error
  }
}

async function insertSampleData(client) {
  console.log('📝 插入示例数据...')
  
  try {
    // 检查是否已有数据
    const { rows: existingUsers } = await client.query('SELECT COUNT(*) as count FROM users')
    if (parseInt(existingUsers[0].count) > 0) {
      console.log('  ℹ️  数据表已有数据，跳过示例数据插入')
      return
    }

    // 插入管理员用户 (密码: admin123)
    const { rows: adminUser } = await client.query(`
      INSERT INTO users (phone, password_hash, name, role) 
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['13800000001', '$2b$10$1g9z.qR6J6i7eXX6M.UO0e8yZ7QT.2qA6kI1L3nN4pV5uU9wW1uWy', '系统管理员', 'admin'])
    console.log('  ✓ 管理员用户 (13800000001 / admin123)')

    // 插入示例医生 (密码: doctor123)
    const { rows: doctorUser } = await client.query(`
      INSERT INTO users (phone, password_hash, name, role) 
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['13800000002', '$2b$10$1g9z.qR6J6i7eXX6M.UO0e8yZ7QT.2qA6kI1L3nN4pV5uU9wW1uWy', '张医生', 'doctor'])
    
    // 插入医生详细信息
    await client.query(`
      INSERT INTO doctor_profiles (user_id, specialty, license_number, description, experience_years) 
      VALUES ($1, $2, $3, $4, $5)
    `, [doctorUser[0].id, '内科', 'DOC20240001', '经验丰富的内科医生，专长于常见疾病诊疗', 10])
    console.log('  ✓ 示例医生 (13800000002 / doctor123)')

    // 插入示例患者 (密码: patient123)
    await client.query(`
      INSERT INTO users (phone, password_hash, name, role) 
      VALUES ($1, $2, $3, $4)
    `, ['13800000003', '$2b$10$1g9z.qR6J6i7eXX6M.UO0e8yZ7QT.2qA6kI1L3nN4pV5uU9wW1uWy', '患者李四', 'patient'])
    console.log('  ✓ 示例患者 (13800000003 / patient123)')

    // 插入医生工作时间安排 (周一到周五, 9:00-17:00)
    const workDays = [1, 2, 3, 4, 5]
    for (const day of workDays) {
      await client.query(`
        INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time) 
        VALUES ($1, $2, $3, $4)
      `, [doctorUser[0].id, day, '09:00', '17:00'])
    }
    console.log('  ✓ 医生工作时间安排 (周一至周五 9:00-17:00)')

    console.log('✅ 示例数据插入完成')
  } catch (error) {
    console.error('❌ 插入示例数据失败:', error.message)
    throw error
  }
}

async function verifyMigration(client) {
  console.log('🔍 验证迁移结果...')
  
  try {
    const { rows: userCount } = await client.query('SELECT COUNT(*) as count FROM users')
    const { rows: doctorCount } = await client.query('SELECT COUNT(*) as count FROM doctor_profiles')
    const { rows: scheduleCount } = await client.query('SELECT COUNT(*) as count FROM doctor_schedules')
    
    console.log(`  ✓ 用户数量: ${userCount[0].count}`)
    console.log(`  ✓ 医生信息: ${doctorCount[0].count}`)
    console.log(`  ✓ 工作时间安排: ${scheduleCount[0].count}`)
    
    if (parseInt(userCount[0].count) >= 3) {
      console.log('✅ 迁移验证成功')
    } else {
      console.warn('⚠️  数据量少于预期，请检查迁移过程')
    }
  } catch (error) {
    console.error('❌ 验证失败:', error.message)
    throw error
  }
}

async function runMigration() {
  let client = null
  
  try {
    console.log('🚀 === Neon数据库迁移开始 ===')
    
    client = await connectToNeon()
    await createTables(client)
    await insertSampleData(client)
    await verifyMigration(client)
    
    console.log('🎉 === Neon数据库迁移完成 ===')
    console.log('')
    console.log('📱 测试账号信息:')
    console.log('  管理员: 13800000001 / admin123')
    console.log('  医生:   13800000002 / doctor123')  
    console.log('  患者:   13800000003 / patient123')
    console.log('')
    console.log('🔄 下一步:')
    console.log('  1. 在Vercel项目中设置DATABASE_URL环境变量')
    console.log('  2. 重新部署项目')
    console.log('  3. 访问 https://doctor-seven-vert.vercel.app 测试')
    
  } catch (error) {
    console.error('💥 迁移失败:', error.message)
    process.exit(1)
  } finally {
    if (client) {
      await client.end()
      console.log('🔌 数据库连接已关闭')
    }
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  runMigration()
}

module.exports = { runMigration }