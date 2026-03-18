import yfinance as yf
import pandas as pd
import os

DATA_DIR = os.path.join(os.path.dirname(__file__))

def fetch_data(symbol, start, end):
    df = yf.download(symbol, start=start, end=end)
    return df

def save_data(df, symbol):
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(os.path.join(DATA_DIR, f'{symbol}.csv'))

def load_data(symbol, start='2020-01-01', end='2024-12-31'):
    path = os.path.join(DATA_DIR, f'{symbol}.csv')
    if not os.path.exists(path):
        df = yf.download(symbol, start=start, end=end, auto_adjust=True)
        df.columns = df.columns.get_level_values(0)
        df.to_csv(path)
    df = pd.read_csv(path, index_col=0, parse_dates=True)
    df['Close'] = pd.to_numeric(df['Close'], errors='coerce')
    return df