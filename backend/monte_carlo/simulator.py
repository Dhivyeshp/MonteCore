import numpy as np
import pandas as pd

def bootstrap_returns(returns, n_simulations=1000, horizon=252):
    """Vectorized bootstrap — samples all paths at once (10-20x faster than loop)."""
    returns_arr = np.asarray(returns, dtype=np.float64)
    # Shape: (n_simulations, horizon)
    sampled = np.random.choice(returns_arr, size=(n_simulations, horizon), replace=True)
    # Cumulative product along horizon axis → shape (n_simulations, horizon)
    equity = (1.0 + sampled).cumprod(axis=1)
    # Return as (horizon, n_simulations) DataFrame to match old API
    return pd.DataFrame(equity.T)

def run_simulation(returns, n_simulations=1000, horizon=252):
    return bootstrap_returns(returns, n_simulations, horizon)
