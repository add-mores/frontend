// src/types.ts
export interface Hospital {
  hos_nm: string;       // 병원 이름
  add: string;          // 주소
  deps: string;         // 진료과
  lat: number;          // 위도
  lon: number;          // 경도
  distance: number;     // 거리 (km)
}

