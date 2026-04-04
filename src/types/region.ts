export interface Region {
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

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
export type AlignmentMode = 'all' | 'strict-edge'

export interface DrawState {
  active: boolean
  startPx: number
  startPy: number
  curPx: number
  curPy: number
}

export interface DragState {
  active: boolean
  regionId: string | null
  startPx: number
  startPy: number
  originPx: number
  originPy: number
}

export interface ResizeState {
  active: boolean
  regionId: string | null
  handle: ResizeHandle | null
  startPx: number
  startPy: number
  originPx: number
  originPy: number
  originPw: number
  originPh: number
}

export interface HistoryEntry {
  id: string
  title: string
  imageDataUrl: string
  naturalSize: { width: number; height: number }
  regions: Region[]
  createdAt: number
}
