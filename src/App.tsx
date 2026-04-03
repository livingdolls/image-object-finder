import { useState, useRef, useEffect } from 'react'
import './App.css'

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
}

interface DrawState {
  active: boolean
  startPx: number
  startPy: number
  curPx: number
  curPy: number
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef(0)
  const prevUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    }
  }, [])

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
    if (e.button !== 0) return
    e.preventDefault()
    const { px, py } = getPct(e)
    setDraw({ active: true, startPx: px, startPy: py, curPx: px, curPy: py })
    setSelectedId(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draw.active) return
    const { px, py } = getPct(e)
    setDraw((d) => ({ ...d, curPx: px, curPy: py }))
  }

  const handleMouseUp = () => {
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

  const copyJSON = async () => {
    const data = regions.map(({ label, x, y, width, height }) => ({
      label,
      x,
      y,
      width,
      height,
    }))
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
                <span className="icf-hint">Click and drag to draw a region</span>
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
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setSelectedId(r.id)
                      }}
                    >
                      <span className="icf-region-label">{r.label}</span>
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
