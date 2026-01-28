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

export default function ChainsVersusTab() {
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chain1, setChain1] = useState<Chain | ''>('');
  const [chain2, setChain2] = useState<Chain | ''>('');

  const [filters, setFilters] = useState<FilterState>({
    chain: 'Ethereum', // Default to Ethereum
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

  // Apply filters and chain selection
  const filteredData = useMemo(() => {
    return tradeData.filter((trade) => {
      if (chain1 && chain2 && trade.chain !== chain1 && trade.chain !== chain2) {
        return false;
      }
      // Filter by single selected chain (when chain1/chain2 are not set)
      if (!chain1 && !chain2 && trade.chain !== filters.chain) {
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
  }, [tradeData, filters, chain1, chain2]);

  // Win rate per pair
  const winRatePerPair = useMemo(() => {
    if (!chain1 || !chain2) return [];
    
    const pairs = Array.from(
      new Set(
        filteredData.map(
          (t) => `${t.pair.tokenIn}-${t.pair.tokenOut}`
        )
      )
    );
    return pairs.map((pairKey) => {
      const calcWinRate = (chain: Chain) => {
        const chainTrades = filteredData.filter(
          (t) =>
            t.chain === chain &&
            `${t.pair.tokenIn}-${t.pair.tokenOut}` === pairKey
        );
        
        let totalWins = 0;
        let totalTrades = 0;
        
        chainTrades.forEach((trade) => {
          if (trade.quotes.length > 0) {
            totalTrades++;
            // Count how many aggregators won (could be multiple if tied)
            const bestPrice = getBestPrice(trade.quotes);
            const winners = trade.quotes.filter((q) => q.price === bestPrice);
            totalWins += winners.length;
          }
        });
        
        // Average win rate across all aggregators on this chain
        const totalQuotes = chainTrades.reduce((sum, t) => sum + t.quotes.length, 0);
        return totalQuotes > 0 ? (totalWins / totalQuotes) * 100 : 0;
      };

      return {
        pair: pairKey,
        [chain1]: calcWinRate(chain1),
        [chain2]: calcWinRate(chain2),
      };
    });
  }, [filteredData, chain1, chain2]);

  // Global boxplot
  const globalBoxPlot = useMemo(() => {
    if (!chain1 || !chain2) return [];
    
    const chain1Trades = filteredData.filter((t) => t.chain === chain1);
    const chain2Trades = filteredData.filter((t) => t.chain === chain2);
    
    const chain1Data: number[] = [];
    const chain2Data: number[] = [];
    
    chain1Trades.forEach((trade) => {
      const bestPrice = getBestPrice(trade.quotes);
      trade.quotes.forEach((quote) => {
        chain1Data.push(calculatePriceDifference(quote.price, bestPrice));
      });
    });
    
    chain2Trades.forEach((trade) => {
      const bestPrice = getBestPrice(trade.quotes);
      trade.quotes.forEach((quote) => {
        chain2Data.push(calculatePriceDifference(quote.price, bestPrice));
      });
    });

    const result: any[] = [];
    if (chain1Data.length > 0) {
      result.push(priceDistributionToBoxPlot(chain1, chain1Data));
    }
    if (chain2Data.length > 0) {
      result.push(priceDistributionToBoxPlot(chain2, chain2Data));
    }

    return result;
  }, [filteredData, chain1, chain2]);

  // Boxplot per aggregator
  const boxPlotPerAggregator = useMemo(() => {
    if (!chain1 || !chain2) return [];
    
    const aggregators = new Set<string>();
    filteredData.forEach((trade) => {
      trade.quotes.forEach((quote) => {
        aggregators.add(quote.aggregator);
      });
    });
    
    const result: any[] = [];
    
    aggregators.forEach((agg) => {
      const chain1Data: number[] = [];
      const chain2Data: number[] = [];
      
      filteredData.forEach((trade) => {
        if (trade.chain === chain1 || trade.chain === chain2) {
          const bestPrice = getBestPrice(trade.quotes);
          trade.quotes.forEach((quote) => {
            if (quote.aggregator === agg) {
              if (trade.chain === chain1) {
                chain1Data.push(calculatePriceDifference(quote.price, bestPrice));
              } else if (trade.chain === chain2) {
                chain2Data.push(calculatePriceDifference(quote.price, bestPrice));
              }
            }
          });
        }
      });

      if (chain1Data.length > 0) {
        result.push(priceDistributionToBoxPlot(`${chain1} - ${agg}`, chain1Data));
      }
      if (chain2Data.length > 0) {
        result.push(priceDistributionToBoxPlot(`${chain2} - ${agg}`, chain2Data));
      }
    });

    return result;
  }, [filteredData, chain1, chain2]);

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
          Select Chains to Compare
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Chain 1
            </label>
            <select
              value={chain1}
              onChange={(e) => setChain1(e.target.value as Chain)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-slate-700">Select...</option>
              {CHAINS.map((chain) => (
                <option key={chain} value={chain} className="bg-slate-700">
                  {chain}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Chain 2
            </label>
            <select
              value={chain2}
              onChange={(e) => setChain2(e.target.value as Chain)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-slate-700">Select...</option>
              {CHAINS.filter((chain) => chain !== chain1).map((chain) => (
                <option key={chain} value={chain} className="bg-slate-700">
                  {chain}
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

      {chain1 && chain2 && (
        <div className="space-y-6">
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
                        {chain1}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                        {chain2}
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
                          {(row[chain1] as number).toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {(row[chain2] as number).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {globalBoxPlot.length > 0 && (
            <BoxPlot
              data={globalBoxPlot}
              title="Global Price Distribution"
              yAxisLabel="Price Difference (%)"
            />
          )}

          {boxPlotPerAggregator.length > 0 && (
            <BoxPlot
              data={boxPlotPerAggregator}
              title="Price Distribution per Aggregator"
              yAxisLabel="Price Difference (%)"
            />
          )}
        </div>
      )}

      {(!chain1 || !chain2) && (
        <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-12 text-center">
          <p className="text-slate-400">
            Please select two chains to compare
          </p>
        </div>
      )}
    </div>
  );
}
