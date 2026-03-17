from fastapi import FastAPI
from pydantic import BaseModel
from data.data_loader import load_data
from strategies.moving_average import generate_signals
from engine.backtester import run_backtest
from metrics.performance import compute_sharpe, compute_drawdown, compute_total_return
from monte_carlo.simulator import run_simulation

app = FastAPI()

class BacktestRequest(BaseModel):
    symbol: str
    short_window: int
    long_window: int

@app.post("/backtest")
def backtest(req: BacktestRequest):
    df = load_data(req.symbol)
    df = generate_signals(df, req.short_window, req.long_window)
    df = run_backtest(df)
    returns = df['Strategy_Return']
    equity = df['Equity_Curve']
    metrics = {
        "sharpe": compute_sharpe(returns),
        "drawdown": compute_drawdown(equity),
        "total_return": compute_total_return(equity),
        "equity_curve": equity.tolist(),
        "dates": equity.index.strftime('%Y-%m-%d').tolist()
    }
    return metrics
