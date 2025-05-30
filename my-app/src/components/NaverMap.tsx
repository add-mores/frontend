// components/NaverMap.tsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface NaverMapHandle {
  panTo: (pos: { lat: number, lng: number }, opts?: any) => void
}

type LatLng = { lat: number, lon: number }
type Hospital = { hos_nm: string; lat: number; lon: number }

interface Props {
  center: LatLng
  hospitals: Hospital[]
  userLocation?: LatLng
  selectedHos?: string
  onMarkerClick?: (h: Hospital) => void
}

const NaverMap = forwardRef<NaverMapHandle, Props>((props, ref) => {
  const { center, hospitals, userLocation, selectedHos, onMarkerClick} = props
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInst = useRef<any>(null)
  const markers = useRef<Record<string, any>>({})
  const userMarker = useRef<any>(null)

  // 1) 지도 초기화
  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) return
    if (!mapInst.current) {
      mapInst.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(center.lat, center.lon),
        zoom: 15,
      })
    }
  }, [])

  // 2) center 변경 시
  useEffect(() => {
    if (mapInst.current) {
      mapInst.current.setCenter(
        new window.naver.maps.LatLng(center.lat, center.lon)
      )
    }
  }, [center.lat, center.lon])

  // 3) 병원 마커 렌더링
  useEffect(() => {
    if (!mapInst.current) return
    Object.values(markers.current).forEach(m => m.setMap(null))
    markers.current = {}
    hospitals.forEach(h => {
      const m = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(h.lat, h.lon),
        map: mapInst.current,
        title: h.hos_nm,
      })
      m.addListener('click', () => onMarkerClick?.(h))
      markers.current[h.hos_nm] = m
    })
  }, [hospitals, onMarkerClick])

  // 4) 내 위치 빨간 마커 렌더링
  useEffect(() => {
    if (!mapInst.current || !userLocation) return
    console.log('▶ userLocation useEffect:', userLocation)
    // 이전 마커 제거
    userMarker.current?.setMap(null)
    // 새로운 빨간 마커 생성
    userMarker.current = new window.naver.maps.Marker({
      map: mapInst.current,
      position: new window.naver.maps.LatLng(userLocation.lat, userLocation.lon),
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        size: new window.naver.maps.Size(32, 32),
        anchor: new window.naver.maps.Point(16, 32),
      },
    })
  }, [userLocation])


  // 6) 외부 panTo
  useImperativeHandle(ref, () => ({
    panTo(pos, opts) {
      mapInst.current?.panTo(
        new window.naver.maps.LatLng(pos.lat, pos.lng),
        opts
      )
    }
  }))

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
})

export default NaverMap
