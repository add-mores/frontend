// app/hospital/ClientHospital.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import axios from 'axios'
import { CopyIcon, Clipboard } from 'lucide-react'
import { SiKakaotalk, SiNaver, SiGooglemaps } from 'react-icons/si'

const NaverMap = dynamic(() => import('@/components/NaverMap'), { ssr: false })

interface Hospital {
  hos_nm:   string
  add:      string
  deps:     string
  lat:      number
  lon:      number
  distance: number
}

export default function ClientHospital() {
  const searchParams       = useSearchParams()
  const queryDepts         = searchParams.getAll('depts')
  const [isAutoMode, setIsAutoMode]       = useState(queryDepts.length > 0)
  const [selectedDepts, setSelectedDepts] = useState<string[]>(queryDepts)

  const [location, setLocation] = useState<{ lat:number; lon:number; accuracy:number } | null>(null)
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation({
        lat: coords.latitude,
        lon: coords.longitude,
        accuracy: coords.accuracy
      }),
      () => alert('위치 정보를 가져오지 못했습니다.'),
      { enableHighAccuracy: true }
    )
  }
  useEffect(() => { getLocation() }, [])

  const [searchName, setSearchName]       = useState('')
  const [debouncedName, setDebouncedName] = useState(searchName)
  const [radius, setRadius]               = useState(1)
  const [allDepts, setAllDepts]           = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<{ department: string }[]>([])
  const [hospitals, setHospitals]         = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const apiBase = process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'https://addmore.kr'

  // 전체 진료과 목록
  useEffect(() => {
    axios.get<string[]>(`${apiBase}/list_departments`)
      .then(r => setAllDepts(r.data))
      .catch(console.error)
  }, [apiBase])

  // 추천 진료과 로드
  useEffect(() => {
    axios.get<{ recommendations: { department: string }[] }>(`${apiBase}/api/recommendations`)
      .then(r => setRecommendations(r.data.recommendations))
      .catch(console.error)
  }, [apiBase])

  // 검색어 디바운스
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(searchName), 300)
    return () => clearTimeout(timer)
  }, [searchName])

  // 병원 조회
  useEffect(() => {
    if (!location) return

    setLoading(true)
    setError(null)

    // 자동 모드 시 추천 진료과 사용
    let depsToSend: string[] | undefined = undefined
    if (isAutoMode && recommendations.length > 0) {
      const autoDepts = [...new Set(recommendations.map(r => r.department))]
      depsToSend = autoDepts
    } else if (selectedDepts.length > 0) {
      depsToSend = selectedDepts
    }

    axios.post<Hospital[]>(`${apiBase}/api/hospital`, {
      lat: location.lat,
      lon: location.lon,
      radius,
      deps: depsToSend,
      search_name: debouncedName || undefined
    })
    .then(r => setHospitals(r.data))
    .catch(e => setError(e.message))
    .finally(() => setLoading(false))
  }, [location, radius, debouncedName, selectedDepts, isAutoMode, recommendations, apiBase])

  const mapRef = useRef<any>(null)
  const onSelect = (h: Hospital) => {
    setSelectedHospital(h)
    if (mapRef.current) {
      mapRef.current.panTo({ lat: h.lat, lng: h.lon }, { duration: 500 })
    }
  }

  const onCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('클립보드에 복사되었습니다.')
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* ─── 좌측: 지도 ─── */}
      <div className="lg:w-2/3 w-full p-4">
        <div className="relative h-[70vh] rounded-lg overflow-hidden shadow-xl">
          {location && (
            <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-sm font-medium bg-white text-black border shadow">
              📍 정확도: ±{Math.round(location.accuracy)}m
            </div>
          )}
          {location && (
            <NaverMap
              ref={mapRef}
              center={location}
              hospitals={hospitals}
              selectedHos={selectedHospital?.hos_nm}
              onMarkerClick={h => onSelect(h)}
              // radius 시각화 예시 (기능 지원 시)
              circle={{
                center: location,
                radius: radius * 1000,
                options: { fillOpacity: 0.1, strokeWeight: 1 }
              }}
            />
          )}
        </div>
      </div>

      {/* ─── 우측: 사이드바 ─── */}
      <div className="lg:w-1/3 w-full border-l border-gray-700 bg-gray-800 p-6 flex flex-col">
        {/* 검색 & 반경 */}
        <div className="space-y-3 mb-6">
          <input
            type="text"
            placeholder="🔍 병원명 검색"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded"
          />
          <div>
            <label className="text-sm">
              반경: <span className="font-medium">{radius.toFixed(1)}km</span>
            </label>
            <input
              type="range"
              min={0.1} max={5} step={0.1}
              value={radius}
              onChange={e => setRadius(+e.target.value)}
              className="w-full mt-1 accent-blue-500"
            />
          </div>
        </div>

        {/* 진료과 필터 */}
        <div className="mb-6 relative">
          <details className="w-full">
            <summary className="flex justify-between items-center px-4 py-2 bg-white text-black rounded-full cursor-pointer select-none border border-gray-300 whitespace-nowrap overflow-hidden">
              <span className="font-semibold">진료과 필터</span>
              <span className="text-sm text-gray-600">{selectedDepts.length}개 선택</span>
            </summary>
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-2xl max-h-48 overflow-auto p-3 shadow-lg">
              {allDepts.map(d => (
                <label key={d} className="flex items-center space-x-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isAutoMode}
                    checked={selectedDepts.includes(d)}
                    onChange={() => {
                      setSelectedDepts(prev =>
                        prev.includes(d)
                          ? prev.filter(x => x !== d)
                          : [...prev, d]
                      )
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-black">{d}</span>
                </label>
              ))}
              {isAutoMode && (
                <button
                  onClick={() => setIsAutoMode(false)}
                  className="mt-2 px-3 py-1 bg-gray-600 text-gray-200 rounded-full hover:bg-gray-500 w-full"
                >
                  수동 모드 전환
                </button>
              )}
            </div>
          </details>
        </div>

        {/* 병원 목록 */}
        <div className="flex-1 overflow-auto">
          <div className="flex items-center mb-4">
            <Clipboard className="w-6 h-6 text-yellow-400 mr-2" />
            <h2 className="text-2xl font-bold text-black">병원 목록</h2>
          </div>

          {loading && <p className="text-center text-gray-500">로딩 중...</p>}
          {error && <p className="text-center text-red-400">에러: {error}</p>}

          {!loading && hospitals.length === 0 && !error && (
            <p className="text-gray-400">조건에 맞는 병원이 없습니다.</p>
          )}

          {!loading && hospitals.map(h => (
            <div
              key={h.hos_nm}
              onClick={() => onSelect(h)}
              className={`mb-4 p-4 bg-white text-black rounded-xl shadow ring-1 ring-gray-300 hover:shadow-lg cursor-pointer transition 
                ${selectedHospital?.hos_nm === h.hos_nm ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{h.hos_nm}</h3>
                <button onClick={() => onCopy(h.hos_nm)}>
                  <CopyIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              <p className="text-sm mt-2">{h.add}</p>
              <p className="text-sm mt-1">{h.deps}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-blue-600 font-medium">
                  거리: {h.distance.toFixed(2)}km
                </span>
                <div className="flex space-x-2">
                  <a
                    href={`kakaomap://look?p=${h.lat},${h.lon}`}
                    target="_blank"
                    className="flex items-center px-3 py-1 bg-yellow-400 text-black rounded-full text-xs shadow"
                  >
                    <SiKakaotalk className="w-4 h-4 mr-1 text-black" /> 카카오맵
                  </a>
                  <a
                    href={`https://map.naver.com/v5/search/${encodeURIComponent(h.hos_nm)}`}
                    target="_blank"
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded-full text-xs shadow"
                  >
                    <SiNaver className="w-4 h-4 mr-1 text-white" /> 네이버지도
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lon}`}
                    target="_blank"
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-full text-xs shadow"
                  >
                    <SiGooglemaps className="w-4 h-4 mr-1 text-white" /> 구글지도
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
