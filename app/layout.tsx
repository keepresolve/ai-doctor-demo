import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI医生预约系统',
  description: '在线医生预约和诊疗平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}