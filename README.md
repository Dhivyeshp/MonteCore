# monteCore — Quant Trading Backtesting + Monte Carlo Engine

## Overview

A full-stack quantitative trading platform that backtests moving average strategies on historical equity data, evaluates risk-adjusted performance, and runs progressive Monte Carlo simulations to model uncertainty.

**Stack:** Python (FastAPI) · Next.js 16 · TypeScript · Recharts · yfinance · NumPy/Pandas

---

## Features

### 1. Backtesting Engine
- Load historical OHLCV data via `yfinance` (auto-fetched and cached to CSV)
- Moving average crossover strategy with configurable short/long windows
- Simulates positions, daily returns, and portfolio equity curve from $10,000
- **Transaction costs:** commission + slippage deducted on every position change

### 2. Performance Metrics
- Total return
- Sharpe ratio (annualized, 252 trading days)
- Maximum drawdown
- Full equity curve + daily returns

### 3. Monte Carlo Simulation
- Vectorized bootstrap resampling of historical strategy returns
- Progressive simulation: 100 → 500 → 1,000 → 5,000 paths
- **VaR 95% and VaR 99%** — worst-case portfolio value at each confidence level
- Scenario cards: Optimistic (90th pct), Median (50th pct), Conservative (10th pct)

### 4. Web Dashboard (Next.js + FastAPI)
- Voltrex-inspired dark UI with purple radial gradient background
- **Navbar** with live portfolio value and ticker
- **Stats bar:** Portfolio Value · Total Return · Sharpe · Max Drawdown · VaR 95% · VaR 99% · Simulations Run
- **Equity Curve / Returns chart** — tabbed, orange line chart
- **Monte Carlo chart** — two tabs:
  - *Paths:* 150 faded simulation lines + bold median (pure SVG)
  - *Distribution:* histogram of final returns (teal = positive, red = negative)
- **Right panel:** Deposit-style controls for ticker, strategy, windows, commission, slippage, simulation count
- **Progressive simulation UI:** stage dots pulse 100 → 500k → 1k → 5k as paths fill in live

---

## Project Structure

```
quant-project/
│
├── backend/                       # Python — deploy to Railway / Render / Fly.io
│   ├── main.py                    # FastAPI server — /backtest and /simulate
│   ├── main_standalone.py         # Standalone CLI with matplotlib output
│   ├── requirements.txt           # pip dependencies
│   ├── Procfile                   # Start command for Railway/Heroku
│   ├── .env.example               # ALLOWED_ORIGINS env var template
│   ├── data/
│   │   └── data_loader.py         # yfinance fetch + CSV cache (auto-downloads)
│   ├── strategies/
│   │   └── moving_average.py      # SMA crossover signal generation
│   ├── engine/
│   │   └── backtester.py          # Position simulation + commission/slippage
│   ├── metrics/
│   │   └── performance.py         # Sharpe, drawdown, total return
│   └── monte_carlo/
│       └── simulator.py           # Vectorized bootstrap MC (numpy matrix ops)
│
├── frontend/                      # Next.js — deploy to Vercel
│   ├── .env.local.example         # NEXT_PUBLIC_API_URL template
│   ├── app/
│   │   ├── page.tsx               # Main dashboard — progressive simulation logic
│   │   ├── layout.tsx             # Root layout with Inter font
│   │   └── globals.css            # Full dark theme (Voltrex-inspired)
│   ├── components/
│   │   ├── Sidebar.tsx            # Navbar
│   │   ├── MetricsBar.tsx         # Stats bar (7 metrics)
│   │   ├── ControlPanel.tsx       # Right panel (run/reset + all params)
│   │   ├── ChartCard.tsx          # Equity/returns line chart
│   │   ├── MonteCarloChart.tsx    # Multi-path SVG chart + histogram
│   │   └── MonteCarloPanel.tsx    # Scenario cards
│   └── lib/
│       └── api.ts                 # runBacktest() + runSimulate() with AbortSignal
│
├── .gitignore
└── README.md
```

---

## API Endpoints

### `POST /backtest`
Full backtest + initial 100-sim MC run.

```json
Request:
{
  "symbol": "AAPL",
  "short_window": 20,
  "long_window": 50,
  "n_simulations": 100,
  "commission": 0.001,
  "slippage": 0.0005
}

Response:
{
  "sharpe": 0.84,
  "drawdown": -0.153,
  "total_return": 0.312,
  "equity_curve": [...],
  "dates": [...],
  "var_95": 9240.50,
  "var_99": 8870.10,
  "monte_carlo": [...],
  "paths": [[...], ...],
  "final_values": [...],
  "simulation_count": 100
}
```

### `POST /simulate`
MC-only progressive update — same request shape, returns only MC fields (no equity_curve/dates). Used for stages 500, 1000, 5000.

---

## How It Works

### Step 1 — Load Data
`yfinance` fetches OHLCV data. CSVs are cached in `data/` and auto-downloaded on first request for any ticker.

### Step 2 — Generate Signals
```
SMA_short > SMA_long  →  BUY  (position = 1)
SMA_short ≤ SMA_long  →  SELL (position = 0)
```

### Step 3 — Backtest
Simulate positions with lagged signals. Deduct `commission + slippage` on each trade entry/exit. Compute equity curve from $10,000 initial capital.

### Step 4 — Evaluate
Compute Sharpe ratio, max drawdown, total return.

### Step 5 — Monte Carlo
Bootstrap-resample daily strategy returns into 5,000 simulated 252-day paths (vectorized numpy). Compute VaR, percentile scenarios, and final value distribution.

### Step 6 — Progressive UI
On button click: stage 1 runs `/backtest` (100 sims, instant results), then stages 2–4 call `/simulate` at 500/1000/5000 sims — the chart fills in live as each stage completes.

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.local.example .env.local   # uses http://localhost:8000 by default
npm run dev
# → http://localhost:3000
```

## Deployment

### Backend → Railway / Render / Fly.io
1. Point the platform at the `backend/` directory
2. Set env var: `ALLOWED_ORIGINS=https://your-app.vercel.app`
3. Start command is already in `Procfile`: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend → Vercel
1. Set root directory to `frontend/`
2. Set env var: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
3. Deploy — Vercel auto-detects Next.js

---

## Supported Tickers

SPY · AAPL · MSFT · NVDA · TSLA — any ticker supported by `yfinance` can be added.

---

## Key Concepts

**Sharpe Ratio** — annualized return per unit of risk. Higher = better risk-adjusted performance.

**Max Drawdown** — largest peak-to-trough loss. Measures worst-case historical loss.

**Value at Risk (VaR)** — the portfolio value not expected to be breached with 95% / 99% confidence, derived from the Monte Carlo final value distribution.

**Bootstrap Monte Carlo** — resamples historical daily returns (with replacement) to simulate thousands of possible future equity paths without assuming a return distribution.

**Transaction Costs** — commission (e.g. 0.1%) + slippage (e.g. 0.05%) are deducted on every position change, giving a more realistic backtest.

---

## Future Improvements

- Multiple strategies (RSI, Bollinger Bands, mean reversion)
- Portfolio optimization (multi-asset allocation)
- Real-time paper trading mode
- Walk-forward / out-of-sample validation

---

## Notes

This project is for **educational purposes only** and does not constitute financial advice.
