import pandas as pd
import numpy as np


def generate_signals(df, bb_window=20, bb_num_std=2.0):
    sma = df['Close'].rolling(bb_window).mean()
    std = df['Close'].rolling(bb_window).std()
    upper = sma + bb_num_std * std
    lower = sma - bb_num_std * std

    # Mean-reversion: buy when price dips below lower band, exit when it rises above upper
    raw = pd.Series(np.nan, index=df.index)
    raw[df['Close'] < lower] = 1
    raw[df['Close'] > upper] = 0
    df['Signal'] = raw.ffill().fillna(0)
    return df
