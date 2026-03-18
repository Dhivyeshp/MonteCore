interface BacktestParams {
  ticker: string;
  strategy: string;
  shortWindow: number;
  longWindow: number;
  simulations: number;
  commission: number;
  slippage: number;
}

const API_URL = '/api';

function buildBody(params: BacktestParams, nSims: number) {
  return JSON.stringify({
    symbol:        params.ticker,
    short_window:  params.shortWindow,
    long_window:   params.longWindow,
    n_simulations: nSims,
    commission:    params.commission,
    slippage:      params.slippage,
  });
}

/** Full backtest + initial MC run (100 sims). Returns equity curve, metrics, and MC data. */
export async function runBacktest(params: BacktestParams, signal?: AbortSignal) {
  const res = await fetch(`${API_URL}/backtest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: buildBody(params, 100),   // stage 1 always starts at 100
    signal,
  });
  if (!res.ok) throw new Error('Backtest failed');
  return res.json();
}

/** MC-only progressive update — no equity curve in response, faster for stages 2-4. */
export async function runSimulate(params: BacktestParams, nSims: number, signal?: AbortSignal) {
  const res = await fetch(`${API_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: buildBody(params, nSims),
    signal,
  });
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
}
