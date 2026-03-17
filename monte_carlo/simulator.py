import numpy as np
import pandas as pd

def bootstrap_returns(returns, n_simulations=1000, horizon=252):
    simulations = []
    for _ in range(n_simulations):
        sampled = np.random.choice(returns, size=horizon, replace=True)
        equity = (1 + sampled).cumprod()
        simulations.append(equity)
    return pd.DataFrame(simulations).T

def run_simulation(returns, n_simulations=1000, horizon=252):
    return bootstrap_returns(returns, n_simulations, horizon)