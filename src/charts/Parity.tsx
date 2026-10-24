import { useId, useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import type { HeldoutRow } from '../data';
import { classLabel, fmt, useWidth } from '../lib';

const M = { t: 12, r: 26, b: 46, l: 54 };

export function Parity({ rows, highlightClass = null, maxSize = 560, ariaLabel }: { rows: HeldoutRow[]; highlightClass?: string | null; maxSize?: number; ariaLabel: string }) {
  const [wrap, w] = useWidth<HTMLDivElement>(520);
  const [hover, setHover] = useState<HeldoutRow | null>(null);
  const clipId = `plot-clip-${useId().replace(/:/g, '')}`;
  const size = Math.min(w, maxSize);
  const iw = size - M.l - M.r;
  const ih = size - M.t - M.b;

  const { x, y, ticks } = useMemo(() => {
    const [lo = 0, hi = 1] = extent(rows.flatMap((r) => [r.y, r.yPred]));
    const d0 = Math.floor(lo), d1 = Math.ceil(hi);
    const sx = scaleLinear().domain([d0, d1]).range([0, iw]);
    const sy = scaleLinear().domain([d0, d1]).range([ih, 0]);
    const tk: number[] = [];
    for (let k = d0; k <= d1; k++) tk.push(k);
    return { x: sx, y: sy, ticks: tk };
  }, [rows, iw, ih]);

  const [d0, d1] = x.domain() as [number, number];
  const b2 = Math.log10(2), b5 = Math.log10(5);
  const band = (b: number) => `M${x(d0)},${y(d0 - b)} L${x(d1)},${y(d1 - b)} L${x(d1)},${y(d1 + b)} L${x(d0)},${y(d0 + b)} Z`;
  const tickLabel = (k: number) => fmt(10 ** k, k < 0 ? -k : 0);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left - M.l, py = e.clientY - r.top - M.t;
    let best: HeldoutRow | null = null, bd = 18 * 18;
    for (const row of rows) {
      const dx = x(row.y) - px, dy = y(row.yPred) - py, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = row; }
    }
    setHover(best);
  };

  const off = (r: HeldoutRow) => (highlightClass && r.cls !== highlightClass);
  const fe = hover ? 10 ** Math.abs(hover.yPred - hover.y) : 0;

  return (
    <div ref={wrap} className="chart-wrap" style={{ maxWidth: maxSize }}>
      <svg width={size} height={size} role="img" aria-label={ariaLabel} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs><clipPath id={clipId}><rect x={0} y={0} width={iw} height={ih} /></clipPath></defs>
        <g transform={`translate(${M.l},${M.t})`}>
          {ticks.map((k) => (
            <g key={k}>
              <line x1={x(k)} x2={x(k)} y1={0} y2={ih} className="grid" />
              <line x1={0} x2={iw} y1={y(k)} y2={y(k)} className="grid" />
              <text x={x(k)} y={ih + 18} textAnchor="middle" className="tick">{tickLabel(k)}</text>
              <text x={-8} y={y(k)} dy="0.32em" textAnchor="end" className="tick">{tickLabel(k)}</text>
            </g>
          ))}
          <g clipPath={`url(#${clipId})`}>
            <path d={band(b5)} fill="var(--accent)" opacity={0.07} />
            <path d={band(b2)} fill="var(--accent)" opacity={0.1} />
            <line x1={x(d0)} y1={y(d0)} x2={x(d1)} y2={y(d1)} stroke="var(--accent)" strokeWidth={1.25} opacity={0.55} />
            {rows.map((r) => (
              <circle key={r.id} cx={x(r.y)} cy={y(r.yPred)} r={hover?.id === r.id ? 6 : 4}
                fill={off(r) ? 'var(--rule-strong)' : 'var(--accent)'} fillOpacity={off(r) ? 0.7 : 0.85}
                stroke="var(--surface)" strokeWidth={1.5} />
            ))}
          </g>
          <text x={iw - 6} y={ih - 30} textAnchor="end" className="band-label">dark band: within 2×</text>
          <text x={iw - 6} y={ih - 14} textAnchor="end" className="band-label">light band: within 5×</text>
          <text x={iw / 2} y={ih + 38} textAnchor="middle" className="axis-title">Measured qe (mg/g, log scale)</text>
          <text transform={`translate(${-40},${ih / 2}) rotate(-90)`} textAnchor="middle" className="axis-title">Predicted qe (mg/g)</text>
        </g>
      </svg>
      {hover ? (
        <div className="tooltip" style={{ left: Math.min(M.l + x(hover.y) + 12, size - 190), top: Math.max(0, M.t + y(hover.yPred) - 84) }} role="status">
          <strong>{hover.framework}</strong>
          <span>{hover.species} <em>({classLabel(hover.cls)})</em></span>
          <span className="tnum">Measured {fmt(hover.qe, hover.qe < 10 ? 2 : 0)} mg/g</span>
          <span className="tnum">Predicted {fmt(hover.qePred, hover.qePred < 10 ? 2 : 0)} mg/g</span>
          <span className="tnum">Off by {fmt(fe, 2)}×</span>
        </div>
      ) : null}
    </div>
  );
}
