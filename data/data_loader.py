import yfinance as yf
import pandas as pd
import os

def fetch_data(symbol, start, end):
    df = yf.download(symbol, start=start, end=end)
    return df

def save_data(df, symbol):
    os.makedirs('data', exist_ok=True)
    df.to_csv(f'data/{symbol}.csv')

def load_data(symbol):
    return pd.read_csv(f'data/{symbol}.csv', index_col=0, parse_dates=True)