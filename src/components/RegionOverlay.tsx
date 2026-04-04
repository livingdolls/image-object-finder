import type { Region, ResizeHandle } from '../types/region'

interface RegionOverlayProps {
  region: Region
  selected: boolean
  onRegionMouseDown: (e: React.MouseEvent, region: Region) => void
  onResizeMouseDown: (e: React.MouseEvent, region: Region, handle: ResizeHandle) => void
}

const HANDLES: ResizeHandle[] = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']

export function RegionOverlay({
  region,
  selected,
  onRegionMouseDown,
  onResizeMouseDown,
}: RegionOverlayProps) {
  return (
    <div
      className={`icf-region-rect${selected ? ' active' : ''}`}
      style={{
        left: `${region.px}%`,
        top: `${region.py}%`,
        width: `${region.pw}%`,
        height: `${region.ph}%`,
      }}
      onMouseDown={(e) => onRegionMouseDown(e, region)}
    >
      <span className="icf-region-label">{region.label}</span>

      {selected &&
        HANDLES.map((handle) => (
          <div
            key={handle}
            className={`icf-resize-handle ${handle}`}
            onMouseDown={(e) => onResizeMouseDown(e, region, handle)}
          />
        ))}
    </div>
  )
}
