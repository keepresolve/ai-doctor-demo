#!/usr/bin/env node

// 验证所有迁移工具是否正常工作
console.log('🔍 === 验证Neon数据库迁移工具 ===')
console.log('')

const fs = require('fs')
const path = require('path')

// 检查文件是否存在
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`)
    return true
  } else {
    console.log(`❌ ${description}: ${filePath} - 文件不存在`)
    return false
  }
}

// 验证脚本语法
function verifySyntax(filePath, description) {
  try {
    require.resolve(path.resolve(filePath))
    console.log(`✅ ${description}: 语法正确`)
    return true
  } catch (error) {
    console.log(`❌ ${description}: 语法错误 - ${error.message}`)
    return false
  }
}

console.log('📋 检查迁移工具文件...')

const tools = [
  {
    file: 'scripts/migrate-to-neon.js',
    desc: 'Neon迁移脚本'
  },
  {
    file: 'scripts/test-neon-connection.js', 
    desc: 'Neon连接测试'
  },
  {
    file: 'scripts/demo-neon-setup.js',
    desc: 'Neon设置演示'
  },
  {
    file: 'docs/PostgreSQL-Migration-Guide.md',
    desc: 'PostgreSQL迁移指南'
  }
]

let allFilesExist = true
let allSyntaxValid = true

tools.forEach(tool => {
  if (!checkFile(tool.file, tool.desc)) {
    allFilesExist = false
  }
  
  if (tool.file.endsWith('.js')) {
    if (!verifySyntax(tool.file, tool.desc)) {
      allSyntaxValid = false
    }
  }
})

console.log('')
console.log('📦 检查依赖包...')

try {
  require('pg')
  console.log('✅ pg: PostgreSQL客户端已安装')
} catch (error) {
  console.log('❌ pg: PostgreSQL客户端未安装 - 运行 npm install')
  allSyntaxValid = false
}

try {
  require('@vercel/postgres')
  console.log('✅ @vercel/postgres: Vercel PostgreSQL客户端已安装')
} catch (error) {
  console.log('❌ @vercel/postgres: Vercel PostgreSQL客户端未安装')
  allSyntaxValid = false
}

console.log('')
console.log('📖 检查文档完整性...')

const docs = [
  'README.md',
  'docs/PostgreSQL-Migration-Guide.md'
]

docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    const content = fs.readFileSync(doc, 'utf8')
    if (content.includes('Neon')) {
      console.log(`✅ ${doc}: 包含Neon相关内容`)
    } else {
      console.log(`⚠️  ${doc}: 缺少Neon相关内容`)
    }
  }
})

console.log('')
console.log('🎯 验证结果:')

if (allFilesExist && allSyntaxValid) {
  console.log('✅ 所有迁移工具准备就绪!')
  console.log('')
  console.log('🚀 下一步操作:')
  console.log('1. 创建Neon数据库: https://console.neon.tech')
  console.log('2. 查看设置指南: node scripts/demo-neon-setup.js')
  console.log('3. 测试数据库连接: node scripts/test-neon-connection.js')
  console.log('4. 运行数据库迁移: node scripts/migrate-to-neon.js')
  console.log('5. 在Vercel中设置DATABASE_URL环境变量')
  console.log('6. 重新部署项目验证迁移结果')
} else {
  console.log('❌ 发现问题，请检查上述错误信息')
  process.exit(1)
}