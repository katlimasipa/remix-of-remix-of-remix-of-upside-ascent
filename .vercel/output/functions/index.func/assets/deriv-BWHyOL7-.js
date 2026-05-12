const DERIV_APP_ID = 1089;
const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;
class DerivClient {
  ws = null;
  reqId = 1;
  pending = /* @__PURE__ */ new Map();
  subs = /* @__PURE__ */ new Map();
  // subscription id -> handler
  symbolHandlers = /* @__PURE__ */ new Map();
  candleHandlers = /* @__PURE__ */ new Map();
  contractHandlers = /* @__PURE__ */ new Map();
  connected = false;
  connectingPromise = null;
  onAuth = null;
  onBalance = null;
  onClose = null;
  async connect() {
    if (this.connected) return;
    if (this.connectingPromise) return this.connectingPromise;
    this.connectingPromise = new Promise((resolve, reject) => {
      const ws = new WebSocket(DERIV_WS_URL);
      this.ws = ws;
      ws.onopen = () => {
        this.connected = true;
        resolve();
      };
      ws.onerror = (e) => {
        reject(e);
      };
      ws.onclose = () => {
        this.connected = false;
        this.connectingPromise = null;
        this.onClose?.();
      };
      ws.onmessage = (ev) => this.handle(JSON.parse(ev.data));
    });
    return this.connectingPromise;
  }
  handle(msg) {
    if (msg.subscription?.id && this.subs.has(msg.subscription.id)) {
      this.subs.get(msg.subscription.id)(msg);
    }
    if (msg.msg_type === "tick" && msg.tick) {
      const h = this.symbolHandlers.get(msg.tick.symbol);
      h?.({ symbol: msg.tick.symbol, quote: msg.tick.quote, epoch: msg.tick.epoch });
    }
    if (msg.msg_type === "ohlc" && msg.ohlc) {
      const h = this.candleHandlers.get(msg.ohlc.symbol);
      h?.({
        epoch: Number(msg.ohlc.open_time),
        open: Number(msg.ohlc.open),
        high: Number(msg.ohlc.high),
        low: Number(msg.ohlc.low),
        close: Number(msg.ohlc.close)
      }, false);
    }
    if (msg.msg_type === "candles" && msg.candles && msg.echo_req?.ticks_history) {
      const sym = msg.echo_req.ticks_history;
      const h = this.candleHandlers.get(sym);
      if (h) {
        for (const c of msg.candles) {
          h({ epoch: Number(c.epoch), open: Number(c.open), high: Number(c.high), low: Number(c.low), close: Number(c.close) }, true);
        }
      }
    }
    if (msg.msg_type === "balance" && msg.balance) {
      this.onBalance?.({ balance: Number(msg.balance.balance), currency: msg.balance.currency });
    }
    if (msg.msg_type === "proposal_open_contract" && msg.proposal_open_contract) {
      const id = msg.proposal_open_contract.contract_id;
      this.contractHandlers.get(id)?.(msg.proposal_open_contract);
    }
    if (msg.req_id && this.pending.has(msg.req_id)) {
      const p = this.pending.get(msg.req_id);
      this.pending.delete(msg.req_id);
      if (msg.error) p.reject(new Error(msg.error.message));
      else p.resolve(msg);
    }
  }
  send(payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Not connected"));
    }
    const req_id = this.reqId++;
    return new Promise((resolve, reject) => {
      this.pending.set(req_id, { resolve, reject });
      this.ws.send(JSON.stringify({ ...payload, req_id }));
      setTimeout(() => {
        if (this.pending.has(req_id)) {
          this.pending.delete(req_id);
          reject(new Error("Request timed out"));
        }
      }, 25e3);
    });
  }
  async authorize(token) {
    const res = await this.send({ authorize: token });
    const scopes = res.authorize?.scopes ?? [];
    const required = ["read", "trade"];
    const missing = required.filter((s) => !scopes.includes(s));
    if (missing.length) {
      throw new Error(
        `Token is missing required scope(s): ${missing.join(", ")}. Re-create the token at app.deriv.com with read + trade scopes.`
      );
    }
    this.onAuth?.(res.authorize);
    await this.send({ balance: 1, subscribe: 1 });
    return res.authorize;
  }
  async subscribeTicks(symbol, handler) {
    this.symbolHandlers.set(symbol, handler);
    await this.send({ ticks: symbol, subscribe: 1 });
  }
  async unsubscribeTicks(symbol) {
    this.symbolHandlers.delete(symbol);
    try {
      await this.send({ forget_all: "ticks" });
    } catch {
    }
  }
  async subscribeCandles(symbol, granularity, count, handler) {
    this.candleHandlers.set(symbol, handler);
    await this.send({
      ticks_history: symbol,
      adjust_start_time: 1,
      count,
      end: "latest",
      granularity,
      style: "candles",
      subscribe: 1
    });
  }
  async unsubscribeCandles(symbol) {
    this.candleHandlers.delete(symbol);
    try {
      await this.send({ forget_all: "candles" });
    } catch {
    }
  }
  // Fetch a window of recent tick history (no subscribe)
  async fetchTickHistory(symbol, count = 200) {
    const res = await this.send({
      ticks_history: symbol,
      adjust_start_time: 1,
      count,
      end: "latest",
      style: "ticks"
    });
    const prices = res.history?.prices ?? [];
    const times = res.history?.times ?? [];
    return prices.map((p, i) => ({ symbol, quote: Number(p), epoch: Number(times[i]) }));
  }
  // Buy an Only Ups / Only Downs contract.
  // Official Deriv contract types: RUNHIGH (Only Ups) and RUNLOW (Only Downs).
  // These tick contracts are offered for 2–5 ticks on synthetic demo markets.
  async buyOnlyUpsDowns(opts) {
    const contract_type = opts.direction === "up" ? "RUNHIGH" : "RUNLOW";
    const duration = Math.max(2, Math.min(5, Math.round(opts.ticks)));
    const proposal = await this.send({
      proposal: 1,
      amount: opts.stake,
      basis: "stake",
      contract_type,
      currency: opts.currency,
      duration,
      duration_unit: "t",
      symbol: opts.symbol
    });
    if (!proposal.proposal?.id) throw new Error("No proposal id");
    const buy = await this.send({
      buy: proposal.proposal.id,
      price: opts.stake
    });
    return { buy: buy.buy, proposal: proposal.proposal };
  }
  // Subscribe to contract updates until it settles. Resolves with final state.
  watchContract(contract_id, onUpdate) {
    return new Promise((resolve, reject) => {
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
    try {
      this.ws?.close();
    } catch {
    }
    this.ws = null;
    this.connected = false;
    this.connectingPromise = null;
  }
}
const DERIV_MARKETS = [
  { symbol: "R_10", name: "Volatility 10 Index" },
  { symbol: "R_25", name: "Volatility 25 Index" },
  { symbol: "R_50", name: "Volatility 50 Index" },
  { symbol: "R_75", name: "Volatility 75 Index" },
  { symbol: "R_100", name: "Volatility 100 Index" },
  { symbol: "1HZ10V", name: "Volatility 10 (1s) Index" },
  { symbol: "1HZ25V", name: "Volatility 25 (1s) Index" },
  { symbol: "1HZ50V", name: "Volatility 50 (1s) Index" },
  { symbol: "1HZ75V", name: "Volatility 75 (1s) Index" },
  { symbol: "1HZ100V", name: "Volatility 100 (1s) Index" }
];
export {
  DerivClient as D,
  DERIV_MARKETS as a
};
