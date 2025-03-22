export function Slider() {
  return (
    <div className="w-full max-w-xs">
      <input type="range" min={0} max="100" className="range" step="25" />
      <div className="flex justify-between px-2.5 mt-2 text-xs">
        <span>•</span>
        <span>•</span>
        <span>•</span>
        <span>•</span>
        <span>•</span>
      </div>
      <div className="flex justify-between px-2.5 mt-2 text-xs">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
    </div>
  )
}
