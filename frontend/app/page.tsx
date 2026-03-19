"use client";
import { useState, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import MetricsBar from '../components/MetricsBar';
import ControlPanel from '../components/ControlPanel';
import ChartCard from '../components/ChartCard';
import MonteCarloPanel from '../components/MonteCarloPanel';
import MonteCarloChart from '../components/MonteCarloChart';
import { runBacktest, runSimulate, type BacktestParams } from '../lib/api';

// Stages: 100 → 500 → 1000 → 5000
const MC_STAGES = [500, 1000, 5000] as const;

type Metrics = {
  portfolio_value: number;
  total_return: number;
  sharpe: number;
  drawdown: number;
  var_95: number;
  var_99: number;
};

const defaultMetrics: Metrics = {
  portfolio_value: 0,
  total_return: 0,
  sharpe: 0,
  drawdown: 0,
  var_95: 0,
  var_99: 0,
};

type Params = BacktestParams;

export default function DashboardPage() {
  const [metrics, setMetrics]           = useState<Metrics>(defaultMetrics);
  const [equityCurve, setEquityCurve]   = useState<{ date: string; value: number }[]>([]);
  const [returns, setReturns]           = useState<{ date: string; value: number }[]>([]);
  const [simulations, setSimulations]   = useState<any[]>([]);
  const [mcPaths, setMcPaths]           = useState<number[][]>([]);
  const [mcFinalValues, setMcFinalValues] = useState<number[]>([]);
  const [mcSimCount, setMcSimCount]     = useState(0);
  const [dates, setDates]               = useState<string[]>([]);
  const [loading, setLoading]           = useState(false);
  const [simStage, setSimStage]         = useState<number | null>(null);
  const [chartTab, setChartTab]         = useState<'equity' | 'returns'>('equity');

  // Abort controller ref — cancel in-progress run when a new one starts
  const abortRef = useRef<AbortController | null>(null);

  const [form, setForm] = useState<Params>({
    ticker: 'AAPL',
    strategy: 'moving_average',
    shortWindow: 20,
    longWindow: 50,
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70,
    bbWindow: 20,
    bbNumStd: 2.0,
    mrWindow: 20,
    mrZThreshold: 1.5,
    simulations: 1000,
    commission: 0.001,
    slippage: 0.0005,
  });

  const handleChange = (key: keyof Params, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const applyMcResult = useCallback((result: any) => {
    setMcPaths(result.paths         ?? []);
    setMcFinalValues(result.final_values ?? []);
    setMcSimCount(result.simulation_count ?? 0);
    setSimulations(result.monte_carlo ?? []);
    setMetrics(prev => ({
      ...prev,
      var_95: result.var_95 ?? prev.var_95,
      var_99: result.var_99 ?? prev.var_99,
    }));
  }, []);

  const handleRun = async (params: Params) => {
    // Cancel any previous in-progress run
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const sig = controller.signal;

    setLoading(true);
    setSimStage(100);

    // ── Stage 1: full backtest + 100 MC sims ──────────────────
    try {
      const result = await runBacktest(params, sig);
      if (sig.aborted) return;

      const rawEquity: number[] = result.equity_curve ?? [];
      const rawDates:  string[] = result.dates         ?? [];

      setMetrics({
        portfolio_value: rawEquity[rawEquity.length - 1] ?? 0,
        total_return:    result.total_return ?? 0,
        sharpe:          result.sharpe       ?? 0,
        drawdown:        result.drawdown     ?? 0,
        var_95:          result.var_95       ?? 0,
        var_99:          result.var_99       ?? 0,
      });
      setEquityCurve(rawEquity.map((v, i) => ({ date: rawDates[i] ?? '', value: Math.round(v) })));
      setReturns(rawEquity.map((v, i) => ({
        date: rawDates[i] ?? '',
        value: i === 0 ? 0 : parseFloat((((v - rawEquity[i - 1]) / rawEquity[i - 1]) * 100).toFixed(4)),
      })));
      setDates(rawDates);
      applyMcResult(result);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      alert('Backtest failed: ' + (e?.message ?? 'Unknown error'));
      setLoading(false);
      setSimStage(null);
      return;
    }

    // ── Stages 2–4: progressive MC refinement (capped by params.simulations) ──
    for (const n of MC_STAGES.filter(n => n <= params.simulations)) {
      if (sig.aborted) break;
      setSimStage(n);
      try {
        const result = await runSimulate(params, n, sig);
        if (!sig.aborted) applyMcResult(result);
      } catch (e: any) {
        if (e?.name === 'AbortError') break;
        // non-fatal: stop further stages but don't alert
        console.error(`MC stage ${n} failed:`, e);
        break;
      }
    }

    if (!sig.aborted) {
      setLoading(false);
      setSimStage(null);
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setMetrics(defaultMetrics);
    setEquityCurve([]);
    setReturns([]);
    setSimulations([]);
    setMcPaths([]);
    setMcFinalValues([]);
    setMcSimCount(0);
    setDates([]);
    setLoading(false);
    setSimStage(null);
  };

  const chartData  = chartTab === 'equity' ? equityCurve : returns;
  const chartColor = chartTab === 'equity' ? '#f7931a' : '#26d9c0';
  const hasData    = metrics.portfolio_value > 0;

  // Stage label shown in epoch bar
  const stageLabel = simStage !== null
    ? `Simulating… ${simStage.toLocaleString()} paths`
    : dates.length > 0
      ? `${dates.length} trading days · ${mcSimCount.toLocaleString()} sims`
      : 'Ready to run';

  return (
    <div className="app-root">
      <Sidebar
        ticker={form.ticker}
        portfolioValue={metrics.portfolio_value}
        onRun={() => handleRun(form)}
        loading={loading}
      />

      <MetricsBar metrics={metrics} simCount={mcSimCount} />

      <div className="main-content">
        <div className="left-content">

          {/* Backtest info bar */}
          <div className="epoch-bar">
            <div>
              <div className="epoch-heading">monteCore</div>
            </div>
            <div className="epoch-block">
              <div className="epoch-sub-label">Current Backtest</div>
              <div className="epoch-name">
                {form.ticker} — {
                form.strategy === 'moving_average' ? 'Moving Average' :
                form.strategy === 'rsi' ? 'RSI' :
                form.strategy === 'bollinger_bands' ? 'Bollinger Bands' :
                form.strategy === 'mean_reversion' ? 'Mean Reversion' :
                form.strategy
              }
              </div>
            </div>
            <div className="epoch-progress-wrap">
              {dates.length > 0 && (
                <div className="epoch-dates">
                  <span>{dates[0]}</span>
                  <span>{dates[dates.length - 1]}</span>
                </div>
              )}
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: dates.length > 0 ? '100%' : '0%' }} />
              </div>
            </div>
            <div className="epoch-right-info">
              {loading && simStage !== null && (
                <span className="sim-stage-pulse" />
              )}
              {stageLabel}
            </div>
          </div>

          {/* Equity curve / Returns chart */}
          <div className="chart-section">
            <div className="chart-header">
              <div className="chart-header-left">
                <div className="chart-tabs">
                  <div className={`chart-tab ${chartTab === 'equity' ? 'active' : ''}`} onClick={() => setChartTab('equity')}>
                    Equity Curve
                  </div>
                  <div className={`chart-tab ${chartTab === 'returns' ? 'active' : ''}`} onClick={() => setChartTab('returns')}>
                    Returns
                  </div>
                </div>
                {hasData && (
                  <div className="chart-allocation">
                    <span>Return: <span className="alloc-val">{(metrics.total_return * 100).toFixed(1)}%</span></span>
                    <span>Sharpe: <span className="alloc-val">{metrics.sharpe.toFixed(2)}</span></span>
                    <span>MDD: <span className="alloc-val">{(metrics.drawdown * 100).toFixed(1)}%</span></span>
                  </div>
                )}
              </div>
              <select className="chart-time-select" defaultValue="all">
                <option value="all">All time</option>
              </select>
            </div>
            <ChartCard title="" data={chartData} color={chartColor} />
          </div>

          {/* Monte Carlo multi-path + histogram chart */}
          <MonteCarloChart
            paths={mcPaths}
            finalValues={mcFinalValues}
            simulationCount={mcSimCount}
            initialValue={10000}
            isLoading={loading && simStage !== null}
            simStage={simStage}
          />

          {/* Scenario cards (Optimistic / Median / Conservative) */}
          <MonteCarloPanel
            simulations={simulations}
            onRun={() => handleRun(form)}
            loading={loading}
            initialValue={10000}
          />

        </div>

        <ControlPanel
          ticker={form.ticker}
          strategy={form.strategy}
          shortWindow={form.shortWindow}
          longWindow={form.longWindow}
          rsiPeriod={form.rsiPeriod}
          rsiOversold={form.rsiOversold}
          rsiOverbought={form.rsiOverbought}
          bbWindow={form.bbWindow}
          bbNumStd={form.bbNumStd}
          mrWindow={form.mrWindow}
          mrZThreshold={form.mrZThreshold}
          simulations={form.simulations}
          commission={form.commission}
          slippage={form.slippage}
          onChange={handleChange}
          onRun={() => handleRun(form)}
          onReset={handleReset}
          loading={loading}
          metrics={metrics}
        />
      </div>
    </div>
  );
}
