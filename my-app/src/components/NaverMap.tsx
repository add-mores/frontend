// components/NaverMap.tsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { Hospital } from '@/types'
import { createTooltipOverlay, createTooltipElement } from './MapTooltipOverlay'

export interface NaverMapHandle {
  panTo: (pos: { lat: number, lng: number }, opts?: any, hosNm?: string) => void
}

type LatLng = { lat: number, lon: number }

interface Props {
  center: LatLng
  hospitals: Hospital[]
  userLocation?: LatLng
  selectedHos?: string
  onMarkerClick?: (h: Hospital) => void
  className: string
}

const NaverMap = forwardRef<NaverMapHandle, Props>((props, ref) => {
  const { center, hospitals, userLocation, selectedHos, onMarkerClick } = props
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInst = useRef<any>(null)
  const markers = useRef<Record<string, any>>({})
  const userMarker = useRef<any>(null)
  const overlayRef = useRef<any>(null)

  const emergencyIcon = {
    url: '/emergency.png',
    size: new window.naver.maps.Size(32, 32),
    anchor: new window.naver.maps.Point(16, 32),
    scaledSize: new window.naver.maps.Size(32, 32),
  }

  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) return
    if (!mapInst.current) {
      mapInst.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(center.lat, center.lon),
        zoom: 15,
      })
    }
  }, [])

  useEffect(() => {
    if (mapInst.current) {
      mapInst.current.setCenter(new window.naver.maps.LatLng(center.lat, center.lon))
    }
  }, [center.lat, center.lon])

  useEffect(() => {
    if (!mapInst.current) return
    Object.values(markers.current).forEach(m => m.setMap(null))
    markers.current = {}

    hospitals.forEach(h => {
      const m = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(h.lat, h.lon),
        map: mapInst.current,
        title: h.hos_nm,
        icon: h.emer?.trim() === '있음' ? emergencyIcon : undefined,
      })

      m.addListener('click', () => {
        overlayRef.current?.setMap(null)

        const el = createTooltipElement(h.hos_nm, h.add, h.emer, h.emer_phone, h.deps)
        const overlay = createTooltipOverlay(new window.naver.maps.LatLng(h.lat, h.lon), el)
        overlay.setMap(mapInst.current)
        overlayRef.current = overlay

        onMarkerClick?.(h)
      })

      markers.current[h.hos_nm] = m
    })
  }, [hospitals, onMarkerClick])

  useEffect(() => {
    if (!mapInst.current || !userLocation) return
    userMarker.current?.setMap(null)
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

  useImperativeHandle(ref, () => ({
    panTo(pos, opts, hosNm) {
      const latLng = new window.naver.maps.LatLng(pos.lat, pos.lng)
      mapInst.current?.panTo(latLng, opts)

      if (hosNm && markers.current[hosNm]) {
        const h = hospitals.find(h => h.hos_nm === hosNm)
        if (h) {
          overlayRef.current?.setMap(null)
          const el = createTooltipElement(h.hos_nm, h.add, h.emer, h.emer_phone, h.deps)
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
