import { TradeData, Chain, Pair, TradeSize } from '@/types';

// This will be replaced with actual DB connection later
// For now, we'll use a JSON file approach

export async function getTradeData(): Promise<TradeData[]> {
  // TODO: Replace with actual database query
  // For now, return empty array - user will populate with their data
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

export const CHAINS: Chain[] = ['Monad', 'HyperEVM', 'Base', 'Arbitrum', 'Ethereum', 'Polygon'];

export const TRADE_SIZES: TradeSize[] = [10000, 50000, 100000, 250000, 500000, 1000000];

export const TRADE_SIZE_LABELS: Record<TradeSize, string> = {
  10000: '10K',
  50000: '50K',
  100000: '100K',
  250000: '250K',
  500000: '500K',
  1000000: '1M',
};
