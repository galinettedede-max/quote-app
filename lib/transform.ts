import { RawQuoteData, TradeData, Quote, Chain, Pair, TradeSize } from '@/types';

// Map chain names to our Chain type
const CHAIN_MAP: Record<string, Chain> = {
  'Mainnet': 'Ethereum',
  'Ethereum': 'Ethereum',
  'Base': 'Base',
  'Arbitrum': 'Arbitrum',
  'Polygon': 'Polygon',
  'Monad': 'Monad',
  'HyperEVM': 'HyperEVM',
};

// Normalize chain name
function normalizeChain(chain: string, chainName?: string): Chain {
  const key = chainName || chain;
  return CHAIN_MAP[key] || 'Ethereum'; // Default to Ethereum if unknown
}

// Determine pair type based on tokens
function determinePairType(tokenIn: string, tokenOut: string): 'Native-Stable' | 'Stable-Stable' {
  const stablecoins = ['USDC', 'USDT', 'DAI', 'USDD', 'BUSD', 'TUSD', 'FRAX', 'LUSD'];
  const isTokenInStable = stablecoins.includes(tokenIn);
  const isTokenOutStable = stablecoins.includes(tokenOut);
  
  if (isTokenInStable && isTokenOutStable) {
    return 'Stable-Stable';
  }
  return 'Native-Stable';
}

// Parse efficiency string (e.g., "99.94%") to number
function parseEfficiency(efficiency: string): number {
  const cleaned = efficiency.replace('%', '').trim();
  return parseFloat(cleaned) || 0;
}

// List of aggregator names to exclude (test names, outliers, etc.)
const EXCLUDED_AGGREGATORS = new Set([
  'oogabooga',
  'test',
  'test_aggregator',
  'debug',
  'mock',
]);

// Filter out erratic quotes (efficiency outside 95-101%)
function isValidQuote(efficiency: number, aggregator: string): boolean {
  // Exclude test/debug aggregators
  const normalizedAggregator = aggregator.toLowerCase().trim();
  if (EXCLUDED_AGGREGATORS.has(normalizedAggregator)) {
    return false;
  }
  
  // Filter efficiency range
  return efficiency >= 95 && efficiency <= 101;
}

// Calculate statistical outliers using IQR (Interquartile Range) method
function calculateOutliers(values: number[]): Set<number> {
  if (values.length < 4) return new Set(); // Need at least 4 values for meaningful outlier detection
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  // More conservative bounds: 2.5 * IQR instead of 1.5 * IQR
  const lowerBound = q1 - 2.5 * iqr;
  const upperBound = q3 + 2.5 * iqr;
  
  const outliers = new Set<number>();
  values.forEach((value) => {
    if (value < lowerBound || value > upperBound) {
      outliers.add(value);
    }
  });
  
  return outliers;
}

// Filter out quotes that are statistical outliers within their trade
function filterOutliers(quotes: Array<{ price: number; aggregator: string; efficiency: number; latency_ms: number }>): Array<{ price: number; aggregator: string; efficiency: number; latency_ms: number }> {
  if (quotes.length < 4) return quotes; // Need at least 4 quotes to detect outliers
  
  // Calculate price outliers
  const prices = quotes.map(q => q.price);
  const priceOutliers = calculateOutliers(prices);
  
  // Also filter based on efficiency outliers (additional safety)
  const efficiencies = quotes.map(q => q.efficiency);
  const efficiencyOutliers = calculateOutliers(efficiencies);
  
  // Calculate median price for additional filtering
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const medianPrice = sortedPrices.length % 2 === 0
    ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
    : sortedPrices[Math.floor(sortedPrices.length / 2)];
  
  // Filter out quotes that are outliers in price OR efficiency
  return quotes.filter((quote) => {
    const isPriceOutlier = priceOutliers.has(quote.price);
    const isEfficiencyOutlier = efficiencyOutliers.has(quote.efficiency);
    
    // Also filter extremely high latency (e.g., > 30 seconds)
    const isLatencyOutlier = quote.latency_ms > 30000;
    
    // Additional check: if price is more than 10% away from median, it's likely an outlier
    const priceDeviation = medianPrice > 0 ? Math.abs((quote.price - medianPrice) / medianPrice) : 0;
    const isPriceDeviationOutlier = priceDeviation > 0.10; // 10% deviation
    
    return !isPriceOutlier && !isEfficiencyOutlier && !isLatencyOutlier && !isPriceDeviationOutlier;
  });
}

// Calculate price from expectedAmount and token amount
// Price = expectedAmount / token_amount (output per input token)
// This represents the output amount per unit of input token
function calculatePrice(expectedAmount: number, tokenAmount: number): number {
  if (tokenAmount === 0) return 0;
  return expectedAmount / tokenAmount;
}

