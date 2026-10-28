import React, { useRef, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Upload,
  FileUp,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  X,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";
const ACCEPTED_TYPES = [".pdf", ".txt", ".docx"];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatus(data) {
  const assessment = data?.assessment || data?.risk_assessment || {};
  const raw =
    assessment?.risk_level ||
    assessment?.level ||
    assessment?.status ||
    data?.risk_level ||
    data?.status ||
    data?.classification ||
    "";
  const value = String(raw).toLowerCase();
  if (/high|critical|danger|malicious|phishing|scam/.test(value)) return "danger";
  if (/medium|suspicious|warning|caution/.test(value)) return "warning";
  if (/low|safe|legitimate|clean|benign/.test(value)) return "safe";
  return "unknown";
}

function firstAvailable(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function getList(data, keys) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.assessment?.[key])) return data.assessment[key];
    if (Array.isArray(data?.analysis?.[key])) return data.analysis[key];
  }
  return [];
}

export default function DocPage({ onBack }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const chooseFile = (candidate) => {
    setError("");
    setResult(null);
    if (!candidate) return;

    const lowerName = candidate.name.toLowerCase();
    const validExtension = ACCEPTED_TYPES.some((ext) => lowerName.endsWith(ext));
    if (!validExtension) {
      setFile(null);
      setError("Please choose a PDF, TXT, or DOCX file.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("The file is larger than 15 MB. Please choose a smaller document.");
      return;
    }
    setFile(candidate);
  };

  const analyzeDocument = async (event) => {
    event.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // This endpoint expects multipart/form-data with a field named "file".
      const response = await fetch(`${API_BASE}/api/analyze-document`, {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : { detail: await response.text() };

      if (!response.ok) {
        throw new Error(
          payload?.detail ||
            payload?.message ||
            `Document analysis failed (HTTP ${response.status}).`
        );
      }
      setResult(payload);
    } catch (err) {
      setError(
        err?.message?.includes("Failed to fetch")
          ? "Cannot connect to the PAUSE backend. Check that FastAPI is running on http://127.0.0.1:8000 and that /api/analyze-document is available."
          : err.message || "Unable to analyze this document. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const status = result ? getStatus(result) : "unknown";
  const assessment =
    result?.assessment ||
    result?.risk_assessment ||
    result?.analysis?.assessment ||
    {};
  const summary = firstAvailable(
    assessment?.summary,
    assessment?.reason,
    assessment?.explanation,
    result?.summary,
    result?.analysis?.summary,
    result?.message,
    result?.context?.summary
  );
  const signals = getList(result, [
    "signals",
    "risk_signals",
    "suspicious_signals",
    "indicators",
  ]);
  const recommendations = getList(result, [
    "recommendations",
    "recommended_actions",
    "safety_recommendations",
    "next_steps",
  ]);
  const evidence = getList(result, ["evidence", "findings", "key_findings"]);
  const confidence = firstAvailable(
    assessment?.confidence,
    result?.confidence,
    result?.context?.confidence
  );
  const riskLabel = firstAvailable(
    assessment?.risk_level,
    assessment?.level,
    assessment?.status,
    result?.risk_level,
    result?.classification,
    result?.status,
    "Assessment available"
  );

  const renderItem = (item, index) => {
    if (typeof item === "string" || typeof item === "number") {
      return <li key={`${index}-${item}`}>{String(item)}</li>;
    }
    if (!item || typeof item !== "object") return null;
    const title = firstAvailable(item.title, item.name, item.signal, item.type, item.label, `Finding ${index + 1}`);
    const detail = firstAvailable(item.description, item.explanation, item.reason, item.details, item.evidence, item.message);
    const severity = firstAvailable(item.severity, item.risk, item.level);
    return (
      <li className="doc-result-item" key={`${index}-${title}`}>
        <div className="doc-result-item-top">
          <strong>{String(title)}</strong>
          {severity && <span className="doc-severity">{String(severity)}</span>}
        </div>
        {detail && <p>{String(detail)}</p>}
      </li>
    );
  };

  return (
    <main className="doc-page">
      <button type="button" className="doc-back-button" onClick={onBack}>
        <ArrowLeft size={17} />
        <span>Back</span>
      </button>

      <header className="doc-page-heading">
        <div className="doc-heading-icon"><FileText size={27} /></div>
        <p className="doc-eyebrow">DOCUMENT SECURITY</p>
        <h1>Document Analysis</h1>
        <p className="doc-heading-description">
          Inspect documents for suspicious claims, unexpected payment requests,
          pressure tactics, and other potential signs of fraud.
        </p>
      </header>

      <div className="doc-layout">
        <section className="doc-panel">
          <div className="doc-step-label">01 <span>/ UPLOAD DOCUMENT</span></div>
          <div className="doc-upload-intro">
            <div>
              <h2>Choose a document to inspect</h2>
              <p>Upload a file and PAUSE will analyze its readable content.</p>
            </div>
            <div className="doc-upload-small-icon"><FileUp size={22} /></div>
          </div>

          <form onSubmit={analyzeDocument}>
            <input
              ref={inputRef}
              className="doc-hidden-input"
              type="file"
              accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />

            {!file ? (
              <button
                type="button"
                className={`doc-dropzone${dragging ? " is-dragging" : ""}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  chooseFile(event.dataTransfer.files?.[0]);
                }}
              >
                <span className="doc-drop-icon"><Upload size={24} /></span>
                <strong>Drop your document here</strong>
                <span>or click to browse files</span>
                <small>PDF, TXT, or DOCX · Maximum 15 MB</small>
              </button>
            ) : (
              <div className="doc-selected-file">
                <div className="doc-file-icon"><FileText size={24} /></div>
                <div className="doc-file-details">
                  <strong title={file.name}>{file.name}</strong>
                  <span>{formatBytes(file.size)} · Ready to analyze</span>
                </div>
                <button
                  type="button"
                  className="doc-remove-file"
                  aria-label="Remove selected file"
                  onClick={() => { setFile(null); setResult(null); if (inputRef.current) inputRef.current.value = ""; }}
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="doc-upload-help">
              <span>Supported formats: PDF, TXT, DOCX</span>
              <span>Maximum file size: 15 MB</span>
            </div>

            <button className="doc-primary-button" type="submit" disabled={!file || loading}>
              {loading ? <><LoaderCircle className="doc-spin" size={19} /> Analyzing document…</> : <><ShieldCheck size={19} /> Analyze with PAUSE</>}
            </button>
          </form>

          {error && (
            <div className="doc-error" role="alert">
              <AlertTriangle size={19} />
              <span>{error}</span>
            </div>
          )}

          <div className="doc-privacy-note">
            <LockKeyhole size={17} />
            <p>Only upload documents you are authorized to share. Analysis results are automated and should be verified independently.</p>
          </div>
        </section>

        <aside className="doc-side-card">
          <div className="doc-side-icon"><ShieldAlert size={23} /></div>
          <h3>What PAUSE looks for</h3>
          <ul>
            <li>Unexpected fees, deposits, or payment instructions</li>
            <li>Urgent deadlines and pressure to act quickly</li>
            <li>Requests for passwords, personal details, or financial information</li>
            <li>Suspicious claims, impersonation, and inconsistent details</li>
          </ul>
          <div className="doc-caution">
            <AlertTriangle size={18} />
            <p>A document can contain risks even when its wording and formatting look professional.</p>
          </div>
        </aside>
      </div>

      {result && (
        <section className="doc-results" aria-live="polite">
          <div className="doc-results-heading">
            <div>
              <p className="doc-eyebrow">02 / ANALYSIS COMPLETE</p>
              <h2>Document assessment</h2>
            </div>
            <span className={`doc-status-pill ${status}`}>
              {status === "danger" ? <ShieldAlert size={17} /> : status === "safe" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
              {String(riskLabel)}
            </span>
          </div>

          {summary && (
            <article className="doc-result-card">
              <h3>Summary</h3>
              <p className="doc-summary-text">
                {typeof summary === "string" ? summary : JSON.stringify(summary)}
              </p>
            </article>
          )}

          <article className="doc-result-card">
            <h3>Risk signals</h3>
            {signals.length ? (
              <ul className="doc-result-list">{signals.map(renderItem)}</ul>
            ) : (
              <p className="doc-muted">No separate risk-signal list was returned by the API.</p>
            )}
          </article>

          {evidence.length > 0 && (
            <article className="doc-result-card">
              <h3>Evidence and findings</h3>
              <ul className="doc-result-list">{evidence.map(renderItem)}</ul>
            </article>
          )}

          <article className="doc-result-card">
            <h3>Recommended next steps</h3>
            {recommendations.length ? (
              <ul className="doc-recommendations">{recommendations.map(renderItem)}</ul>
            ) : (
              <p className="doc-muted">Follow your organization’s verification process before acting on requests in the document.</p>
            )}
          </article>

          {confidence !== undefined && (
            <p className="doc-confidence">Confidence: {typeof confidence === "object" ? JSON.stringify(confidence) : String(confidence)}</p>
          )}

          <div className="doc-results-footer">
            <AlertTriangle size={17} />
            <p>Automated analysis is a screening aid, not proof that a document is safe or fraudulent. Verify important claims through a trusted channel.</p>
          </div>

          <button
            type="button"
            className="doc-secondary-button"
            onClick={() => { setFile(null); setResult(null); setError(""); if (inputRef.current) inputRef.current.value = ""; }}
          >
            <RefreshCw size={16} /> Analyze another document
          </button>
        </section>
      )}
    </main>
  );
}
