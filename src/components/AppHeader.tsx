interface AppHeaderProps {
  logoSrc: string
}

export function AppHeader({ logoSrc }: AppHeaderProps) {
  return (
    <header className="icf-header">
      <div className="icf-header-title">
        <img src={logoSrc} alt="Icon" className="icf-header-icon" height={50} width={50} />
        <h1>Image Coordinate Finder</h1>
      </div>
      <p>Upload an image, then click and drag to mark objects and get their coordinates.</p>
    </header>
  )
}
