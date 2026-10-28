import React, { useState, useRef } from "react";
import {
  ArrowLeft, ArrowRight, Image as ImageIcon, LoaderCircle, AlertTriangle,
  CheckCircle2, Eye, LockKeyhole, ScanSearch, ChevronUp, ChevronDown
} from "lucide-react";
import { API } from "../config";
import Card from "./ResultCard";

function ScreenshotPage({ onBack }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [result, setResult] = useState(null);
  const [traceOpen, setTraceOpen] = useState(false);

  const fileInput = useRef(null);

  function selectFile(selectedFile) {
    setError("");
    setExtractedText("");
    setResult(null);

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("The image must be smaller than 10 MB.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  function removeFile() {
    if (preview) URL.revokeObjectURL(preview);

    setFile(null);
    setPreview("");
    setExtractedText("");
    setResult(null);
    setError("");

    if (fileInput.current) {
      fileInput.current.value = "";
    }
  }

  async function extractText() {
    if (!file) {
      setError("Please upload a screenshot first.");
      return;
    }

    setExtracting(true);
    setError("");
    setExtractedText("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API}/api/extract-screenshot`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not extract text from the screenshot."
        );
      }

      if (!data.text?.trim()) {
        throw new Error(
          "No readable text was detected. Try a clearer screenshot."
        );
      }

      setExtractedText(data.text);
    } catch (err) {
      setError(
        `${err.message || "Screenshot extraction failed."} Check that the backend is running on port 8000.`
      );
    } finally {
      setExtracting(false);
    }
  }

  // Analyze the extracted text without navigating to AnalysisPage.
  async function analyzeExtractedText() {
    const cleanedText = extractedText.trim();

    if (cleanedText.length < 5) {
      setError("The extracted text is too short. Please review it.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setResult(null);
    setTraceOpen(false);

    try {
      const response = await fetch(`${API}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanedText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Analysis failed. Please try again."
        );
      }

      setResult(data);

      // Show the results below the extracted text.
      setTimeout(() => {
        document
          .getElementById("screenshot-analysis-results")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (err) {
      setError(
        `${err.message || "Unable to connect to PAUSE."} Check that the backend is running on port 8000 and that the configured model is accessible.`
      );
    } finally {
      setAnalyzing(false);
    }
  }

  const assessmentText = result?.assessment?.toLowerCase() || "";

  const status =
    assessmentText.includes("multiple") ||
    assessmentText.includes("high-risk") ||
    assessmentText.includes("high risk")
      ? "danger"
      : assessmentText.includes("verification") ||
          assessmentText.includes("review")
        ? "warning"
        : "calm";

  return (
    <main className="analysis-page">
      <div className="analysis-page-heading">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={16} /> Change input type
        </button>

        <div>
          <span className="kicker">INPUT TYPE / SCREENSHOT</span>
          <h1>Let's look at it together.</h1>
          <p>
            Upload a screenshot, review the extracted text, and analyze
            it with PAUSE — all on this page.
          </p>
        </div>
      </div>

      <div className="analysis-layout">
        {/* STEP 1: Upload and extract */}
        <section className="card input-card">
          <div className="section-number">
            01 <span>/ SCREENSHOT INPUT</span>
          </div>

          <div className="input-card-title">
            <div>
              <h2>What did you receive?</h2>
              <p>
                Upload a screenshot containing the message you want to check.
              </p>
            </div>
            <ImageIcon size={23} />
          </div>

          {!file ? (
            <button
              type="button"
              className="screenshot-dropzone"
              onClick={() => fileInput.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectFile(event.dataTransfer.files?.[0]);
              }}
            >
              <ImageIcon size={36} />
              <strong>Drop your screenshot here</strong>
              <span>or click to browse your files</span>
              <small>Image files · Maximum 10 MB</small>
            </button>
          ) : (
            <div className="screenshot-preview">
              <img
                src={preview}
                alt="Screenshot selected for analysis"
              />

              <div className="screenshot-file-info">
                <span>{file.name}</span>
                <button type="button" onClick={removeFile}>
                  Remove
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) =>
              selectFile(event.target.files?.[0])
            }
          />

          <div className="submit-row">
            <small>
              {file
                ? `${(file.size / 1024).toFixed(0)} KB selected`
                : "No screenshot selected"}
            </small>

            <button
              type="button"
              className="primary"
              disabled={!file || extracting || analyzing}
              onClick={extractText}
            >
              {extracting ? (
                <>
                  <LoaderCircle className="spin" />
                  Reading screenshot…
                </>
              ) : (
                <>
                  Extract text <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* STEP 2: Review extracted text */}
          {extractedText && (
            <div className="extracted-text">
              <h3>Review extracted text</h3>
              <p>
                Check the text for OCR errors. You can edit it before
                running the safety analysis.
              </p>

              <textarea
                value={extractedText}
                maxLength={12000}
                onChange={(event) => {
                  setExtractedText(event.target.value);
                  setResult(null);
                  setError("");
                }}
                aria-label="Extracted screenshot text"
              />

              <div className="submit-row">
                <small>
                  {extractedText.length.toLocaleString()} / 12,000 characters
                </small>

                <button
                  type="button"
                  className="primary"
                  disabled={
                    analyzing || extractedText.trim().length < 5
                  }
                  onClick={analyzeExtractedText}
                >
                  {analyzing ? (
                    <>
                      <LoaderCircle className="spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      Analyze with PAUSE <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="privacy">
            <LockKeyhole size={14} />
            <span>
              Avoid uploading screenshots containing passwords, OTPs,
              or unnecessary personal information.
            </span>
          </div>
        </section>

        {/* STEP 3: Results stay on the Screenshot page */}
        <section
          className="results screenshot-results"
          id="screenshot-analysis-results"
          aria-live="polite"
        >
          {!result && !analyzing && (
            <div className="card empty">
              <div className="empty-icon">
                <Eye size={27} />
              </div>

              <span className="kicker">YOUR REVIEW SPACE</span>
              <h2>Your clarity starts here.</h2>

              <p>
                Upload a screenshot, extract its text, and run the
                analysis. Your assessment and recommendations will
                appear here without leaving this page.
              </p>

              <div className="steps">
                <span>01 Upload</span>
                <span>02 Extract</span>
                <span>03 Review</span>
                <span>04 Analyze</span>
              </div>
            </div>
          )}

          {analyzing && (
            <div className="card empty">
              <LoaderCircle className="spin big" />
              <span className="kicker">PAUSE IS WORKING</span>
              <h2>Reviewing your screenshot</h2>
              <p>
                PAUSE is analyzing the extracted text and preparing
                its assessment, signals, and verification steps.
              </p>
            </div>
          )}

          {result && (
            <>
              <div className={`assessment ${status}`}>
                <div className="assessment-icon">
                  {status === "danger" ? (
                    <AlertTriangle />
                  ) : status === "warning" ? (
                    <ScanSearch />
                  ) : (
                    <CheckCircle2 />
                  )}
                </div>

                <div>
                  <div className="kicker">PAUSE ASSESSMENT</div>
                  <h2>
                    {result.assessment || "Assessment returned"}
                  </h2>
                  <p>
                    {result.confidence_note ||
                      "Review the evidence and independently verify important claims."}
                  </p>
                </div>
              </div>

              <Card title="Interaction context">
                <b className="context">
                  {result.context?.interaction_type ||
                    (typeof result.context === "string"
                      ? result.context
                      : "Context not provided")}
                </b>

                {result.context?.requested_action && (
                  <p className="body">
                    <b>Requested action:</b>{" "}
                    {result.context.requested_action}
                  </p>
                )}

                {result.context?.claimed_actor && (
                  <p className="body">
                    <b>Claimed actor:</b>{" "}
                    {result.context.claimed_actor}
                  </p>
                )}
              </Card>

              <Card title="Signals that deserve attention">
                {(result.signals || []).length > 0 ? (
                  result.signals.map((signal, index) => (
                    <div className="signal" key={index}>
                      <span
                        className={`severity ${(signal.severity || "low").toLowerCase()}`}
                      >
                        {signal.severity || "Review"}
                      </span>

                      <div>
                        <b>{signal.name || "Observed signal"}</b>
                        <p className="quote">
                          {signal.exact_evidence ||
                            signal.evidence ||
                            "No exact quote provided."}
                        </p>
                        <p className="body">
                          {signal.explanation ||
                            signal.why_it_matters ||
                            "Review this observation in context."}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="body">
                    No signals were returned. This does not guarantee
                    that the content is safe.
                  </p>
                )}
              </Card>

              <Card title="Verification checklist">
                {(result.verification || []).length > 0 ? (
                  result.verification.map((item, index) => (
                    <div className="verify" key={index}>
                      <ScanSearch />
                      <div>
                        <b>{item.claim || "Claim to verify"}</b>
                        <small>
                          {item.status ||
                            "Independent verification recommended"}
                        </small>
                        <p>
                          {item.next_step ||
                            "Check using an official channel you find independently."}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="body">
                    No verification steps were returned. Independently
                    check important claims using official channels.
                  </p>
                )}
              </Card>

              <Card title="Safer next steps">
                {(result.recommendations || []).length > 0 ? (
                  <ul>
                    {result.recommendations.map(
                      (recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="body">
                    No recommendations were returned.
                  </p>
                )}

                <div className="evidence">
                  <b>Evidence &amp; limitations</b>
                  <p>
                    {result.evidence_summary ||
                      "This assessment is based on the submitted text and may not include independent verification of external claims."}
                  </p>
                </div>
              </Card>

              <Card
                title={
                  <>
                    Agent trace{" "}
                    <span className="trace-label">
                      INSPECTABLE WORKFLOW
                    </span>
                  </>
                }
              >
                <button
                  type="button"
                  className="trace-toggle"
                  onClick={() => setTraceOpen(!traceOpen)}
                >
                  {traceOpen
                    ? "Hide workflow details"
                    : "Show workflow details"}

                  {traceOpen ? (
                    <ChevronUp size={15} />
                  ) : (
                    <ChevronDown size={15} />
                  )}
                </button>

                {traceOpen &&
                  (result.agent_trace || []).map((agent, index) => (
                    <div className="trace" key={index}>
                      <CheckCircle2 />
                      <div>
                        <b>{agent.agent}</b>
                        <p>{agent.summary}</p>
                      </div>
                      <small>{agent.status}</small>
                    </div>
                  ))}

                {traceOpen &&
                  !(result.agent_trace || []).length && (
                    <p className="body trace-empty">
                      No trace details were returned for this request.
                    </p>
                  )}
              </Card>

              <p className="disclaimer">
                PAUSE provides decision support, not a guarantee that
                content is safe or fraudulent. Independently verify
                important claims before sharing information or making
                payments.
              </p>

              <button
                type="button"
                className="secondary-action"
                onClick={() => {
                  setResult(null);
                  setError("");
                  setTraceOpen(false);
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              >
                Analyze again <ArrowRight size={15} />
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default ScreenshotPage;
