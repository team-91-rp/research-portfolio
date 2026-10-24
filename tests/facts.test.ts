import { describe, expect, it } from 'vitest';
import { FACTS, type Fact } from '../src/data/facts';
import { SOURCES } from '../src/data';
import fs from 'node:fs';
import path from 'node:path';

const entries = Object.entries(FACTS) as [string, Fact][];
const derived = entries.filter(([, f]) => f.check);
const cited = entries.filter(([, f]) => f.paperOnly);

describe('facts', () => {
  it('every fact is either derived from data or carries a citation', () => {
    for (const [k, f] of entries) {
      expect(Boolean(f.check) !== Boolean(f.paperOnly), `${k} must be exactly one of derived/cited`).toBe(true);
      expect(f.source.length, `${k} needs a source`).toBeGreaterThan(3);
    }
  });

  it.each(derived)('%s matches the value recomputed from the result files', (key, f) => {
    const recomputed = f.check!();
    const shown = Number(recomputed.toFixed(f.dp));
    expect(Math.abs(shown - f.value), `${key}: shown ${f.value}, recomputed ${recomputed}`).toBeLessThan(1e-9);
  });

  it('has a meaningful derived share (the site is mostly checked, not just cited)', () => {
    expect(derived.length).toBeGreaterThan(cited.length);
    console.log(`facts: ${derived.length} derived, ${cited.length} cited (paper/README only)`);
  });
});

const root = path.resolve(__dirname, '..', '..');
// The sibling project repositories are present on the authors' machines but not on a deploy host,
// where the committed generated JSON is the input. The file-existence check only runs when they are present.
const haveSources = fs.existsSync(path.join(root, 'PredModel_FeatureExtraction', 'outputs'));

describe.skipIf(!haveSources)('sources', () => {
  it('every extracted dataset names source files that exist', () => {
    for (const [name, files] of Object.entries(SOURCES)) {
      expect(files.length, name).toBeGreaterThan(0);
      for (const f of files) expect(fs.existsSync(path.join(root, f)), `${name}: ${f}`).toBe(true);
    }
  });
});

describe('cross-source agreement for the headline', () => {
  it('summary.json, recomputed rows and the split table agree on held-out RMSE', async () => {
    const { D } = await import('../src/data');
    const fromSummary = D.summary.test.rmse;
    const fromSplit = D.splits.single.find((r) => r.estimator === 'tabpfn' && r.evaluation === 'hold-out' && r.split.startsWith('paper'))!.rmse;
    expect(Math.abs(fromSummary - fromSplit)).toBeLessThan(2e-4);
  });
});
