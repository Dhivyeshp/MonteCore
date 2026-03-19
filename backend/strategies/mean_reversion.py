import pandas as pd
import numpy as np


def generate_signals(df, mr_window=20, mr_z_threshold=1.5):
    rolling_mean = df['Close'].rolling(mr_window).mean()
    rolling_std = df['Close'].rolling(mr_window).std()
    z_score = (df['Close'] - rolling_mean) / rolling_std

    # Buy when price is significantly below its rolling mean, sell when above
    raw = pd.Series(np.nan, index=df.index)
    raw[z_score < -mr_z_threshold] = 1
    raw[z_score > mr_z_threshold] = 0
    df['Signal'] = raw.ffill().fillna(0)
    return df
