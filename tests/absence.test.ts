import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Claims that exist in the source material but are wrong or unsupported must never ship.
const BANNED: [RegExp, string][] = [
  [/7,823|7823 (?:samples|molecules)/i, 'ToxPredict README sample count (the CSV has 7,831 molecules, 7,265 labelled)'],
  [/Knowledge-Limited/i, 'KL-HGNN README expansion (the decks say Key-Lock)'],
  [/0\.60\s*[-–]\s*0\.70|0\.70\s*[-–]\s*0\.80|0\.65\s*[-–]\s*0\.75/, 'KL-HGNN README baseline R² ranges that were never produced'],
  [/simple_gnn|env_aware_gnn|kl_hgnn\.py/, 'scripts named in the KL-HGNN README that do not exist'],
  [/\bGong\b/, 'wrong MOFDiff first author (it is Fu)'],
  [/Nature Communications[^.]{0,40}ALIGNN|ALIGNN[^.]{0,60}Nature Communications/i, 'wrong ALIGNN venue (npj Computational Materials)'],
  [/limit of detection of \d|LOD of \d/i, 'a sensing figure of merit the model does not predict'],
];

function walk(dir: string, out: string[] = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'generated') walk(p, out); }
    else if (/\.(tsx?|css|html|js)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe('known wrong claims are absent', () => {
  const root = path.resolve(__dirname, '..');
  const files = [...walk(path.join(root, 'src')), ...(fs.existsSync(path.join(root, 'dist')) ? walk(path.join(root, 'dist')) : [])];
  it('scans source files', () => expect(files.length).toBeGreaterThan(3));
  for (const [re, why] of BANNED) {
    it(`no match for ${re} (${why})`, () => {
      const hits = files.filter((f) => re.test(fs.readFileSync(f, 'utf8')));
      expect(hits, hits.join(', ')).toEqual([]);
    });
  }
});

describe('typography rules', () => {
  it('no em dash or en dash appears anywhere in the site source', () => {
    const root = path.resolve(__dirname, '..');
    const hits = walk(path.join(root, 'src')).filter((f) => /[\u2013\u2014]/.test(fs.readFileSync(f, 'utf8')));
    expect(hits, hits.join(', ')).toEqual([]);
  });
});
