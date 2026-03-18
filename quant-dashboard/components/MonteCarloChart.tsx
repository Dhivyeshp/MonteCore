"use client";
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

type Props = {
  paths: number[][];
  finalValues: number[];
  simulationCount: number;
  initialValue?: number;
  isLoading?: boolean;
  simStage?: number | null;
};

// ── Helpers ────────────────────────────────────────────────

function computeMedianPath(paths: number[][]): number[] {
  if (!paths.length) return [];
  return Array.from({ length: paths[0].length }, (_, i) => {
    const vals = paths.map(p => p[i]).sort((a, b) => a - b);
    return vals[Math.floor(vals.length / 2)];
  });
}

function buildHistogram(finalValues: number[], initialValue: number, bins = 50) {
  if (!finalValues.length) return [];
  const returns = finalValues.map(v => ((v - initialValue) / initialValue) * 100);
  const min = Math.min(...returns);
  const max = Math.max(...returns);
  const binSize = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  returns.forEach(r => {
    const idx = Math.min(Math.floor((r - min) / binSize), bins - 1);
    counts[idx]++;
  });
  return counts.map((count, i) => ({
    ret: parseFloat((min + (i + 0.5) * binSize).toFixed(1)),
    label: `${(min + i * binSize) >= 0 ? '+' : ''}${(min + i * binSize).toFixed(0)}%`,
    count,
    isPositive: min + (i + 0.5) * binSize >= 0,
  }));
}

// ── SVG Paths Chart ─────────────────────────────────────────

function PathsChart({
  paths,
  width,
  height,
}: {
  paths: number[][];
  width: number;
  height: number;
}) {
  if (!paths.length || width < 10 || height < 10) return null;

  const median = computeMedianPath(paths);
  const allValues = [...paths.flat(), ...median];
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const range = maxV - minV || 1;
  const n = paths[0].length;

  const PAD = { top: 16, right: 16, bottom: 32, left: 62 };
  const cw = width  - PAD.left - PAD.right;
  const ch = height - PAD.top  - PAD.bottom;

  const toX = (i: number) => PAD.left + (i / (n - 1)) * cw;
  const toY = (v: number) => PAD.top  + (1 - (v - minV) / range) * ch;
  const toD  = (pts: number[]) =>
    pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join('');

  const yTicks   = Array.from({ length: 5 }, (_, i) => minV + (i / 4) * range);
  const xTickIdx = [0, 0.25, 0.5, 0.75, 1.0].map(t => Math.round(t * (n - 1)));

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* Horizontal grid */}
      {yTicks.map((v, i) => (
        <line key={i}
          x1={PAD.left} y1={toY(v)} x2={PAD.left + cw} y2={toY(v)}
          stroke="rgba(255,255,255,0.035)" strokeWidth={1}
        />
      ))}

      {/* 150 faded simulation paths */}
      {paths.map((pts, i) => (
        <path key={i} d={toD(pts)}
          stroke="#f7931a" strokeWidth={0.65} opacity={0.13} fill="none"
        />
      ))}

      {/* Bold median path */}
      <path d={toD(median)}
        stroke="#f7931a" strokeWidth={2.5} opacity={1} fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Axes */}
      <line x1={PAD.left}        y1={PAD.top}       x2={PAD.left}        y2={PAD.top + ch} stroke="rgba(255,255,255,0.07)" />
      <line x1={PAD.left}        y1={PAD.top + ch}  x2={PAD.left + cw}   y2={PAD.top + ch} stroke="rgba(255,255,255,0.07)" />

      {/* Y-axis labels */}
      {yTicks.map((v, i) => (
        <text key={i} x={PAD.left - 8} y={toY(v) + 4}
          textAnchor="end" fill="#5c5c90" fontSize={10}
          fontFamily="Inter, system-ui, sans-serif">
          ${(v / 1000).toFixed(1)}k
        </text>
      ))}

      {/* X-axis labels */}
      {xTickIdx.map((idx, i) => (
        <text key={i} x={toX(idx)} y={PAD.top + ch + 18}
          textAnchor="middle" fill="#5c5c90" fontSize={10}
          fontFamily="Inter, system-ui, sans-serif">
          Day {Math.round((idx / (n - 1)) * 252)}
        </text>
      ))}

      {/* Legend */}
      <line x1={PAD.left + 8}   y1={PAD.top + 12} x2={PAD.left + 22} y2={PAD.top + 12} stroke="#f7931a" strokeWidth={0.8} opacity={0.45} />
      <text x={PAD.left + 26}   y={PAD.top + 16} fill="#6868a0" fontSize={9.5} fontFamily="Inter, system-ui, sans-serif">Simulated paths</text>
      <line x1={PAD.left + 118} y1={PAD.top + 12} x2={PAD.left + 132} y2={PAD.top + 12} stroke="#f7931a" strokeWidth={2.5} />
      <text x={PAD.left + 136}  y={PAD.top + 16} fill="#6868a0" fontSize={9.5} fontFamily="Inter, system-ui, sans-serif">Median</text>
    </svg>
  );
}

