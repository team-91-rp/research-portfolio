import heldout from './generated/heldout.json';
import summary from './generated/summary.json';
import classError from './generated/classError.json';
import splits from './generated/splits.json';
import estimators from './generated/estimators.json';
import ablations from './generated/ablations.json';
import learning from './generated/learning.json';
import conformal from './generated/conformal.json';
import paperVariance from './generated/paperVariance.json';
import embeddingProbe from './generated/embeddingProbe.json';
import structureVerification from './generated/structureVerification.json';
import leakAudit from './generated/leakAudit.json';
import proto from './generated/proto.json';
import dataset from './generated/dataset.json';
import tox from './generated/tox.json';

export interface HeldoutRow {
  id: string; paper: string; framework: string; species: string; cls: string;
  qe: number; y: number; yPred: number; qePred: number; absErr: number;
}
export interface ClassErr { cls: string; n: number; rmse: number; mae: number }
export interface SplitSingle {
  estimator: string; evaluation: string; split: string; n: number;
  rmse: number; mae: number; r2: number; medianFE: number; within2: number;
}
export interface SplitRepeated { view: string; metric: string; n: number; mean: number; sd: number; min: number; max: number }
export interface EstimatorRow {
  variant: string; version: string; target: string; testRmse: number; testSd: number; testMae: number;
  testR2: number; within2: number; fw: number; sp: number; genAll: number;
  delta: number | null; deltaLo: number | null; deltaHi: number | null; pBetter: number | null;
}
export interface AblationRow { estimator: string; block: string; n: number; rmse: number; mae: number; r2: number }
export interface CrossRow {
  estimator: string; variant: string; nFeatures: number; testRmse: number | null; testR2: number | null;
  fw: number | null; sp: number | null; genAll: number | null;
}
export interface PermRow { estimator: string; block: string; increase: number }
export interface ConformalRow {
  estimator: string; target: string; method: string; nominal: number; coverage: number; widthDex: number; widthFold: number;
}

export const D = {
  heldout: heldout.data as HeldoutRow[],
  summary: summary.data as typeof summary.data,
  classError: classError.data as ClassErr[],
  splits: splits.data as { single: SplitSingle[]; repeated: SplitRepeated[] },
  estimators: estimators.data as EstimatorRow[],
  ablations: ablations.data as {
    devCv: AblationRow[]; fwDisjoint: AblationRow[]; cross: CrossRow[]; permutation: PermRow[];
  },
  learning: learning.data as {
    held: { rows: number; papers: number; rmse: number; drawSd: number; seedSd: number }[];
    views: { view: string; rows: number; rmse: number; drawSd: number }[];
    asymptotes: { view: string; asymptote: number }[];
    projection: { rows: number; rmse: number; gain: number }[];
  },
  conformal: conformal.data as ConformalRow[],
  paperVariance: paperVariance.data as {
    papers: number; rows: number; rmseNow: number; icc: number; rmseIfRemoved: number;
  },
  embeddingProbe: embeddingProbe.data as { property: string; loo: number; spearman: number }[],
  structureVerification: structureVerification.data as {
    framework: string; cod: number; source: string; pctDiff: number; status: string;
  }[],
  leakAudit: leakAudit.data as { counts: Record<string, number>; columns: { column: string; category: string; reason: string }[] },
  proto: proto.data as {
    records: number; mofNames: number; sourceGroups: number; baselineRows: number;
    baselineSplit: Record<string, number>; structureStatus: Record<string, number>;
    results: { split: string; rmse: number; mae: number; r2: number }[];
  },
  dataset: dataset.data as {
    records: number; publicationGroups: number; mofNames: number; adsorbateNames: number; usable: number;
    usablePapers: number; rowsBySplit: Record<string, number>; papersBySplit: Record<string, number>;
    extractionShare: Record<string, number>; doiShare: number; refTestRows: number; refTestPapers: number;
    structureRecipes: Record<string, number>;
  },
  tox: tox.data as { molecules: number; labelled: number; positives: number; positiveShare: number },
};

export const SOURCES = {
  heldout: heldout.source, summary: summary.source, classError: classError.source, splits: splits.source,
  estimators: estimators.source, ablations: ablations.source, learning: learning.source,
  conformal: conformal.source, paperVariance: paperVariance.source, embeddingProbe: embeddingProbe.source,
  structureVerification: structureVerification.source, leakAudit: leakAudit.source, proto: proto.source,
  dataset: dataset.source, tox: tox.source,
};

export const find = <T,>(xs: T[], pred: (x: T) => boolean, what: string): T => {
  const x = xs.find(pred);
  if (!x) throw new Error(`data lookup failed: ${what}`);
  return x;
};
