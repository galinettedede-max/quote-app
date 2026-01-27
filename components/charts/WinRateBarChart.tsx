'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WinRateData {
  aggregator: string;
  winRate: number;
}

interface WinRateBarChartProps {
  data: WinRateData[];
}

export default function WinRateBarChart({ data }: WinRateBarChartProps) {
  return (
    <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Win Rate by Aggregator</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="aggregator" stroke="#94a3b8" />
          <YAxis label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }} stroke="#94a3b8" />
          <Tooltip 
            formatter={(value: number) => `${value.toFixed(2)}%`}
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '4px', color: '#f1f5f9' }}
          />
          <Legend wrapperStyle={{ color: '#f1f5f9' }} />
          <Bar dataKey="winRate" fill="#60a5fa" name="Win Rate (%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
