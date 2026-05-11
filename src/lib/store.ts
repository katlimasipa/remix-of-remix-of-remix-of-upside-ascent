import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Direction, Strategy } from "./trading";

export type TradeRecord = {
  id: string;
  ts: number;
  direction: Direction;
  stake: number;
  pnl: number;
  result: "win" | "loss";
  entry: number;
  exit: number;
  level: number;
};

export type SessionConfig = {
  market: string;
  strategy: Strategy;
  baseStake: number;
  durationTicks: number;
  martingaleEnabled: boolean;
  martingaleMultiplier: number;
  maxMartingaleLevels: number;
  resetOnWin: boolean;
  takeProfit: number | null;
  stopLoss: number | null;
  maxTrades: number | null;
  cooldownSeconds: number;
  autoTrade: boolean;
};

export type SessionState = {
  id: string | null;
  status: "idle" | "running" | "paused" | "ended";
  startedAt: number | null;
  endedAt: number | null;
  startingBalance: number;
  balance: number;
  pnl: number;
  trades: TradeRecord[];
  wins: number;
  losses: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  currentLevel: number;
  lastResult: "win" | "loss" | null;
  nextStake: number;
  price: number;
  config: SessionConfig;
};

export const defaultConfig: SessionConfig = {
  market: "VOL_50",
  strategy: "rise_fall",
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
};

type Actions = {
  setConfig: (patch: Partial<SessionConfig>) => void;
  startSession: (startingBalance: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  recordTrade: (t: Omit<TradeRecord, "id" | "ts">) => void;
  setPrice: (p: number) => void;
  setNextStake: (s: number, lvl: number) => void;
  reset: () => void;
};

const initial: SessionState = {
  id: null,
  status: "idle",
  startedAt: null,
  endedAt: null,
  startingBalance: 1000,
  balance: 1000,
  pnl: 0,
  trades: [],
  wins: 0,
  losses: 0,
  consecutiveWins: 0,
  consecutiveLosses: 0,
  currentLevel: 0,
  lastResult: null,
  nextStake: defaultConfig.baseStake,
  price: 1000,
  config: defaultConfig,
};

export const useSession = create<SessionState & Actions>()(
  persist(
    (set) => ({
      ...initial,
      setConfig: (patch) =>
        set((s) => ({
          config: { ...s.config, ...patch },
          nextStake: s.status === "idle" ? (patch.baseStake ?? s.config.baseStake) : s.nextStake,
        })),
      startSession: (startingBalance) =>
        set((s) => ({
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
          price: 1000 + Math.random() * 200,
        })),
      pauseSession: () => set({ status: "paused" }),
      resumeSession: () => set({ status: "running" }),
      endSession: () => set({ status: "ended", endedAt: Date.now() }),
      recordTrade: (t) =>
        set((s) => {
          const trade: TradeRecord = { ...t, id: crypto.randomUUID(), ts: Date.now() };
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
            lastResult: t.result,
          };
        }),
      setPrice: (p) => set({ price: p }),
      setNextStake: (s, lvl) => set({ nextStake: s, currentLevel: lvl }),
      reset: () => set(initial),
    }),
    {
      name: "tickwise-session",
      partialize: (s) => ({ config: s.config, startingBalance: s.startingBalance }),
    }
  )
);
