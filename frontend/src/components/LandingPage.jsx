import { ShieldCheck, ScanSearch, Eye, LockKeyhole, ArrowRight } from "lucide-react";

function LandingPage({ onStart }) {
  return <main className="landing">
    <div className="landing-copy">
     
<div className="eyebrow">
  <span className="eyebrow-line" /> A MOMENT BEFORE THE NEXT STEP
</div>

<h1 className="main-title">
  Personal AI Understanding & Safety Engine
</h1>

<div className="tagline-stack">
  <h3 className="tagline-line tagline-orange">Before you click.</h3>
  <h3 className="tagline-line tagline-green">Before you pay.</h3>
  <h3 className="tagline-line tagline-blue">Before you act.</h3>
</div>
      <p className="landing-description">An explainable AI safety layer for everyday digital interactions. Understand what you received, inspect the evidence, and know what to verify before you take action.</p>
      <div className="landing-actions">
        <button className="primary primary-large" onClick={onStart}>Start analysis <ArrowRight size={18} /></button>
        <a className="text-action" href="#how-it-works">Explore how it works <ArrowRight size={15} /></a>
      </div>
      <div className="landing-note"><LockKeyhole size={15} /> Thoughtful checks. Clear explanations. Safer decisions.</div>
    </div>
    <div className="landing-art" aria-hidden="true">
      <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
      <div className="art-circle circle-cyan" /><div className="art-circle circle-orange" />
      <div className="art-circle circle-blue" /><div className="art-circle circle-green" />
      <div className="art-ribbon ribbon-blue" /><div className="art-ribbon ribbon-orange" /><div className="art-ribbon ribbon-cyan" />
      <div className="art-center"><ShieldCheck size={47} strokeWidth={1.2} /><span>PAUSE</span><small>UNDERSTAND · VERIFY · ACT</small></div>
    </div>
    <section className="how-section" id="how-it-works">
      <div><span className="kicker">A SIMPLE, HUMAN WORKFLOW</span><h2>Make room for a better decision.</h2></div>
      <div className="how-grid">
        <article><span className="how-number">01</span><ScanSearch /><h3>Understand</h3><p>Identify what the message is asking you to do and who it claims to represent.</p></article>
        <article><span className="how-number">02</span><Eye /><h3>Inspect</h3><p>Review observable signals and the evidence that supports each observation.</p></article>
        <article><span className="how-number">03</span><ShieldCheck /><h3>Verify</h3><p>Get practical next steps to independently check important claims before acting.</p></article>
      </div>
    </section>
  </main>;
}

export default LandingPage;