// ── Histogram Tooltip ───────────────────────────────────────

function HistogramTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'rgba(10,7,22,0.97)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: '0.78rem',
      color: '#f0eeff',
      fontFamily: 'Inter, system-ui, sans-serif',
      lineHeight: 1.8,
    }}>
      <div style={{ color: '#5c5c90', fontSize: '0.72rem' }}>
        Return: {d.ret >= 0 ? '+' : ''}{d.ret.toFixed(1)}%
      </div>
      <div style={{ fontWeight: 700 }}>Simulations: {d.count}</div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

const STAGES = [100, 500, 1000, 5000];

export default function MonteCarloChart({
  paths,
  finalValues,
  simulationCount,
  initialValue = 10000,
  isLoading = false,
  simStage = null,
}: Props) {
  const [tab, setTab] = useState<'paths' | 'distribution'>('paths');
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      setSize({
        width:  containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, []);

  useEffect(() => {
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateSize]);

  const histData    = buildHistogram(finalValues, initialValue);
  const sorted      = [...finalValues].sort((a, b) => a - b);
  const mean        = finalValues.length
    ? finalValues.reduce((s, v) => s + v, 0) / finalValues.length
    : 0;
  const median      = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const best95      = sorted[Math.floor(0.95 * sorted.length)] ?? 0;
  const worst5      = sorted[Math.floor(0.05 * sorted.length)]  ?? 0;
  const isEmpty     = !paths.length && !finalValues.length;

  return (
    <div className="mc-chart-card">

      {/* Header */}
      <div className="mc-chart-header">
        <div>
          <div className="mc-chart-title">Monte Carlo Simulation</div>
          {(!isEmpty || isLoading) && (
            <div className="mc-chart-subtitle">
              {isLoading && simStage !== null
                ? `Simulating ${simStage.toLocaleString()} paths…`
                : `${simulationCount.toLocaleString()} paths · 252-day horizon`}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Stage progress dots */}
          <div className="mc-stage-dots">
            {STAGES.map(s => {
              const done    = simulationCount >= s;
              const active  = isLoading && simStage === s;
              return (
                <div key={s} className={`mc-stage-dot ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                  <span>{s >= 1000 ? `${s / 1000}k` : s}</span>
                </div>
              );
            })}
          </div>
        <div className="chart-tabs">
          <div
            className={`chart-tab ${tab === 'paths' ? 'active' : ''}`}
            onClick={() => setTab('paths')}
          >
            Paths
          </div>
          <div
            className={`chart-tab ${tab === 'distribution' ? 'active' : ''}`}
            onClick={() => setTab('distribution')}
          >
            Distribution
          </div>
        </div>
        </div>
      </div>

      {/* Stats row */}
      {!isEmpty && (
        <div className="mc-stats-row">
          <div className="mc-stat">
            <span className="mc-stat-label">Mean</span>
            <span className="mc-stat-val">
              ${mean.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mc-stat">
            <span className="mc-stat-label">Median</span>
            <span className="mc-stat-val">
              ${median.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mc-stat">
            <span className="mc-stat-label">Best 95th</span>
            <span className="mc-stat-val teal">
              ${best95.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mc-stat">
            <span className="mc-stat-label">Worst 5th</span>
            <span className="mc-stat-val red">
              ${worst5.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

      {/* Chart area */}
      <div className="mc-chart-area" ref={containerRef}>
        {isEmpty ? (
          <div className="mc-chart-empty">
            Run a backtest to generate Monte Carlo paths
          </div>
        ) : tab === 'paths' ? (
          <PathsChart paths={paths} width={size.width} height={size.height} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={histData}
              margin={{ top: 10, right: 16, left: 0, bottom: 24 }}
              barCategoryGap="2%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.035)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: '#5c5c90', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(histData.length / 7)}
              />
              <YAxis
                tick={{ fill: '#5c5c90', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<HistogramTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {histData.map((d, i) => (
                  <Cell key={i} fill={d.isPositive ? '#29dfc4' : '#ff5272'} opacity={0.78} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
