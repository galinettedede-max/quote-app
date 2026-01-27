'use client';

import { Pair } from '@/types';
import { useState } from 'react';

interface PairMultiSelectProps {
  selectedPairs: Pair[];
  availablePairs: Pair[];
  onPairsChange: (pairs: Pair[]) => void;
}

export default function PairMultiSelect({
  selectedPairs,
  availablePairs,
  onPairsChange,
}: PairMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const pairKey = (pair: Pair) => `${pair.tokenIn}-${pair.tokenOut}`;
  const isSelected = (pair: Pair) =>
    selectedPairs.some(
      (p) => p.tokenIn === pair.tokenIn && p.tokenOut === pair.tokenOut
    );

  const togglePair = (pair: Pair) => {
    if (isSelected(pair)) {
      onPairsChange(
        selectedPairs.filter(
          (p) => !(p.tokenIn === pair.tokenIn && p.tokenOut === pair.tokenOut)
        )
      );
    } else {
      onPairsChange([...selectedPairs, pair]);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Pairs
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-left text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {selectedPairs.length === 0
          ? 'Select pairs...'
          : selectedPairs.length === availablePairs.length
          ? 'All pairs selected'
          : `${selectedPairs.length} of ${availablePairs.length} selected`}
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {availablePairs.map((pair) => (
            <label
              key={pairKey(pair)}
              className="flex items-center px-4 py-2 hover:bg-slate-600 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isSelected(pair)}
                onChange={() => togglePair(pair)}
                className="mr-2"
              />
              <span className="text-sm text-slate-200">
                {pair.tokenIn} / {pair.tokenOut} ({pair.pairType})
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
