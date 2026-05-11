// Deriv WebSocket API client.
// Docs: https://developers.binary.com/api/
// We use app_id 1089 (Deriv's public demo app id) — safe for any user token.
// User supplies their own API token from app.deriv.com -> Settings -> API token.
// IMPORTANT: instruct users to use a DEMO account token (no real money).

export const DERIV_APP_ID = 1089;
export const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;

export type DerivTick = { symbol: string; quote: number; epoch: number };
export type DerivCandle = { epoch: number; open: number; high: number; low: number; close: number };

type Pending = { resolve: (v: any) => void; reject: (e: any) => void };

export class DerivClient {
  private ws: WebSocket | null = null;
  private reqId = 1;
  private pending = new Map<number, Pending>();
  private subs = new Map<string, (msg: any) => void>(); // subscription id -> handler
  private symbolHandlers = new Map<string, (t: DerivTick) => void>();
  private candleHandlers = new Map<string, (c: DerivCandle, isNew: boolean) => void>();
  private contractHandlers = new Map<number, (c: any) => void>();
  private connected = false;
  private connectingPromise: Promise<void> | null = null;
  public onAuth: ((info: any) => void) | null = null;
  public onBalance: ((b: { balance: number; currency: string }) => void) | null = null;
  public onClose: (() => void) | null = null;

  async connect(): Promise<void> {
    if (this.connected) return;
    if (this.connectingPromise) return this.connectingPromise;
    this.connectingPromise = new Promise((resolve, reject) => {
      const ws = new WebSocket(DERIV_WS_URL);
      this.ws = ws;
      ws.onopen = () => { this.connected = true; resolve(); };
      ws.onerror = (e) => { reject(e); };
      ws.onclose = () => {
        this.connected = false;
        this.connectingPromise = null;
        this.onClose?.();
      };
      ws.onmessage = (ev) => this.handle(JSON.parse(ev.data));
    });
    return this.connectingPromise;
  }

  private handle(msg: any) {
    // Subscription stream messages
    if (msg.subscription?.id && this.subs.has(msg.subscription.id)) {
      this.subs.get(msg.subscription.id)!(msg);
    }
    // Tick stream
    if (msg.msg_type === "tick" && msg.tick) {
      const h = this.symbolHandlers.get(msg.tick.symbol);
      h?.({ symbol: msg.tick.symbol, quote: msg.tick.quote, epoch: msg.tick.epoch });
    }
    // Candle stream (ohlc updates)
    if (msg.msg_type === "ohlc" && msg.ohlc) {
      const h = this.candleHandlers.get(msg.ohlc.symbol);
      h?.({
        epoch: Number(msg.ohlc.open_time),
        open: Number(msg.ohlc.open),
        high: Number(msg.ohlc.high),
        low: Number(msg.ohlc.low),
        close: Number(msg.ohlc.close),
      }, false);
    }
    // Initial candles list
    if (msg.msg_type === "candles" && msg.candles && msg.echo_req?.ticks_history) {
      const sym = msg.echo_req.ticks_history;
      const h = this.candleHandlers.get(sym);
      if (h) {
        for (const c of msg.candles) {
          h({ epoch: Number(c.epoch), open: Number(c.open), high: Number(c.high), low: Number(c.low), close: Number(c.close) }, true);
        }
      }
    }
    // Balance updates
    if (msg.msg_type === "balance" && msg.balance) {
      this.onBalance?.({ balance: Number(msg.balance.balance), currency: msg.balance.currency });
    }
    // Open contract updates
    if (msg.msg_type === "proposal_open_contract" && msg.proposal_open_contract) {
      const id = msg.proposal_open_contract.contract_id;
      this.contractHandlers.get(id)?.(msg.proposal_open_contract);
    }
    // Pending request response
    if (msg.req_id && this.pending.has(msg.req_id)) {
      const p = this.pending.get(msg.req_id)!;
      this.pending.delete(msg.req_id);
      if (msg.error) p.reject(new Error(msg.error.message));
      else p.resolve(msg);
    }
  }

