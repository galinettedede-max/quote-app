'use client';

import { useState, useEffect, useMemo } from 'react';
import { TradeData, FilterState, Chain, Pair, TradeSize } from '@/types';
import { getTradeData, CHAINS, TRADE_SIZES } from '@/lib/data';
import FilterPanel from '@/components/filters/FilterPanel';
import WinRateBarChart from '@/components/charts/WinRateBarChart';
import BoxPlot, { priceDistributionToBoxPlot } from '@/components/charts/BoxPlot';
import {
  getBestPrice,
  calculatePriceDifference,
  didAggregatorWin,
} from '@/lib/utils';

export default function AggsVersusTab() {
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [agg1, setAgg1] = useState<string>('');
  const [agg2, setAgg2] = useState<string>('');

  const [filters, setFilters] = useState<FilterState>({
    chain: 'Mainnet', // Default to Mainnet
    pairs: [],
    sizeRange: { min: TRADE_SIZES[0], max: TRADE_SIZES[TRADE_SIZES.length - 1] },
    aggregators: [],
  });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTradeData();
        setTradeData(data);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const availablePairs = useMemo(() => {
    const pairMap = new Map<string, Pair>();
    tradeData.forEach((trade) => {
      const key = `${trade.pair.tokenIn}-${trade.pair.tokenOut}`;
      if (!pairMap.has(key)) {
        pairMap.set(key, trade.pair);
      }
    });
    return Array.from(pairMap.values());
  }, [tradeData]);

  const availableAggregators = useMemo(() => {
    const aggregators = new Set<string>();
    tradeData.forEach((trade) => {
      trade.quotes.forEach((quote) => {
        aggregators.add(quote.aggregator);
      });
    });
    return Array.from(aggregators);
  }, [tradeData]);

  // Pre-select all pairs and aggregators when data loads
  useEffect(() => {
    if (availablePairs.length > 0 && availableAggregators.length > 0) {
      setFilters((prev) => ({
        ...prev,
        pairs: prev.pairs.length === 0 ? availablePairs : prev.pairs,
        aggregators: prev.aggregators.length === 0 ? availableAggregators : prev.aggregators,
      }));
    }
  }, [availablePairs, availableAggregators]);

  // Apply filters and aggregator selection
  const filteredData = useMemo(() => {
    return tradeData.filter((trade) => {
      if (agg1 && agg2) {
        // Check if trade has quotes from either aggregator
        const hasAgg1 = trade.quotes.some((q) => q.aggregator === agg1);
        const hasAgg2 = trade.quotes.some((q) => q.aggregator === agg2);
        if (!hasAgg1 && !hasAgg2) return false;
      }
      // Filter by single selected chain
      if (trade.chain !== filters.chain) {
        return false;
      }
      if (filters.pairs.length > 0) {
        const pairMatch = filters.pairs.some(
          (p) =>
            p.tokenIn === trade.pair.tokenIn &&
            p.tokenOut === trade.pair.tokenOut
        );
        if (!pairMatch) return false;
      }
      if (
        trade.tradeSize < filters.sizeRange.min ||
        trade.tradeSize > filters.sizeRange.max
      ) {
        return false;
      }
      if (filters.aggregators.length > 0) {
        const hasMatchingAggregator = trade.quotes.some((quote) =>
          filters.aggregators.includes(quote.aggregator)
        );
        if (!hasMatchingAggregator) return false;
      }
      return true;
    });
  }, [tradeData, filters, agg1, agg2]);

  // Global win rate
  const globalWinRateData = useMemo(() => {
    if (!agg1 || !agg2) return [];
    
    const calcWinRate = (aggregator: string) => {
      let wins = 0;
      let total = 0;
      
      filteredData.forEach((trade) => {
        const hasQuote = trade.quotes.some((q) => q.aggregator === aggregator);
        if (hasQuote) {
          total++;
          if (didAggregatorWin(aggregator, trade.quotes)) {
            wins++;
          }
        }
      });
      
      return total > 0 ? (wins / total) * 100 : 0;
    };

    return [
      { aggregator: agg1, winRate: calcWinRate(agg1) },
      { aggregator: agg2, winRate: calcWinRate(agg2) },
    ];
  }, [filteredData, agg1, agg2]);

  // Win rate per chain
  const winRatePerChain = useMemo(() => {
    if (!agg1 || !agg2) return [];
    
    const chains = Array.from(new Set(filteredData.map((t) => t.chain)));
    return chains.map((chain) => {
      const chainTrades = filteredData.filter((t) => t.chain === chain);
      
      const calcWinRate = (aggregator: string) => {
        let wins = 0;
        let total = 0;
        
        chainTrades.forEach((trade) => {
          const hasQuote = trade.quotes.some((q) => q.aggregator === aggregator);
          if (hasQuote) {
            total++;
            if (didAggregatorWin(aggregator, trade.quotes)) {
              wins++;
            }
          }
        });
        
        return total > 0 ? (wins / total) * 100 : 0;
      };

      return {
        chain,
        [agg1]: calcWinRate(agg1),
        [agg2]: calcWinRate(agg2),
      };
    });
  }, [filteredData, agg1, agg2]);

  // Win rate per pair
  const winRatePerPair = useMemo(() => {
    if (!agg1 || !agg2) return [];
    
    const pairs = Array.from(
      new Set(
        filteredData.map(
          (t) => `${t.pair.tokenIn}-${t.pair.tokenOut}`
        )
      )
    );
    return pairs.map((pairKey) => {
      const pairTrades = filteredData.filter(
        (t) => `${t.pair.tokenIn}-${t.pair.tokenOut}` === pairKey
      );
      
      const calcWinRate = (aggregator: string) => {
        let wins = 0;
        let total = 0;
        
        pairTrades.forEach((trade) => {
          const hasQuote = trade.quotes.some((q) => q.aggregator === aggregator);
          if (hasQuote) {
            total++;
            if (didAggregatorWin(aggregator, trade.quotes)) {
              wins++;
            }
          }
        });
        
        return total > 0 ? (wins / total) * 100 : 0;
      };

      return {
        pair: pairKey,
        [agg1]: calcWinRate(agg1),
        [agg2]: calcWinRate(agg2),
      };
    });
  }, [filteredData, agg1, agg2]);

  // Boxplot per chain
  const boxPlotPerChain = useMemo(() => {
    if (!agg1 || !agg2) return [];
    
    const chains = Array.from(new Set(filteredData.map((t) => t.chain)));
    const result: any[] = [];
    
    chains.forEach((chain) => {
      const chainTrades = filteredData.filter((t) => t.chain === chain);
      const agg1Data: number[] = [];
      const agg2Data: number[] = [];
      
      chainTrades.forEach((trade) => {
        const bestPrice = getBestPrice(trade.quotes);
        trade.quotes.forEach((quote) => {
          if (quote.aggregator === agg1) {
            agg1Data.push(calculatePriceDifference(quote.price, bestPrice));
          }
          if (quote.aggregator === agg2) {
            agg2Data.push(calculatePriceDifference(quote.price, bestPrice));
          }
        });
      });

      if (agg1Data.length > 0) {
        result.push(priceDistributionToBoxPlot(`${agg1} - ${chain}`, agg1Data));
      }
      if (agg2Data.length > 0) {
        result.push(priceDistributionToBoxPlot(`${agg2} - ${chain}`, agg2Data));
      }
    });

    return result;
  }, [filteredData, agg1, agg2]);

  // Boxplot per pair
  const boxPlotPerPair = useMemo(() => {
    if (!agg1 || !agg2) return [];
    
    const pairs = Array.from(
      new Set(
        filteredData.map(
          (t) => `${t.pair.tokenIn}-${t.pair.tokenOut}`
        )
      )
    );
    const result: any[] = [];
    
    pairs.forEach((pairKey) => {
      const pairTrades = filteredData.filter(
        (t) => `${t.pair.tokenIn}-${t.pair.tokenOut}` === pairKey
      );
      const agg1Data: number[] = [];
      const agg2Data: number[] = [];
      
      pairTrades.forEach((trade) => {
        const bestPrice = getBestPrice(trade.quotes);
        trade.quotes.forEach((quote) => {
          if (quote.aggregator === agg1) {
            agg1Data.push(calculatePriceDifference(quote.price, bestPrice));
          }
          if (quote.aggregator === agg2) {
            agg2Data.push(calculatePriceDifference(quote.price, bestPrice));
          }
        });
      });

      if (agg1Data.length > 0) {
        result.push(priceDistributionToBoxPlot(`${agg1} - ${pairKey}`, agg1Data));
      }
      if (agg2Data.length > 0) {
        result.push(priceDistributionToBoxPlot(`${agg2} - ${pairKey}`, agg2Data));
      }
    });

    return result;
  }, [filteredData, agg1, agg2]);

  // Boxplot per trade size
  const boxPlotPerSize = useMemo(() => {
    if (!agg1 || !agg2) return [];
    
    const sizes = Array.from(new Set(filteredData.map((t) => t.tradeSize)));
    const result: any[] = [];
    
    sizes.forEach((size) => {
      const sizeTrades = filteredData.filter((t) => t.tradeSize === size);
      const agg1Data: number[] = [];
      const agg2Data: number[] = [];
      
      sizeTrades.forEach((trade) => {
        const bestPrice = getBestPrice(trade.quotes);
        trade.quotes.forEach((quote) => {
          if (quote.aggregator === agg1) {
            agg1Data.push(calculatePriceDifference(quote.price, bestPrice));
          }
          if (quote.aggregator === agg2) {
            agg2Data.push(calculatePriceDifference(quote.price, bestPrice));
          }
        });
      });

      if (agg1Data.length > 0) {
        result.push(priceDistributionToBoxPlot(`${agg1} - ${size}`, agg1Data));
      }
      if (agg2Data.length > 0) {
        result.push(priceDistributionToBoxPlot(`${agg2} - ${size}`, agg2Data));
      }
    });

    return result;
  }, [filteredData, agg1, agg2]);

  // Get the latest timestamp from the data
  const latestTimestamp = useMemo(() => {
    if (tradeData.length === 0) return null;
    const timestamps = tradeData.map(t => t.timestamp).sort().reverse();
    return timestamps[0];
  }, [tradeData]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const [datePart, timePart] = timestamp.split('_');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading data...</div>
      </div>
    );
  }

  return (
    <div>
      {latestTimestamp && (
        <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-300">Data Run Date:</span>
              <span className="ml-2 text-sm text-slate-100">{formatTimestamp(latestTimestamp)}</span>
            </div>
            <div className="text-xs text-slate-400">
              {tradeData.length} trades loaded
            </div>
          </div>
        </div>
      )}
      <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Select Aggregators to Compare
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Aggregator 1
            </label>
            <select
              value={agg1}
              onChange={(e) => setAgg1(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-slate-700">Select...</option>
              {availableAggregators.map((agg) => (
                <option key={agg} value={agg} className="bg-slate-700">
                  {agg}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Aggregator 2
            </label>
            <select
              value={agg2}
              onChange={(e) => setAgg2(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-slate-700">Select...</option>
              {availableAggregators
                .filter((agg) => agg !== agg1)
                .map((agg) => (
                  <option key={agg} value={agg} className="bg-slate-700">
                    {agg}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        availablePairs={availablePairs}
        availableAggregators={availableAggregators}
      />

      {agg1 && agg2 && (
        <div className="space-y-6">
          <WinRateBarChart data={globalWinRateData} />
          
          {winRatePerChain.length > 0 && (
            <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                Win Rate per Chain
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Chain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        {agg1}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        {agg2}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800 divide-y divide-slate-700">
                    {winRatePerChain.map((row) => (
                      <tr key={row.chain}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                          {row.chain}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {(row[agg1] as number).toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {(row[agg2] as number).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {winRatePerPair.length > 0 && (
            <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                Win Rate per Pair
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Pair
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        {agg1}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        {agg2}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800 divide-y divide-slate-700">
                    {winRatePerPair.map((row) => (
                      <tr key={row.pair}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                          {row.pair}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {(row[agg1] as number).toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {(row[agg2] as number).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {boxPlotPerChain.length > 0 && (
            <BoxPlot
              data={boxPlotPerChain}
              title="Price Distribution per Chain"
              yAxisLabel="Price Difference (%)"
            />
          )}

          {boxPlotPerPair.length > 0 && (
            <BoxPlot
              data={boxPlotPerPair}
              title="Price Distribution per Pair"
              yAxisLabel="Price Difference (%)"
            />
          )}

          {boxPlotPerSize.length > 0 && (
            <BoxPlot
              data={boxPlotPerSize}
              title="Price Distribution per Trade Size"
              yAxisLabel="Price Difference (%)"
            />
          )}
        </div>
      )}

      {(!agg1 || !agg2) && (
        <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-12 text-center">
          <p className="text-slate-400">
            Please select two aggregators to compare
          </p>
        </div>
      )}
    </div>
  );
}
