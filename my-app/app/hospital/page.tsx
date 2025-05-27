// app/hospital/page.tsx
import type { Metadata } from 'next'
import ClientHospital from './ClientHospital'

export const metadata: Metadata = {
  title: '내 병원 찾기',
  description: '내 주변 병원 추천 서비스',
}

export default function HospitalPage() {
  return <ClientHospital />
}

