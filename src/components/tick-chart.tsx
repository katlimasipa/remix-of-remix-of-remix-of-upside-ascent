import { useEffect, useRef } from "react";
import { createChart, AreaSeries, LineStyle, type IChartApi, type ISeriesApi, type Time, type UTCTimestamp } from "lightweight-charts";

export type TickPoint = { epoch: number; quote: number };

/**
 * Real-time tick chart. Renders an area series of incoming tick quotes.
 * Up vs down direction is implied by colour shifts on the latest segment via priceLine.
 */
export function TickChart({
  ticks,
  className,
  height = 320,
  trend = "flat",
  markers,
}: {
  ticks: TickPoint[];
  className?: string;
  height?: number;
  trend?: "up" | "down" | "flat";
  markers?: { epoch: number; type: "buy-up" | "buy-down" | "win" | "loss" }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const lineRef = useRef<ReturnType<ISeriesApi<"Area">["createPriceLine"]> | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#94a3b8",
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.06)" },
        horzLines: { color: "rgba(148,163,184,0.06)" },
      },
      rightPriceScale: { borderColor: "rgba(148,163,184,0.08)" },
      timeScale: { borderColor: "rgba(148,163,184,0.08)", timeVisible: true, secondsVisible: true, rightOffset: 6 },
      crosshair: { mode: 1 },
      handleScroll: true,
      handleScale: true,
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#60a5fa",
      topColor: "rgba(96,165,250,0.35)",
      bottomColor: "rgba(96,165,250,0.0)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    const ro = new ResizeObserver(() => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth }); });
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, [height]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    const color = trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#60a5fa";
    series.applyOptions({
      lineColor: color,
      topColor: trend === "up" ? "rgba(34,197,94,0.35)" : trend === "down" ? "rgba(239,68,68,0.35)" : "rgba(96,165,250,0.35)",
      bottomColor: "rgba(0,0,0,0)",
    });
  }, [trend]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    // Dedup + ascending
    const map = new Map<number, number>();
    for (const t of ticks) map.set(t.epoch, t.quote);
    const sorted = Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
    series.setData(sorted.map(([epoch, quote]) => ({ time: epoch as UTCTimestamp, value: quote })));

    const last = sorted[sorted.length - 1];
    if (last) {
      if (lineRef.current) series.removePriceLine(lineRef.current);
      lineRef.current = series.createPriceLine({
        price: last[1],
        color: trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#60a5fa",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "spot",
      });
    }
  }, [ticks, trend]);

  return <div ref={ref} className={className} style={{ height }} />;
}
