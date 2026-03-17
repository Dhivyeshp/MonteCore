import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import yfinance as yf


def load_data(ticker: str, start: str, end: str) -> pd.DataFrame:
    df = yf.download(ticker, start=start, end=end, auto_adjust=True)

    if df.empty:
        raise ValueError(f"No data returned for {ticker}")

    # Keep only needed columns
    df = df[["Close"]].copy()

    # Handle possible multi-index columns from yfinance
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df.dropna(inplace=True)
    return df


def generate_signals(df: pd.DataFrame, short_window: int = 20, long_window: int = 50) -> pd.DataFrame:
    df = df.copy()

    df["SMA_Short"] = df["Close"].rolling(window=short_window).mean()
    df["SMA_Long"] = df["Close"].rolling(window=long_window).mean()

    df["Signal"] = 0
    df.loc[df["SMA_Short"] > df["SMA_Long"], "Signal"] = 1
    df.loc[df["SMA_Short"] <= df["SMA_Long"], "Signal"] = 0

    # Position = changes in signal
    df["Position"] = df["Signal"].diff()

    return df


def backtest(df: pd.DataFrame, initial_cash: float = 10000.0) -> pd.DataFrame:
    df = df.copy()

    df["Market_Return"] = df["Close"].pct_change()
    df["Strategy_Return"] = df["Signal"].shift(1) * df["Market_Return"]

    df["Market_Equity"] = initial_cash * (1 + df["Market_Return"]).cumprod()
    df["Strategy_Equity"] = initial_cash * (1 + df["Strategy_Return"]).cumprod()

    return df


def print_metrics(df: pd.DataFrame) -> None:
    strategy_returns = df["Strategy_Return"].dropna()

    total_return = (df["Strategy_Equity"].iloc[-1] / df["Strategy_Equity"].iloc[0]) - 1

    sharpe_ratio = 0.0
    if strategy_returns.std() != 0:
        sharpe_ratio = (strategy_returns.mean() / strategy_returns.std()) * np.sqrt(252)

    rolling_max = df["Strategy_Equity"].cummax()
    drawdown = (df["Strategy_Equity"] - rolling_max) / rolling_max
    max_drawdown = drawdown.min()

    print("\n=== Backtest Metrics ===")
    print(f"Final Portfolio Value: ${df['Strategy_Equity'].iloc[-1]:,.2f}")
    print(f"Total Return: {total_return:.2%}")
    print(f"Sharpe Ratio: {sharpe_ratio:.2f}")
    print(f"Max Drawdown: {max_drawdown:.2%}")


def plot_results(df: pd.DataFrame, ticker: str) -> None:
    plt.figure(figsize=(12, 6))
    plt.plot(df.index, df["Close"], label="Close Price")
    plt.plot(df.index, df["SMA_Short"], label="20-Day SMA")
    plt.plot(df.index, df["SMA_Long"], label="50-Day SMA")

    buy_signals = df[df["Position"] == 1]
    sell_signals = df[df["Position"] == -1]

    plt.scatter(buy_signals.index, buy_signals["Close"], marker="^", label="Buy Signal")
    plt.scatter(sell_signals.index, sell_signals["Close"], marker="v", label="Sell Signal")

    plt.title(f"{ticker} Price and Trading Signals")
    plt.xlabel("Date")
    plt.ylabel("Price")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

    plt.figure(figsize=(12, 6))
    plt.plot(df.index, df["Market_Equity"], label="Buy and Hold")
    plt.plot(df.index, df["Strategy_Equity"], label="Strategy Equity")
    plt.title(f"{ticker} Strategy vs Buy and Hold")
    plt.xlabel("Date")
    plt.ylabel("Portfolio Value ($)")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()


def main() -> None:
    ticker = "SPY"
    start_date = "2020-01-01"
    end_date = "2025-01-01"

    df = load_data(ticker, start_date, end_date)
    df = generate_signals(df)
    df = backtest(df)

    print(df.tail())
    print_metrics(df)
    plot_results(df, ticker)


if __name__ == "__main__":
    main()