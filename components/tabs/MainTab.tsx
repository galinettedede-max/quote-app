'use client';

import { useState, useEffect, useMemo } from 'react';
import { TradeData, FilterState, Pair, Quote } from '@/types';
import { getTradeData, TRADE_SIZES } from '@/lib/data';
import FilterPanel from '@/components/filters/FilterPanel';
import WinRateBarChart from '@/components/charts/WinRateBarChart';
import MedianVsBestChart from '@/components/charts/MedianVsBestChart';
import BoxPlot, { priceDistributionToBoxPlot } from '@/components/charts/BoxPlot';
import LatencyChart from '@/components/charts/LatencyChart';
import TransactionsTable from '@/components/tables/TransactionsTable';
import {
  getBestPrice,
  getMedianPrice,
  calculateEfficiency,
  calculateAverageLatency,
  calculateMedianLatency,
  calculateP95Latency,
} from '@/lib/utils';

export default function MainTab() {
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Extract unique pairs and aggregators from data
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

  // Apply filters
  const filteredData = useMemo(() => {
    return tradeData.filter((trade) => {
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
        // Check if any quote has a matching aggregator
        const hasMatchingAggregator = trade.quotes.some((quote) =>
          filters.aggregators.includes(quote.aggregator)
        );
        if (!hasMatchingAggregator) return false;
      }
      return true;
    });
  }, [tradeData, filters]);

  // Calculate win rate by aggregator (dynamically from quotes)
  const winRateData = useMemo(() => {
    const aggregatorMap = new Map<string, { wins: number; total: number }>();
    
    filteredData.forEach((trade) => {
      if (trade.quotes.length === 0) return;
      
      const bestPrice = getBestPrice(trade.quotes);
      const winningAggregators = trade.quotes
        .filter((q) => q.price === bestPrice)
        .map((q) => q.aggregator);
      
      // Count participation and wins for each aggregator
      trade.quotes.forEach((quote) => {
        const current = aggregatorMap.get(quote.aggregator) || { wins: 0, total: 0 };
        current.total++;
        if (winningAggregators.includes(quote.aggregator)) {
          current.wins++;
        }
        aggregatorMap.set(quote.aggregator, current);
      });
    });

    return Array.from(aggregatorMap.entries()).map(([aggregator, stats]) => ({
      aggregator,
      winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
    }));
  }, [filteredData]);

  // Calculate median vs best (dynamically from quotes)
  const medianVsBestData = useMemo(() => {
    const aggregatorMap = new Map<string, { prices: number[]; bestPrices: number[] }>();

    filteredData.forEach((trade) => {
      if (trade.quotes.length === 0) return;
      
      const bestPrice = getBestPrice(trade.quotes);
      const medianPrice = getMedianPrice(trade.quotes);
      
      trade.quotes.forEach((quote) => {
        const current = aggregatorMap.get(quote.aggregator) || {
          prices: [],
          bestPrices: [],
        };
        current.prices.push(quote.price);
        current.bestPrices.push(bestPrice);
        aggregatorMap.set(quote.aggregator, current);
      });
    });

    return Array.from(aggregatorMap.entries()).map(([aggregator, stats]) => {
      // Calculate median of aggregator prices
      const sortedPrices = [...stats.prices].sort((a, b) => a - b);
      const median =
        sortedPrices.length > 0
          ? sortedPrices.length % 2 === 0
            ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
            : sortedPrices[Math.floor(sortedPrices.length / 2)]
          : 0;
      
      // Calculate median of best prices
      const sortedBest = [...stats.bestPrices].sort((a, b) => a - b);
      const best =
        sortedBest.length > 0
          ? sortedBest.length % 2 === 0
            ? (sortedBest[sortedBest.length / 2 - 1] + sortedBest[sortedBest.length / 2]) / 2
            : sortedBest[Math.floor(sortedBest.length / 2)]
          : 0;

      return {
        aggregator,
        median: best > 0 ? ((median - best) / best) * 100 : 0,
        best: 0,
      };
    });
  }, [filteredData]);


  // Calculate efficiency boxplot per aggregator (using efficiency from quotes directly)
  const efficiencyBoxPlotData = useMemo(() => {
    const aggregatorMap = new Map<string, number[]>();

    filteredData.forEach((trade) => {
      if (trade.quotes.length === 0) return;

      trade.quotes.forEach((quote) => {
        const current = aggregatorMap.get(quote.aggregator) || [];
        // Use efficiency directly from quote if available, otherwise calculate
        const efficiency = quote.efficiency || calculateEfficiency(quote.price, getBestPrice(trade.quotes));
        current.push(efficiency);
        aggregatorMap.set(quote.aggregator, current);
      });
    });

    return Array.from(aggregatorMap.entries()).map(([aggregator, efficiencies]) =>
      priceDistributionToBoxPlot(aggregator, efficiencies)
    );
  }, [filteredData]);

  // Calculate latency statistics by aggregator
  const latencyData = useMemo(() => {
    const aggregatorMap = new Map<string, Quote[]>();

    filteredData.forEach((trade) => {
      trade.quotes.forEach((quote) => {
        const current = aggregatorMap.get(quote.aggregator) || [];
        current.push(quote);
        aggregatorMap.set(quote.aggregator, current);
      });
    });

    return Array.from(aggregatorMap.entries()).map(([aggregator, quotes]) => ({
      aggregator,
      average: calculateAverageLatency(quotes),
      median: calculateMedianLatency(quotes),
      p95: calculateP95Latency(quotes),
    }));
  }, [filteredData]);

  // Get the latest timestamp from the data
  const latestTimestamp = useMemo(() => {
    if (tradeData.length === 0) return null;
    const timestamps = tradeData.map(t => t.timestamp).sort().reverse();
    return timestamps[0];
  }, [tradeData]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    // Convert "2026-01-27_19-58-12" to "January 27, 2026 at 19:58:12"
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
      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        availablePairs={availablePairs}
        availableAggregators={availableAggregators}
      />

      <div className="space-y-6">
        <WinRateBarChart data={winRateData} />
        <MedianVsBestChart data={medianVsBestData} />
        {efficiencyBoxPlotData.length > 0 && (
          <BoxPlot
            data={efficiencyBoxPlotData}
            title="Efficiency Distribution by Aggregator"
            yAxisLabel="Efficiency (%)"
          />
        )}
        {latencyData.length > 0 && (
          <>
            <LatencyChart data={latencyData} metric="average" />
            <LatencyChart data={latencyData} metric="median" />
            <LatencyChart data={latencyData} metric="p95" />
          </>
        )}

        {/* Transactions Table */}
        <TransactionsTable data={filteredData} />
      </div>
    </div>
  );
}
