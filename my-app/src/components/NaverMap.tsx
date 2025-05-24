'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window { naver: any }
}

interface Hospital {
  hos_nm: string
  add: string
  deps: string
  lat: number
  lon: number
}

export default function NaverMap({
  center,
  hospitals,
  selectedHospital
}: {
  center: { lat: number; lon: number }
  hospitals: Hospital[]
  selectedHospital?: { lat: number; lon: number } | null
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markers = useRef<any[]>([])

  // ── 맵 생성 / 중심 갱신 ───────────────
  useEffect(() => {
    console.log('▶️ NaverMap useEffect[center] fired:', {
      hasWindow: !!window.naver,
      hasRef: !!mapRef.current,
      center
    })
    if (!window.naver || !mapRef.current) return

    console.log('✅ 지도 생성 시작', center)
    if (!mapInstance.current) {
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(center.lat, center.lon),
        zoom: 15
      })
      console.log('🟢 mapInstance 생성됨:', mapInstance.current)
    } else {
      mapInstance.current.setCenter(
        new window.naver.maps.LatLng(center.lat, center.lon)
      )
      console.log('🟡 mapInstance 중심 갱신:', center)
    }
  }, [center])

  // ── 마커 렌더링 ───────────────
  useEffect(() => {
    console.log('▶️ NaverMap useEffect[hospitals] fired:', hospitals.length, 'items')
    if (!mapInstance.current) return

    markers.current.forEach(m => m.setMap(null))
    markers.current = []

    hospitals.forEach(h => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(h.lat, h.lon),
        map: mapInstance.current,
        title: h.hos_nm
      })
      markers.current.push(marker)
    })
    console.log(`📍 ${hospitals.length}개 마커 렌더 완료`)
  }, [hospitals])

  // ── 병원 선택 시 이동 ───────────────
  useEffect(() => {
    console.log('▶️ NaverMap useEffect[selectedHospital] fired:', selectedHospital)
    if (selectedHospital && mapInstance.current) {
      mapInstance.current.setCenter(
        new window.naver.maps.LatLng(selectedHospital.lat, selectedHospital.lon)
      )
      console.log('🎯 선택된 병원으로 이동:', selectedHospital)
    }
  }, [selectedHospital])

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '400px',
        border: '2px dashed green'
      }}
    />
  )
}
