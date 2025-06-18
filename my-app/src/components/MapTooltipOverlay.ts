// components/MapTooltipOverlay.ts
// • 기능 로직은 유지하고 “글자 크기·여백·색상”만 살짝 보강했습니다.
// • 변경 범위: <style> 블록 + 아이콘 이모지만 굵게 표시

export function createTooltipOverlay(position: any, element: HTMLDivElement) {
  class TooltipOverlay extends window.naver.maps.OverlayView {
    position: any
    element: HTMLDivElement

    constructor(position: any, element: HTMLDivElement) {
      super()
      this.position = position
      this.element = element
    }

    onAdd() {
      this.getPanes().floatPane.appendChild(this.element)
    }

    onRemove() {
      this.element.parentNode?.removeChild(this.element); // ← wrapper는 그대로 두기
    }
    draw() {
      const proj = this.getProjection()
      const pt = proj.fromCoordToOffset(this.position)
      this.element.style.left = `${pt.x}px`
      this.element.style.top = `${pt.y}px`
    }

    setPosition(p: any) {
      this.position = p
    }
    getPosition() {
      return this.position
    }
  }

  return new TooltipOverlay(position, element)
}

export function createTooltipElement(
  hos_nm: string,
  address: string,
  emer?: string,
  emer_phone?: string,
  deps?: string
): HTMLDivElement {
  const container = document.createElement('div')
  container.className = 'map-tooltip-box'

  container.innerHTML = `
    <style>
      .map-tooltip-box{
        position:absolute; transform:translate(-50%,-110%);
        max-width:260px; background:#fff; border-radius:14px;
        padding:14px 18px; box-shadow:0 4px 12px rgba(0,0,0,.15);
        font-family:'Pretendard',sans-serif; z-index:100;
        color:#374151; line-height:1.6; word-break:keep-all;
        pointer-events:none;
      }
      .map-tooltip-sec{margin-bottom:10px; font-size:13px}
      .map-tooltip-title{
        display:block; margin-bottom:4px;
        font-size:14px; font-weight:700; color:#111827
      }
      .map-tooltip-emer{margin-top:6px; font-weight:600; color:#dc2626}
      .map-tooltip-phone{margin-top:4px; font-weight:500; color:#2563eb}
      .tooltip-arrow{
        position:absolute; bottom:-8px; left:50%; transform:translateX(-50%);
        width:0; height:0;
        border-left:6px solid transparent; border-right:6px solid transparent;
        border-top:8px solid #fff;
      }
    </style>

    <div class="map-tooltip-sec">
      <span class="map-tooltip-title">🏥 병원명</span>
      ${hos_nm}
    </div>
    <div class="map-tooltip-sec">
      <span class="map-tooltip-title">📍 주소</span>
      <div style="white-space:pre-wrap;">${address}</div>
    </div>
    ${deps
      ? `<div class="map-tooltip-sec">
             <span class="map-tooltip-title">🩺 진료과목</span>
             <div style="white-space:pre-wrap;">${deps}</div>
           </div>`
      : ''
    }
    ${emer?.trim() === '있음'
      ? `<div class="map-tooltip-emer">🆘 응급실 운영중</div>`
      : ''
    }
    ${emer_phone
      ? `<div class="map-tooltip-phone">☎ ${emer_phone}</div>`
      : ''
    }
    <div class="tooltip-arrow"></div>
  `
  return container
}
