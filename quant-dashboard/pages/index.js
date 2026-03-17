
import Head from 'next/head';
import { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [symbol, setSymbol] = useState('AAPL');
  const [shortWindow, setShortWindow] = useState(20);
  const [longWindow, setLongWindow] = useState(50);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMetrics(null);
    try {
      const res = await axios.post('http://localhost:8000/backtest', {
        symbol,
        short_window: shortWindow,
        long_window: longWindow,
      });
      setMetrics(res.data);
    } catch (err) {
      setError('Error fetching data.');
    }
    setLoading(false);
  };

  const chartData = metrics
    ? metrics.dates.map((date, i) => ({ date, value: metrics.equity_curve[i] }))
    : [];

  return (
    <div className="dashboard-bg">
      <Head>
        <title>Quant Trading Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-title">monteCore</div>
          <nav className="sidebar-nav">
            <a className="nav-link active">Dashboard</a>
            <a className="nav-link">Analytics</a>
            <a className="nav-link">Trading</a>
            <a className="nav-link">Portfolio</a>
            <a className="nav-link">Settings</a>
          </nav>
        </aside>
        <main className="main-panel">
          <div className="topbar">
            <div className="search-bar">
              <input type="text" placeholder="Search Symbol..." value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} />
            </div>
            <div className="top-stats">
              <div className="stat-card">
                <div className="stat-label">Sharpe Ratio</div>
                <div className="stat-value green">{metrics ? metrics.sharpe.toFixed(2) : '--'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Max Drawdown</div>
                <div className="stat-value red">{metrics ? (metrics.drawdown * 100).toFixed(2) + '%' : '--'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Return</div>
                <div className="stat-value blue">{metrics ? (metrics.total_return * 100).toFixed(2) + '%' : '--'}</div>
              </div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-header">
              <div className="analytics-title">Portfolio Analytics</div>
              <form className="analytics-form" onSubmit={handleSubmit}>
                <input type="number" value={shortWindow} min={1} max={longWindow-1} onChange={e => setShortWindow(Number(e.target.value))} placeholder="Short MA" />
                <input type="number" value={longWindow} min={shortWindow+1} max={200} onChange={e => setLongWindow(Number(e.target.value))} placeholder="Long MA" />
                <button type="submit" disabled={loading}>{loading ? 'Running...' : 'Run'}</button>
              </form>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="analytics-body">
              <div className="portfolio-value">
                <span className="portfolio-label">Final Portfolio Value</span>
                <span className="portfolio-amount">{metrics ? '$' + metrics.equity_curve[metrics.equity_curve.length - 1].toLocaleString(undefined, {maximumFractionDigits: 0}) : '--'}</span>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#23272b" />
                    <XAxis dataKey="date" tick={{ fill: '#bbb', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#bbb', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#181c20', border: 'none', color: '#fff' }} labelStyle={{ color: '#00eaff' }} />
                    <Line type="monotone" dataKey="value" stroke="#00eaff" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>
      <style jsx global>{`
        body, html, #__next {
          height: 100%;
          margin: 0;
          padding: 0;
          background: #101114;
          color: #e0e0e0;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .dashboard-bg {
          min-height: 100vh;
          background: linear-gradient(120deg, #101114 60%, #1a1d22 100%);
        }
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 220px;
          background: #181c20ee;
          border-right: 1.5px solid #23272b;
          display: flex;
          flex-direction: column;
          padding: 32px 0 0 0;
          min-height: 100vh;
        }
        .sidebar-title {
          font-size: 1.5em;
          font-weight: bold;
          color: #00eaff;
          margin-bottom: 36px;
          text-align: center;
          letter-spacing: 1px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .nav-link {
          color: #b0b8c1;
          text-decoration: none;
          padding: 10px 32px;
          border-radius: 8px 0 0 8px;
          font-size: 1.08em;
          transition: background 0.2s, color 0.2s;
          cursor: pointer;
        }
        .nav-link.active, .nav-link:hover {
          background: #23272b;
          color: #00eaff;
        }
        .main-panel {
          flex: 1;
          padding: 48px 36px 36px 36px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .search-bar input {
          background: #23272b;
          color: #e0e0e0;
          border: 1.5px solid #23272b;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 1em;
          outline: none;
          min-width: 160px;
          transition: border 0.2s;
        }
        .search-bar input:focus {
          border: 1.5px solid #00eaff;
        }
        .top-stats {
          display: flex;
          gap: 18px;
        }
        .stat-card {
          background: #181c20;
          border-radius: 12px;
          box-shadow: 0 2px 8px #0004;
          padding: 18px 24px 12px 24px;
          min-width: 120px;
          text-align: center;
        }
        .stat-label {
          color: #b0b8c1;
          font-size: 0.98em;
          margin-bottom: 6px;
        }
        .stat-value {
          font-size: 1.35em;
          font-weight: bold;
        }
        .stat-value.green { color: #2ee59d; }
        .stat-value.red { color: #ff4d4f; }
        .stat-value.blue { color: #00eaff; }
        .analytics-card {
          background: #181c20ee;
          border-radius: 18px;
          box-shadow: 0 4px 32px 0 #000a, 0 1.5px 4px 0 #0004;
          padding: 32px 32px 24px 32px;
          max-width: 900px;
          margin: 0 auto;
        }
        .analytics-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .analytics-title {
          font-size: 1.3em;
          color: #00eaff;
          font-weight: bold;
        }
        .analytics-form {
          display: flex;
          gap: 10px;
        }
        .analytics-form input {
          background: #23272b;
          color: #e0e0e0;
          border: 1.5px solid #23272b;
          border-radius: 6px;
          padding: 7px 12px;
          font-size: 1em;
          outline: none;
          width: 90px;
          transition: border 0.2s;
        }
        .analytics-form input:focus {
          border: 1.5px solid #00eaff;
        }
        .analytics-form button {
          background: linear-gradient(90deg, #00eaff 0%, #005b7f 100%);
          color: #181c20;
          border: none;
          border-radius: 6px;
          padding: 7px 18px;
          font-weight: bold;
          font-size: 1em;
          cursor: pointer;
          box-shadow: 0 2px 8px #00eaff22;
          transition: background 0.2s, color 0.2s;
        }
        .analytics-form button:disabled {
          background: #222;
          color: #aaa;
          cursor: not-allowed;
        }
        .analytics-body {
          margin-top: 18px;
        }
        .portfolio-value {
          display: flex;
          align-items: baseline;
          gap: 18px;
          margin-bottom: 18px;
        }
        .portfolio-label {
          color: #b0b8c1;
          font-size: 1.08em;
        }
        .portfolio-amount {
          color: #2ee59d;
          font-size: 1.5em;
          font-weight: bold;
        }
        .chart-container {
          margin-top: 8px;
          background: #181c20;
          border-radius: 10px;
          padding: 16px 8px 8px 8px;
          box-shadow: 0 1px 6px #0004;
        }
        .error {
          color: #ff4d4f;
          text-align: center;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}
