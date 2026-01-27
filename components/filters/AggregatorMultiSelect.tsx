'use client';

import { useState } from 'react';

interface AggregatorMultiSelectProps {
  selectedAggregators: string[];
  availableAggregators: string[];
  onAggregatorsChange: (aggregators: string[]) => void;
}

export default function AggregatorMultiSelect({
  selectedAggregators,
  availableAggregators,
  onAggregatorsChange,
}: AggregatorMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAggregator = (agg: string) => {
    if (selectedAggregators.includes(agg)) {
      onAggregatorsChange(selectedAggregators.filter((a) => a !== agg));
    } else {
      onAggregatorsChange([...selectedAggregators, agg]);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Aggregators
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-left text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {selectedAggregators.length === 0
          ? 'Select aggregators...'
          : `${selectedAggregators.length} selected`}
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {availableAggregators.map((agg) => (
            <label
              key={agg}
              className="flex items-center px-4 py-2 hover:bg-slate-600 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedAggregators.includes(agg)}
                onChange={() => toggleAggregator(agg)}
                className="mr-2"
              />
              <span className="text-sm text-slate-200">{agg}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
