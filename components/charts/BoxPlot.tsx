'use client';

interface BoxPlotData {
  aggregator: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

interface BoxPlotProps {
  data: BoxPlotData[];
  title: string;
  yAxisLabel?: string;
}

// Calculate quartiles from array of numbers
export function calculateQuartiles(values: number[]): { min: number; q1: number; median: number; q3: number; max: number } {
  if (values.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  
  const min = sorted[0];
  const max = sorted[len - 1];
  const median = len % 2 === 0 
    ? (sorted[len / 2 - 1] + sorted[len / 2]) / 2
    : sorted[Math.floor(len / 2)];
  
  const lowerHalf = sorted.slice(0, Math.floor(len / 2));
  const upperHalf = sorted.slice(Math.ceil(len / 2));
  
  const q1 = lowerHalf.length === 0 
    ? min
    : lowerHalf.length % 2 === 0
    ? (lowerHalf[lowerHalf.length / 2 - 1] + lowerHalf[lowerHalf.length / 2]) / 2
    : lowerHalf[Math.floor(lowerHalf.length / 2)];
  
  const q3 = upperHalf.length === 0
    ? max
    : upperHalf.length % 2 === 0
    ? (upperHalf[upperHalf.length / 2 - 1] + upperHalf[upperHalf.length / 2]) / 2
    : upperHalf[Math.floor(upperHalf.length / 2)];
  
  return { min, q1, median, q3, max };
}

// Custom SVG-based boxplot
export default function BoxPlot({ data, title, yAxisLabel = 'Value' }: BoxPlotProps) {
  const chartHeight = 400;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };

  // Use viewBox for responsive scaling instead of fixed width
  const viewBoxWidth = 800;
  const plotWidth = viewBoxWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const boxWidth = Math.min(80, plotWidth / data.length - 10);

  // Calculate scale
  const allValues = data.flatMap(d => [d.min, d.max]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue || 1;

  const scaleY = (value: number) => {
    return padding.top + plotHeight - ((value - minValue) / range) * plotHeight;
  };

  const getXPosition = (index: number) => {
    return padding.left + (index + 0.5) * (plotWidth / data.length);
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
      <div style={{ width: '100%', height: chartHeight }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${viewBoxWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke="#475569"
            strokeWidth="2"
          />
          
          {/* Y-axis label */}
          <text
            x={20}
            y={chartHeight / 2}
            transform={`rotate(-90, 20, ${chartHeight / 2})`}
            textAnchor="middle"
            className="text-sm fill-slate-300"
          >
            {yAxisLabel}
          </text>

          {/* Y-axis ticks and labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = minValue + ratio * range;
            const y = scaleY(value);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left - 5}
                  y1={y}
                  x2={padding.left}
                  y2={y}
                  stroke="#64748b"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-slate-400"
                >
                  {value.toFixed(4)}
                </text>
              </g>
            );
          })}

          {/* Boxplots */}
          {data.map((item, index) => {
            const x = getXPosition(index);
            const yMin = scaleY(item.min);
            const yMax = scaleY(item.max);
            const yQ1 = scaleY(item.q1);
            const yMedian = scaleY(item.median);
            const yQ3 = scaleY(item.q3);
            const boxHeight = yQ1 - yQ3;

            return (
              <g key={item.aggregator}>
                {/* Whiskers */}
                <line
                  x1={x}
                  y1={yMin}
                  x2={x}
                  y2={yQ1}
                  stroke="#94a3b8"
                  strokeWidth="2"
                />
                <line
                  x1={x}
                  y1={yQ3}
                  x2={x}
                  y2={yMax}
                  stroke="#94a3b8"
                  strokeWidth="2"
                />
                
                {/* Box */}
                <rect
                  x={x - boxWidth / 2}
                  y={yQ3}
                  width={boxWidth}
                  height={boxHeight}
                  fill="#60a5fa"
                  fillOpacity="0.3"
                  stroke="#60a5fa"
                  strokeWidth="2"
                />
                
                {/* Median line */}
                <line
                  x1={x - boxWidth / 2}
                  y1={yMedian}
                  x2={x + boxWidth / 2}
                  y2={yMedian}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                
                {/* Min/Max markers */}
                <line
                  x1={x - 5}
                  y1={yMin}
                  x2={x + 5}
                  y2={yMin}
                  stroke="#94a3b8"
                  strokeWidth="2"
                />
                <line
                  x1={x - 5}
                  y1={yMax}
                  x2={x + 5}
                  y2={yMax}
                  stroke="#94a3b8"
                  strokeWidth="2"
                />
                
                {/* Label */}
                <text
                  x={x}
                  y={chartHeight - padding.bottom + 20}
                  textAnchor="middle"
                  className="text-xs fill-slate-300"
                  style={{ fontSize: '12px' }}
                  transform={`rotate(-45, ${x}, ${chartHeight - padding.bottom + 20})`}
                >
                  {item.aggregator}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-4 text-xs text-slate-400">
        <p>Min: Minimum value | Q1: First quartile | Median: Middle value | Q3: Third quartile | Max: Maximum value</p>
      </div>
    </div>
  );
}

// Helper function to convert price distribution to boxplot data
export function priceDistributionToBoxPlot(
  aggregator: string,
  priceDistribution: number[]
): BoxPlotData {
  const quartiles = calculateQuartiles(priceDistribution);
  return {
    aggregator,
    ...quartiles,
  };
}