// Alternative: calculate price from USD amounts
// Price = to_amount_usd / from_amount_usd (output USD per input USD)
function calculatePriceFromUSD(toAmountUSD: number, fromAmountUSD: number): number {
  if (fromAmountUSD === 0) return 0;
  return toAmountUSD / fromAmountUSD;
}

// Transform raw data to TradeData format
export function transformRawData(rawData: RawQuoteData[]): TradeData[] {
  // Group quotes by unique trade (timestamp, chain, pair, usd_amount)
  const tradeMap = new Map<string, {
    timestamp: string;
    chain: Chain;
    pair: Pair;
    tradeSize: TradeSize;
    tokenIn: string;
    quotes: Quote[];
  }>();

  rawData.forEach((row) => {
    // Filter out erratic quotes and excluded aggregators
    const efficiency = parseEfficiency(row.efficiency);
    if (!isValidQuote(efficiency, row.project)) {
      return; // Skip this quote
    }

    // Create unique key for grouping trades
    const chain = normalizeChain(row.chain, row.chain_name);
    const pairKey = `${row.timestamp}-${chain}-${row.from_token}-${row.to_token}-${row.usd_amount}`;
    
    if (!tradeMap.has(pairKey)) {
      const pair: Pair = {
        tokenIn: row.from_token,
        tokenOut: row.to_token,
        pairType: determinePairType(row.from_token, row.to_token),
      };

      // Round usd_amount to nearest TradeSize
      const tradeSize = roundToTradeSize(row.usd_amount);

      tradeMap.set(pairKey, {
        timestamp: row.timestamp,
        chain,
        pair,
        tradeSize,
        tokenIn: row.from_token,
        quotes: [],
      });
    }

    const trade = tradeMap.get(pairKey)!;
    // Use USD amounts for price calculation (more accurate)
    // Price represents output USD per input USD
    const price = row.to_amount_usd > 0 && row.from_amount_usd > 0
      ? calculatePriceFromUSD(row.to_amount_usd, row.from_amount_usd)
      : calculatePrice(row.expectedAmount, row.token_amount);

    trade.quotes.push({
      aggregator: row.project,
      price,
      efficiency,
      latency_ms: row.latency_ms,
      expectedAmount: row.expectedAmount,
    });
  });

  // Convert to TradeData array with IDs and filter outliers
  let tradeId = 1;
  return Array.from(tradeMap.values()).map((trade) => {
    // Filter outliers from quotes within each trade
    const filteredQuotes = filterOutliers(trade.quotes);
    
    const id = `trade-${tradeId.toString().padStart(3, '0')}`;
    tradeId++;
    return {
      id,
      chain: trade.chain,
      pair: trade.pair,
      tradeSize: trade.tradeSize,
      tokenIn: trade.tokenIn,
      quotes: filteredQuotes.length > 0 ? filteredQuotes : trade.quotes, // Keep original if all filtered out
      timestamp: trade.timestamp,
    };
  });
}

// Round USD amount to nearest TradeSize
function roundToTradeSize(usdAmount: number): TradeSize {
  const sizes: TradeSize[] = [10000, 50000, 100000, 250000, 500000, 1000000];
  let closest = sizes[0];
  let minDiff = Math.abs(usdAmount - sizes[0]);
  
  for (const size of sizes) {
    const diff = Math.abs(usdAmount - size);
    if (diff < minDiff) {
      minDiff = diff;
      closest = size;
    }
  }
  
  return closest;
}

// Parse CSV string to RawQuoteData array (supports both comma and tab-separated)
export function parseCSV(csvContent: string): RawQuoteData[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Detect delimiter (tab or comma)
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  
  const headers = firstLine.split(delimiter).map(h => h.trim());
  const data: RawQuoteData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim());
    if (values.length !== headers.length) continue;
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    
    // Convert numeric fields
    const rawData: RawQuoteData = {
      timestamp: row.timestamp || '',
      chain: row.chain || '',
      chain_name: row.chain_name || '',
      from_token: row.from_token || '',
      to_token: row.to_token || '',
      usd_amount: parseFloat(row.usd_amount) || 0,
      token_amount: parseFloat(row.token_amount) || 0,
      project: row.project || '',
      expectedAmount: parseFloat(row.expectedAmount) || 0,
      efficiency: row.efficiency || '0%',
      latency_ms: parseFloat(row.latency_ms) || 0,
      from_amount_usd: parseFloat(row.from_amount_usd) || 0,
      to_amount_usd: parseFloat(row.to_amount_usd) || 0,
    };
    
    data.push(rawData);
  }
  
  return data;
}
