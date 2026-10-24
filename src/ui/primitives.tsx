import { useEffect, useRef, useState, type ReactNode } from 'react';
import { fmt } from '../lib';

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${seen ? 'in' : ''} ${className}`}>{children}</div>;
}

export function Section({ id, title, intro, children, tone }: { id: string; title: string; intro?: ReactNode; children: ReactNode; tone?: 'plain' | 'tint' }) {
  return (
    <section id={id} className={`section ${tone === 'tint' ? 'section-tint' : ''}`} aria-labelledby={`${id}-h`}>
      <div className="page">
        <Reveal>
          <h2 id={`${id}-h`}>{title}</h2>
          {intro ? <div className="section-intro">{intro}</div> : null}
        </Reveal>
        {children}
      </div>
    </section>
  );
}

export function SourceNote({ files }: { files: string[] }) {
  return (
    <p className="source-note">
      Source: {files.map((f, i) => (<span key={f}>{i ? ', ' : ''}<code title={f}>{f.split('/').slice(-1)[0]}</code></span>))}
    </p>
  );
}

export function Callout({ tone = 'note', title, children }: { tone?: 'note' | 'caveat' | 'planned'; title?: string; children: ReactNode }) {
  return (
    <aside className={`callout callout-${tone}`}>
      {title ? <h4>{title}</h4> : null}
      <div>{children}</div>
    </aside>
  );
}

export function Badge({ tone = 'accent', children }: { tone?: 'accent' | 'amber' | 'plain'; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void; label: string }) {
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = tabs.length;
    const go = (j: number) => { const t = tabs[(j + n) % n]; if (t) { onChange(t.id); (document.getElementById(`tab-${t.id}`) as HTMLElement | null)?.focus(); } };
    if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
    if (e.key === 'Home') { e.preventDefault(); go(0); }
    if (e.key === 'End') { e.preventDefault(); go(n - 1); }
  };
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button key={t.id} id={`tab-${t.id}`} role="tab" aria-selected={value === t.id} aria-controls={`panel-${t.id}`}
          tabIndex={value === t.id ? 0 : -1} className="tab" onClick={() => onChange(t.id)} onKeyDown={(e) => onKey(e, i)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function ViewSwitch({ view, onChange }: { view: 'chart' | 'table'; onChange: (v: 'chart' | 'table') => void }) {
  return (
    <div className="viewswitch" role="group" aria-label="Chart or table view">
      {(['chart', 'table'] as const).map((v) => (
        <button key={v} aria-pressed={view === v} onClick={() => onChange(v)}>{v === 'chart' ? 'Chart' : 'Table'}</button>
      ))}
    </div>
  );
}

export interface Col<R> { key: string; label: string; render: (r: R) => ReactNode; num?: boolean }
export function DataTable<R>({ cols, rows, caption, maxHeight }: { cols: Col<R>[]; rows: R[]; caption: string; maxHeight?: number }) {
  return (
    <div className="table-wrap" style={maxHeight ? { maxHeight } : undefined} tabIndex={0} role="region" aria-label={caption}>
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead><tr>{cols.map((c) => <th key={c.key} scope="col" className={c.num ? 'num' : ''}>{c.label}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (<tr key={i}>{cols.map((c) => <td key={c.key} className={c.num ? 'num tnum' : ''}>{c.render(r)}</td>)}</tr>))}</tbody>
      </table>
    </div>
  );
}

/** Horizontal bars as plain HTML: 24px max thickness, rounded data end, value at the tip. */
export function HBars({ items, max, format = (x: number) => fmt(x, 3), highlight, label }:
  { items: { key: string; label: string; value: number; sub?: string; muted?: boolean; display?: string }[]; max?: number; format?: (x: number) => string; highlight?: string; label: string }) {
  const top = max ?? Math.max(...items.map((i) => i.value));
  return (
    <ul className="hbars" aria-label={label}>
      {items.map((it) => (
        <li key={it.key} className={highlight === it.key ? 'is-hl' : ''}>
          <span className="hb-label">{it.label}{it.sub ? <small>{it.sub}</small> : null}</span>
          <span className="hb-track"><span className={`hb-bar ${it.muted ? 'muted' : ''}`} style={{ width: `${Math.max(0.5, (100 * Math.max(0, it.value)) / top)}%` }} /></span>
          <span className="hb-val tnum">{it.display ?? format(it.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Stat({ value, label, note }: { value: ReactNode; label: string; note?: ReactNode }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {note ? <div className="stat-note">{note}</div> : null}
    </div>
  );
}
