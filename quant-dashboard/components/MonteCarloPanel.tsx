import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

type SimScenario = {
  name: string;
  label: string;
  final_value: number;
  path: number[];
};

type SimCardsProps = {
  simulations: SimScenario[];
  onRun: () => void;
  loading: boolean;
  initialValue?: number;
};

const AVATAR_CLASS: Record<string, string> = {
  Optimistic: 'opt',
  Median: 'med',
  Conservative: 'con',
};

const AVATAR_INITIALS: Record<string, string> = {
  Optimistic: 'O',
  Median: 'M',
  Conservative: 'C',
};

const SPARKLINE_COLOR: Record<string, string> = {
  Optimistic: '#26d9c0',
  Median: '#f7931a',
  Conservative: '#ff5c7a',
};

const SimCard: React.FC<{ sim: SimScenario; initialValue: number }> = ({ sim, initialValue }) => {
  const pnl = sim.final_value - initialValue;
  const roi = ((sim.final_value - initialValue) / initialValue) * 100;
  const isPositive = pnl >= 0;
  const sparkData = sim.path.map((v, i) => ({ i, v }));
  const color = SPARKLINE_COLOR[sim.name] ?? '#26d9c0';

  return (
    <div className="sim-card">
      <div className="sim-card-top">
        <div className="sim-card-identity">
          <div className={`sim-card-avatar ${AVATAR_CLASS[sim.name] ?? 'opt'}`}>
            {AVATAR_INITIALS[sim.name] ?? sim.name[0]}
          </div>
          <div>
            <div className="sim-card-name">{sim.name}</div>
            <div className="sim-card-slots">{sim.label}</div>
          </div>
        </div>
        <span className="sim-card-star">☆</span>
      </div>

      <div>
        <div className={`sim-pnl ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
        <div className={`sim-roi ${isPositive ? 'positive' : 'negative'}`}>
          ROI {isPositive ? '+' : ''}{roi.toFixed(2)}%
        </div>
      </div>

      <div className="sim-sparkline">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="sim-metrics">
        <div>
          <span>Initial</span>
          <span className="sim-metric-val">${initialValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div>
          <span>Final</span>
          <span className="sim-metric-val">${sim.final_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div>
          <span>ROI</span>
          <span className="sim-metric-val" style={{ color: isPositive ? '#26d9c0' : '#ff5c7a' }}>
            {roi.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="sim-actions">
        <button className="btn-mock">Details</button>
        <button className="btn-copy">View</button>
      </div>
    </div>
  );
};

const MonteCarloPanel: React.FC<SimCardsProps> = ({
  simulations,
  onRun,
  loading,
  initialValue = 10000,
}) => (
  <div className="sim-section">
    <div className="sim-section-header">
      <span className="sim-section-title">Monte Carlo Simulations</span>
      <button className="sim-run-btn" onClick={onRun} disabled={loading}>
        {loading ? 'Running...' : 'Run'}
      </button>
    </div>
    {simulations && simulations.length > 0 ? (
      <div className="sim-cards">
        {simulations.map(sim => (
          <SimCard key={sim.name} sim={sim} initialValue={initialValue} />
        ))}
      </div>
    ) : (
      <div className="sim-empty">No simulations yet — run a backtest to generate Monte Carlo paths.</div>
    )}
  </div>
);

export default MonteCarloPanel;
