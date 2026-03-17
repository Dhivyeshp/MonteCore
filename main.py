from data.data_loader import fetch_data, save_data, load_data
from strategies.moving_average import generate_signals
from engine.backtester import run_backtest
from metrics.performance import compute_sharpe, compute_drawdown, compute_total_return
from monte_carlo.simulator import run_simulation

symbol = 'AAPL'
start = '2020-01-01'
end = '2023-01-01'

# Step 1: Fetch and save data (run once)
df = fetch_data(symbol, start, end)
save_data(df, symbol)

# Step 2: Load data
df = load_data(symbol)

# Step 3: Generate signals
df = generate_signals(df)

# Step 4: Run backtest
df = run_backtest(df)

# Step 5: Compute metrics
returns = df['Strategy_Return']
equity = df['Equity_Curve']
print('Sharpe:', compute_sharpe(returns))
print('Max Drawdown:', compute_drawdown(equity))
print('Total Return:', compute_total_return(equity))

# Step 6: Monte Carlo simulation (optional)
simulations = run_simulation(returns)
print('Monte Carlo simulation shape:', simulations.shape)