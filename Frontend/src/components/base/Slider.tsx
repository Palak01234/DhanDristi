interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
  id: string;
  display?: string;
}

export function Slider({ min, max, step, value, onChange, label, id, display }: SliderProps) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-foreground-950">
          {label}
        </label>
        <span className="rounded-md bg-background-100 px-2.5 py-1 text-xs font-bold text-primary-700">
          {display ?? `${value}`}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-background-200 accent-primary-600"
      />
    </div>
  );
}