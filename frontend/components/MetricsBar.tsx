import React from 'react';

type Metrics = {
  portfolio_value: number;
  total_return: number;
  sharpe: number;
  drawdown: number;
  var_95: number;
  var_99: number;
};

type StatsBarProps = {
  metrics: Metrics;
  simCount: number;
};

const MetricsBar: React.FC<StatsBarProps> = ({ metrics, simCount }) => {
  const hasData = metrics.portfolio_value > 0;
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <div className="stat-label">Portfolio Value</div>
        <div className={`stat-value ${hasData ? 'teal' : 'dim'}`}>
          {hasData ? `$${metrics.portfolio_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '--'}
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Total Return</div>
        <div className={`stat-value ${!hasData ? 'dim' : metrics.total_return >= 0 ? 'teal' : 'red'}`}>
          {hasData ? `${(metrics.total_return * 100).toFixed(2)}%` : '--'}
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Sharpe Ratio</div>
        <div className={`stat-value ${hasData ? '' : 'dim'}`}>
          {hasData ? metrics.sharpe.toFixed(2) : '--'}
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Max Drawdown</div>
        <div className={`stat-value ${hasData ? 'red' : 'dim'}`}>
          {hasData ? `${(metrics.drawdown * 100).toFixed(2)}%` : '--'}
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-label">VaR 95%</div>
        <div className={`stat-value ${hasData ? 'red' : 'dim'}`}>
          {hasData ? `$${metrics.var_95.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '--'}
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-label">VaR 99%</div>
        <div className={`stat-value ${hasData ? 'red' : 'dim'}`}>
          {hasData ? `$${metrics.var_99.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '--'}
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Simulations Run</div>
        <div className={`stat-value ${simCount > 0 ? 'teal' : 'dim'}`}>
          {simCount > 0 ? simCount.toLocaleString() : '--'}
        </div>
      </div>
    </div>
  );
};

export default MetricsBar;
