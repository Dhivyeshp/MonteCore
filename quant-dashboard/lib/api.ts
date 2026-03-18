export async function runBacktest(params: {
  ticker: string;
  strategy: string;
  shortWindow: number;
  longWindow: number;
  simulations: number;
}) {
  const res = await fetch('http://localhost:8000/backtest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      symbol: params.ticker,
      short_window: params.shortWindow,
      long_window: params.longWindow,
      n_simulations: params.simulations,
    }),
  });
  if (!res.ok) throw new Error('Backtest failed');
  return res.json();
}
