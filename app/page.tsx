import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI医生预约系统
          </h1>
          <p className="text-gray-600 mb-8">
            选择您的身份进入系统
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/patient/login"
            className="w-full btn-primary block text-center py-4 text-lg"
          >
            患者登录
          </Link>
          
          <Link
            href="/doctor/login"
            className="w-full btn-secondary block text-center py-4 text-lg"
          >
            医生登录
          </Link>
          
          <Link
            href="/admin/login"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium block text-center py-4 text-lg rounded-md transition-colors"
          >
            管理员登录
          </Link>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>首次使用？</p>
          <Link href="/patient/register" className="text-primary-600 hover:text-primary-700">
            注册患者账号
          </Link>
        </div>
      </div>
    </div>
  )
}