'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import axios from 'axios'

const NaverMap = dynamic(() => import('@/components/NaverMap'), {
  ssr: false
})

interface Hospital {
  hos_nm: string
  add: string
  deps: string
  lat: number
  lon: number
  distance: number
}

let locationWatcher: number | null = null

export default function HospitalPage() {
  const [location, setLocation] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null)
  const [radius, setRadius] = useState<number>(1.0)
  const [searchName, setSearchName] = useState<string>("")
  const [treatments, setTreatments] = useState<string[]>([])
  const [allDepts, setAllDepts] = useState<string[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<{ lat: number; lon: number } | null>(null)
  const [apiBase, setApiBase] = useState<string | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // ① 네이버 지도 SDK 로드 (ncpKeyId로 변경)
  useEffect(() => {
    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_MAP_CLIENT_ID}`
    script.async = true
    script.onload = () => {
      console.log('✅ 네이버 지도 SDK 로드 완료')
      setIsMapLoaded(true)
    }
    script.onerror = () => {
      console.error('❌ 네이버 지도 SDK 로드 실패')
    }
    document.head.appendChild(script)
  }, [])

  // ② API Base 결정
  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname
      const base = host === "localhost" ? "http://localhost:8000" : "https://addmore.kr"
      console.log('🔗 API Base:', base)
      setApiBase(base)
    }
  }, [])

  // ③ 위치 요청 함수
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("위치 정보를 지원하지 않는 브라우저입니다.")
      return
    }
    console.log('📡 위치 요청 시작')
    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        console.log('✅ 위치 수신 성공:', latitude, longitude, '정확도:', accuracy)
        if (accuracy < 4000) {
          setLocation({ lat: latitude, lon: longitude, accuracy })
          navigator.geolocation.clearWatch(watcher)
        }
      },
      (err) => {
        console.error('❌ 위치 접근 실패:', err)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
    locationWatcher = watcher
  }

  // ④ 최초 위치 요청
  useEffect(() => {
    getLocation()
    return () => {
      if (locationWatcher !== null) navigator.geolocation.clearWatch(locationWatcher)
    }
  }, [])

  // ⑤ 병원 데이터 필터링 요청
  useEffect(() => {
    if (!location || !apiBase) return
    console.log('🔍 병원 필터 요청:', { location, radius, treatments, searchName })
    axios.post(`${apiBase}/filter_hospitals`, {
      lat: location.lat,
      lon: location.lon,
      radius,
      deps: treatments,
      search_name: searchName
    }).then(res => {
      console.log('📑 병원 응답:', res.data.length)
      setHospitals(res.data)
    }).catch(err => console.error('❌ 병원 요청 실패', err))
  }, [location, radius, treatments, searchName, apiBase])

  // ⑥ 진료과 목록 요청
  useEffect(() => {
    if (!apiBase) return
    axios.get(`${apiBase}/list_departments`)
      .then(res => {
        console.log('📋 진료과 목록:', res.data.length)
        setAllDepts(res.data)
      })
      .catch(err => console.error('❌ 진료과 요청 실패', err))
  }, [apiBase])

  // ⑦ selectedHospital 상태 디버깅
  useEffect(() => {
    console.log('🌟 selectedHospital 상태 변경:', selectedHospital)
  }, [selectedHospital])

  return (
    <div style={{ padding: '1rem' }}>
      <h1>🏥 병원 지도 서비스</h1>

      {/* 위치 정확도 */}
      {location && (
        <div style={{ marginBottom: '1rem' }}>
          <p>📍 위치 정확도: ±{Math.round(location.accuracy ?? 0)}m</p>
          <button onClick={getLocation}>📍 위치 다시 요청</button>
        </div>
      )}

      {/* 반경 슬라이더 */}
      <label>반경: {radius}km</label>
      <input
        type="range"
        min="0.1" max="5" step="0.1"
        value={radius}
        onChange={e => setRadius(Number(e.target.value))}
      />

      {/* 병원명 검색 */}
      <input
        type="text"
        placeholder="🔍 병원명 검색"
        value={searchName}
        onChange={e => setSearchName(e.target.value)}
        style={{ width: '100%', padding: '8px', margin: '1rem 0' }}
      />

      {/* 진료과 필터 */}
      <div style={{ marginBottom: '1rem' }}>
        {allDepts.map(dept => (
          <label key={dept} style={{ marginRight: '10px' }}>
            <input
              type="checkbox"
              checked={treatments.includes(dept)}
              onChange={() => setTreatments(prev =>
                prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
              )}
            />
            {dept}
          </label>
        ))}
      </div>

      {/* ⑧ hospital 렌더 조건 디버깅 */}
      {console.log('▶️ hospital.tsx 렌더 조건:', { isMapLoaded, hasLocation: !!location })}
      {isMapLoaded && location && (
        <NaverMap
          center={location}
          hospitals={hospitals}
          selectedHospital={selectedHospital}
        />
      )}

      {/* 병원 목록 & 클릭 핸들러 */}
      <h2>📋 병원 목록</h2>
      {hospitals.length === 0 && <p>조건에 맞는 병원이 없습니다.</p>}
      {hospitals.map((h, i) => (
        <div
          key={i}
          onClick={() => {
            console.log('🏥 병원 클릭됨:', h.hos_nm, h.lat, h.lon)
            setSelectedHospital({ lat: h.lat, lon: h.lon })
          }}
          style={{ cursor: 'pointer', padding: '8px', borderBottom: '1px solid #eee' }}
        >
          <strong>{h.hos_nm}</strong> — {h.deps}
        </div>
      ))}
    </div>
  )
}
