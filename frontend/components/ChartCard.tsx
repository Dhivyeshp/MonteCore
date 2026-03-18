import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

type ChartPoint = { date: string; value: number };

type ChartCardProps = {
  title: string;
  data: ChartPoint[];
  color?: string;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val: number = payload[0].value;
  const isSmall = Math.abs(val) < 10;
  const formatted = isSmall
    ? `${val >= 0 ? '+' : ''}${val.toFixed(3)}%`
    : `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const pnl = isSmall ? null : val - 10000;
  return (
    <div style={{
      background: 'rgba(10, 7, 22, 0.97)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 10,
      padding: '9px 14px',
      fontSize: '0.79rem',
      color: '#f0eeff',
      lineHeight: 1.9,
      fontFamily: 'var(--font-inter, Inter, sans-serif)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: '#5c5c90', fontSize: '0.72rem', marginBottom: 3, fontWeight: 500 }}>{label}</div>
      <div style={{ fontWeight: 700, color: payload[0].stroke, fontVariantNumeric: 'tabular-nums' }}>
        Value: {formatted}
      </div>
      {pnl !== null && (
        <div style={{ fontWeight: 700, color: pnl >= 0 ? '#29dfc4' : '#ff5272', fontVariantNumeric: 'tabular-nums' }}>
          PNL: {pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      )}
    </div>
  );
};

const ChartCard: React.FC<ChartCardProps> = ({ data, color = '#f7931a' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted, #5c5c90)', fontSize: '0.86rem', fontWeight: 500 }}>
          Run a backtest to see the chart
        </span>
      </div>
    );
  }

  // Subsample for performance: show at most 300 points
  const maxPoints = 300;
  const step = data.length > maxPoints ? Math.ceil(data.length / maxPoints) : 1;
  const chartData = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  // For X-axis, show only a few labels
  const xTicks: string[] = [];
  const tickCount = 6;
  for (let i = 0; i < tickCount; i++) {
    const idx = Math.floor((i / (tickCount - 1)) * (chartData.length - 1));
    xTicks.push(chartData[idx]?.date);
  }

  return (
    <div className="chart-area">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.035)" vertical={false} />
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tick={{ fill: '#5c5c90', fontSize: 11, fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#5c5c90', fontSize: 11, fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
            axisLine={false}
            tickLine={false}
            width={60}
            tickFormatter={v =>
              Math.abs(v) >= 1000
                ? `$${(v / 1000).toFixed(0)}k`
                : `${v.toFixed(1)}`
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartCard;
