from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from data.data_loader import load_data
from strategies.moving_average import generate_signals
from engine.backtester import run_backtest
from metrics.performance import compute_sharpe, compute_drawdown, compute_total_return
from monte_carlo.simulator import run_simulation

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BacktestRequest(BaseModel):
    symbol: str
    short_window: int
    long_window: int
    n_simulations: int = 100
    commission: float = 0.001
    slippage: float = 0.0005

# ── Shared helper ─────────────────────────────────────────────────────────────

def _build_mc_payload(sim_df: pd.DataFrame, initial_value: float, n_sim: int) -> dict:
    final_values = initial_value * sim_df.iloc[-1]
    final_values_sorted = final_values.sort_values()
    n = len(final_values_sorted)

    var_95 = float(np.percentile(final_values, 5))
    var_99 = float(np.percentile(final_values, 1))

    def downsample(col_idx, n_points=60):
        path = initial_value * sim_df[col_idx]
        idxs = np.linspace(0, len(path) - 1, n_points, dtype=int)
        return [round(float(path.iloc[i]), 2) for i in idxs]

    opt_col = final_values_sorted.index[int(0.90 * n)]
    med_col = final_values_sorted.index[int(0.50 * n)]
    con_col = final_values_sorted.index[int(0.10 * n)]

    mc_scenarios = [
        {"name": "Optimistic",   "label": "90th Percentile Path", "final_value": round(float(final_values[opt_col]), 2), "path": downsample(opt_col)},
        {"name": "Median",       "label": "50th Percentile Path", "final_value": round(float(final_values[med_col]), 2), "path": downsample(med_col)},
        {"name": "Conservative", "label": "10th Percentile Path", "final_value": round(float(final_values[con_col]), 2), "path": downsample(con_col)},
    ]

    n_chart = min(150, n_sim)
    chart_cols = np.random.choice(n_sim, n_chart, replace=False)
    chart_paths = []
    for col in chart_cols:
        path = initial_value * sim_df[col]
        idxs = np.linspace(0, len(path) - 1, 60, dtype=int)
        chart_paths.append([round(float(path.iloc[i]), 2) for i in idxs])

    return {
        "monte_carlo":      mc_scenarios,
        "paths":            chart_paths,
        "final_values":     [round(float(v), 2) for v in final_values.tolist()],
        "simulation_count": n_sim,
        "var_95":           var_95,
        "var_99":           var_99,
    }

# ── /backtest ─────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.post("/backtest")
def backtest(req: BacktestRequest):
    df = load_data(req.symbol)
    df = generate_signals(df, req.short_window, req.long_window)
    df = run_backtest(df, commission=req.commission, slippage=req.slippage)

    returns_series = df['Strategy_Return']
    equity         = df['Equity_Curve']
    initial_value  = float(equity.iloc[0])

    n_sim  = min(req.n_simulations, 5000)
    sim_df = run_simulation(returns_series, n_simulations=n_sim)

    payload = _build_mc_payload(sim_df, initial_value, n_sim)
    payload.update({
        "sharpe":       compute_sharpe(returns_series),
        "drawdown":     compute_drawdown(equity),
        "total_return": compute_total_return(equity),
        "equity_curve": equity.tolist(),
        "dates":        pd.to_datetime(equity.index).strftime('%Y-%m-%d').tolist(),
    })
    return payload

# ── /simulate  (MC-only, no equity/dates in response) ─────────────────────────

@app.post("/simulate")
def simulate(req: BacktestRequest):
    """Progressive MC update — runs backtest to get returns then re-runs MC only."""
    df = load_data(req.symbol)
    df = generate_signals(df, req.short_window, req.long_window)
    df = run_backtest(df, commission=req.commission, slippage=req.slippage)

    returns_series = df['Strategy_Return']
    equity         = df['Equity_Curve']
    initial_value  = float(equity.iloc[0])

    n_sim  = min(req.n_simulations, 5000)
    sim_df = run_simulation(returns_series, n_simulations=n_sim)

    return _build_mc_payload(sim_df, initial_value, n_sim)
