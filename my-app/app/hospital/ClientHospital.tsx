// app/hospital/ClientHospital.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import axios from 'axios'
import { CopyIcon, Clipboard } from 'lucide-react'
// import { SiKakaotalk, SiNaver, SiGooglemaps } from 'react-icons/si'


// SSR을 피하기 위해 동적으로 불러오는 네이버 지도 컴포넌트
const NaverMap = dynamic(() => import('@/components/NaverMap'), { ssr: false })

interface Hospital {
  hos_nm: string  // 병원 이름
  add: string  // 주소
  deps: string  // 진료과
  lat: number  // 위도
  lon: number  // 경도
  distance: number  // 거리(km)
}

export default function ClientHospital() {
  // ─── URL 파라미터로 자동/수동 모드 결정 ───
  const searchParams = useSearchParams()
  const departmentsParam = searchParams.get('departments')
  const queryDepts = departmentsParam ? departmentsParam.split(',') : []

  // 상태 선언
  const [isAutoMode, setIsAutoMode] = useState(false)
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [location, setLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null)

  const [searchAddress, setSearchAddress] = useState('')
  const [searchName, setSearchName] = useState('')
  const [debouncedName, setDebouncedName] = useState(searchName)
  const [radius, setRadius] = useState(1)

  const [allDepts, setAllDepts] = useState<string[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;


  // 위치 조회 함수
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation({ lat: coords.latitude, lon: coords.longitude, accuracy: coords.accuracy }),
      () => alert('위치 정보를 가져오지 못했습니다.'),
      { enableHighAccuracy: true }
    )
  }

  // 초기 위치 조회 (컴포넌트 마운트 시)
  useEffect(() => {
    getLocation()
  }, [])

  // 전체 진료과 목록 불러오기
  useEffect(() => {
    axios.get<string[]>(`${apiBase}/list_departments`)
      .then(res => setAllDepts(res.data))
      .catch(console.error)
  }, [apiBase])

  // debouncedName 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(searchName)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchName])

  // URL 쿼리로 진료과가 있으면 selectedDepts에 세팅
  // 위치가 준비되면 쿼리 있는 경우, deps 포함 검색 수행
  useEffect(() => {
    const hasQueryDepts = queryDepts.length > 0

    if (location) {
      if (hasQueryDepts) {
        setSelectedDepts(queryDepts)
        setIsAutoMode(true)  // ✅ URL에 진료과가 있으면 auto 모드 ON
      } else {
        setSelectedDepts([])
        setIsAutoMode(false) // ❌ 없으면 auto 모드 OFF
      }
    }
  }, [location, queryDepts.join(',')])

  // 병원 조회 함수
  const fetchHospitals = async (deps?: string[]) => {
    if (!location) return
    setLoading(true)
    setError(null)
    try {
      const params = {
        lat: location.lat,
        lon: location.lon,
        radius,
        search_name: debouncedName || undefined,
        deps: deps && deps.length > 0 ? deps : undefined,
      }
      const res = await axios.post<Hospital[]>(`${apiBase}/api/hospital`, params)
      setHospitals(res.data)
    } catch (e: any) {
      setError(e.message || '병원 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 위치가 세팅되고 selectedDepts가 변할 때 병원 검색
  // 쿼리가 있으면 selectedDepts를 이용, 없으면 빈 배열로 호출해서 deps 없이 검색
  useEffect(() => {
    if (location) {
      fetchHospitals(selectedDepts)
    }
  }, [location, selectedDepts, radius, debouncedName])

  // 주소 검색 버튼 핸들러
  const handleSearchAddress = async () => {
    if (!searchAddress) return
    try {
      const { data } = await axios.get(`${apiBase}/geocode`, { params: { query: searchAddress } })
      if (data.lat != null && data.lon != null) {
        setLocation({ lat: data.lat, lon: data.lon, accuracy: 0 })
      } else {
        alert('주소를 찾을 수 없습니다.')
      }
    } catch {
      alert('주소 검색 중 오류가 발생했습니다.')
    }
  }

  // 지도 패닝 및 클립보드 복사
  const mapRef = useRef<any>(null)
  const onSelect = (h: Hospital) => {
    setSelectedHospital(h)
    mapRef.current?.panTo({ lat: h.lat, lng: h.lon }, { duration: 500 })
  }
  const onCopy = (t: string) => {
    navigator.clipboard.writeText(t)
    alert('병원명이 클립보드에 복사되었습니다.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 py-16 px-6 md:px-12">
      <div className="max-w-6xl mx-auto space-y-16">

        {/* ─── 헤더 ─── */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-sky-700">
            🏥 병원 정보 서비스
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            입력한 증상과 조건을 기반으로 최적의 병원을 추천해드립니다.
          </p>
        </div>

        {/* ─── 메인 레이아웃: 지도(60%) + 사이드바(40%) ─── */}
        <div className="flex gap-6">

          {/* ─── 지도 영역 ─── */}
          <div className="w-3/5 h-[70vh] rounded-3xl overflow-hidden shadow-lg relative">
            {/* 정확도 배지 (지도 위) */}
            {location && (
              <>
                {/* 내 위치 재요청 버튼 */}
                {/* 정확도 배지 */}
                {location && (
                  <div className="absolute top-3 left-3 z-20 inline-flex items-center space-x-1
                           bg-white px-3 py-1 rounded-full text-sm font-medium text-black
                           ring-1 ring-gray-300 shadow">
                    {location.accuracy > 0
                      ? <>📍 정확도: ±{Math.round(location.accuracy)}m</>
                      : <>📍 주소 기준</>
                    }
                  </div>
                )}

                {/* 내 위치 재요청 버튼 */}
                <button
                  onClick={getLocation}
                  className="absolute top-3 right-3 z-20 bg-white px-3 py-1 rounded-lg
                             text-sm font-medium text-gray-700 ring-1 ring-gray-300 shadow
                             hover:ring-blue-400 transition"
                >
                  내 위치 재요청
                </button>
              </>
            )}

            <div className="w-full h-full">
              {location && (
                <NaverMap
                  ref={mapRef}
                  center={location}
                  userLocation={location}
                  hospitals={hospitals}
                  selectedHos={selectedHospital?.hos_nm}
                  onMarkerClick={onSelect}
                  className="w-full h-full"
                />
              )}
            </div>
          </div>

          {/* ─── 사이드바 영역 ─── */}
          <div className="w-2/5 flex flex-col h-[70vh] space-y-4">

            {/* 검색 & 반경 */}
            {/* ─── 주소 검색 ─── */}
            <div className="mb-4 bg-white rounded-2xl p-4 shadow-inner">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="📍 주소를 입력하세요"
                  value={searchAddress}
                  onChange={e => setSearchAddress(e.target.value)}
                  className="flex-1 px-4 py-2 bg-black-100 rounded-lg text-black"
                />
                <button
                  onClick={handleSearchAddress}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  위치 검색
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-inner">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="🔍 병원명 검색"
                  value={searchName}
                  onChange={e => setSearchName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-black"
                />
                <button
                  onClick={() => setDebouncedName(searchName)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  검색
                </button>
              </div>
              <div className="mt-3">
                <label className="text-sm text-gray-700">
                  반경: <span className="font-medium">{radius.toFixed(1)}km</span>
                </label>
                <input
                  type="range"
                  min={0.1} max={5} step={0.1}
                  value={radius}
                  onChange={e => setRadius(+e.target.value)}
                  className="w-full mt-1 accent-blue-400"
                />
              </div>
            </div>

            {/* 진료과 필터 */}
            <details className="bg-white rounded-2xl p-4 shadow-inner">
              <summary className="flex justify-between items-center cursor-pointer text-black">
                <span>진료과 필터</span>
                <span className="text-sm">{selectedDepts.length}개 선택</span>
              </summary>
              <div className="mt-2 max-h-44 overflow-auto space-y-2">
                {allDepts.map(d => (
                  <label key={d} className="flex items-center space-x-2 text-gray-600">
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
                      className="w-4 h-4 text-blue-400"
                    />
                    <span>{d}</span>
                  </label>
                ))}
                {isAutoMode && (
                  <button
                    onClick={() => setIsAutoMode(false)}
                    className="w-full py-1 bg-gray-300 rounded-lg"
                  >
                    수동 모드 전환
                  </button>
                )}
              </div>
            </details>

            {/* 병원 목록 (스크롤 영역) */}
            <div
              className="bg-white rounded-2xl p-4 shadow-inner overflow-y-auto"
              style={{ maxHeight: 'calc(70vh - 16rem)' }}
            >
              <div className="flex items-center mb-4">
                <Clipboard className="w-6 h-6 text-yellow-400 mr-2" />
                <h2 className="text-2xl font-bold text-black">병원 목록</h2>
              </div>
              {loading && <p className="text-center text-gray-400">로딩 중...</p>}
              {error && <p className="text-center text-red-500">에러: {error}</p>}
              {!loading && hospitals.length === 0 && !error && (
                <p className="text-gray-500">조건에 맞는 병원이 없습니다.</p>
              )}
              {hospitals.map(h => (
                <div
                  key={h.hos_nm}
                  onClick={() => onSelect(h)}
                  className={`
                    mb-3 p-3 rounded-lg cursor-pointer
                    ${selectedHospital?.hos_nm === h.hos_nm ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200'}
                    hover:shadow-md
                  `}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-black">{h.hos_nm}</h3>
                    <button onClick={() => onCopy(h.hos_nm)}>
                      <CopyIcon className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{h.add}</p>
                  <p className="mt-1 text-sm text-gray-600">{h.deps}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-blue-600 font-medium">{h.distance.toFixed(2)}km</span>
                    <div className="flex space-x-2">
                      {/* 지도 링크 버튼 */}
                      <a
                        href={`kakaomap://look?p=${h.lat},${h.lon}`}
                        target="_blank"
                        className="px-2 py-1 bg-yellow-400 rounded-full text-xs"
                      >
                        Kakao
                      </a>
                      <a
                        href={`https://map.naver.com/v5/search/${encodeURIComponent(h.hos_nm)}`}
                        target="_blank"
                        className="px-2 py-1 bg-green-600 text-white rounded-full text-xs"
                      >
                        Naver
                      </a>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lon}`}
                        target="_blank"
                        className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs"
                      >
                        Google
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
