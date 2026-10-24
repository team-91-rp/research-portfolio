import { useState } from 'react';
import { Tabs } from '../ui/primitives';
import { AblationPanel, EstimatorPanel, IntervalPanel, LearningPanel } from './panels2';
import { ClassPanel, HeldoutPanel, R2Panel, SplitPanel } from './panels1';

const TABS = [
  { id: 'heldout', label: 'Held-out predictions' },
  { id: 'class', label: 'By pollutant class' },
  { id: 'split', label: 'Split convention' },
  { id: 'r2', label: 'Reading R²' },
  { id: 'est', label: 'Estimators' },
  { id: 'abl', label: 'Ablations' },
  { id: 'learn', label: 'More data' },
  { id: 'int', label: 'Intervals' },
] as const;
type Id = (typeof TABS)[number]['id'];

export function Evidence() {
  const [tab, setTab] = useState<Id>('heldout');
  return (
    <div className="evidence">
      <Tabs tabs={TABS.map((x) => ({ id: x.id, label: x.label }))} value={tab} onChange={setTab} label="Evidence explorers" />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tabpanel">
        {tab === 'heldout' && <HeldoutPanel />}
        {tab === 'class' && <ClassPanel />}
        {tab === 'split' && <SplitPanel />}
        {tab === 'r2' && <R2Panel />}
        {tab === 'est' && <EstimatorPanel />}
        {tab === 'abl' && <AblationPanel />}
        {tab === 'learn' && <LearningPanel />}
        {tab === 'int' && <IntervalPanel />}
      </div>
    </div>
  );
}
