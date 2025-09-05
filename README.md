# AI医生预约系统

基于Next.js 14和SQLite的在线医生预约和诊疗平台。

## 项目特性

### 🏥 核心功能
- **患者系统**: 注册/登录、预约医生、查看预约历史、查看诊疗记录
- **医生系统**: 时间安排管理、查看患者预约、填写诊疗记录
- **管理员系统**: 用户管理、创建医生账号、系统监控

### 🔧 技术栈
- **前端**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, SQLite3
- **认证**: JWT令牌认证
- **部署**: Vercel (支持)

## 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 yarn

### 安装步骤

1. **项目初始化**
   ```bash
   ./scripts/setup.sh
   ```

2. **开发模式运行**
   ```bash
   ./scripts/dev.sh
   ```

3. **生产模式构建和运行**
   ```bash
   ./scripts/build.sh
   ./scripts/start.sh
   ```

4. **部署到Vercel**
   ```bash
   ./scripts/deploy.sh
   ```

## 默认账号信息

### 管理员账号
- **手机号**: 13800138000  
- **密码**: admin123

### 使用流程
1. 访问 http://localhost:3000
2. 使用管理员账号登录后台
3. 创建医生账号
4. 医生登录设置可预约时间
5. 患者注册账号并预约医生

## 项目结构

```
├── app/                    # Next.js App目录
│   ├── api/               # API路由
│   │   ├── auth/         # 认证相关API
│   │   ├── admin/        # 管理员API
│   │   ├── appointments/ # 预约管理API
│   │   └── doctors/      # 医生相关API
│   ├── components/        # 可复用组件
│   ├── lib/              # 工具库
│   │   ├── database.ts   # 数据库连接
│   │   └── auth.ts       # 认证工具
│   ├── types/            # TypeScript类型定义
│   ├── patient/          # 患者页面
│   ├── doctor/           # 医生页面
│   └── admin/            # 管理员页面
├── scripts/               # 运行脚本
├── logs/                 # 日志文件
└── docs/                 # 项目文档
```

## 数据库设计

### 主要数据表
- `users` - 用户基本信息
- `patient_profiles` - 患者扩展信息  
- `doctor_profiles` - 医生扩展信息
- `doctor_schedules` - 医生可预约时间
- `appointments` - 预约记录

## 开发指南

### 代码规范
- TypeScript强类型定义
- 单个文件不超过300行
- 每个文件夹不超过8个文件
- 使用Tailwind CSS样式

### API设计
- RESTful API设计
- JWT认证中间件
- 统一错误处理
- 请求响应类型定义

## 部署说明

### 生产环境配置
1. 修改 `.env` 文件中的JWT密钥
2. 配置生产数据库连接
3. 设置安全的管理员密码

### Vercel部署
项目已配置为可直接部署到Vercel，自动处理：
- 服务端渲染
- API路由
- 静态资源优化
- 环境变量管理

## 许可证

MIT License

---

🏥 **AI医生预约系统** - 让医疗服务更便民高效