import { useEffect, useRef, useState } from 'react';

/** Width of an element, kept current with ResizeObserver. */
export function useWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export const fmt = (x: number, dp = 3) => {
  const s = Math.abs(x).toFixed(dp);
  const [i, f] = s.split('.');
  const body = (i ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? `.${f}` : '');
  return x < 0 ? `−${body}` : body;
};

export const classLabel = (c: string) =>
  ({
    industrial_organic: 'Industrial organic', nitroaromatic: 'Nitroaromatic', dye_anionic: 'Anionic dye',
    antibiotic: 'Antibiotic', metalloid_oxyanion: 'Metalloid oxyanion', edc_phenolic: 'Phenolic EDC',
    pharmaceutical: 'Pharmaceutical', heavy_metal: 'Heavy metal', uremic_toxin: 'Uremic toxin',
    pfas: 'PFAS', dye_cationic: 'Cationic dye', pesticide_herbicide: 'Pesticide / herbicide', mycotoxin: 'Mycotoxin',
  } as Record<string, string>)[c] ?? c;