  private send<T = any>(payload: any): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Not connected"));
    }
    const req_id = this.reqId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(req_id, { resolve, reject });
      this.ws!.send(JSON.stringify({ ...payload, req_id }));
      // 25s timeout
      setTimeout(() => {
        if (this.pending.has(req_id)) {
          this.pending.delete(req_id);
          reject(new Error("Request timed out"));
        }
      }, 25000);
    });
  }

  async authorize(token: string) {
    const res = await this.send({ authorize: token });
    this.onAuth?.(res.authorize);
    // subscribe to balance updates
    await this.send({ balance: 1, subscribe: 1 });
    return res.authorize;
  }

  async subscribeTicks(symbol: string, handler: (t: DerivTick) => void) {
    this.symbolHandlers.set(symbol, handler);
    await this.send({ ticks: symbol, subscribe: 1 });
  }

  async unsubscribeTicks(symbol: string) {
    this.symbolHandlers.delete(symbol);
    try { await this.send({ forget_all: "ticks" }); } catch {}
  }

  async subscribeCandles(symbol: string, granularity: number, count: number, handler: (c: DerivCandle, isInitial: boolean) => void) {
    this.candleHandlers.set(symbol, handler);
    await this.send({
      ticks_history: symbol,
      adjust_start_time: 1,
      count,
      end: "latest",
      granularity,
      style: "candles",
      subscribe: 1,
    });
  }

  async unsubscribeCandles(symbol: string) {
    this.candleHandlers.delete(symbol);
    try { await this.send({ forget_all: "candles" }); } catch {}
  }

  // Buy an Only Ups / Only Downs contract.
  // contract_type: ONLYUPS or ONLYDOWNS
  // duration: tick count (5 to 10 typically for these)
  async buyOnlyUpsDowns(opts: {
    symbol: string;
    direction: "up" | "down";
    stake: number;
    ticks: number;
    currency: string;
  }) {
    const contract_type = opts.direction === "up" ? "ONLYUPS" : "ONLYDOWNS";
    // 1) Get a proposal so we know the payout
    const proposal = await this.send({
      proposal: 1,
      amount: opts.stake,
      basis: "stake",
      contract_type,
      currency: opts.currency,
      duration: opts.ticks,
      duration_unit: "t",
      symbol: opts.symbol,
    });
    if (!proposal.proposal?.id) throw new Error("No proposal id");
    // 2) Buy
    const buy = await this.send({
      buy: proposal.proposal.id,
      price: opts.stake,
    });
    return { buy: buy.buy, proposal: proposal.proposal };
  }

  // Subscribe to contract updates until it settles. Resolves with final state.
  watchContract(contract_id: number, onUpdate?: (c: any) => void): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.contractHandlers.set(contract_id, (c) => {
        onUpdate?.(c);
        if (c.is_sold || c.status === "won" || c.status === "lost") {
          this.contractHandlers.delete(contract_id);
          resolve(c);
        }
      });
      this.send({ proposal_open_contract: 1, contract_id, subscribe: 1 }).catch(reject);
    });
  }

  close() {
    this.symbolHandlers.clear();
    this.candleHandlers.clear();
    this.contractHandlers.clear();
    this.pending.clear();
    try { this.ws?.close(); } catch {}
    this.ws = null;
    this.connected = false;
    this.connectingPromise = null;
  }
}

// Common Deriv synthetic markets (24/7 trading, demo-friendly)
export const DERIV_MARKETS = [
  { symbol: "R_10", name: "Volatility 10 Index" },
  { symbol: "R_25", name: "Volatility 25 Index" },
  { symbol: "R_50", name: "Volatility 50 Index" },
  { symbol: "R_75", name: "Volatility 75 Index" },
  { symbol: "R_100", name: "Volatility 100 Index" },
  { symbol: "1HZ10V", name: "Volatility 10 (1s) Index" },
  { symbol: "1HZ25V", name: "Volatility 25 (1s) Index" },
  { symbol: "1HZ50V", name: "Volatility 50 (1s) Index" },
  { symbol: "1HZ75V", name: "Volatility 75 (1s) Index" },
  { symbol: "1HZ100V", name: "Volatility 100 (1s) Index" },
];

export const GRANULARITIES = [
  { v: 60, label: "1m" },
  { v: 120, label: "2m" },
  { v: 300, label: "5m" },
  { v: 900, label: "15m" },
  { v: 3600, label: "1h" },
];
