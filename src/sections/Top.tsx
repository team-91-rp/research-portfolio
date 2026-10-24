import { ArrowDown, ArrowRight, List, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { D } from '../data';
import { t } from '../data/facts';
import { Parity } from '../charts/Parity';
import { Callout, Reveal, Section, Stat } from '../ui/primitives';

export const REPO_URL = 'https://github.com/team-91-rp/research-portfolio';

const LINKS = [
  { id: 'result', label: 'Result' }, { id: 'journey', label: 'Journey' }, { id: 'data', label: 'Dataset' },
  { id: 'method', label: 'Method' }, { id: 'evidence', label: 'Evidence' }, { id: 'ledger', label: 'Experiments' },
  { id: 'findings', label: 'Findings' }, { id: 'status', label: 'Next' }, { id: 'team', label: 'Team' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <div className="page nav-in">
        <a href="#top" className="brand" aria-label="Team 91, back to top">Team 91</a>
        <nav aria-label="Sections" className={`nav-links ${open ? 'open' : ''}`}>
          {LINKS.map((l) => (<a key={l.id} href={`#${l.id}`} onClick={() => setOpen(false)}>{l.label}</a>))}
        </nav>
        <button className="nav-toggle" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <List size={22} />}
        </button>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section id="top" className="hero">
      <div className="page hero-grid">
        <div className="hero-copy">
          <p className="hero-status">Research in progress.</p>
          <h1>Will this MOF capture that pollutant?</h1>
          <p className="hero-sub">A leakage-audited dataset and a pretrained model that predicts MOF uptake from water, for publications it has never seen.</p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="#result">See the result <ArrowDown size={18} /></a>
            <a className="btn btn-secondary" href="#journey">Follow the journey <ArrowRight size={18} /></a>
          </div>
        </div>
        <figure className="hero-fig">
          <Parity rows={D.heldout} maxSize={520} ariaLabel={`Predicted against measured adsorption capacity for ${D.heldout.length} held-out measurements`} />
          <figcaption>{t('nTest')} measurements from {t('nTestPapers')} publications the model never saw. Each dot is one prediction; the diagonal is perfect agreement.</figcaption>
        </figure>
      </div>
    </section>
  );
}

export function ResultStrip() {
  return (
    <Section id="result" title="The result, on one screen" tone="tint"
      intro={<p>Metal-organic frameworks (MOFs) are porous crystals that can capture contaminants such as heavy metals, antibiotics, pesticides and mycotoxins from liquids. Choosing a framework is still mostly trial and error. We asked how well a model can predict equilibrium uptake for a study it has never seen.</p>}>
      <Reveal>
        <div className="stats">
          <Stat value={<>{t('rmse')}<small> dex</small></>} label="Held-out RMSE" note={<>{t('pctBelowMean')}% lower than predicting the mean. An error of δ dex is a factor of 10<sup>δ</sup> in uptake.</>} />
          <Stat value={t('nTestPapers')} label="Publications held out whole" note={<>{t('nTest')} measurements the model never saw; no publication contributes to both training and test.</>} />
          <Stat value={t('nRows')} label="Modelling rows" note={<>From {t('records')} literature records across {t('nPapers')} publications, {t('nFrameworks')} frameworks and {t('nSpecies')} chemical species.</>} />
          <Stat value={<>{t('gap')}<small> dex</small></>} label="What random splits hide" note="The error a random-row evaluation would understate by, measured over ten paired partitions." />
        </div>
        <p className="r2-line">R² on the held-out publications is {t('r2')}. That figure flatters the model because the test set is unusually wide, so this site compares results by RMSE in dex and shows R² together with the spread it was computed on.</p>
        <Callout tone="caveat" title="What this model does and does not predict">
          It predicts <strong>equilibrium uptake from water</strong> for a single solute. It does not predict limit of detection, selectivity, kinetics or regeneration, and very few records come from food matrices such as milk or juice. The sensing ambition of the project is the direction of travel, not something this result demonstrates.
        </Callout>
      </Reveal>
    </Section>
  );
}

export function Problem() {
  return (
    <Section id="problem" title="Why liquids break the usual models">
      <Reveal>
        <div className="prose-grid">
          <p>Machine-learning models of MOF adsorption have been built almost entirely on gas-phase data. They take the framework as input, sometimes the guest molecule, but not the solvent, the pH or the charge state of the guest. In water those dominate: a framework surface that is positive at one pH can be negative at another, an acidic antibiotic changes charge across the same range, water competes for open metal sites, and many frameworks hydrolyse. We call this gap <em>phase blindness</em>.</p>
          <p>Two further obstacles stand in the way. No public dataset of aqueous MOF-pollutant adsorption exists at the scale of the gas-phase databases, so every record here was transcribed by hand from the primary literature ({t('pubGroups')} publication groups). And literature data are clustered: one publication contributes many rows that share a batch of material, an activation protocol and an analytical method. When rows from one paper fall on both sides of a split, a model can learn the paper instead of the chemistry, and reported accuracy is inflated.</p>
          <p>The long-term aim is a heterogeneous graph neural network with a solvation gate. A model like that can only be judged against a clean dataset and an honest baseline, so this stage of the work builds exactly those.</p>
        </div>
      </Reveal>
    </Section>
  );
}
