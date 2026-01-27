'use client';

import { TradeSize } from '@/types';
import { TRADE_SIZES, TRADE_SIZE_LABELS } from '@/lib/data';

interface SizeRangeSelectorProps {
  min: TradeSize;
  max: TradeSize;
  onRangeChange: (min: TradeSize, max: TradeSize) => void;
}

export default function SizeRangeSelector({
  min,
  max,
  onRangeChange,
}: SizeRangeSelectorProps) {
  const handleMinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMin = Number(e.target.value) as TradeSize;
    if (newMin <= max) {
      onRangeChange(newMin, max);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMax = Number(e.target.value) as TradeSize;
    if (newMax >= min) {
      onRangeChange(min, newMax);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Trade Size (USD)
      </label>
      <div className="flex items-center space-x-2">
        <select
          value={min}
          onChange={handleMinChange}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {TRADE_SIZES.filter((size) => size <= max).map((size) => (
            <option key={size} value={size} className="bg-slate-700">
              {TRADE_SIZE_LABELS[size]}
            </option>
          ))}
        </select>
        <span className="text-slate-400">to</span>
        <select
          value={max}
          onChange={handleMaxChange}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {TRADE_SIZES.filter((size) => size >= min).map((size) => (
            <option key={size} value={size} className="bg-slate-700">
              {TRADE_SIZE_LABELS[size]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
