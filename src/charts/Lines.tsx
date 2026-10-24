import { scaleLinear } from 'd3-scale';
import { fmt, useWidth } from '../lib';

export interface Pt { x: number; y: number; lo?: number; hi?: number }
export interface Series { key: string; label: string; pts: Pt[]; tone: 'accent' | 'ink'; dashed?: boolean; endLabel?: string; endLabelDy?: number }
export interface Ref { y: number; label: string }

const M = { t: 14, r: 120, b: 46, l: 52 };
const TONE = { accent: 'var(--accent)', ink: 'var(--ink-2)' } as const;

export function Lines({ series, refs = [], xLabel, yLabel, yDomain, xDomain, height = 300, ariaLabel }:
  { series: Series[]; refs?: Ref[]; xLabel: string; yLabel: string; yDomain: [number, number]; xDomain: [number, number]; height?: number; ariaLabel: string }) {
  const [wrap, w] = useWidth<HTMLDivElement>(560);
  const iw = w - M.l - M.r, ih = height - M.t - M.b;
  const x = scaleLinear().domain(xDomain).range([0, iw]);
  const y = scaleLinear().domain(yDomain).range([ih, 0]);
  const yt = y.ticks(5), xt = x.ticks(Math.max(3, Math.floor(iw / 90)));
  const path = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.x)},${y(p.y)}`).join(' ');
  return (
    <div ref={wrap} className="chart-wrap">
      <svg width={w} height={height} role="img" aria-label={ariaLabel}>
        <g transform={`translate(${M.l},${M.t})`}>
          {yt.map((t) => (<g key={t}><line x1={0} x2={iw} y1={y(t)} y2={y(t)} className="grid" /><text x={-8} y={y(t)} dy="0.32em" textAnchor="end" className="tick">{fmt(t, 2)}</text></g>))}
          {xt.map((t) => (<text key={t} x={x(t)} y={ih + 18} textAnchor="middle" className="tick">{fmt(t, 0)}</text>))}
          {refs.map((r) => (<g key={r.label}><line x1={0} x2={iw} y1={y(r.y)} y2={y(r.y)} stroke="var(--amber-ink)" strokeWidth={1.25} strokeDasharray="2 4" /><text x={iw + 6} y={y(r.y)} dy="0.32em" className="end-label amber">{r.label}</text></g>))}
          {series.map((s) => (
            <g key={s.key}>
              {s.pts.filter((p) => p.lo !== undefined && p.hi !== undefined).map((p) => (<line key={p.x} x1={x(p.x)} x2={x(p.x)} y1={y(p.lo as number)} y2={y(p.hi as number)} stroke={TONE[s.tone]} strokeWidth={1.25} opacity={0.45} />))}
              <path d={path(s.pts)} fill="none" stroke={TONE[s.tone]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dashed ? '1 5' : undefined} />
              {s.dashed ? null : s.pts.map((p) => (<circle key={p.x} cx={x(p.x)} cy={y(p.y)} r={4} fill={TONE[s.tone]} stroke="var(--surface)" strokeWidth={2} />))}
              {s.endLabel ? (() => { const l = s.pts[s.pts.length - 1]!; return <text x={x(l.x) + 10} y={y(l.y) + (s.endLabelDy ?? 0)} dy="0.32em" className="end-label">{s.endLabel}</text>; })() : null}
            </g>
          ))}
          <text x={iw / 2} y={ih + 40} textAnchor="middle" className="axis-title">{xLabel}</text>
          <text transform={`translate(${-38},${ih / 2}) rotate(-90)`} textAnchor="middle" className="axis-title">{yLabel}</text>
        </g>
      </svg>
    </div>
  );
}
