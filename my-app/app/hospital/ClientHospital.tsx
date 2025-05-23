'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import axios from 'axios'
import { CopyIcon } from 'lucide-react'
import type { NaverMapHandle } from '@/components/NaverMap'

const NaverMap = dynamic(() => import('@/components/NaverMap'), { ssr: false })

interface Hospital {
  hos_nm: string
  add: string
  deps: string
  lat: number
  lon: number
  distance: number
}

export default function ClientHospital() {
  // 자동 모드: URL 쿼리에서 depts 읽기
  const searchParams = useSearchParams()
  const queryDepts = searchParams.getAll('depts')
  const [isAutoMode, setIsAutoMode] = useState(queryDepts.length > 0)
  const [selectedDepts, setSelectedDepts] = useState<string[]>(queryDepts)

  // 위치 & 정확도
  const [location, setLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null)
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation({ lat: coords.latitude, lon: coords.longitude, accuracy: coords.accuracy }),
      () => alert('위치 정보를 가져오지 못했습니다.'),
      { enableHighAccuracy: true }
    )
  }
  useEffect(getLocation, [])

  // 검색어 & 반경
  const [searchName, setSearchName] = useState('')
  const [radius, setRadius] = useState(1)

  // 전체 진료과 목록
  const [allDepts, setAllDepts] = useState<string[]>([])
  const apiBase = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://addmore.kr'
  useEffect(() => {
    axios.get<string[]>(`${apiBase}/list_departments`)
      .then(r => setAllDepts(r.data))
      .catch(() => {})
  }, [apiBase])

  // 병원 리스트 & 선택
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  useEffect(() => {
    if (!location) return
    axios.post<Hospital[]>(`${apiBase}/api/hospital`, {
      lat: location.lat,
      lon: location.lon,
      radius,
      deps: selectedDepts.length ? selectedDepts : undefined,
      search_name: searchName || undefined,
    })
    .then(r => setHospitals(r.data))
    .catch(() => {})
  }, [location, radius, searchName, selectedDepts, apiBase])

  // mapRef 설정
  const mapRef = useRef<NaverMapHandle>(null)
  const onSelect = (h: Hospital) => {
    setSelectedHospital(h)
    mapRef.current?.panTo({ lat: h.lat, lng: h.lon }, { duration: 500 })
  }
  const onCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('클립보드에 복사되었습니다.')
  }

  return (
    <div className="flex h-screen bg-gray-100 gap-6 items-start p-6">
      {/* 지도 박스 */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-2xl h-[500px] bg-white rounded-2xl shadow-lg border flex flex-col relative">
          {location && (
            <div className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded-md shadow flex items-center space-x-2">
              <span>📍 ±{Math.round(location.accuracy)}m</span>
              <button
                onClick={getLocation}
                className="px-2 py-1 bg-blue-500 text-white rounded"
              >
                다시 요청
              </button>
            </div>
          )}
          {/* 지도 */}
          {location && (
            <NaverMap
              ref={mapRef}
              center={location}
              hospitals={hospitals}
              selectedHos={selectedHospital?.hos_nm}
              onMarkerClick={onSelect}
            />
          )}
        </div>
      </div>

      {/* 리스트 박스 */}
      <div className="w-[400px] max-w-full bg-white rounded-2xl shadow-lg border p-4 flex flex-col h-[500px] overflow-y-auto">
        {/* 검색 & 반경 */}
        <div className="mb-4 space-y-2">
          <input
            type="text"
            placeholder="🔍 병원명 검색"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <div>
            <label className="text-sm">반경: {radius.toFixed(1)}km</label>
            <input
              type="range"
              min={0.1} max={5} step={0.1}
              value={radius}
              onChange={e => setRadius(+e.target.value)}
              className="w-full mt-1"
            />
          </div>
        </div>

        {/* 진료과 토글 */}
        <div className="mb-4">
          <h3 className="font-medium mb-1">진료과 선택</h3>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto">
            {allDepts.map(d => (
              <button
                key={d}
                disabled={isAutoMode}
                onClick={() =>
                  setSelectedDepts(prev =>
                    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                  )
                }
                className={`
                  px-2 py-1 text-xs rounded-full transition 
                  ${selectedDepts.includes(d)
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'}
                  ${isAutoMode ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {d}
              </button>
            ))}
          </div>
          {isAutoMode && (
            <button
              onClick={() => setIsAutoMode(false)}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              수동 모드로 전환
            </button>
          )}
        </div>

        {/* 병원 리스트 */}
        <div className="flex-1 overflow-auto space-y-4">
          <h2 className="text-lg font-semibold mb-2">병원 목록</h2>
          {hospitals.length === 0 ? (
            <p className="text-gray-500">조건에 맞는 병원이 없습니다.</p>
          ) : hospitals.map(h => (
            <div
              key={h.hos_nm}
              onClick={() => onSelect(h)}
              className={`
                p-4 bg-gray-50 rounded-xl shadow hover:shadow-lg transition cursor-pointer
                ${selectedHospital?.hos_nm === h.hos_nm
                  ? 'ring-2 ring-blue-400 shadow-lg'
                  : ''}
                flex flex-col gap-2
              `}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-base">{h.hos_nm}</h3>
                <button onClick={e => { e.stopPropagation(); onCopy(h.hos_nm) }}>
                  <CopyIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">{h.deps}</p>
              <p className="text-xs text-gray-600">{h.add}</p>
              <p className="text-sm font-medium mt-2">거리: {h.distance.toFixed(2)}km</p>
              <div className="flex gap-2 mt-2">
                <a
                  href={`https://map.naver.com/v5/search/${encodeURIComponent(h.hos_nm)}`}
                  target="_blank"
                  className="bg-green-500 text-white font-bold px-3 py-1 rounded"
                >네이버지도</a>
                <a
                  href={`https://map.kakao.com/link/map/${encodeURIComponent(h.hos_nm)},${h.lat},${h.lon}`}
                  target="_blank"
                  className="bg-yellow-400 text-black font-bold px-3 py-1 rounded"
                >카카오맵</a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lon}`}
                  target="_blank"
                  className="bg-blue-500 text-white font-bold px-3 py-1 rounded"
                >구글지도</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
