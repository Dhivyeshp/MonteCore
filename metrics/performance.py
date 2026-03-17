import numpy as np

def compute_sharpe(returns, risk_free_rate=0):
    excess_returns = returns - risk_free_rate / 252
    return np.sqrt(252) * excess_returns.mean() / excess_returns.std()

def compute_drawdown(equity_curve):
    roll_max = equity_curve.cummax()
    drawdown = (equity_curve - roll_max) / roll_max
    return drawdown.min()

def compute_total_return(equity_curve):
    return (equity_curve.iloc[-1] / equity_curve.iloc[0]) - 1