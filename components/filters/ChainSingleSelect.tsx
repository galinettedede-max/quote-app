'use client';

import { Chain } from '@/types';
import { CHAINS } from '@/lib/data';
import { useState } from 'react';

interface ChainSingleSelectProps {
  selectedChain: Chain;
  onChainChange: (chain: Chain) => void;
}

export default function ChainSingleSelect({
  selectedChain,
  onChainChange,
}: ChainSingleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectChain = (chain: Chain) => {
    onChainChange(chain);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Chain
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-left text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
      >
        <span>{selectedChain}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {CHAINS.map((chain) => (
            <button
              key={chain}
              onClick={() => selectChain(chain)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-600 ${
                selectedChain === chain
                  ? 'bg-blue-600 text-slate-100'
                  : 'text-slate-200'
              }`}
            >
              {chain}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
