import React, { useState } from 'react';

type Params = {
  ticker: string;
  strategy: string;
  shortWindow: number;
  longWindow: number;
  simulations: number;
};

type Metrics = {
  portfolio_value: number;
  total_return: number;
  sharpe: number;
  drawdown: number;
};

type RightPanelProps = {
  ticker: string;
  strategy: string;
  shortWindow: number;
  longWindow: number;
  simulations: number;
  onChange: (key: keyof Params, value: any) => void;
  onRun: () => void;
  onReset: () => void;
  loading?: boolean;
  metrics: Metrics;
};

const SIM_STEPS = [100, 500, 1000, 2000, 5000];

const ControlPanel: React.FC<RightPanelProps> = ({
  ticker,
  strategy,
  shortWindow,
  longWindow,
  simulations,
  onChange,
  onRun,
  onReset,
  loading = false,
  metrics,
}) => {
  const [activeTab, setActiveTab] = useState<'run' | 'reset'>('run');
  const [aboutTab, setAboutTab] = useState<'about' | 'performance'>('about');

  const hasData = metrics.portfolio_value > 0;
  const simSliderVal = SIM_STEPS.indexOf(simulations) !== -1 ? SIM_STEPS.indexOf(simulations) : 2;

  return (
    <div className="right-panel">
      {/* Top tabs */}
      <div className="panel-tabs">
        <div
          className={`panel-tab ${activeTab === 'run' ? 'active' : ''}`}
          onClick={() => setActiveTab('run')}
        >
          RUN BACKTEST
        </div>
        <div
          className={`panel-tab ${activeTab === 'reset' ? 'active' : ''}`}
          onClick={() => setActiveTab('reset')}
        >
          RESET
        </div>
      </div>

      {/* Portfolio stats */}
      <div className="panel-stats">
        <div className="panel-stat">
          <div className="panel-stat-label">Short Window</div>
          <div className="panel-stat-value">{shortWindow} days</div>
        </div>
        <div className="panel-stat">
          <div className="panel-stat-label">Long Window</div>
          <div className="panel-stat-value teal">{longWindow} days</div>
        </div>
      </div>

      <div className="panel-divider" />

      {/* Available */}
      <div className="panel-available">
        <span>Strategy</span>
        <span className="panel-available-val">
          {strategy === 'moving_average' ? 'Moving Average' : strategy}
        </span>
      </div>

      {activeTab === 'run' ? (
        <>
          {/* Ticker */}
          <div className="panel-input-group">
            <div className="panel-input-label">Ticker</div>
            <select
              className="panel-select"
              value={ticker}
              onChange={e => onChange('ticker', e.target.value)}
            >
              <option value="SPY">SPY</option>
              <option value="AAPL">AAPL</option>
              <option value="MSFT">MSFT</option>
              <option value="NVDA">NVDA</option>
              <option value="TSLA">TSLA</option>
            </select>
          </div>

          {/* Strategy */}
          <div className="panel-input-group">
            <div className="panel-input-label">Strategy</div>
            <select
              className="panel-select"
              value={strategy}
              onChange={e => onChange('strategy', e.target.value)}
            >
              <option value="moving_average">Moving Average</option>
            </select>
          </div>

          {/* Simulations slider */}
          <div className="period-section">
            <div className="period-header">
              <span className="period-label">Simulations</span>
              <span className="period-value">{simulations.toLocaleString()}</span>
            </div>
            <input
              type="range"
              className="period-slider"
              min={0}
              max={SIM_STEPS.length - 1}
              value={simSliderVal >= 0 ? simSliderVal : 2}
              onChange={e => onChange('simulations', SIM_STEPS[Number(e.target.value)])}
            />
            <div className="period-ticks">
              {SIM_STEPS.map(s => <span key={s}>{s >= 1000 ? `${s / 1000}k` : s}</span>)}
            </div>
          </div>

          {/* Short window */}
          <div className="panel-info-row">
            <span>Short Window (SMA)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                className="panel-input"
                style={{ width: 64, padding: '5px 8px', fontSize: '0.82rem' }}
                value={shortWindow}
                min={1}
                max={longWindow - 1}
                onChange={e => onChange('shortWindow', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Long window */}
          <div className="panel-info-row">
            <span>Long Window (SMA)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                className="panel-input"
                style={{ width: 64, padding: '5px 8px', fontSize: '0.82rem' }}
                value={longWindow}
                min={shortWindow + 1}
                max={200}
                onChange={e => onChange('longWindow', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="panel-divider" />

          {/* Result metrics */}
          <div className="panel-info-row">
            <span>Sharpe Ratio</span>
            <span className={`panel-info-val ${hasData ? '' : 'dim'}`}>
              {hasData ? metrics.sharpe.toFixed(2) : '--'}
            </span>
          </div>
          <div className="panel-info-row">
            <span>You Will Get</span>
            <span className={`panel-info-val ${hasData ? 'teal' : 'dim'}`}>
              {hasData
                ? `${(metrics.total_return * 100).toFixed(2)}% return`
                : '-- %'}
            </span>
          </div>

          {/* Run button */}
          <button className="run-backtest-btn" onClick={onRun} disabled={loading}>
            {loading ? 'Running...' : 'Run Backtest'}
          </button>
        </>
      ) : (
        <>
          <p className="reset-description">
            Clear all backtest results and reset the dashboard to its initial state.
          </p>
          <button className="reset-btn" onClick={onReset}>
            Reset Dashboard
          </button>
        </>
      )}

      <div className="panel-divider" />

      {/* About / Performance tabs */}
      <div className="about-tabs">
        <div
          className={`about-tab ${aboutTab === 'about' ? 'active' : ''}`}
          onClick={() => setAboutTab('about')}
        >
          About
        </div>
        <div
          className={`about-tab ${aboutTab === 'performance' ? 'active' : ''}`}
          onClick={() => setAboutTab('performance')}
        >
          Performance
        </div>
      </div>

      {aboutTab === 'about' ? (
        <>
          <div className="panel-leader">
            <div className="leader-avatar">M</div>
            <div>
              <div className="leader-name">monteCore</div>
              <div className="leader-handle">@quant</div>
            </div>
          </div>
          <p className="panel-description">
            This quantitative trading platform backtests moving average crossover strategies
            on historical equity data. It performs Monte Carlo simulations to model risk
            and uncertainty, and accrues performance metrics including Sharpe ratio and
            maximum drawdown.
            <br /><br />
            The platform uses the following strategies as components:
          </p>
          <div className="panel-contract">
            strategy::moving_average_crossover v1.0 · bootstrap_mc_simulation v1.0
          </div>
        </>
      ) : (
        <>
          <div className="panel-info-row">
            <span>Portfolio Value</span>
            <span className={`panel-info-val ${hasData ? 'teal' : 'dim'}`}>
              {hasData ? `$${metrics.portfolio_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '--'}
            </span>
          </div>
          <div className="panel-info-row">
            <span>Total Return</span>
            <span className={`panel-info-val ${hasData ? (metrics.total_return >= 0 ? 'teal' : '') : 'dim'}`}
                  style={hasData && metrics.total_return < 0 ? { color: '#ff5c7a' } : {}}>
              {hasData ? `${(metrics.total_return * 100).toFixed(2)}%` : '--'}
            </span>
          </div>
          <div className="panel-info-row">
            <span>Sharpe Ratio</span>
            <span className={`panel-info-val ${hasData ? '' : 'dim'}`}>
              {hasData ? metrics.sharpe.toFixed(2) : '--'}
            </span>
          </div>
          <div className="panel-info-row">
            <span>Max Drawdown</span>
            <span className="panel-info-val" style={hasData ? { color: '#ff5c7a' } : {}}>
              {hasData ? `${(metrics.drawdown * 100).toFixed(2)}%` : '--'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default ControlPanel;
