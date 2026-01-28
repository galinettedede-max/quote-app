export type Chain = 'Monad' | 'HyperEVM' | 'Base' | 'Arbitrum' | 'Ethereum' | 'Polygon';

export type TradeSize = 10000 | 50000 | 100000 | 250000 | 500000 | 1000000;

export interface Pair {
  tokenIn: string;
  tokenOut: string;
  pairType: 'Native-Stable' | 'Stable-Stable';
}

// Raw data row from CSV/JSON input
export interface RawQuoteData {
  timestamp: string;
  chain: string;
  chain_name: string;
  from_token: string;
  to_token: string;
  usd_amount: number;
  token_amount: number;
  project: string; // aggregator name
  expectedAmount: number;
  efficiency: string; // e.g., "99.94%"
  latency_ms: number;
  from_amount_usd: number;
  to_amount_usd: number;
}

// Individual quote from an aggregator for a trade
export interface Quote {
  aggregator: string;
  price: number; // price offered by this aggregator (calculated from expectedAmount)
  efficiency: number; // efficiency as percentage (0-100)
  latency_ms: number;
  expectedAmount: number;
}

// Trade with multiple quotes from different aggregators
export interface TradeData {
  id: string;
  chain: Chain;
  pair: Pair;
  tradeSize: TradeSize;
  tokenIn: string;
  quotes: Quote[]; // quotes from different aggregators for this trade
  timestamp: string;
}

// Legacy interface for backward compatibility (will be computed dynamically)
export interface AggregatedTradeData {
  id: string;
  aggregator: string;
  chain: Chain;
  pair: Pair;
  tradeSize: TradeSize;
  tokenIn: string;
  winRate: number; // percentage
  priceDifference: number; // difference from best price
  medianPrice: number;
  bestPrice: number;
  timestamp: string;
  efficiency: number; // efficiency percentage (bestPrice / aggregatorPrice * 100)
}

export interface AggregatorStats {
  aggregator: string;
  winRate: number;
  medianVsBest: number;
  priceDistribution: number[]; // for boxplot
}

export interface FilterState {
  chain: Chain; // Single chain selection
  pairs: Pair[];
  sizeRange: { min: TradeSize; max: TradeSize };
  aggregators: string[];
}
