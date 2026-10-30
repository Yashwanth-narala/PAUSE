import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Link2,
  LoaderCircle,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { API } from "../config";

const URL_SAMPLES = [
  { label: "HTTPS website", value: "https://example.com/login" },
  { label: "HTTP website", value: "http://example.com/login" },
  { label: "URL user-info syntax", value: "https://example.com@evil.invalid/login" },
  { label: "Shortened link", value: "https://bit.ly/example" },
];

function getAssessmentStatus(assessment = "") {
  const value = assessment.toLowerCase();
  if (value.includes("multiple") || value.includes("high-risk") || value.includes("high risk")) {
    return "danger";
  }
  if (value.includes("verification") || value.includes("review")) {
    return "warning";
  }
  return "calm";
}

function humanizeSeverity(severity = "low") {
  const value = String(severity).toLowerCase();
  if (value === "high") return "High";
  if (value === "medium") return "Medium";
  return "Low";
}

function ResultSection({ title, children }) {
  return (
    <section className="url-result-card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export default function UrlPage({ onBack }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const assessmentStatus = useMemo(
    () => getAssessmentStatus(result?.assessment || ""),
    [result]
  );

  function updateUrl(value) {
    setUrl(value);
    setError("");
    setResult(null);
  }

  function validateUrl(value) {
    const trimmed = value.trim();
    if (!trimmed) return "Enter a URL to analyze.";
    if (trimmed.length > 2048) return "The URL must be 2,048 characters or fewer.";
    if (/\s/.test(trimmed)) return "Remove spaces from the URL and try again.";

    try {
      const parsed = new URL(trimmed);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "Only HTTP and HTTPS URLs are supported.";
      }
      if (!parsed.hostname || !parsed.hostname.includes(".")) {
        return "Enter a complete website address, such as https://example.com.";
      }
      return "";
    } catch {
      return "Enter a complete URL, including https:// or http://.";
    }
  }

  async function analyzeUrl(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/api/analyze-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = typeof data.detail === "string"
          ? data.detail
          : "URL analysis failed. Please check the URL and try again.";
        throw new Error(detail);
      }

      setResult(data);
      window.setTimeout(() => {
        document.getElementById("url-analysis-results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setError(
        `${err.message || "Unable to connect to PAUSE."} Check that the backend is running on port 8000 and that POST /api/analyze-url is available.`
      );
    } finally {
      setLoading(false);
    }
  }

  const metadata = result?.url_metadata || {};
  const signals = Array.isArray(result?.signals) ? result.signals : [];
  const recommendations = Array.isArray(result?.recommendations) ? result.recommendations : [];
  const verification = Array.isArray(result?.verification) ? result.verification : [];

  return (
    <main className="url-page">
      <div className="url-page-heading">
        <button type="button" className="url-back-link" onClick={onBack}>
          <ArrowLeft size={16} /> Change input type
        </button>
        <div className="url-heading-copy">
          <span className="url-kicker">INPUT TYPE / URL</span>
          <h1>Check a link before you trust it.</h1>
          <p>
            PAUSE inspects the URL structure and highlights warning signs. It does not
            open the destination website.
          </p>
        </div>
      </div>

      <div className="url-layout">
        <section className="url-panel">
          <div className="url-section-number">01 <span>/ URL INPUT</span></div>
          <div className="url-input-title">
            <div>
              <h2>Which link would you like to inspect?</h2>
              <p>Paste the full website address, including http:// or https://.</p>
            </div>
            <div className="url-title-icon"><Link2 size={23} /></div>
          </div>

          <div className="url-samples">
            <small>TRY A TEST URL</small>
            <div className="url-sample-buttons">
              {URL_SAMPLES.map((sample) => (
                <button type="button" key={sample.label} onClick={() => updateUrl(sample.value)}>
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={analyzeUrl}>
            <label className="url-field-label" htmlFor="pause-url-input">Website URL</label>
            <div className="url-field-wrap">
              <Globe size={19} aria-hidden="true" />
              <input
                id="pause-url-input"
                type="url"
                value={url}
                maxLength={2048}
                onChange={(event) => updateUrl(event.target.value)}
                placeholder="https://example.com"
                autoComplete="url"
                spellCheck="false"
                aria-describedby="url-input-help"
              />
              {url && (
                <button
                  type="button"
                  className="url-clear-button"
                  onClick={() => updateUrl("")}
                  aria-label="Clear URL"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="url-input-help" id="url-input-help">
              <span>{url.length.toLocaleString()} / 2,048 characters</span>
              <span>HTTP and HTTPS supported</span>
            </div>

            <button className="url-primary-button" type="submit" disabled={loading || !url.trim()}>
              {loading ? (
                <><LoaderCircle className="url-spin" size={17} /> Analyzing URL…</>
              ) : (
                <>Analyze with PAUSE <ArrowRight size={17} /></>
              )}
            </button>
          </form>

          {error && (
            <div className="url-error" role="alert">
              <AlertTriangle size={17} />
              <span>{error}</span>
            </div>
          )}

          <div className="url-privacy-note">
            <LockKeyhole size={15} />
            <span>
              PAUSE does not visit the submitted URL in this feature. This is a
              structural inspection, not a live reputation check.
            </span>
          </div>
        </section>

        <aside className="url-side-note">
          <div className="url-side-icon"><ShieldCheck size={22} /></div>
          <h3>What we check</h3>
          <ul>
            <li>URL format and hostname structure</li>
            <li>HTTP versus HTTPS</li>
            <li>Known URL shortener domains</li>
            <li>Potentially confusing user-info syntax</li>
            <li>Selected words and patterns that may warrant caution</li>
          </ul>
          <div className="url-side-caution">
            <ShieldAlert size={17} />
            <p>A warning is not proof of fraud. No warning is not proof of safety.</p>
          </div>
        </aside>
      </div>

      {result && (
        <section className="url-results" id="url-analysis-results" aria-live="polite">
          <div className="url-results-heading">
            <div>
              <span className="url-kicker">02 / ANALYSIS REPORT</span>
              <h2>Here’s what PAUSE found.</h2>
            </div>
            <span className={`url-assessment-pill ${assessmentStatus}`}>
              {assessmentStatus === "danger" ? <ShieldAlert size={16} /> :
                assessmentStatus === "warning" ? <AlertTriangle size={16} /> :
                  <CheckCircle2 size={16} />}
              {result.assessment || "Assessment unavailable"}
            </span>
          </div>

          <ResultSection title="URL overview">
            <div className="url-overview">
              <div className="url-overview-row">
                <span>Submitted URL</span>
                <strong className="url-break-word">{metadata.url || url}</strong>
              </div>
              <div className="url-overview-row">
                <span>Hostname</span>
                <strong className="url-break-word">{metadata.hostname || "Not provided"}</strong>
              </div>
              <div className="url-overview-row">
                <span>Connection scheme</span>
                <strong>{metadata.scheme?.toUpperCase() || "Unknown"}</strong>
              </div>
              <div className="url-overview-row">
                <span>HTTPS</span>
                <strong>{metadata.uses_https ? "Enabled (not proof of safety)" : "Not enabled"}</strong>
              </div>
              <div className="url-overview-row">
                <span>Known URL shortener</span>
                <strong>{metadata.is_known_shortener ? "Yes" : "No"}</strong>
              </div>
            </div>
          </ResultSection>

          <ResultSection title={`Observed indicators (${signals.length})`}>
            {signals.length ? (
              <div className="url-signals">
                {signals.map((signal, index) => (
                  <article className="url-signal" key={`${signal.name || "signal"}-${index}`}>
                    <div className="url-signal-top">
                      <strong>{signal.name || "Risk indicator"}</strong>
                      <span className={`url-severity ${String(signal.severity || "low").toLowerCase()}`}>
                        {humanizeSeverity(signal.severity)}
                      </span>
                    </div>
                    {signal.evidence && (
                      <div className="url-evidence">
                        <span>Observed</span>
                        <code>{signal.evidence}</code>
                      </div>
                    )}
                    {signal.why_it_matters && <p>{signal.why_it_matters}</p>}
                  </article>
                ))}
              </div>
            ) : (
              <p className="url-empty-state">No structured indicators were returned. This does not guarantee the URL is safe.</p>
            )}
          </ResultSection>

          {result.evidence_summary && (
            <ResultSection title="Evidence summary">
              <p className="url-body-copy">{result.evidence_summary}</p>
            </ResultSection>
          )}

          {recommendations.length > 0 && (
            <ResultSection title="Recommended next steps">
              <ul className="url-recommendations">
                {recommendations.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
              </ul>
            </ResultSection>
          )}

          {verification.length > 0 && (
            <ResultSection title="Verification checks">
              <div className="url-verification-list">
                {verification.map((item, index) => (
                  <div className="url-verification-item" key={`${item.claim || "check"}-${index}`}>
                    <strong>{item.claim || "Claim to verify"}</strong>
                    {item.status && <span>{item.status}</span>}
                    {item.next_step && <p>{item.next_step}</p>}
                  </div>
                ))}
              </div>
            </ResultSection>
          )}

          {result.confidence_note && (
            <div className="url-confidence-note">
              <Sparkles size={17} />
              <p>{result.confidence_note}</p>
            </div>
          )}

          <div className="url-result-footer">
            <ExternalLink size={16} />
            <span>PAUSE did not open this link or independently verify the destination.</span>
          </div>
        </section>
      )}
    </main>
  );
}
