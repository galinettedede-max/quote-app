'use client';

import { useState, useMemo } from 'react';
import { TradeData, Quote } from '@/types';
import { TRADE_SIZE_LABELS } from '@/lib/data';
import { getBestPrice } from '@/lib/utils';

interface TransactionsTableProps {
  data: TradeData[];
}

interface TransactionRow {
  id: string;
  chain: string;
  pair: string;
  tradeSize: string;
  aggregator: string;
  price: number;
  efficiency: number;
  latency: number;
  expectedAmount: number;
  isBest: boolean;
  timestamp: string;
}

export default function TransactionsTable({ data }: TransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof TransactionRow>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const rowsPerPage = 50;

  // Flatten trades to individual quote rows
  const rows = useMemo(() => {
    const allRows: TransactionRow[] = [];

    data.forEach((trade) => {
      const bestPrice = getBestPrice(trade.quotes);

      trade.quotes.forEach((quote) => {
        allRows.push({
          id: `${trade.id}-${quote.aggregator}`,
          chain: trade.chain,
          pair: `${trade.pair.tokenIn}/${trade.pair.tokenOut}`,
          tradeSize: TRADE_SIZE_LABELS[trade.tradeSize] || trade.tradeSize.toString(),
          aggregator: quote.aggregator,
          price: quote.price,
          efficiency: quote.efficiency,
          latency: quote.latency_ms,
          expectedAmount: quote.expectedAmount,
          isBest: quote.price === bestPrice,
          timestamp: trade.timestamp,
        });
      });
    });

    return allRows;
  }, [data]);

  // Sort rows
  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return sortDirection === 'asc'
          ? (aVal === bVal ? 0 : aVal ? 1 : -1)
          : (aVal === bVal ? 0 : bVal ? 1 : -1);
      }

      return 0;
    });

    return sorted;
  }, [rows, sortColumn, sortDirection]);

  // Paginate rows
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedRows, currentPage]);

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);

  const handleSort = (column: keyof TransactionRow) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (rows.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-8 text-center">
        <p className="text-slate-400">No transactions found for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700">
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100">
          Transactions
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {sortedRows.length} total transactions
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50 text-slate-300 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-slate-700" onClick={() => handleSort('chain')}>
                <div className="flex items-center">
                  Chain
                  {sortColumn === 'chain' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-slate-700" onClick={() => handleSort('pair')}>
                <div className="flex items-center">
                  Pair
                  {sortColumn === 'pair' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-slate-700" onClick={() => handleSort('tradeSize')}>
                <div className="flex items-center">
                  Size
                  {sortColumn === 'tradeSize' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-slate-700" onClick={() => handleSort('aggregator')}>
                <div className="flex items-center">
                  Aggregator
                  {sortColumn === 'aggregator' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-slate-700" onClick={() => handleSort('price')}>
                <div className="flex items-center justify-end">
                  Price
                  {sortColumn === 'price' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-slate-700" onClick={() => handleSort('efficiency')}>
                <div className="flex items-center justify-end">
                  Efficiency
                  {sortColumn === 'efficiency' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-slate-700" onClick={() => handleSort('latency')}>
                <div className="flex items-center justify-end">
                  Latency (ms)
                  {sortColumn === 'latency' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-slate-700" onClick={() => handleSort('expectedAmount')}>
                <div className="flex items-center justify-end">
                  Expected Amount
                  {sortColumn === 'expectedAmount' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {paginatedRows.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-slate-700/30 ${
                  row.isBest ? 'bg-green-900/20' : ''
                }`}
              >
                <td className="px-4 py-3 text-slate-200">{row.chain}</td>
                <td className="px-4 py-3 text-slate-200 font-mono text-xs">{row.pair}</td>
                <td className="px-4 py-3 text-slate-200">{row.tradeSize}</td>
                <td className="px-4 py-3 text-slate-200">
                  <div className="flex items-center">
                    {row.aggregator}
                    {row.isBest && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-green-600 text-white rounded">
                        Best
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-slate-200 font-mono">
                  {row.price.toFixed(6)}
                </td>
                <td className="px-4 py-3 text-right text-slate-200">
                  <span className={row.efficiency >= 99.5 ? 'text-green-400' : row.efficiency >= 98 ? 'text-yellow-400' : 'text-red-400'}>
                    {row.efficiency.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-200">
                  {row.latency.toFixed(0)}
                </td>
                <td className="px-4 py-3 text-right text-slate-200 font-mono text-xs">
                  {row.expectedAmount.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, sortedRows.length)} of {sortedRows.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-slate-700 text-slate-200 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-slate-700 text-slate-200 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-slate-700 text-slate-200 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-slate-700 text-slate-200 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
