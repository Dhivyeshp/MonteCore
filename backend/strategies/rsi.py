import pandas as pd
import numpy as np


def generate_signals(df, rsi_period=14, rsi_oversold=30, rsi_overbought=70):
    delta = df['Close'].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.ewm(com=rsi_period - 1, min_periods=rsi_period).mean()
    avg_loss = loss.ewm(com=rsi_period - 1, min_periods=rsi_period).mean()

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    df['RSI'] = rsi

    # 1 when RSI dips below oversold, 0 when it rises above overbought; hold between
    raw = pd.Series(np.nan, index=df.index)
    raw[rsi < rsi_oversold] = 1
    raw[rsi > rsi_overbought] = 0
    df['Signal'] = raw.ffill().fillna(0)
    return df
