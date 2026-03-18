import pandas as pd
import numpy as np

def run_backtest(df, initial_cash=10000, commission=0.001, slippage=0.0005):
    """
    commission : fraction of trade value charged per trade (e.g. 0.001 = 0.1%)
    slippage   : one-way price impact per trade (e.g. 0.0005 = 0.05%)
    """
    df['Position'] = df['Signal'].shift(1).fillna(0)
    df['Daily_Return'] = df['Close'].pct_change().fillna(0)

    # Detect trade entries/exits (position changes)
    df['Trade'] = df['Position'].diff().abs().fillna(0)

    # Total round-trip cost applied on the day of each position change
    total_cost_per_trade = commission + slippage
    df['Cost'] = df['Trade'] * total_cost_per_trade

    df['Strategy_Return'] = df['Daily_Return'] * df['Position'] - df['Cost']
    df['Equity_Curve'] = (1 + df['Strategy_Return']).cumprod() * initial_cash
    return df
