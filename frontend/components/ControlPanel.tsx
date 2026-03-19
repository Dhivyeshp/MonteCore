import React, { useState } from 'react';
import { type BacktestParams } from '../lib/api';

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
  rsiPeriod: number;
  rsiOversold: number;
  rsiOverbought: number;
  bbWindow: number;
  bbNumStd: number;
  mrWindow: number;
  mrZThreshold: number;
  simulations: number;
  commission: number;
  slippage: number;
  onChange: (key: keyof BacktestParams, value: any) => void;
  onRun: () => void;
  onReset: () => void;
  loading?: boolean;
  metrics: Metrics;
};

const SIM_STEPS = [100, 500, 1000, 2000, 5000];

const STRATEGY_LABELS: Record<string, string> = {
  moving_average: 'Moving Average',
  rsi: 'RSI',
  bollinger_bands: 'Bollinger Bands',
  mean_reversion: 'Mean Reversion',
};

const ControlPanel: React.FC<RightPanelProps> = ({
  ticker,
  strategy,
  shortWindow,
  longWindow,
  rsiPeriod,
  rsiOversold,
  rsiOverbought,
  bbWindow,
  bbNumStd,
  mrWindow,
  mrZThreshold,
  simulations,
  commission,
  slippage,
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
          <div className="panel-stat-label">Strategy</div>
          <div className="panel-stat-value">{STRATEGY_LABELS[strategy] ?? strategy}</div>
        </div>
        <div className="panel-stat">
          <div className="panel-stat-label">Ticker</div>
          <div className="panel-stat-value teal">{ticker}</div>
        </div>
      </div>

      <div className="panel-divider" />

      {/* Available */}
      <div className="panel-available">
        <span>Strategy</span>
        <span className="panel-available-val">{STRATEGY_LABELS[strategy] ?? strategy}</span>
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
              <option value="rsi">RSI</option>
              <option value="bollinger_bands">Bollinger Bands</option>
              <option value="mean_reversion">Mean Reversion</option>
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

          {/* ── Strategy-specific params ── */}

          {strategy === 'moving_average' && (
            <>
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
              <div className="panel-info-row">
                <span>Long Window (SMA)</span>
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
            </>
          )}

          {strategy === 'rsi' && (
            <>
              <div className="panel-info-row">
                <span>RSI Period</span>
                <input
                  type="number"
                  className="panel-input"
                  style={{ width: 64, padding: '5px 8px', fontSize: '0.82rem' }}
                  value={rsiPeriod}
                  min={2}
                  max={50}
                  onChange={e => onChange('rsiPeriod', Number(e.target.value))}
                />
              </div>
              <div className="panel-info-row">
                <span>Oversold (buy &lt;)</span>
                <input
                  type="number"
                  className="panel-input"
                  style={{ width: 64, padding: '5px 8px', fontSize: '0.82rem' }}
                  value={rsiOversold}
                  min={10}
                  max={45}
                  onChange={e => onChange('rsiOversold', Number(e.target.value))}
                />
              </div>
              <div className="panel-info-row">
                <span>Overbought (sell &gt;)</span>
                <input
                  type="number"
                  className="panel-input"
                  style={{ width: 64, padding: '5px 8px', fontSize: '0.82rem' }}
                  value={rsiOverbought}
                  min={55}
                  max={90}
                  onChange={e => onChange('rsiOverbought', Number(e.target.value))}
                />
              </div>
            </>
          )}

          {strategy === 'bollinger_bands' && (
            <>
              <div className="panel-info-row">
                <span>BB Window</span>
                <input
                  type="number"
                  className="panel-input"
                  style={{ width: 64, padding: '5px 8px', fontSize: '0.82rem' }}
                  value={bbWindow}
                  min={5}
                  max={100}
                  onChange={e => onChange('bbWindow', Number(e.target.value))}
                />
              </div>
              <div className="panel-info-row">
                <span>Std Deviations</span>
                <input
                  type="number"
                  className="panel-input"
                  style={{ width: 64, padding: '5px 8px', fontSize: '0.82rem' }}
                  value={bbNumStd}
                  min={0.5}
                  max={4}
                  step={0.1}
                  onChange={e => onChange('bbNumStd', Number(e.target.value))}
                />
              </div>
            </>
          )}

          {strategy === 'mean_reversion' && (
            <>
              <div className="panel-info-row">
                <span>Rolling Window</span>
                <input
                  type="number"
                  className="panel-input"
                  style={{ width: 64, padding: '5px 8px', fontSize: '0.82rem' }}
                  value={mrWindow}
                  min={5}
                  max={100}
                  onChange={e => onChange('mrWindow', Number(e.target.value))}
                />
              </div>
              <div className="panel-info-row">
                <span>Z-Score Threshold</span>
                <input
                  type="number"
                  className="panel-input"
                  style={{ width: 64, padding: '5px 8px', fontSize: '0.82rem' }}
                  value={mrZThreshold}
                  min={0.5}
                  max={4}
                  step={0.1}
                  onChange={e => onChange('mrZThreshold', Number(e.target.value))}
                />
              </div>
            </>
          )}

          {/* Commission */}
          <div className="panel-info-row">
            <span>Commission</span>
            <input
              type="number"
              className="panel-input"
              style={{ width: 72, padding: '5px 8px', fontSize: '0.82rem' }}
              value={commission}
              min={0}
              max={0.05}
              step={0.0005}
              onChange={e => onChange('commission', Number(e.target.value))}
            />
          </div>
          <div className="panel-info-row" style={{ marginTop: -8 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>per trade, e.g. 0.001 = 0.1%</span>
          </div>

          {/* Slippage */}
          <div className="panel-info-row">
            <span>Slippage</span>
            <input
              type="number"
              className="panel-input"
              style={{ width: 72, padding: '5px 8px', fontSize: '0.82rem' }}
              value={slippage}
              min={0}
              max={0.05}
              step={0.0005}
              onChange={e => onChange('slippage', Number(e.target.value))}
            />
          </div>
          <div className="panel-info-row" style={{ marginTop: -8 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>price impact, e.g. 0.0005 = 0.05%</span>
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
            This quantitative trading platform backtests strategies on historical equity data
            and runs Monte Carlo simulations to model risk and uncertainty.
            <br /><br />
            Available strategies:
          </p>
          <div className="panel-contract">
            strategy::moving_average_crossover v1.0 · rsi v1.0 · bollinger_bands v1.0 · mean_reversion v1.0
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
