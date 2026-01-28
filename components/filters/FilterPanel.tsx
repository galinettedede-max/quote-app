'use client';

import { FilterState, Chain, Pair, TradeSize } from '@/types';
import { CHAINS, TRADE_SIZES, TRADE_SIZE_LABELS } from '@/lib/data';
import ChainSingleSelect from './ChainSingleSelect';
import PairMultiSelect from './PairMultiSelect';
import SizeRangeSelector from './SizeRangeSelector';
import AggregatorMultiSelect from './AggregatorMultiSelect';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availablePairs: Pair[];
  availableAggregators: string[];
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  availablePairs,
  availableAggregators,
}: FilterPanelProps) {
  return (
    <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ChainSingleSelect
          selectedChain={filters.chain}
          onChainChange={(chain) =>
            onFiltersChange({ ...filters, chain })
          }
        />
        <PairMultiSelect
          selectedPairs={filters.pairs}
          availablePairs={availablePairs}
          onPairsChange={(pairs) => onFiltersChange({ ...filters, pairs })}
        />
        <SizeRangeSelector
          min={filters.sizeRange.min}
          max={filters.sizeRange.max}
          onRangeChange={(min, max) =>
            onFiltersChange({
              ...filters,
              sizeRange: { min, max },
            })
          }
        />
        <AggregatorMultiSelect
          selectedAggregators={filters.aggregators}
          availableAggregators={availableAggregators}
          onAggregatorsChange={(aggregators) =>
            onFiltersChange({ ...filters, aggregators })
          }
        />
      </div>
    </div>
  );
}
