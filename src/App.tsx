import { Nav, Hero, ResultStrip, Problem } from './sections/Top';
import { Journey, Dataset, Method } from './sections/Story';
import { EvidenceSection, Ledger, Findings, Status, ToxPredict, Team } from './sections/Rest';

export default function App() {
  return (
    <>
      <a className="skip" href="#result">Skip to content</a>
      <Nav />
      <main>
        <Hero />
        <ResultStrip />
        <Problem />
        <Journey />
        <Dataset />
        <Method />
        <EvidenceSection />
        <Ledger />
        <Findings />
        <Status />
        <ToxPredict />
        <Team />
      </main>
    </>
  );
}
