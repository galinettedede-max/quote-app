# DEX Aggregator Performance Comparator

A Next.js application for comparing performance metrics across DEX aggregators.

## Features

- **Main Tab**: Compare all aggregators with win rate charts, median vs best price comparisons, and boxplots
- **Aggs versus Tab**: Side-by-side comparison of two aggregators with detailed breakdowns
- **Chains versus Tab**: Compare performance across different blockchain networks

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add your trade data to `data/trades.json` (see Data Format below)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Data Format

The application expects trade data in the following JSON format in `data/trades.json`:

```json
[
  {
    "id": "unique-id",
    "aggregator": "1inch",
    "chain": "Ethereum",
    "pair": {
      "tokenIn": "ETH",
      "tokenOut": "USDC",
      "pairType": "Native-Stable"
    },
    "tradeSize": 100000,
    "tokenIn": "ETH",
    "winRate": 75.5,
    "priceDifference": 0.0012,
    "medianPrice": 2500.50,
    "bestPrice": 2500.48,
    "timestamp": "2024-01-01T00:00:00Z"
  }
]
```

### Data Fields

- `id`: Unique identifier for the trade
- `aggregator`: Name of the DEX aggregator (e.g., "1inch", "Paraswap", "0x")
- `chain`: One of: "Monad", "HyperEVM", "Base", "Arbitrum", "Ethereum", "Polygon"
- `pair`: Object with `tokenIn`, `tokenOut`, and `pairType` ("Native-Stable" or "Stable-Stable")
- `tradeSize`: Trade size in USD (10000, 50000, 100000, 250000, 500000, 1000000)
- `tokenIn`: Token being swapped from
- `winRate`: Win rate percentage (0-100)
- `priceDifference`: Difference from best price (as decimal, e.g., 0.0012 = 0.12%)
- `medianPrice`: Median price across all aggregators
- `bestPrice`: Best price available
- `timestamp`: ISO 8601 timestamp

## Database Integration

Currently, the app reads from a JSON file. To integrate with a database:

1. **Option 1: SQLite (Recommended for local development)**
   - Install: `npm install better-sqlite3`
   - Create a database file and tables
   - Update `app/api/data/route.ts` to query SQLite

2. **Option 2: PostgreSQL (Recommended for production)**
   - Install: `npm install pg`
   - Set up connection string in environment variables
   - Update `app/api/data/route.ts` to query PostgreSQL

3. **Option 3: Continue with JSON file**
   - Update `data/trades.json` manually or via script
   - The API route will automatically serve the JSON data

### Example Database Schema

```sql
CREATE TABLE trades (
  id TEXT PRIMARY KEY,
  aggregator TEXT NOT NULL,
  chain TEXT NOT NULL,
  token_in TEXT NOT NULL,
  token_out TEXT NOT NULL,
  pair_type TEXT NOT NULL,
  trade_size INTEGER NOT NULL,
  win_rate REAL NOT NULL,
  price_difference REAL NOT NULL,
  median_price REAL NOT NULL,
  best_price REAL NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE INDEX idx_aggregator ON trades(aggregator);
CREATE INDEX idx_chain ON trades(chain);
CREATE INDEX idx_timestamp ON trades(timestamp);
```

## Daily Data Updates

To update data daily:

1. **Manual**: Replace `data/trades.json` with new data
2. **Script**: Create a script that:
   - Fetches/calculates trade data
   - Writes to `data/trades.json` or database
   - Runs via cron job or scheduled task

Example script structure:
```javascript
// scripts/update-data.js
const fs = require('fs');
const path = require('path');

async function updateTradeData() {
  // Your data fetching logic here
  const newData = await fetchTradeData();
  
  // Write to JSON file
  fs.writeFileSync(
    path.join(__dirname, '../data/trades.json'),
    JSON.stringify(newData, null, 2)
  );
  
  // Or update database
  // await db.insertTrades(newData);
}

updateTradeData();
```

## Project Structure

```
├── app/
│   ├── api/data/        # API route for serving trade data
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main page with tabs
├── components/
│   ├── charts/          # Chart components
│   ├── filters/         # Filter components
│   └── tabs/            # Tab components
├── lib/
│   ├── data.ts          # Data utilities
│   └── utils.ts         # General utilities
├── types/
│   └── index.ts         # TypeScript type definitions
└── data/
    └── trades.json      # Trade data (or use database)
```

## Technologies

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts

## License

MIT
