import { useState } from 'react'
import { RegionOverlay } from './RegionOverlay'
import type { AlignmentMode, Region, ResizeHandle } from '../types/region'

interface CanvasPanelProps {
  imageSrc: string | null
  naturalSize: { width: number; height: number }
  regions: Region[]
  selectedId: string | null
  alignmentMode: AlignmentMode
  activeOverlay: { left: string; top: string; width: string; height: string } | null
  dragGuides: {
    xGuides: Array<{ value: number; aligned: boolean }>
    yGuides: Array<{ value: number; aligned: boolean }>
  } | null
  onAlignmentModeChange: (mode: AlignmentMode) => void
  wrapperRef: React.RefObject<HTMLDivElement | null>
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onLoadImageFromUrl: (url: string) => Promise<void>
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
  alignmentMode,
  activeOverlay,
  dragGuides,
  onAlignmentModeChange,
  wrapperRef,
  onFileUpload,
  onLoadImageFromUrl,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onImageLoad,
  onRegionMouseDown,
  onResizeMouseDown,
}: CanvasPanelProps) {
  const [urlInput, setUrlInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)

  const handleLoadUrl = async () => {
    if (!urlInput.trim()) return
    setIsLoading(true)
    try {
      await onLoadImageFromUrl(urlInput)
      setUrlInput('')
      setShowUrlInput(false)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="icf-canvas-panel">
      {!imageSrc ? (
        <div className="icf-upload-container">
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

          <div className="icf-upload-divider">
            <span>or</span>
          </div>

          <div className="icf-url-input-group">
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  void handleLoadUrl()
                }
              }}
              disabled={isLoading}
              className="icf-url-input"
            />
            <button
              onClick={() => void handleLoadUrl()}
              disabled={isLoading || !urlInput.trim()}
              className="icf-btn"
            >
              {isLoading ? 'Loading...' : 'Load from URL'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="icf-toolbar">
            <label className="icf-btn icf-btn-sm">
              Change Image
              <input type="file" accept="image/*" onChange={onFileUpload} />
            </label>
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="icf-btn icf-btn-sm"
              title="Load image from URL"
            >
              From URL
            </button>
            <span className="icf-dim-badge">
              {naturalSize.width} x {naturalSize.height} px
            </span>
            <label className="icf-align-mode">
              <span>Align</span>
              <select
                value={alignmentMode}
                onChange={(e) => onAlignmentModeChange(e.target.value as AlignmentMode)}
              >
                <option value="all">All</option>
                <option value="strict-edge">Strict Edge</option>
              </select>
            </label>
            <span className="icf-hint">Drag to draw • Drag to move • Del to delete</span>
          </div>

          {showUrlInput && (
            <div className="icf-url-toolbar">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    void handleLoadUrl()
                  }
                }}
                disabled={isLoading}
                className="icf-url-input"
                autoFocus
              />
              <button
                onClick={() => void handleLoadUrl()}
                disabled={isLoading || !urlInput.trim()}
                className="icf-btn icf-btn-sm"
              >
                {isLoading ? 'Loading...' : 'Load'}
              </button>
              <button
                onClick={() => {
                  setShowUrlInput(false)
                  setUrlInput('')
                }}
                disabled={isLoading}
                className="icf-btn icf-btn-sm icf-btn-cancel"
              >
                Cancel
              </button>
            </div>
          )}

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
                  {dragGuides.yGuides.map((guide) => (
                    <div
                      key={`y-${guide.value}`}
                      className={`icf-guide-line x${guide.aligned ? ' aligned' : ''}`}
                      style={{ top: `${guide.value}%` }}
                    />
                  ))}
                  {dragGuides.xGuides.map((guide) => (
                    <div
                      key={`x-${guide.value}`}
                      className={`icf-guide-line y${guide.aligned ? ' aligned' : ''}`}
                      style={{ left: `${guide.value}%` }}
                    />
                  ))}
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
