// components/NaverMap.tsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { Hospital } from '@/types'
import { createTooltipOverlay, createTooltipElement } from './MapTooltipOverlay'

export interface NaverMapHandle {
  panTo: (
    pos: { lat: number; lng: number },
    opts?: any,
    hosNm?: string
  ) => void
}

type LatLng = { lat: number; lon: number }

interface Props {
  center: LatLng
  hospitals: Hospital[]
  userLocation?: LatLng
  selectedHos?: string
  onMarkerClick?: (h: Hospital) => void
  onMapClick?: () => void
  onViewportChange?: (center: LatLng, radiusKm: number) => void
  className: string
}

const NaverMap = forwardRef<NaverMapHandle, Props>((props, ref) => {
  const {
    center,
    hospitals,
    userLocation,
    onMarkerClick,
    onViewportChange,
    onMapClick
  } = props

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInst = useRef<any>(null)
  const markers = useRef<Record<string, any>>({})
  const userMarker = useRef<any>(null)
  const overlayRef = useRef<any>(null)

  const emergencyIcon = {
    url: '/emergency.png',
    size: new window.naver.maps.Size(32, 32),
    anchor: new window.naver.maps.Point(16, 32),
    scaledSize: new window.naver.maps.Size(32, 32)
  }

  /* ────────── 1. 지도 생성 ────────── */
  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) return
    if (mapInst.current) return

    mapInst.current = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(center.lat, center.lon),
      zoom: 15
    })

    // 빈곳·드래그·줌 시 말풍선/선택 해제
    const hide = (e?: any) => {
      if (e?.overlay instanceof window.naver.maps.Marker) return;   // 마커·오버레이를 누른 건 무시
      if (overlayRef.current) {
        overlayRef.current.setMap(null)
        overlayRef.current = null
      }

      /* ② 빈곳 클릭·드래그 종료 시 내 위치로 복귀 */
      if (userLocation && mapInst.current) {
        const p = new window.naver.maps.LatLng(
          userLocation.lat,
          userLocation.lon
        )
        mapInst.current.panTo(p, { duration: 300 })
      }

      onMapClick?.()
    }
    const ls = [
      window.naver.maps.Event.addListener(mapInst.current, 'click', hide),
      window.naver.maps.Event.addListener(mapInst.current, 'dragend', hide),    // ✅ dragend 로 교체
      window.naver.maps.Event.addListener(mapInst.current, 'zoom_changed', hide)
    ]
    return () => ls.forEach(l => window.naver.maps.Event.removeListener(l))
  }, [onMapClick, userLocation])

  /* ────────── 2. 중심 좌표 변경 ────────── */
  useEffect(() => {
    if (mapInst.current) {
      mapInst.current.setCenter(
        new window.naver.maps.LatLng(center.lat, center.lon)
      )
    }
  }, [center.lat, center.lon])

  /* ────────── 3. 병원 마커 갱신 ────────── */
  useEffect(() => {
    if (!mapInst.current) return
    Object.values(markers.current).forEach(m => m.setMap(null))
    markers.current = {}

    hospitals.forEach(h => {
      const m = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(h.lat, h.lon),
        map: mapInst.current,
        title: h.hos_nm,
        icon: h.emer?.trim() === '있음' ? emergencyIcon : undefined
      })

      m.addListener('click', () => {
        overlayRef.current?.setMap(null)
        const el = createTooltipElement(
          h.hos_nm,
          h.add,
          h.emer,
          h.emer_phone,
          h.deps
        )
        const overlay = createTooltipOverlay(
          new window.naver.maps.LatLng(h.lat, h.lon),
          el
        )
        overlay.setMap(mapInst.current)
        overlayRef.current = overlay
        onMarkerClick?.(h)
      })

      markers.current[h.hos_nm] = m
    })
  }, [hospitals, onMarkerClick])

  /* ────────── 4. 사용자 위치 마커 ────────── */
  useEffect(() => {
    if (!mapInst.current || !userLocation) return
    userMarker.current?.setMap(null)
    userMarker.current = new window.naver.maps.Marker({
      map: mapInst.current,
      position: new window.naver.maps.LatLng(
        userLocation.lat,
        userLocation.lon
      ),
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        size: new window.naver.maps.Size(32, 32),
        anchor: new window.naver.maps.Point(16, 32)
      }
    })
  }, [userLocation])

  /* ────────── 5. 뷰포트 변화 감지 (idle) ────────── */
  useEffect(() => {
    if (!mapInst.current || !onViewportChange) return

    const listener = window.naver.maps.Event.addListener(
      mapInst.current,
      'idle',
      () => {
        const map = mapInst.current
        const c = map.getCenter()
        const b = map.getBounds()
        const ne = map.getBounds().getMax()  // ← 수정

        // Haversine 거리(km) 계산
        const toRad = (d: number) => (d * Math.PI) / 180
        const R = 6371
        const dLat = toRad(ne.lat() - c.lat())
        const dLon = toRad(ne.lng() - c.lng())
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(c.lat())) *
          Math.cos(toRad(ne.lat())) *
          Math.sin(dLon / 2) ** 2
        const radiusKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

        onViewportChange({ lat: c.lat(), lon: c.lng() }, radiusKm)
      }
    )

    return () => window.naver.maps.Event.removeListener(listener)
  }, [onViewportChange])

  /* ────────── 6. 외부에서 panTo 제어 ────────── */
  useImperativeHandle(ref, () => ({
    panTo(pos, opts, hosNm) {
      const latLng = new window.naver.maps.LatLng(pos.lat, pos.lng)
      mapInst.current?.panTo(latLng, opts)

      if (hosNm && markers.current[hosNm]) {
        const h = hospitals.find(h => h.hos_nm === hosNm)
        if (h) {
          overlayRef.current?.setMap(null)
          const el = createTooltipElement(
            h.hos_nm,
            h.add,
            h.emer,
            h.emer_phone,
            h.deps
          )
          const overlay = createTooltipOverlay(latLng, el)
          overlay.setMap(mapInst.current)
          overlayRef.current = overlay
        }
      }
    }
  }))

  return <div ref={mapRef} className={props.className} />
})

export default NaverMap
