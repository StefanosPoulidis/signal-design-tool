interface ParamSliderProps {
  label: string;
  symbol?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  tooltip?: string;
  format?: (v: number) => string;
}

export function ParamSlider({
  label, symbol, value, min, max, step, onChange, tooltip, format,
}: ParamSliderProps) {
  const display = format ? format(value) : value.toFixed(2);

  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-sm font-medium text-gray-700" title={tooltip}>
          {symbol && (
            <span className="font-mono text-primary-600 mr-1">{symbol}</span>
          )}
          {label}
        </label>
        <span className="text-sm font-mono text-gray-900 font-semibold">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
