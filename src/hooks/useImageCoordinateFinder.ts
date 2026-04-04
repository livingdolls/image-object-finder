import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  AlignmentMode,
  DragState,
  DrawState,
  Region,
  ResizeHandle,
  ResizeState,
} from '../types/region'

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max))

const ALIGN_TOLERANCE_PCT = 0.3

const getCopiedLabel = (label: string, existingLabels: Set<string>) => {
  const base = `${label} Copy`
  if (!existingLabels.has(base)) return base

  let index = 2
  while (existingLabels.has(`${base} ${index}`)) {
    index += 1
  }
  return `${base} ${index}`
}

const getAlignedActivePoints = (
  activePoints: number[],
  otherPoints: number[],
  tolerance: number
) => {
  const alignedPoints = new Set<number>()

  for (const activePoint of activePoints) {
    for (const otherPoint of otherPoints) {
      const delta = Math.abs(activePoint - otherPoint)
      if (delta > tolerance) continue

      alignedPoints.add(activePoint)
    }
  }

  return [...alignedPoints].sort((a, b) => a - b)
}

export function useImageCoordinateFinder() {
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
  const [alignmentMode, setAlignmentMode] = useState<AlignmentMode>('all')
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

  const getPct = (e: React.MouseEvent): { px: number; py: number } => {
    const el = wrapperRef.current
    if (!el) return { px: 0, py: 0 }
    const rect = el.getBoundingClientRect()
    return {
      px: Math.max(0, Math.min(((e.clientX - rect.left) / rect.width) * 100, 100)),
      py: Math.max(0, Math.min(((e.clientY - rect.top) / rect.height) * 100, 100)),
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    const url = URL.createObjectURL(file)
    prevUrlRef.current = url
    setImageSrc(url)
    setNaturalSize({ width: 0, height: 0 })
    setRegions([])
    setSelectedId(null)
    setExpandedRegionId(null)
    counterRef.current = 0
    e.target.value = ''
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (drag.active || resize.active) return
    if (e.button !== 0) return
    e.preventDefault()
    const { px, py } = getPct(e)
    setDraw({ active: true, startPx: px, startPy: py, curPx: px, curPy: py })
    setSelectedId(null)
  }

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
    handle: ResizeHandle
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
        prev.map((region) => {
          if (region.id !== resize.regionId) return region

          let nextPx = resize.originPx
          let nextPy = resize.originPy
          let nextPw = resize.originPw
          let nextPh = resize.originPh

          const handle = resize.handle
          const minSize = 2

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
            ...region,
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
        prev.map((region) => {
          if (region.id !== drag.regionId) return region
          const nextPx = clamp(drag.originPx + dx, 0, 100 - region.pw)
          const nextPy = clamp(drag.originPy + dy, 0, 100 - region.ph)
          return {
            ...region,
            px: nextPx,
            py: nextPy,
            x: Math.round((nextPx / 100) * naturalSize.width),
            y: Math.round((nextPy / 100) * naturalSize.height),
          }
        })
      )
      return
    }

    if (!draw.active) return
    const { px, py } = getPct(e)
    setDraw((prev) => ({ ...prev, curPx: px, curPy: py }))
  }

  const handleMouseUp = () => {
    if (resize.active) {
      setResize((prev) => ({ ...prev, active: false, regionId: null, handle: null }))
      return
    }

    if (drag.active) {
      setDrag((prev) => ({ ...prev, active: false, regionId: null }))
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
      const width = Math.round((pw / 100) * naturalSize.width)
      const height = Math.round((ph / 100) * naturalSize.height)
      counterRef.current += 1
      const newRegion: Region = {
        id: crypto.randomUUID(),
        label: `Object ${counterRef.current}`,
        x,
        y,
        width,
        height,
        px,
        py,
        pw,
        ph,
        metadata: {},
      }
      setRegions((prev) => [...prev, newRegion])
      setSelectedId(newRegion.id)
    }

    setDraw((prev) => ({ ...prev, active: false }))
  }

  const deleteRegion = (id: string) => {
    setRegions((prev) => prev.filter((region) => region.id !== id))
    if (selectedId === id) setSelectedId(null)
    if (expandedRegionId === id) setExpandedRegionId(null)
  }

  const duplicateRegion = (id: string) => {
    const source = regions.find((region) => region.id === id)
    if (!source) return

    const offsetPct = 1
    const nextPx = clamp(source.px + offsetPct, 0, 100 - source.pw)
    const nextPy = clamp(source.py + offsetPct, 0, 100 - source.ph)
    const labels = new Set(regions.map((region) => region.label))
    const copiedLabel = getCopiedLabel(source.label, labels)
    const duplicated: Region = {
      ...source,
      id: crypto.randomUUID(),
      label: copiedLabel,
      px: nextPx,
      py: nextPy,
      x:
        naturalSize.width > 0
          ? Math.round((nextPx / 100) * naturalSize.width)
          : source.x,
      y:
        naturalSize.height > 0
          ? Math.round((nextPy / 100) * naturalSize.height)
          : source.y,
      metadata: { ...source.metadata },
    }

    setRegions((prev) => [...prev, duplicated])
    setSelectedId(duplicated.id)
    setExpandedRegionId(duplicated.id)
  }

  const updateLabel = (id: string, label: string) => {
    setRegions((prev) => prev.map((region) => (region.id === id ? { ...region, label } : region)))
  }

  const addMetadataField = (id: string) => {
    setRegions((prev) =>
      prev.map((region) => {
        if (region.id !== id) return region
        const newKey = `field_${Object.keys(region.metadata).length + 1}`
        return {
          ...region,
          metadata: { ...region.metadata, [newKey]: '' },
        }
      })
    )
  }

  const updateMetadataField = (
    regionId: string,
    oldKey: string,
    newKey: string,
    value: string
  ) => {
    setRegions((prev) =>
      prev.map((region) => {
        if (region.id !== regionId) return region
        const nextMetadata = { ...region.metadata }
        if (oldKey !== newKey) delete nextMetadata[oldKey]
        nextMetadata[newKey] = value
        return { ...region, metadata: nextMetadata }
      })
    )
  }

  const deleteMetadataField = (regionId: string, key: string) => {
    setRegions((prev) =>
      prev.map((region) => {
        if (region.id !== regionId) return region
        const nextMetadata = { ...region.metadata }
        delete nextMetadata[key]
        return { ...region, metadata: nextMetadata }
      })
    )
  }

  const clearAll = () => {
    setRegions([])
    setSelectedId(null)
    setExpandedRegionId(null)
    counterRef.current = 0
  }

  const toggleRegionExpanded = (id: string) => {
    setExpandedRegionId((prev) => (prev === id ? null : id))
  }

  const copyJSON = async () => {
    const data = regions.map(({ label, x, y, width, height, metadata }) => {
      const item: Record<string, unknown> = { label, x, y, width, height }
      if (Object.keys(metadata).length > 0) {
        item.metadata = metadata
      }
      return item
    })

    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeOverlay = useMemo(
    () =>
      draw.active
        ? {
            left: `${Math.min(draw.startPx, draw.curPx)}%`,
            top: `${Math.min(draw.startPy, draw.curPy)}%`,
            width: `${Math.abs(draw.curPx - draw.startPx)}%`,
            height: `${Math.abs(draw.curPy - draw.startPy)}%`,
          }
        : null,
    [draw]
  )

  const dragGuides = useMemo(() => {
    const activeRegionId = drag.active ? drag.regionId : resize.active ? resize.regionId : null
    if (!activeRegionId) return null
    const activeRegion = regions.find((region) => region.id === activeRegionId)
    if (!activeRegion) return null

    const activeXPoints =
      alignmentMode === 'strict-edge'
        ? [activeRegion.px, activeRegion.px + activeRegion.pw]
        : [
            activeRegion.px,
            activeRegion.px + activeRegion.pw / 2,
            activeRegion.px + activeRegion.pw,
          ]
    const activeYPoints =
      alignmentMode === 'strict-edge'
        ? [activeRegion.py, activeRegion.py + activeRegion.ph]
        : [
            activeRegion.py,
            activeRegion.py + activeRegion.ph / 2,
            activeRegion.py + activeRegion.ph,
          ]

    const otherRegions = regions.filter((region) => region.id !== activeRegion.id)

    const otherXPoints = otherRegions.flatMap((region) =>
      alignmentMode === 'strict-edge'
        ? [region.px, region.px + region.pw]
        : [region.px, region.px + region.pw / 2, region.px + region.pw]
    )
    const otherYPoints = otherRegions.flatMap((region) =>
      alignmentMode === 'strict-edge'
        ? [region.py, region.py + region.ph]
        : [region.py, region.py + region.ph / 2, region.py + region.ph]
    )

    const alignedXPoints = getAlignedActivePoints(
      activeXPoints,
      otherXPoints,
      ALIGN_TOLERANCE_PCT
    )
    const alignedYPoints = getAlignedActivePoints(
      activeYPoints,
      otherYPoints,
      ALIGN_TOLERANCE_PCT
    )

    const centerX = activeRegion.px + activeRegion.pw / 2
    const centerY = activeRegion.py + activeRegion.ph / 2

    return {
      xGuides:
        alignedXPoints.length > 0
          ? alignedXPoints.map((value) => ({ value, aligned: true }))
          : [{ value: centerX, aligned: false }],
      yGuides:
        alignedYPoints.length > 0
          ? alignedYPoints.map((value) => ({ value, aligned: true }))
          : [{ value: centerY, aligned: false }],
    }
  }, [drag.active, drag.regionId, resize.active, resize.regionId, regions, alignmentMode])

  return {
    imageSrc,
    naturalSize,
    regions,
    selectedId,
    alignmentMode,
    copied,
    expandedRegionId,
    wrapperRef,
    activeOverlay,
    dragGuides,
    setSelectedId,
    setAlignmentMode,
    handleFileUpload,
    handleImageLoad,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleRegionMouseDown,
    handleResizeMouseDown,
    clearAll,
    copyJSON,
    deleteRegion,
    duplicateRegion,
    updateLabel,
    addMetadataField,
    updateMetadataField,
    deleteMetadataField,
    toggleRegionExpanded,
  }
}
