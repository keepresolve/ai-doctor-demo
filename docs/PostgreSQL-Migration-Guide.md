# PostgreSQL迁移指南

本系统已经完成PostgreSQL数据库支持的开发工作。你可以选择使用PostgreSQL来替代当前的SQLite/Mock数据库，以获得更好的生产环境性能和数据持久化。

## 迁移优势

✅ **生产环境稳定** - PostgreSQL是企业级数据库，适合生产部署  
✅ **数据持久化** - 数据不会因为serverless环境重启而丢失  
✅ **高性能** - 支持复杂查询和大数据量  
✅ **实时统计** - 支持完整的预约趋势和医生统计功能  
✅ **自动备份** - Vercel Postgres提供自动备份  
✅ **无缝切换** - 代码已经兼容，只需设置环境变量即可切换  

## 快速开始

### 1. 创建Neon数据库（推荐）

1. 访问 [Neon Console](https://console.neon.tech)
2. 使用GitHub账号登录
3. 点击 `Create Project`
4. 输入项目名称：`ai-doctor-demo`
5. 选择区域（推荐 `US East (N. Virginia)`）
6. 选择PostgreSQL版本（默认最新版本）
7. 点击 `Create Project`

**为什么选择Neon：**
- ✅ 免费额度：3GB存储，100小时计算时间/月
- ✅ 自动暂停和唤醒，节省成本
- ✅ 分支功能，便于开发测试
- ✅ 更好的性能和可靠性

### 2. 获取数据库连接字符串

创建完成后，在Neon Dashboard中：

1. 点击项目名称进入项目详情
2. 在 `Connection Details` 部分找到连接信息
3. 复制 `Connection string`（类似这样）：
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 3. 在Vercel中配置环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目 `doctor`
3. 点击 `Settings` 标签页
4. 点击 `Environment Variables`
5. 添加环境变量：
   - **Key**: `DATABASE_URL`
   - **Value**: 你从Neon复制的连接字符串
   - **Environment**: `Production`, `Preview`, `Development` 都勾选
6. 点击 `Save`

### 4. 运行数据库迁移

在本地运行迁移脚本来初始化数据库结构：

```bash
# 设置环境变量（使用从Neon复制的DATABASE_URL）
export DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 运行迁移脚本
node scripts/migrate-database.js
```

**迁移脚本会自动：**
- 创建所有必要的数据表
- 插入管理员测试账号
- 添加示例医生和患者数据
- 设置医生工作时间安排

### 5. 重新部署

设置环境变量后，触发Vercel重新部署：

```bash
# 方法1：在Vercel Dashboard中手动触发重新部署
# 进入项目 -> Deployments -> 点击右上角的 "Redeploy"

# 方法2：推送一个小更新触发自动部署
git commit --allow-empty -m "Trigger redeploy for Neon database"
git push origin main
```

## 数据库迁移脚本详解

### 自动迁移

系统会自动创建以下数据表：

1. **users** - 用户基础信息表
   - id, phone, password_hash, name, role, created_at

2. **doctor_profiles** - 医生详细信息表
   - id, user_id, specialty, license_number, description, experience_years

3. **appointments** - 预约记录表
   - id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, notes

4. **doctor_schedules** - 医生时间安排表
   - id, doctor_id, day_of_week, start_time, end_time, is_available

### 示例数据

迁移脚本会自动创建以下测试账号：

| 角色 | 手机号 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | 13800000001 | admin123 | 系统管理员账号 |
| 医生 | 13800000002 | doctor123 | 示例医生账号（内科，DOC20240001） |
| 患者 | 13800000003 | patient123 | 示例患者账号 |

## 功能对比

| 功能 | SQLite/Mock | PostgreSQL |
|------|-------------|------------|
| 用户管理 | ✅ 基础功能 | ✅ 完整功能 |
| 数据导出 | ✅ 文件导出 | ✅ SQL导出 |
| 统计分析 | ❌ 模拟数据 | ✅ 实时统计 |
| 预约趋势 | ❌ 无数据 | ✅ 7天趋势图 |
| 医生排行 | ❌ 无数据 | ✅ 预约排行榜 |
| 数据持久化 | ❌ 临时存储 | ✅ 永久存储 |
| 并发处理 | ❌ 单线程 | ✅ 多连接池 |

## 环境检测

系统会自动检测数据库环境：

- 如果检测到 `DATABASE_URL` 或 `POSTGRES_URL` 环境变量，使用PostgreSQL
- 否则，在Vercel环境使用Mock数据库，本地环境使用SQLite

检测日志示例：
```
数据库连接检测: { hasPostgres: true, isVercel: true }
使用PostgreSQL数据库
```

## 常见问题

### Q: 迁移后数据会丢失吗？
A: 不会。PostgreSQL提供持久化存储，数据不会因为重新部署而丢失。

### Q: 如何备份PostgreSQL数据？
A: Vercel Postgres提供自动备份功能，也可以通过管理面板手动创建备份点。

### Q: 本地开发如何使用PostgreSQL？
A: 在本地 `.env.local` 文件中设置 `DATABASE_URL`，然后运行迁移脚本。

### Q: 如何回退到SQLite？
A: 删除Vercel项目中的 `DATABASE_URL` 环境变量，系统会自动回退到SQLite/Mock数据库。

### Q: PostgreSQL免费额度是多少？
A: Vercel Postgres提供：
- 60小时计算时间/月
- 500MB存储空间
- 3个数据库
- 自动备份和恢复

## API兼容性

所有现有API接口保持不变，无需修改前端代码：

- ✅ `/api/auth/login` - 用户登录
- ✅ `/api/auth/register` - 用户注册  
- ✅ `/api/admin/users` - 用户管理
- ✅ `/api/admin/stats` - 系统统计
- ✅ `/api/profile` - 个人资料
- ✅ `/api/admin/export` - 数据导出

## 性能优化建议

1. **连接池配置** - 使用 `POSTGRES_PRISMA_URL` 获得更好的连接池性能
2. **查询优化** - PostgreSQL版本支持更复杂的统计查询
3. **索引优化** - 已为常用查询字段创建索引
4. **缓存策略** - 可配合Redis实现查询缓存

## 支持联系

如果在迁移过程中遇到问题，请检查：

1. Vercel项目环境变量配置
2. 数据库连接权限
3. 迁移脚本执行日志
4. 部署日志中的错误信息

数据库迁移完成后，你将拥有一个更强大、更稳定的AI医生预约系统！