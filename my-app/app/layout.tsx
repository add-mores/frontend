// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'
import { Geist, Geist_Mono } from 'next/font/google'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'My Healthcare App',
  description: '증상 기반 맞춤 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const mapClientId = process.env.NEXT_PUBLIC_MAP_CLIENT_ID
  if (!mapClientId) console.error('NEXT_PUBLIC_MAP_CLIENT_ID가 설정되어 있지 않습니다.')

  return (
    // ← 이 파일이 app/ 폴더 바로 아래 layout.tsx 여야 합니다!
    <html lang="ko">
      <head>
        {/* 네이버 지도 스크립트 */}
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${mapClientId}`}
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          antialiased
          bg-gray-900 text-gray-100
        `}
      >
        {children}
      </body>
    </html>
  )
}
