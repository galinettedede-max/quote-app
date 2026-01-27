# Data Format Guide

This application now supports your raw quote data format. You can provide data in either CSV (tab-separated) or JSON format.

## Supported File Formats

The application will look for data files in this order:
1. `data/quotes.csv` - Tab-separated CSV file
2. `data/quotes.json` - JSON array of quote objects
3. `data/trades.json` - Legacy format (already transformed)

## Data Structure

Each row/object should contain the following fields:

### Required Fields

- `timestamp`: Timestamp string (e.g., "2026-01-23_09-17-02")
- `chain`: Chain identifier (e.g., "Mainnet")
- `chain_name`: Chain name (e.g., "Ethereum")
- `from_token`: Input token symbol (e.g., "ETH")
- `to_token`: Output token symbol (e.g., "USDC")
- `usd_amount`: Trade size in USD (e.g., 10000)
- `token_amount`: Amount of input token (e.g., 3.333333333)
- `project`: Aggregator/project name (e.g., "1inch_fusion")
- `expectedAmount`: Expected output amount
- `efficiency`: Efficiency as percentage string (e.g., "99.94%")
- `latency_ms`: Latency in milliseconds (e.g., 530)
- `from_amount_usd`: Input amount in USD
- `to_amount_usd`: Output amount in USD

## CSV Format (Tab-Separated)

```csv
timestamp	chain	chain_name	from_token	to_token	usd_amount	token_amount	project	expectedAmount	efficiency	latency_ms	from_amount_usd	to_amount_usd
2026-01-23_09-17-02	Mainnet	Ethereum	ETH	USDC	10000	3.333333333	1inch_fusion	9799.545966	99.94%	530	9802.366667	9796.851091
2026-01-23_09-17-02	Mainnet	Ethereum	ETH	USDC	10000	3.333333333	Velora Delta	9798.362348	99.93%	2970	9802.366667	9795.667798
```

## JSON Format

```json
[
  {
    "timestamp": "2026-01-23_09-17-02",
    "chain": "Mainnet",
    "chain_name": "Ethereum",
    "from_token": "ETH",
    "to_token": "USDC",
    "usd_amount": 10000,
    "token_amount": 3.333333333,
    "project": "1inch_fusion",
    "expectedAmount": 9799.545966,
    "efficiency": "99.94%",
    "latency_ms": 530,
    "from_amount_usd": 9802.366667,
    "to_amount_usd": 9796.851091
  }
]
```

## Data Filtering

The application automatically filters out erratic quotes:
- **Efficiency Range**: Only quotes with efficiency between 95% and 101% are included
- Quotes outside this range are excluded from all calculations

## Data Transformation

The raw data is automatically transformed:
1. Quotes are grouped by trade (same timestamp, chain, pair, and USD amount)
2. Chain names are normalized (e.g., "Mainnet" → "Ethereum")
3. Pair types are automatically detected (Native-Stable vs Stable-Stable)
4. Trade sizes are rounded to nearest standard size (10K, 50K, 100K, 250K, 500K, 1M)
5. Prices are calculated from USD amounts for accuracy

## Metrics Calculated

The application computes the following metrics dynamically:
- **Win Rate**: Percentage of trades where an aggregator has the best price
- **Median vs Best**: Median price difference from best price
- **Efficiency**: Distribution of efficiency across trade sizes
- **Latency**: Average, median, and P95 latency statistics

## Example: Converting Your Data

If you have data in a different format, you can convert it:

```javascript
// Example: Convert your data to quotes.json
const rawData = [
  // Your data rows here
];

// Save as data/quotes.json
fs.writeFileSync('data/quotes.json', JSON.stringify(rawData, null, 2));
```

Or save as tab-separated CSV in `data/quotes.csv`.
