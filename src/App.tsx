import { useState, useRef, useEffect } from 'react'
import './App.css'
import logo from '../src/assets/logo.png'

interface Region {
  id: string
  label: string
  // Natural image pixel coordinates (for output)
  x: number
  y: number
  width: number
  height: number
  // Percentage-based coordinates (for rendering overlays)
  px: number
  py: number
  pw: number
  ph: number
  // Custom key-value metadata
  metadata: Record<string, string>
}

interface DrawState {
  active: boolean
  startPx: number
  startPy: number
  curPx: number
  curPy: number
}

interface DragState {
  active: boolean
  regionId: string | null
  startPx: number
  startPy: number
  originPx: number
  originPy: number
}

interface ResizeState {
  active: boolean
  regionId: string | null
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null
  startPx: number
  startPy: number
  originPx: number
  originPy: number
  originPw: number
  originPh: number
}

function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [regions, setRegions] = useState<Region[]>([])
  const [draw, setDraw] = useState<DrawState>({
    active: false,
    startPx: 0,
    startPy: 0,
    curPx: 0,
    curPy: 0,
  })
  const [drag, setDrag] = useState<DragState>({
    active: false,
    regionId: null,
    startPx: 0,
    startPy: 0,
    originPx: 0,
    originPy: 0,
  })
  const [resize, setResize] = useState<ResizeState>({
    active: false,
    regionId: null,
    handle: null,
    startPx: 0,
    startPy: 0,
    originPx: 0,
    originPy: 0,
    originPw: 0,
    originPh: 0,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef(0)
  const prevUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId) {
        deleteRegion(selectedId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    const url = URL.createObjectURL(file)
    prevUrlRef.current = url
    setImageSrc(url)
    setRegions([])
    setSelectedId(null)
    counterRef.current = 0
    // Reset file input so same file can be re-selected
    e.target.value = ''
  }

  const getPct = (e: React.MouseEvent): { px: number; py: number } => {
    const el = wrapperRef.current
    if (!el) return { px: 0, py: 0 }
    const rect = el.getBoundingClientRect()
    return {
      px: Math.max(0, Math.min(((e.clientX - rect.left) / rect.width) * 100, 100)),
      py: Math.max(0, Math.min(((e.clientY - rect.top) / rect.height) * 100, 100)),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (drag.active) return
    if (e.button !== 0) return
    e.preventDefault()
    const { px, py } = getPct(e)
    setDraw({ active: true, startPx: px, startPy: py, curPx: px, curPy: py })
    setSelectedId(null)
  }

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, max))

  const handleRegionMouseDown = (e: React.MouseEvent, region: Region) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const { px, py } = getPct(e)
    setSelectedId(region.id)
    setDrag({
      active: true,
      regionId: region.id,
      startPx: px,
      startPy: py,
      originPx: region.px,
      originPy: region.py,
    })
  }

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    region: Region,
    handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
  ) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const { px, py } = getPct(e)
    setSelectedId(region.id)
    setResize({
      active: true,
      regionId: region.id,
      handle,
      startPx: px,
      startPy: py,
      originPx: region.px,
      originPy: region.py,
      originPw: region.pw,
      originPh: region.ph,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (resize.active && resize.regionId) {
      const { px, py } = getPct(e)
      const dx = px - resize.startPx
      const dy = py - resize.startPy

      setRegions((prev) =>
        prev.map((r) => {
          if (r.id !== resize.regionId) return r

          let nextPx = resize.originPx
          let nextPy = resize.originPy
          let nextPw = resize.originPw
          let nextPh = resize.originPh

          const handle = resize.handle
          const minSize = 2 // Minimum 2%

          if (handle === 'nw') {
            nextPx = clamp(resize.originPx + dx, 0, 100 - minSize)
            nextPy = clamp(resize.originPy + dy, 0, 100 - minSize)
            nextPw = clamp(resize.originPw - dx, minSize, 100 - nextPx)
            nextPh = clamp(resize.originPh - dy, minSize, 100 - nextPy)
          } else if (handle === 'ne') {
            nextPy = clamp(resize.originPy + dy, 0, 100 - minSize)
            nextPw = clamp(resize.originPw + dx, minSize, 100 - nextPx)
            nextPh = clamp(resize.originPh - dy, minSize, 100 - nextPy)
          } else if (handle === 'sw') {
            nextPx = clamp(resize.originPx + dx, 0, 100 - minSize)
            nextPw = clamp(resize.originPw - dx, minSize, 100 - nextPx)
            nextPh = clamp(resize.originPh + dy, minSize, 100 - nextPy)
          } else if (handle === 'se') {
            nextPw = clamp(resize.originPw + dx, minSize, 100 - nextPx)
            nextPh = clamp(resize.originPh + dy, minSize, 100 - nextPy)
          } else if (handle === 'n') {
            nextPy = clamp(resize.originPy + dy, 0, 100 - minSize)
            nextPh = clamp(resize.originPh - dy, minSize, 100 - nextPy)
          } else if (handle === 's') {
            nextPh = clamp(resize.originPh + dy, minSize, 100 - nextPy)
          } else if (handle === 'e') {
            nextPw = clamp(resize.originPw + dx, minSize, 100 - nextPx)
          } else if (handle === 'w') {
            nextPx = clamp(resize.originPx + dx, 0, 100 - minSize)
            nextPw = clamp(resize.originPw - dx, minSize, 100 - nextPx)
          }

          return {
            ...r,
            px: nextPx,
            py: nextPy,
            pw: nextPw,
            ph: nextPh,
            x: Math.round((nextPx / 100) * naturalSize.width),
            y: Math.round((nextPy / 100) * naturalSize.height),
            width: Math.round((nextPw / 100) * naturalSize.width),
            height: Math.round((nextPh / 100) * naturalSize.height),
          }
        })
      )
      return
    }

    if (drag.active && drag.regionId) {
      const { px, py } = getPct(e)
      const dx = px - drag.startPx
      const dy = py - drag.startPy

      setRegions((prev) =>
        prev.map((r) => {
          if (r.id !== drag.regionId) return r
          const nextPx = clamp(drag.originPx + dx, 0, 100 - r.pw)
          const nextPy = clamp(drag.originPy + dy, 0, 100 - r.ph)
          return {
            ...r,
            px: nextPx,
            py: nextPy,
            x: Math.round((nextPx / 100) * naturalSize.width),
            y: Math.round((nextPy / 100) * naturalSize.height),
          }
        }),
      )
      return
    }

    if (!draw.active) return
    const { px, py } = getPct(e)
    setDraw((d) => ({ ...d, curPx: px, curPy: py }))
  }

  const handleMouseUp = () => {
    if (resize.active) {
      setResize((r) => ({ ...r, active: false, regionId: null, handle: null }))
      return
    }

    if (drag.active) {
      setDrag((d) => ({ ...d, active: false, regionId: null }))
      return
    }

    if (!draw.active) return
    const { startPx, startPy, curPx, curPy } = draw
    const px = Math.min(startPx, curPx)
    const py = Math.min(startPy, curPy)
    const pw = Math.abs(curPx - startPx)
    const ph = Math.abs(curPy - startPy)

    if (pw > 0.5 && ph > 0.5) {
      const x = Math.round((px / 100) * naturalSize.width)
      const y = Math.round((py / 100) * naturalSize.height)
      const w = Math.round((pw / 100) * naturalSize.width)
      const h = Math.round((ph / 100) * naturalSize.height)
      counterRef.current += 1
      const region: Region = {
        id: crypto.randomUUID(),
        label: `Object ${counterRef.current}`,
        x,
        y,
        width: w,
        height: h,
        px,
        py,
        pw,
        ph,
        metadata: {},
      }
      setRegions((prev) => [...prev, region])
      setSelectedId(region.id)
    }

    setDraw((d) => ({ ...d, active: false }))
  }

  const deleteRegion = (id: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const updateLabel = (id: string, label: string) => {
    setRegions((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r)))
  }

  const addMetadataField = (id: string) => {
    setRegions((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const newKey = `field_${Object.keys(r.metadata).length + 1}`
        return {
          ...r,
          metadata: { ...r.metadata, [newKey]: '' },
        }
      })
    )
  }

  const updateMetadataField = (regionId: string, oldKey: string, newKey: string, value: string) => {
    setRegions((prev) =>
      prev.map((r) => {
        if (r.id !== regionId) return r
        const newMetadata = { ...r.metadata }
        if (oldKey !== newKey) delete newMetadata[oldKey]
        newMetadata[newKey] = value
        return { ...r, metadata: newMetadata }
      })
    )
  }

  const deleteMetadataField = (regionId: string, key: string) => {
    setRegions((prev) =>
      prev.map((r) => {
        if (r.id !== regionId) return r
        const newMetadata = { ...r.metadata }
        delete newMetadata[key]
        return { ...r, metadata: newMetadata }
      })
    )
  }

  const copyJSON = async () => {
    const data = regions.map(({ label, x, y, width, height, metadata }) => {
      const obj: Record<string, any> = { label, x, y, width, height }
      if (Object.keys(metadata).length > 0) {
        obj.metadata = metadata
      }
      return obj
    })
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeOverlay = draw.active
    ? {
        left: `${Math.min(draw.startPx, draw.curPx)}%`,
        top: `${Math.min(draw.startPy, draw.curPy)}%`,
        width: `${Math.abs(draw.curPx - draw.startPx)}%`,
        height: `${Math.abs(draw.curPy - draw.startPy)}%`,
      }
    : null

  return (
    <div className="icf-app">
      {/* Header */}
      <header className="icf-header">
        <div className="icf-header-title">
          <img src={logo} alt="Icon" className="icf-header-icon" height={50} width={50} />
          <h1>Image Coordinate Finder</h1>
        </div>
        <p>Upload an image, then click and drag to mark objects and get their coordinates.</p>
      </header>

      <div className="icf-body">
        {/* Canvas Panel */}
        <div className="icf-canvas-panel">
          {!imageSrc ? (
            <label className="icf-upload-zone">
              <input type="file" accept="image/*" onChange={handleFileUpload} />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Click or drop an image here</span>
              <small>PNG, JPG, WEBP, GIF, BMP…</small>
            </label>
          ) : (
            <>
              <div className="icf-toolbar">
                <label className="icf-btn icf-btn-sm">
                  Change Image
                  <input type="file" accept="image/*" onChange={handleFileUpload} />
                </label>
                <span className="icf-dim-badge">
                  {naturalSize.width} × {naturalSize.height} px
                </span>
                <span className="icf-hint">Drag to draw • Drag to move • Del to delete</span>
              </div>

              <div className="icf-canvas-view">
                <div
                  ref={wrapperRef}
                  className="icf-image-wrapper"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    src={imageSrc}
                    alt="Uploaded"
                    draggable={false}
                    onLoad={(e) => {
                      const img = e.currentTarget
                      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
                    }}
                  />

                  {regions.map((r) => (
                    <div
                      key={r.id}
                      className={`icf-region-rect${selectedId === r.id ? ' active' : ''}`}
                      style={{ left: `${r.px}%`, top: `${r.py}%`, width: `${r.pw}%`, height: `${r.ph}%` }}
                      onMouseDown={(e) => handleRegionMouseDown(e, r)}
                    >
                      <span className="icf-region-label">{r.label}</span>
                      
                      {/* Resize handles - only show when selected */}
                      {selectedId === r.id && (
                        <>
                          <div className="icf-resize-handle nw" onMouseDown={(e) => handleResizeMouseDown(e, r, 'nw')} />
                          <div className="icf-resize-handle ne" onMouseDown={(e) => handleResizeMouseDown(e, r, 'ne')} />
                          <div className="icf-resize-handle sw" onMouseDown={(e) => handleResizeMouseDown(e, r, 'sw')} />
                          <div className="icf-resize-handle se" onMouseDown={(e) => handleResizeMouseDown(e, r, 'se')} />
                          <div className="icf-resize-handle n" onMouseDown={(e) => handleResizeMouseDown(e, r, 'n')} />
                          <div className="icf-resize-handle s" onMouseDown={(e) => handleResizeMouseDown(e, r, 's')} />
                          <div className="icf-resize-handle e" onMouseDown={(e) => handleResizeMouseDown(e, r, 'e')} />
                          <div className="icf-resize-handle w" onMouseDown={(e) => handleResizeMouseDown(e, r, 'w')} />
                        </>
                      )}
                    </div>
                  ))}

                  {activeOverlay && (
                    <div className="icf-region-rect drawing" style={activeOverlay} />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="icf-sidebar">
          <div className="icf-sidebar-top">
            <h2>
              Regions
              <span className="icf-count-badge">{regions.length}</span>
            </h2>
            {regions.length > 0 && (
              <div className="icf-sidebar-actions">
                <button
                  className="icf-btn icf-btn-ghost"
                  onClick={() => {
                    setRegions([])
                    setSelectedId(null)
                    counterRef.current = 0
                  }}
                >
                  Clear All
                </button>
                <button className="icf-btn icf-btn-primary" onClick={copyJSON}>
                  {copied ? '✓ Copied!' : 'Copy JSON'}
                </button>
              </div>
            )}
          </div>

          {regions.length === 0 ? (
            <p className="icf-empty-hint">
              {imageSrc ? 'Draw on the image to mark objects.' : 'Upload an image to get started.'}
            </p>
          ) : (
            <ul className="icf-region-list">
              {regions.map((r) => (
                <li
                  key={r.id}
                  className={`icf-region-item${selectedId === r.id ? ' active' : ''}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <div className="icf-ri-header">
                    <input
                      className="icf-ri-label"
                      value={r.label}
                      onChange={(e) => updateLabel(r.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      className="icf-ri-add-meta"
                      title="Add metadata field"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (expandedRegionId !== r.id) {
                          setExpandedRegionId(r.id)
                        }
                        addMetadataField(r.id)
                      }}
                    >
                      +
                    </button>
                    <button
                      className="icf-ri-delete"
                      title="Delete region"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteRegion(r.id)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="icf-ri-coords">
                    <span><i>x</i><b>{r.x}</b></span>
                    <span><i>y</i><b>{r.y}</b></span>
                    <span><i>w</i><b>{r.width}</b></span>
                    <span><i>h</i><b>{r.height}</b></span>
                  </div>
                  
                  {/* Metadata section */}
                  <div className="icf-ri-metadata">
                    <button
                      className="icf-ri-meta-toggle"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedRegionId(expandedRegionId === r.id ? null : r.id)
                      }}
                    >
                      <span>Custom Fields</span>
                      <span className="icf-meta-badge">{Object.keys(r.metadata).length}</span>
                      <span className={`icf-chevron${expandedRegionId === r.id ? ' open' : ''}`}>›</span>
                    </button>
                    
                    {expandedRegionId === r.id && (
                      <div className="icf-ri-fields">
                        {Object.entries(r.metadata).map(([key, value]) => (
                          <div key={key} className="icf-field-row">
                            <input
                              className="icf-field-key"
                              placeholder="Key"
                              value={key}
                              onChange={(e) => {
                                e.stopPropagation()
                                updateMetadataField(r.id, key, e.target.value, value)
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <input
                              className="icf-field-value"
                              placeholder="Value"
                              value={value}
                              onChange={(e) => {
                                e.stopPropagation()
                                updateMetadataField(r.id, key, key, e.target.value)
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              className="icf-field-delete"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteMetadataField(r.id, key)
                              }}
                              title="Delete field"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          className="icf-field-add"
                          onClick={(e) => {
                            e.stopPropagation()
                            addMetadataField(r.id)
                          }}
                        >
                          + Add Field
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}

export default App
