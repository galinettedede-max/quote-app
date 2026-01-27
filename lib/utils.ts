import { type ClassValue, clsx } from 'clsx';
import { TradeData, Quote } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

export function formatPercentage(num: number): string {
  return `${formatNumber(num)}%`;
}

// Calculate best price (minimum price) from quotes
export function getBestPrice(quotes: Quote[]): number {
  if (quotes.length === 0) return 0;
  return Math.min(...quotes.map(q => q.price));
}

// Calculate median price from quotes
export function getMedianPrice(quotes: Quote[]): number {
  if (quotes.length === 0) return 0;
  const sortedPrices = [...quotes.map(q => q.price)].sort((a, b) => a - b);
  const mid = Math.floor(sortedPrices.length / 2);
  return sortedPrices.length % 2 === 0
    ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2
    : sortedPrices[mid];
}

// Calculate efficiency: (bestPrice / aggregatorPrice) * 100
export function calculateEfficiency(aggregatorPrice: number, bestPrice: number): number {
  if (bestPrice === 0) return 0;
  return (bestPrice / aggregatorPrice) * 100;
}

// Calculate price difference percentage: ((aggregatorPrice - bestPrice) / bestPrice) * 100
export function calculatePriceDifference(aggregatorPrice: number, bestPrice: number): number {
  if (bestPrice === 0) return 0;
  return ((aggregatorPrice - bestPrice) / bestPrice) * 100;
}

// Check if an aggregator won (has the best price) for a trade
export function didAggregatorWin(aggregator: string, quotes: Quote[]): boolean {
  if (quotes.length === 0) return false;
  const bestPrice = getBestPrice(quotes);
  const aggregatorQuote = quotes.find(q => q.aggregator === aggregator);
  return aggregatorQuote ? aggregatorQuote.price === bestPrice : false;
}

// Calculate average latency for an aggregator
export function calculateAverageLatency(quotes: Quote[]): number {
  if (quotes.length === 0) return 0;
  const sum = quotes.reduce((acc, q) => acc + q.latency_ms, 0);
  return sum / quotes.length;
}

// Calculate median latency
export function calculateMedianLatency(quotes: Quote[]): number {
  if (quotes.length === 0) return 0;
  const sortedLatencies = [...quotes.map(q => q.latency_ms)].sort((a, b) => a - b);
  const mid = Math.floor(sortedLatencies.length / 2);
  return sortedLatencies.length % 2 === 0
    ? (sortedLatencies[mid - 1] + sortedLatencies[mid]) / 2
    : sortedLatencies[mid];
}

// Calculate p95 latency
export function calculateP95Latency(quotes: Quote[]): number {
  if (quotes.length === 0) return 0;
  const sortedLatencies = [...quotes.map(q => q.latency_ms)].sort((a, b) => a - b);
  const index = Math.ceil(sortedLatencies.length * 0.95) - 1;
  return sortedLatencies[Math.max(0, index)];
}
