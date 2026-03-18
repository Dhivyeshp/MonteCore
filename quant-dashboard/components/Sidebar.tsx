import React from 'react';

type NavbarProps = {
  ticker: string;
  portfolioValue: number;
  onRun: () => void;
  loading: boolean;
};

const Sidebar: React.FC<NavbarProps> = ({ ticker, portfolioValue, onRun, loading }) => (
  <nav className="navbar">
    <div className="navbar-left">
      <div className="navbar-logo">
        <span className="logo-dot" />
        monteCore
      </div>
      <div className="navbar-nav">
        <a className="nav-item active">Dashboard</a>
        <a className="nav-item">Strategies</a>
        <a className="nav-item">🔥 Simulations</a>
        <a className="nav-item">Settings</a>
        <a className="nav-item">More ▾</a>
      </div>
    </div>
    <div className="navbar-right">
      {portfolioValue > 0 && (
        <span className="navbar-value">${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      )}
      <div className="navbar-tag">
        <span>📈</span>
        <span>{ticker}</span>
      </div>
      <button className="navbar-btn" onClick={onRun} disabled={loading}>
        {loading ? 'Running...' : 'Faucet'}
      </button>
    </div>
  </nav>
);

export default Sidebar;
