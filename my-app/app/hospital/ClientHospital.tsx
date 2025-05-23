// app/hospital/ClientHospital.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
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

  const [searchName, setSearchName] = useState('')
  const [radius, setRadius]         = useState(1)
  const [allDepts, setAllDepts]     = useState<string[]>([])
  const apiBase = process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'https://addmore.kr'

  useEffect(() => {
    axios.get<string[]>(`${apiBase}/list_departments`)
      .then(r => setAllDepts(r.data))
      .catch(console.error)
  }, [apiBase])

  const [hospitals, setHospitals]               = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)

  useEffect(() => {
    if (!location) return
    axios.post<Hospital[]>(`${apiBase}/api/hospital`, {
      lat: location.lat,
      lon: location.lon,
      radius,
      deps: selectedDepts.length ? selectedDepts : undefined,  // 서버에서는 OR 조건으로 처리해 주세요.
      search_name: searchName || undefined
    })
    .then(r => setHospitals(r.data))
    .catch(console.error)
  }, [location, radius, searchName, selectedDepts, apiBase])

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
          {/* 정확도만 표시 (버튼 제거) */}
          {location && (
            <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded">
              <span className="text-black font-medium">📍 ±{Math.round(location.accuracy)}m</span>
            </div>
          )}
          {location && (
            <NaverMap
              ref={mapRef}
              center={location}
              hospitals={hospitals}
              selectedHos={selectedHospital?.hos_nm}
              onMarkerClick={h => onSelect(h)}
            />
          )}
        </div>
      </div>

      {/* ─── 우측: 사이드바 ─── */}
      <div className="lg:w-1/3 w-full border-l border-gray-700 bg-gray-800 p-6 flex flex-col">
        <div className="space-y-3 mb-6">
          <input
            type="text"
            placeholder="🔍 병원명 검색"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded"
          />
          <div>
            <label className="text-sm">반경: <span className="font-medium">{radius.toFixed(1)}km</span></label>
            <input
              type="range"
              min={0.1} max={5} step={0.1}
              value={radius}
              onChange={e => setRadius(+e.target.value)}
              className="w-full mt-1 accent-blue-500"
            />
          </div>
        </div>

        {/* 진료과 필터(Select) */}
        + {/* ─── 진료과 드롭다운 + 체크박스 ─── */}
 <div className="mb-6 relative">
   <details className="w-full">
     <summary
       className="flex justify-between items-center px-4 py-2 bg-white text-black rounded-full cursor-pointer select-none"
     >
       <span className="font-semibold">진료과 필터</span>
       <span className="text-sm text-gray-600">{selectedDepts.length}개 선택</span>
     </summary>
     <div
       className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-2xl max-h-48 overflow-auto p-3 shadow-lg"
     >
       {allDepts.map(d => (
         <label key={d} className="flex items-center space-x-2 py-1">
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
            <h2 className="text-2xl font-bold text-white">병원 목록</h2>
          </div>
          {hospitals.length === 0 && (
            <p className="text-gray-400">조건에 맞는 병원이 없습니다.</p>
          )}
          {hospitals.map(h => (
            <div
              key={h.hos_nm}
              onClick={() => onSelect(h)}
              className={`mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg cursor-pointer transition 
                ${selectedHospital?.hos_nm === h.hos_nm ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{h.hos_nm}</h3>
                <button onClick={() => onCopy(h.hos_nm)}>
                  <CopyIcon className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                </button>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{h.add}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{h.deps}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  거리: {h.distance.toFixed(2)}km
                </span>
                <div className="flex space-x-2">
                  <a
                    href={`kakaomap://look?p=${h.lat},${h.lon}`}
                    target="_blank"
                    className="flex items-center px-2 py-1 bg-[#fee500] text-black rounded text-xs"
                  >
                    <SiKakaotalk className="w-4 h-4 mr-1" /> 카카오맵
                  </a>
                  <a
                    href={`https://map.naver.com/v5/search/${encodeURIComponent(h.hos_nm)}`}
                    target="_blank"
                    className="flex items-center px-2 py-1 bg-[#03c75a] text-white rounded text-xs"
                  >
                    <SiNaver className="w-4 h-4 mr-1" /> 네이버지도
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lon}`}
                    target="_blank"
                    className="flex items-center px-2 py-1 bg-[#1a73e8] text-white rounded text-xs"
                  >
                    <SiGooglemaps className="w-4 h-4 mr-1" /> 구글지도
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
