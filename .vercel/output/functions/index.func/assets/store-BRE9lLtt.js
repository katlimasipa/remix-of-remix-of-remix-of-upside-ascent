import { create } from "zustand";
import { persist } from "zustand/middleware";
const defaultConfig = {
  market: "R_50",
  strategy: "only_ups",
  baseStake: 1,
  durationTicks: 5,
  martingaleEnabled: true,
  martingaleMultiplier: 2,
  maxMartingaleLevels: 5,
  resetOnWin: true,
  takeProfit: 50,
  stopLoss: 25,
  maxTrades: 100,
  cooldownSeconds: 2,
  autoTrade: false,
  entryMode: "always",
  streakTicks: 3
};
const initial = {
  id: null,
  status: "idle",
  startedAt: null,
  endedAt: null,
  startingBalance: 1e3,
  balance: 1e3,
  pnl: 0,
  trades: [],
  wins: 0,
  losses: 0,
  consecutiveWins: 0,
  consecutiveLosses: 0,
  currentLevel: 0,
  lastResult: null,
  nextStake: defaultConfig.baseStake,
  price: 1e3,
  config: defaultConfig,
  derivConnected: false,
  derivAuthorized: false,
  derivAccountId: null,
  derivCurrency: "USD",
  derivLiveBalance: null,
  liveSymbol: "R_50"
};
const useSession = create()(
  persist(
    (set) => ({
      ...initial,
      setConfig: (patch) => set((s) => ({
        config: { ...s.config, ...patch },
        nextStake: s.status === "idle" ? patch.baseStake ?? s.config.baseStake : s.nextStake
      })),
      startSession: (startingBalance) => set((s) => ({
        id: crypto.randomUUID(),
        status: "running",
        startedAt: Date.now(),
        endedAt: null,
        startingBalance,
        balance: startingBalance,
        pnl: 0,
        trades: [],
        wins: 0,
        losses: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        currentLevel: 0,
        lastResult: null,
        nextStake: s.config.baseStake,
        price: 1e3 + Math.random() * 200
      })),
      pauseSession: () => set({ status: "paused" }),
      resumeSession: () => set({ status: "running" }),
      endSession: () => set({ status: "ended", endedAt: Date.now() }),
      recordTrade: (t) => set((s) => {
        const trade = { ...t, id: crypto.randomUUID(), ts: Date.now() };
        const wins = s.wins + (t.result === "win" ? 1 : 0);
        const losses = s.losses + (t.result === "loss" ? 1 : 0);
        const consecutiveWins = t.result === "win" ? s.consecutiveWins + 1 : 0;
        const consecutiveLosses = t.result === "loss" ? s.consecutiveLosses + 1 : 0;
        return {
          trades: [trade, ...s.trades].slice(0, 500),
          wins,
          losses,
          consecutiveWins,
          consecutiveLosses,
          balance: s.balance + t.pnl,
          pnl: s.pnl + t.pnl,
          lastResult: t.result
        };
      }),
      setPrice: (p) => set({ price: p }),
      setNextStake: (s, lvl) => set({ nextStake: s, currentLevel: lvl }),
      reset: () => set(initial)
    }),
    {
      name: "tickwise-session",
      partialize: (s) => ({
        config: s.config,
        startingBalance: s.startingBalance,
        status: s.status,
        startedAt: s.startedAt,
        balance: s.balance,
        pnl: s.pnl,
        trades: s.trades,
        wins: s.wins,
        losses: s.losses,
        consecutiveWins: s.consecutiveWins,
        consecutiveLosses: s.consecutiveLosses,
        currentLevel: s.currentLevel,
        lastResult: s.lastResult,
        nextStake: s.nextStake
      })
    }
  )
);
export {
  useSession as u
};
