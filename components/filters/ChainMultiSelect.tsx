'use client';

import { Chain } from '@/types';
import { CHAINS } from '@/lib/data';
import { useState } from 'react';

interface ChainMultiSelectProps {
  selectedChains: Chain[];
  onChainsChange: (chains: Chain[]) => void;
}

export default function ChainMultiSelect({
  selectedChains,
  onChainsChange,
}: ChainMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChain = (chain: Chain) => {
    if (selectedChains.includes(chain)) {
      onChainsChange(selectedChains.filter((c) => c !== chain));
    } else {
      onChainsChange([...selectedChains, chain]);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Chains
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-left text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {selectedChains.length === 0
          ? 'Select chains...'
          : `${selectedChains.length} selected`}
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {CHAINS.map((chain) => (
            <label
              key={chain}
              className="flex items-center px-4 py-2 hover:bg-slate-600 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedChains.includes(chain)}
                onChange={() => toggleChain(chain)}
                className="mr-2"
              />
              <span className="text-sm text-slate-200">{chain}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
