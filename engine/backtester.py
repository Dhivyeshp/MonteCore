import pandas as pd

def run_backtest(df, initial_cash=10000):
    df['Position'] = df['Signal'].shift(1).fillna(0)
    df['Daily_Return'] = df['Close'].pct_change().fillna(0)
    df['Strategy_Return'] = df['Daily_Return'] * df['Position']
    df['Equity_Curve'] = (1 + df['Strategy_Return']).cumprod() * initial_cash
    return df