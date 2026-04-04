import { RegionOverlay } from './RegionOverlay'
import type { Region, ResizeHandle } from '../types/region'

interface CanvasPanelProps {
  imageSrc: string | null
  naturalSize: { width: number; height: number }
  regions: Region[]
  selectedId: string | null
  activeOverlay: { left: string; top: string; width: string; height: string } | null
  dragGuides: { x: number; y: number; alignedX: boolean; alignedY: boolean } | null
  wrapperRef: React.RefObject<HTMLDivElement | null>
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onRegionMouseDown: (e: React.MouseEvent, region: Region) => void
  onResizeMouseDown: (e: React.MouseEvent, region: Region, handle: ResizeHandle) => void
}

export function CanvasPanel({
  imageSrc,
  naturalSize,
  regions,
  selectedId,
  activeOverlay,
  dragGuides,
  wrapperRef,
  onFileUpload,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onImageLoad,
  onRegionMouseDown,
  onResizeMouseDown,
}: CanvasPanelProps) {
  return (
    <div className="icf-canvas-panel">
      {!imageSrc ? (
        <label className="icf-upload-zone">
          <input type="file" accept="image/*" onChange={onFileUpload} />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Click or drop an image here</span>
          <small>PNG, JPG, WEBP, GIF, BMP...</small>
        </label>
      ) : (
        <>
          <div className="icf-toolbar">
            <label className="icf-btn icf-btn-sm">
              Change Image
              <input type="file" accept="image/*" onChange={onFileUpload} />
            </label>
            <span className="icf-dim-badge">
              {naturalSize.width} x {naturalSize.height} px
            </span>
            <span className="icf-hint">Drag to draw • Drag to move • Del to delete</span>
          </div>

          <div className="icf-canvas-view">
            <div
              ref={wrapperRef}
              className="icf-image-wrapper"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <img src={imageSrc} alt="Uploaded" draggable={false} onLoad={onImageLoad} />

              {dragGuides && (
                <>
                  <div
                    className={`icf-guide-line x${dragGuides.alignedY ? ' aligned' : ''}`}
                    style={{ top: `${dragGuides.y}%` }}
                  />
                  <div
                    className={`icf-guide-line y${dragGuides.alignedX ? ' aligned' : ''}`}
                    style={{ left: `${dragGuides.x}%` }}
                  />
                </>
              )}

              {regions.map((region) => (
                <RegionOverlay
                  key={region.id}
                  region={region}
                  selected={selectedId === region.id}
                  onRegionMouseDown={onRegionMouseDown}
                  onResizeMouseDown={onResizeMouseDown}
                />
              ))}

              {activeOverlay && <div className="icf-region-rect drawing" style={activeOverlay} />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
