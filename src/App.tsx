import './App.css'
import logo from '../src/assets/logo.png'
import { AppHeader } from './components/AppHeader'
import { CanvasPanel } from './components/CanvasPanel'
import { RegionsSidebar } from './components/RegionsSidebar'
import { useImageCoordinateFinder } from './hooks/useImageCoordinateFinder'

function App() {
  const {
    imageSrc,
    naturalSize,
    regions,
    history,
    selectedId,
    alignmentMode,
    copied,
    expandedRegionId,
    canvasViewRef,
    wrapperRef,
    activeOverlay,
    dragGuides,
    setSelectedId,
    setAlignmentMode,
    handleFileUpload,
    handleLoadImageFromUrl,
    handleImageLoad,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleRegionMouseDown,
    handleResizeMouseDown,
    clearAll,
    saveCurrentToHistory,
    loadHistoryEntry,
    deleteHistoryEntry,
    copyJSON,
    deleteRegion,
    duplicateRegion,
    updateLabel,
    addMetadataField,
    updateMetadataField,
    deleteMetadataField,
    toggleRegionExpanded,
  } = useImageCoordinateFinder()

  return (
    <div className="icf-app">
      <AppHeader logoSrc={logo} />

      <div className="icf-body">
        <CanvasPanel
          imageSrc={imageSrc}
          naturalSize={naturalSize}
          regions={regions}
          selectedId={selectedId}
          alignmentMode={alignmentMode}
          activeOverlay={activeOverlay}
          dragGuides={dragGuides}
          onAlignmentModeChange={setAlignmentMode}
          canvasViewRef={canvasViewRef}
          wrapperRef={wrapperRef}
          onFileUpload={handleFileUpload}
          onLoadImageFromUrl={handleLoadImageFromUrl}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onImageLoad={handleImageLoad}
          onRegionMouseDown={handleRegionMouseDown}
          onResizeMouseDown={handleResizeMouseDown}
        />

        <RegionsSidebar
          imageSrc={imageSrc}
          regions={regions}
          selectedId={selectedId}
          copied={copied}
          history={history}
          expandedRegionId={expandedRegionId}
          onSelectRegion={setSelectedId}
          onClearAll={clearAll}
          onSaveHistory={saveCurrentToHistory}
          onLoadHistory={loadHistoryEntry}
          onDeleteHistory={deleteHistoryEntry}
          onCopyJson={copyJSON}
          onDeleteRegion={deleteRegion}
          onCopyRegion={duplicateRegion}
          onUpdateLabel={updateLabel}
          onToggleExpanded={toggleRegionExpanded}
          onAddMetadataField={addMetadataField}
          onUpdateMetadataField={updateMetadataField}
          onDeleteMetadataField={deleteMetadataField}
        />
      </div>
    </div>
  )
}

export default App
