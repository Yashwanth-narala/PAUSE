import React, { useState } from "react";
import {
  ArrowLeft, ArrowRight, MessageSquareText, LoaderCircle, AlertTriangle,
  LockKeyhole, Eye, ScanSearch, CheckCircle2, ChevronUp, ChevronDown
} from "lucide-react";
import { API, samples } from "../config";
import Card from "./ResultCard";

function AnalysisPage({ onBack, initialText = "" }) {
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [traceOpen, setTraceOpen] = useState(false);

  function selectSample(sampleText) { setText(sampleText); setResult(null); setError(""); }

  async function analyze() {
    if (text.trim().length < 5) { setError("Paste a message with a few words to begin."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch(`${API}/api/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Analysis failed. Please try again.");
      setResult(data);
    } catch (err) {
      setError(`${err.message || "Unable to connect to PAUSE."} Check that the backend is running on port 8000. If Bedrock is still suspended, the analysis request will fail until access is restored.`);
    } finally { setLoading(false); }
  }

  const assessmentText = result?.assessment?.toLowerCase() || "";
  const status = assessmentText.includes("multiple") || assessmentText.includes("high-risk") || assessmentText.includes("high risk") ? "danger" : assessmentText.includes("verification") || assessmentText.includes("review") ? "warning" : "calm";

  return <main className="analysis-page">
    <div className="analysis-page-heading"><button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Change input type</button><div><span className="kicker">INPUT TYPE / MESSAGE</span><h1>Let's look at it together.</h1><p>Paste the message below. PAUSE will organize its observations, evidence, and suggested verification steps.</p></div></div>
    <div className="analysis-layout">
      <section className="card input-card">
        <div className="section-number">01 <span>/ INPUT</span></div><div className="input-card-title"><div><h2>What did you receive?</h2><p>Paste an SMS, chat, payment request, or account alert.</p></div><MessageSquareText size={23} /></div>
        <div className="samples"><small>TRY A SCENARIO</small>{samples.map(([name, sampleText]) => <button key={name} onClick={() => selectSample(sampleText)}>{name}</button>)}</div>
        <textarea value={text} maxLength={12000} onChange={e => { setText(e.target.value); setResult(null); }} placeholder="Paste the message here…" aria-label="Message to analyze" />
        <div className="submit-row"><small>{text.length.toLocaleString()} / 12,000 characters</small><button className="primary" disabled={loading || text.trim().length < 5} onClick={analyze}>{loading ? <><LoaderCircle className="spin" /> Analyzing…</> : <>Analyze with PAUSE <ArrowRight size={16} /></>}</button></div>
        {error && <div className="error"><AlertTriangle size={16} /><span>{error}</span></div>}
        <div className="privacy"><LockKeyhole size={14} /><span>Submitted text is processed for this request and is not saved to a database by this frontend. Backend logging and provider retention depend on your configuration.</span></div>
      </section>
      <section className="results" aria-live="polite">
        {!result && !loading && <div className="card empty"><div className="empty-icon"><Eye size={27} /></div><span className="kicker">YOUR REVIEW SPACE</span><h2>Your clarity starts here.</h2><p>Submit a message to see its context, observable signals, verification checklist, and safer next steps.</p><div className="steps"><span>01 Context</span><span>02 Signals</span><span>03 Verify</span><span>04 Act safely</span></div></div>}
        {loading && <div className="card empty"><LoaderCircle className="spin big" /><span className="kicker">PAUSE IS WORKING</span><h2>Reviewing the interaction</h2><p>Waiting for the analysis workflow to return its observations. This can take a little time.</p></div>}
        {result && <>
          <div className={`assessment ${status}`}><div className="assessment-icon">{status === "danger" ? <AlertTriangle /> : status === "warning" ? <ScanSearch /> : <CheckCircle2 />}</div><div><div className="kicker">PAUSE ASSESSMENT</div><h2>{result.assessment || "Assessment returned"}</h2><p>{result.confidence_note || "Review the evidence and independently verify important claims."}</p></div></div>
          <Card title="Interaction context"><b className="context">{result.context?.interaction_type || (typeof result.context === "string" ? result.context : "Context not provided")}</b>{result.context?.requested_action && <p className="body"><b>Requested action:</b> {result.context.requested_action}</p>}{result.context?.claimed_actor && <p className="body"><b>Claimed actor:</b> {result.context.claimed_actor}</p>}</Card>
          <Card title="Signals that deserve attention">{(result.signals || []).length ? result.signals.map((signal, i) => <div className="signal" key={i}><span className={`severity ${(signal.severity || "low").toLowerCase()}`}>{signal.severity || "review"}</span><div><b>{signal.name || "Observed signal"}</b><p className="quote">{signal.exact_evidence || signal.evidence || "No exact quote provided."}</p><p className="body">{signal.explanation || signal.why_it_matters || "Review this observation in context."}</p></div></div>) : <p className="body">No signals were returned. This does not guarantee that the content is safe.</p>}</Card>
          <Card title="Verification checklist">{(result.verification || []).length ? result.verification.map((item, i) => <div className="verify" key={i}><ScanSearch /><div><b>{item.claim || "Claim to verify"}</b><small>{item.status || "Independent verification recommended"}</small><p>{item.next_step || "Check using an official channel you find independently."}</p></div></div>) : <p className="body">No verification steps were returned. Independently check important claims using official channels.</p>}</Card>
          <Card title="Safer next steps"><ul>{(result.recommendations || []).map((recommendation, i) => <li key={i}>{recommendation}</li>)}</ul><div className="evidence"><b>Evidence &amp; limitations</b><p>{result.evidence_summary || "The assessment is based on the submitted content and may not include independent verification of external claims."}</p></div></Card>
          <Card title={<>Agent trace <span className="trace-label">INSPECTABLE WORKFLOW</span></>}><button className="trace-toggle" onClick={() => setTraceOpen(!traceOpen)}>{traceOpen ? "Hide workflow details" : "Show workflow details"}{traceOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>{traceOpen && (result.agent_trace || []).map((agent, i) => <div className="trace" key={i}><CheckCircle2 /><div><b>{agent.agent}</b><p>{agent.summary}</p></div><small>{agent.status}</small></div>)}{traceOpen && !(result.agent_trace || []).length && <p className="body trace-empty">No trace details were returned for this request.</p>}</Card>
          <p className="disclaimer">PAUSE provides decision support, not a guarantee that content is safe or fraudulent. Independently verify important claims before sharing information or making payments.</p>
          <button className="secondary-action" onClick={() => { setText(""); setResult(null); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Start a new analysis <ArrowRight size={15} /></button>
        </>}
      </section>
    </div>
  </main>;
}

export default AnalysisPage;
