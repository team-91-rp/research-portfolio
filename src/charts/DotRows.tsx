import { scaleLinear } from 'd3-scale';
import { fmt, useWidth } from '../lib';

export interface DotItem { key: string; label: string; value: number; lo?: number; hi?: number; emphasis?: boolean; note?: string }

/** One row per item: a marker, an optional interval whisker, and the value at the right. */
export function DotRows({ items, domain, zero, ariaLabel, axisLabel, dp = 3 }:
  { items: DotItem[]; domain: [number, number]; zero?: boolean; ariaLabel: string; axisLabel: string; dp?: number }) {
  const [wrap, w] = useWidth<HTMLDivElement>(640);
  const labelW = w < 520 ? 150 : 250, valW = 74, rowH = 34, top = 6, bottom = 40;
  const iw = Math.max(80, w - labelW - valW - 8);
  const x = scaleLinear().domain(domain).range([0, iw]).nice();
  const h = top + items.length * rowH + bottom;
  const ticks = x.ticks(iw < 300 ? 3 : 5);
  return (
    <div ref={wrap} className="chart-wrap">
      <svg width={w} height={h} role="img" aria-label={ariaLabel}>
        <g transform={`translate(${labelW},${top})`}>
          {ticks.map((t) => (<g key={t}><line x1={x(t)} x2={x(t)} y1={0} y2={items.length * rowH} className="grid" />
            <text x={x(t)} y={items.length * rowH + 16} textAnchor="middle" className="tick">{fmt(t, dp > 3 ? 2 : 2)}</text></g>))}
          {zero ? <line x1={x(0)} x2={x(0)} y1={0} y2={items.length * rowH} stroke="var(--ink-2)" strokeWidth={1.25} /> : null}
          {items.map((it, i) => {
            const cy = i * rowH + rowH / 2;
            return (
              <g key={it.key}>
                <text x={-12} y={cy} dy="0.32em" textAnchor="end" className={`row-label ${it.emphasis ? 'em' : ''}`}>{it.label}</text>
                {it.lo !== undefined && it.hi !== undefined ? <line x1={x(it.lo)} x2={x(it.hi)} y1={cy} y2={cy} stroke={it.emphasis ? 'var(--accent)' : 'var(--ink-2)'} strokeWidth={2} strokeLinecap="round" /> : null}
                <circle cx={x(it.value)} cy={cy} r={5} fill={it.emphasis ? 'var(--accent)' : 'var(--ink-2)'} stroke="var(--surface)" strokeWidth={2} />
                <text x={iw + 10} y={cy} dy="0.32em" className="val tnum">{fmt(it.value, dp)}</text>
              </g>
            );
          })}
          <text x={iw / 2} y={items.length * rowH + 34} textAnchor="middle" className="axis-title">{axisLabel}</text>
        </g>
      </svg>
    </div>
  );
}
