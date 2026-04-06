import type { HistoryEntry, Region } from "../types/region";

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

interface RegionsSidebarProps {
  imageSrc: string | null;
  regions: Region[];
  history: HistoryEntry[];
  selectedId: string | null;
  copied: boolean;
  expandedRegionId: string | null;
  onSelectRegion: (id: string) => void;
  onClearAll: () => void;
  onSaveHistory: () => void;
  onLoadHistory: (id: string) => void;
  onDeleteHistory: (id: string) => void;
  onCopyJson: () => Promise<void>;
  onDeleteRegion: (id: string) => void;
  onCopyRegion: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onToggleExpanded: (id: string) => void;
  onAddMetadataField: (id: string) => void;
  onUpdateMetadataField: (
    regionId: string,
    oldKey: string,
    newKey: string,
    value: string,
  ) => void;
  onDeleteMetadataField: (regionId: string, key: string) => void;
}

export function RegionsSidebar({
  imageSrc,
  regions,
  history,
  selectedId,
  copied,
  expandedRegionId,
  onSelectRegion,
  onClearAll,
  onSaveHistory,
  onLoadHistory,
  onDeleteHistory,
  onCopyJson,
  onDeleteRegion,
  onCopyRegion,
  onUpdateLabel,
  onToggleExpanded,
  onAddMetadataField,
  onUpdateMetadataField,
  onDeleteMetadataField,
}: RegionsSidebarProps) {
  return (
    <aside className="icf-sidebar">
      <div className="icf-sidebar-top">
        <h2>
          Regions
          <span className="icf-count-badge">{regions.length}</span>
        </h2>
        {regions.length > 0 && (
          <div className="icf-sidebar-actions">
            <button className="icf-btn icf-btn-ghost" onClick={onSaveHistory}>
              Save History
            </button>
            <button className="icf-btn icf-btn-ghost" onClick={onClearAll}>
              Clear All
            </button>
            <button className="icf-btn icf-btn-primary" onClick={onCopyJson}>
              {copied ? "✓ Copied!" : "Copy JSON"}
            </button>
          </div>
        )}
      </div>

      {regions.length === 0 ? (
        <p className="icf-empty-hint">
          {imageSrc
            ? "Draw on the image to mark objects."
            : "Upload an image to get started."}
        </p>
      ) : (
        <ul className="icf-region-list">
          {regions.map((region) => (
            <li
              key={region.id}
              className={`icf-region-item${selectedId === region.id ? " active" : ""}`}
              onClick={() => onSelectRegion(region.id)}
            >
              <div className="icf-ri-header">
                <input
                  className="icf-ri-label"
                  value={region.label}
                  onChange={(e) => onUpdateLabel(region.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="icf-ri-add-meta"
                  title="Add metadata field"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (expandedRegionId !== region.id) {
                      onToggleExpanded(region.id);
                    }
                    onAddMetadataField(region.id);
                  }}
                >
                  +
                </button>
                <button
                  className="icf-ri-copy"
                  title="Copy region"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyRegion(region.id);
                  }}
                >
                  ⧉
                </button>
                <button
                  className="icf-ri-delete"
                  title="Delete region"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRegion(region.id);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="icf-ri-coords">
                <div className="icf-ri-coord-group">
                  <div className="icf-ri-coord-title">Pixel</div>
                  <div className="icf-ri-coord-grid">
                    <span>
                      <i>x</i>
                      <b>{region.x}</b>
                    </span>
                    <span>
                      <i>y</i>
                      <b>{region.y}</b>
                    </span>
                    <span>
                      <i>w</i>
                      <b>{region.width}</b>
                    </span>
                    <span>
                      <i>h</i>
                      <b>{region.height}</b>
                    </span>
                  </div>
                </div>
                <div className="icf-ri-coord-group">
                  <div className="icf-ri-coord-title">Percent</div>
                  <div className="icf-ri-coord-grid">
                    <span>
                      <i>px</i>
                      <b>{formatPercent(region.px)}</b>
                    </span>
                    <span>
                      <i>py</i>
                      <b>{formatPercent(region.py)}</b>
                    </span>
                    <span>
                      <i>pw</i>
                      <b>{formatPercent(region.pw)}</b>
                    </span>
                    <span>
                      <i>ph</i>
                      <b>{formatPercent(region.ph)}</b>
                    </span>
                  </div>
                </div>
              </div>

              <div className="icf-ri-metadata">
                <button
                  className="icf-ri-meta-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpanded(region.id);
                  }}
                >
                  <span>Custom Fields</span>
                  <span className="icf-meta-badge">
                    {Object.keys(region.metadata).length}
                  </span>
                  <span
                    className={`icf-chevron${expandedRegionId === region.id ? " open" : ""}`}
                  >
                    ›
                  </span>
                </button>

                {expandedRegionId === region.id && (
                  <div className="icf-ri-fields">
                    {Object.entries(region.metadata).map(([key, value]) => (
                      <div key={key} className="icf-field-row">
                        <input
                          className="icf-field-key"
                          placeholder="Key"
                          value={key}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateMetadataField(
                              region.id,
                              key,
                              e.target.value,
                              value,
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          className="icf-field-value"
                          placeholder="Value"
                          value={value}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateMetadataField(
                              region.id,
                              key,
                              key,
                              e.target.value,
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          className="icf-field-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMetadataField(region.id, key);
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
                        e.stopPropagation();
                        onAddMetadataField(region.id);
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

      {history.length > 0 && (
        <div className="icf-history">
          <h3>History</h3>
          <ul className="icf-history-list">
            {history.map((entry) => (
              <li key={entry.id} className="icf-history-item">
                <div className="icf-history-main">
                  <b>{entry.title}</b>
                  <small>{entry.regions.length} regions</small>
                </div>
                <div className="icf-history-actions">
                  <button
                    className="icf-btn icf-btn-sm"
                    onClick={() => onLoadHistory(entry.id)}
                  >
                    Load
                  </button>
                  <button
                    className="icf-btn icf-btn-ghost"
                    onClick={() => onDeleteHistory(entry.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
