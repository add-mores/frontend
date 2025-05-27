import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

export interface NaverMapHandle {
  panTo: (pos: { lat: number, lng: number }, opts?: any) => void
}

interface LatLng { lat: number; lon: number }
interface Hospital {
  hos_nm: string
  lat: number
  lon: number
}

type Props = {
  center: LatLng
  hospitals: Hospital[]
  selectedHos?: string
  onMarkerClick?: (h: Hospital) => void
}

// forwardRef로 외부에서 panTo 등 제어 가능하게!
const NaverMap = forwardRef<NaverMapHandle, Props>(
  ({ center, hospitals, selectedHos, onMarkerClick }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstance = useRef<any>(null)
    const markerMap = useRef<{ [hos_nm: string]: any }>({})

    // 지도 mount
    useEffect(() => {
      if (!mapRef.current || !window.naver?.maps) return
      if (!mapInstance.current) {
        mapInstance.current = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(center.lat, center.lon),
          zoom: 15,
        })
      }
    }, [])

    // 중심 이동
    useEffect(() => {
      if (!mapInstance.current) return
      mapInstance.current.setCenter(
        new window.naver.maps.LatLng(center.lat, center.lon)
      )
    }, [center.lat, center.lon])

    // 마커 렌더링
    useEffect(() => {
      if (!mapInstance.current) return
      // 기존 마커 제거
      Object.values(markerMap.current).forEach(m => m.setMap(null))
      markerMap.current = {}

      hospitals.forEach(h => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(h.lat, h.lon),
          map: mapInstance.current,
          title: h.hos_nm,
        })
        marker.addListener('click', () => onMarkerClick?.(h))
        markerMap.current[h.hos_nm] = marker
      })
    }, [hospitals, selectedHos, onMarkerClick])

    // 외부에서 panTo 호출
    useImperativeHandle(ref, () => ({
      panTo: (pos, opts) => {
        if (mapInstance.current)
          mapInstance.current.panTo(
            new window.naver.maps.LatLng(pos.lat, pos.lng), opts
          )
      }
    }))

    // 꼭 style!
    return (
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    )
  }
)

export default NaverMap
