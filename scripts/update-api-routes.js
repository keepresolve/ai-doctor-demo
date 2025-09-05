#!/usr/bin/env node

// 批量更新API路由文件，移除getDatabase()使用，直接使用PostgreSQL
const fs = require('fs')
const path = require('path')

const apiRoutesDir = 'app/api'

function updateFile(filePath) {
  console.log(`正在更新: ${filePath}`)
  
  let content = fs.readFileSync(filePath, 'utf8')
  let updated = false
  
  // 替换getDatabase导入
  if (content.includes("import { getDatabase }")) {
    content = content.replace(
      /import { getDatabase([^}]*) } from '@\/app\/lib\/database'/,
      "import { getUserByPhone, createUser, getUserById, getAllUsers, getUsersByRole, deleteUser, createDoctorProfile, getDoctorProfile, updateDoctorProfile } from '@/app/lib/database'"
    )
    updated = true
  }
  
  // 移除getDatabase()调用的简单用法
  if (content.includes('const db = getDatabase()')) {
    console.log(`  警告: ${filePath} 包含复杂的db.query调用，需要手动更新`)
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`  ✅ 已更新`)
  } else {
    console.log(`  ⏭️  无需更新`)
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      walkDir(filePath)
    } else if (file.endsWith('.ts') && file !== 'route.ts') {
      // 跳过route.ts文件，因为它们需要手动处理
      continue
    } else if (file === 'route.ts') {
      updateFile(filePath)
    }
  }
}

console.log('🔄 开始更新API路由文件...')
walkDir(apiRoutesDir)
console.log('✅ API路由文件更新完成')

console.log(`
⚠️  注意: 某些文件可能包含复杂的数据库查询，需要手动更新：
- 将 db.query() 替换为 sql\`...\`
- 将 db.get() 替换为 sql\`...\` 并使用 rows[0]
- 将 db.run() 替换为 sql\`...\`
- 更新参数化查询语法从 ? 到 \${variable}
`)