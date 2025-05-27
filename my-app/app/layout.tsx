import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

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
  if (!mapClientId) {
    console.error('❌ NEXT_PUBLIC_MAP_CLIENT_ID가 설정되지 않았습니다.')
  }

  return (
    <html lang="ko">
      <head>
        {/* onLoad/onError 제거 */}
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${mapClientId}`}
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  )
}
