// components/MapTooltipOverlay.ts

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
      const pane = this.getPanes().floatPane
      pane.appendChild(this.element)
    }

    onRemove() {
      if (this.element?.parentNode) {
        this.element.parentNode.removeChild(this.element)
      }
    }

    draw() {
      const projection = this.getProjection()
      const point = projection.fromCoordToOffset(this.position)
      this.element.style.left = `${point.x}px`
      this.element.style.top = `${point.y}px`
    }

    setPosition(position: any) {
      this.position = position
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
      .map-tooltip-box {
        position: absolute;
        transform: translate(-50%, -110%);
        background: white;
        border-radius: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 14px 16px;
        color: #1f2937;
        font-size: 13px;
        font-family: 'Pretendard', sans-serif;
        z-index: 100;
        max-width: 280px;
        line-height: 1.6;
        word-break: keep-all;
      }

      .map-tooltip-label {
        margin-bottom: 8px;
        font-size: 13px;
      }

      .map-tooltip-label strong {
        display: block;
        font-weight: 700;
        margin-bottom: 2px;
        color: #111827;
      }

      .map-tooltip-emer {
        margin-top: 10px;
        color: #dc2626;
        font-weight: 600;
        font-size: 13px;
      }

      .map-tooltip-phone {
        margin-top: 4px;
        color: #2563eb;
        font-weight: 500;
        font-size: 13px;
      }

      .tooltip-arrow {
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid white;
      }
    </style>

    <div class="map-tooltip-label">
      <strong>🏥 병원명</strong>
      ${hos_nm}
    </div>
    <div class="map-tooltip-label">
      <strong>📍 주소</strong>
      ${address}
    </div>
    ${deps ? `
      <div class="map-tooltip-label">
        <strong>🩺 진료과목</strong>
        <div style="white-space: pre-wrap;">${deps}</div>
      </div>` : ''
    }
    ${emer?.trim() === "있음" ? `<div class="map-tooltip-emer">🆘 응급실 운영중</div>` : ''}
    ${emer_phone ? `<div class="map-tooltip-phone">☎ ${emer_phone}</div>` : ''}
    <div class="tooltip-arrow"></div>
  `
  return container
}
    
