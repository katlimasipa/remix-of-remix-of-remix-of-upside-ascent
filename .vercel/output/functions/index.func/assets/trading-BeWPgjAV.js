const STRATEGIES = [
  {
    id: "only_ups",
    label: "Only Ups",
    hint: "Win only if EVERY tick is strictly higher than the previous one.",
    direction: "up"
  },
  {
    id: "only_downs",
    label: "Only Downs",
    hint: "Win only if EVERY tick is strictly lower than the previous one.",
    direction: "down"
  }
];
function nextStake(opts) {
  const { baseStake, multiplier, lastResult, currentLevel, maxLevels, resetOnWin } = opts;
  if (lastResult === null) return { stake: baseStake, level: 0 };
  if (lastResult === "win") {
    return resetOnWin ? { stake: baseStake, level: 0 } : { stake: baseStake, level: 0 };
  }
  const newLevel = Math.min(currentLevel + 1, maxLevels);
  const stake = baseStake * Math.pow(multiplier, newLevel);
  return { stake, level: newLevel };
}
function totalExposure(baseStake, multiplier, levels) {
  let s = 0;
  for (let i = 0; i <= levels; i++) s += baseStake * Math.pow(multiplier, i);
  return s;
}
function fmtMoney(n, currency = "$") {
  const sign = n < 0 ? "-" : "";
  return `${sign}${currency}${Math.abs(n).toFixed(2)}`;
}
function fmtPct(n) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}
function evaluateSignal(ticks, cfg) {
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
    const ok2 = cfg.direction === "up" ? allUp : allDown;
    return ok2 ? { fire: true, reason: `${need} ${cfg.direction} ticks in a row` } : { fire: false, reason: `waiting for ${need} ${cfg.direction} streak` };
  }
  const ok = cfg.direction === "up" ? allDown : allUp;
  return ok ? { fire: true, reason: `reversal after ${need} opposite ticks` } : { fire: false, reason: `waiting for ${need} opposite-streak` };
}
export {
  STRATEGIES as S,
  fmtPct as a,
  evaluateSignal as e,
  fmtMoney as f,
  nextStake as n,
  totalExposure as t
};
