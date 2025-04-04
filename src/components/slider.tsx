interface SliderProps {
  min: number
  max: number
  step: number
  suffix: string
  value: any
  label: string
  disabled?: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
}


export function Slider({ min = 0, max = 100, step = 25, suffix = "", value, disabled, onChange, label }: SliderProps) {
  return (
    <div className="w-full max-w-xs">
      <label className="mb-2 inline-block">{label}</label>
      <div className="flex gap-2">
        <input type="range" min={min} max={max} className="range range-xs" step={step} value={value} disabled={disabled} onChange={onChange} />
        {/* <div className="flex justify-between px-2.5 mt-2 text-xs">
          {
            Array(max - min + 1).fill(0).map((_, i) => {
              return <span key={i}>{min + step * i}{suffix}</span>
            })
          }
        </div> */}
        <label>{value}{suffix}</label>
      </div>
    </div>
  )
}
