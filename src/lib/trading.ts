// Simulated tick generator + martingale engine.
// Pure functions — easy to test, no side effects.

export type Strategy = "only_ups" | "only_downs";
export type Direction = "up" | "down";

export const MARKETS = [
  { id: "VOL_10", name: "Volatility 10 Index", vol: 0.0008 },
  { id: "VOL_25", name: "Volatility 25 Index", vol: 0.0018 },
  { id: "VOL_50", name: "Volatility 50 Index", vol: 0.0034 },
  { id: "VOL_75", name: "Volatility 75 Index", vol: 0.005 },
  { id: "VOL_100", name: "Volatility 100 Index", vol: 0.0068 },
  { id: "BOOM_500", name: "Boom 500", vol: 0.004 },
  { id: "CRASH_500", name: "Crash 500", vol: 0.004 },
];

export const STRATEGIES: { id: Strategy; label: string; hint: string; direction: Direction }[] = [
  {
    id: "only_ups",
    label: "Only Ups",
    hint: "Win only if EVERY tick is strictly higher than the previous one.",
    direction: "up",
  },
  {
    id: "only_downs",
    label: "Only Downs",
    hint: "Win only if EVERY tick is strictly lower than the previous one.",
    direction: "down",
  },
];

export function nextTick(price: number, vol: number): number {
  // geometric brownian-ish micro-step
  const z = (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 1.4;
  const drift = (Math.random() - 0.5) * vol * 0.1;
  return Math.max(0.01, price * (1 + drift + z * vol));
}

export function simulateTrade(opts: {
  entry: number;
  ticks: number;
  vol: number;
  direction: Direction;
  stake: number;
  payoutRate?: number; // e.g. 4.0 -> 400% return on win (Only Ups/Downs are high-payout)
}): { exit: number; result: "win" | "loss"; pnl: number; payout: number; path: number[] } {
  // Only Ups / Only Downs are rare events with high payout multiples.
  // Default payout scales with tick count: roughly 2^n - 1 minus house edge.
  const fairMultiple = Math.pow(2, opts.ticks) - 1;
  const payoutRate = opts.payoutRate ?? fairMultiple * 0.85;
  const path: number[] = [opts.entry];
  let p = opts.entry;
  for (let i = 0; i < opts.ticks; i++) {
    p = nextTick(p, opts.vol);
    path.push(p);
  }
  // Only Ups: every tick strictly > previous. Only Downs: every tick strictly < previous.
  let win = true;
  for (let i = 1; i < path.length; i++) {
    const stepUp = path[i] > path[i - 1];
    const stepDown = path[i] < path[i - 1];
    if (opts.direction === "up" && !stepUp) { win = false; break; }
    if (opts.direction === "down" && !stepDown) { win = false; break; }
  }
  const payout = win ? opts.stake * (1 + payoutRate) : 0;
  const pnl = win ? opts.stake * payoutRate : -opts.stake;
  return { exit: p, result: win ? "win" : "loss", pnl, payout, path };
}

// Martingale: after a loss, multiply stake. After a win, reset.
export function nextStake(opts: {
  baseStake: number;
  multiplier: number;
  lastResult: "win" | "loss" | null;
  currentLevel: number;
  maxLevels: number;
  resetOnWin: boolean;
}): { stake: number; level: number } {
  const { baseStake, multiplier, lastResult, currentLevel, maxLevels, resetOnWin } = opts;
  if (lastResult === null) return { stake: baseStake, level: 0 };
  if (lastResult === "win") {
    return resetOnWin ? { stake: baseStake, level: 0 } : { stake: baseStake, level: 0 };
  }
  // loss
  const newLevel = Math.min(currentLevel + 1, maxLevels);
  const stake = baseStake * Math.pow(multiplier, newLevel);
  return { stake, level: newLevel };
}

export function totalExposure(baseStake: number, multiplier: number, levels: number): number {
  let s = 0;
  for (let i = 0; i <= levels; i++) s += baseStake * Math.pow(multiplier, i);
  return s;
}

export function fmtMoney(n: number, currency = "$") {
  const sign = n < 0 ? "-" : "";
  return `${sign}${currency}${Math.abs(n).toFixed(2)}`;
}

export function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

// ─── Bot signal engine ──────────────────────────────────────────────────────
// Entry filters used by the auto-trader to decide WHEN to fire a trade.

export type EntryMode = "always" | "streak" | "reversal";

export type SignalConfig = {
  mode: EntryMode;
  streakTicks: number; // how many consecutive ticks in the trigger direction
  direction: Direction; // bot bias
};

/**
 * Decide whether the bot should enter NOW based on the recent tick window.
 * - "always":   fire whenever ready
 * - "streak":   N consecutive ticks moving in the bot's bias direction (momentum)
 * - "reversal": N consecutive ticks moving OPPOSITE to bias, then enter (mean-revert)
 */
export function evaluateSignal(
  ticks: number[],
  cfg: SignalConfig,
): { fire: boolean; reason: string } {
  if (cfg.mode === "always") return { fire: true, reason: "always-on" };
  const need = Math.max(2, cfg.streakTicks);
  if (ticks.length < need + 1) return { fire: false, reason: `waiting for ${need + 1} ticks` };
  const window = ticks.slice(-(need + 1));
  let allUp = true, allDown = true;
  for (let i = 1; i < window.length; i++) {
    if (!(window[i] > window[i - 1])) allUp = false;
    if (!(window[i] < window[i - 1])) allDown = false;
  }
  if (cfg.mode === "streak") {
    const ok = cfg.direction === "up" ? allUp : allDown;
    return ok
      ? { fire: true, reason: `${need} ${cfg.direction} ticks in a row` }
      : { fire: false, reason: `waiting for ${need} ${cfg.direction} streak` };
  }
  // reversal: opposite streak triggers entry in bias direction
  const ok = cfg.direction === "up" ? allDown : allUp;
  return ok
    ? { fire: true, reason: `reversal after ${need} opposite ticks` }
    : { fire: false, reason: `waiting for ${need} opposite-streak` };
}
