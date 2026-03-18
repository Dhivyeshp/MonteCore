"use client";
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MetricsBar from '../components/MetricsBar';
import ControlPanel from '../components/ControlPanel';
import ChartCard from '../components/ChartCard';
import MonteCarloPanel from '../components/MonteCarloPanel';
import { runBacktest } from '../lib/api';

type Metrics = {
  portfolio_value: number;
  total_return: number;
  sharpe: number;
  drawdown: number;
};

const defaultMetrics: Metrics = {
  portfolio_value: 0,
  total_return: 0,
  sharpe: 0,
  drawdown: 0,
};

type Params = {
  ticker: string;
  strategy: string;
  shortWindow: number;
  longWindow: number;
  simulations: number;
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics>(defaultMetrics);
  const [equityCurve, setEquityCurve] = useState<{ date: string; value: number }[]>([]);
  const [returns, setReturns] = useState<{ date: string; value: number }[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartTab, setChartTab] = useState<'equity' | 'returns'>('equity');

  const [form, setForm] = useState<Params>({
    ticker: 'AAPL',
    strategy: 'moving_average',
    shortWindow: 20,
    longWindow: 50,
    simulations: 1000,
  });

  const handleChange = (key: keyof Params, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleRun = async (params: Params) => {
    setLoading(true);
    try {
      const result = await runBacktest(params);

      const rawEquity: number[] = result.equity_curve || [];
      const rawDates: string[] = result.dates || [];

      const equityData = rawEquity.map((v: number, i: number) => ({
        date: rawDates[i] ?? '',
        value: Math.round(v),
      }));

      const returnsData = rawEquity.map((v: number, i: number) => ({
        date: rawDates[i] ?? '',
        value: i === 0 ? 0 : parseFloat(
          (((v - rawEquity[i - 1]) / rawEquity[i - 1]) * 100).toFixed(4)
        ),
      }));

      setMetrics({
        portfolio_value: rawEquity[rawEquity.length - 1] ?? 0,
        total_return: result.total_return ?? 0,
        sharpe: result.sharpe ?? 0,
        drawdown: result.drawdown ?? 0,
      });
      setEquityCurve(equityData);
      setReturns(returnsData);
      setDates(rawDates);
      setSimulations(result.monte_carlo || []);
    } catch (e: any) {
      alert('Backtest failed: ' + (e?.message ?? 'Unknown error'));
    }
    setLoading(false);
  };

  const handleReset = () => {
    setMetrics(defaultMetrics);
    setEquityCurve([]);
    setReturns([]);
    setSimulations([]);
    setDates([]);
  };

  const chartData = chartTab === 'equity' ? equityCurve : returns;
  const chartColor = chartTab === 'equity' ? '#f7931a' : '#26d9c0';
  const hasData = metrics.portfolio_value > 0;

  return (
    <div className="app-root">
      {/* Navbar */}
      <Sidebar
        ticker={form.ticker}
        portfolioValue={metrics.portfolio_value}
        onRun={() => handleRun(form)}
        loading={loading}
      />

      {/* Stats bar */}
      <MetricsBar metrics={metrics} simCount={simulations.length} />

      {/* Main content */}
      <div className="main-content">
        <div className="left-content">

          {/* Current Backtest info bar */}
          <div className="epoch-bar">
            <div>
              <div className="epoch-heading">monteCore</div>
            </div>
            <div className="epoch-block">
              <div className="epoch-sub-label">Current Backtest</div>
              <div className="epoch-name">
                {form.ticker} — {form.strategy === 'moving_average' ? 'Moving Average' : form.strategy}
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
                <div
                  className="progress-bar-fill"
                  style={{ width: dates.length > 0 ? '100%' : '0%' }}
                />
              </div>
            </div>
            <div className="epoch-right-info">
              {dates.length > 0
                ? `${dates.length} trading days analyzed`
                : 'Ready to run'}
            </div>
          </div>

          {/* Chart section */}
          <div className="chart-section">
            <div className="chart-header">
              <div className="chart-header-left">
                <div className="chart-tabs">
                  <div
                    className={`chart-tab ${chartTab === 'equity' ? 'active' : ''}`}
                    onClick={() => setChartTab('equity')}
                  >
                    Equity Curve
                  </div>
                  <div
                    className={`chart-tab ${chartTab === 'returns' ? 'active' : ''}`}
                    onClick={() => setChartTab('returns')}
                  >
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

          {/* Monte Carlo simulation cards */}
          <MonteCarloPanel
            simulations={simulations}
            onRun={() => handleRun(form)}
            loading={loading}
            initialValue={10000}
          />

        </div>

        {/* Right panel */}
        <ControlPanel
          ticker={form.ticker}
          strategy={form.strategy}
          shortWindow={form.shortWindow}
          longWindow={form.longWindow}
          simulations={form.simulations}
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
