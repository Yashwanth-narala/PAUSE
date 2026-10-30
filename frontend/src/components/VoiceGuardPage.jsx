import React, { useRef, useState } from "react";
import {
  ArrowLeft,
  AudioLines,
  CheckCircle2,
  CircleAlert,
  FileAudio,
  LoaderCircle,
  LockKeyhole,
  Mic,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { API } from "../config";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const SUPPORTED_EXTENSIONS = [
  ".mp3",
  ".mp4",
  ".wav",
  ".flac",
  ".ogg",
  ".amr",
  ".webm",
];

function getRiskLabel(result) {
  return (
    result?.assessment ||
    result?.risk_level ||
    result?.risk ||
    "Analysis completed"
  );
}

function getRiskClass(result) {
  const value = getRiskLabel(result).toLowerCase();

  if (
    value.includes("high-risk") ||
    value.includes("high risk") ||
    value.includes("phishing") ||
    value.includes("scam")
  ) {
    return "vg-risk-high";
  }

  if (
    value.includes("verification") ||
    value.includes("medium") ||
    value.includes("suspicious")
  ) {
    return "vg-risk-medium";
  }

  return "vg-risk-neutral";
}

function getErrorMessage(errorData, fallback) {
  if (typeof errorData?.detail === "string") {
    return errorData.detail;
  }

  return fallback;
}

export default function VoiceGuardPage({ onBack }) {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("te-IN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [transcript, setTranscript] = useState("");

  function selectFile(selectedFile) {
    setError("");
    setResult(null);
    setTranscript("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const extension = selectedFile.name
      .slice(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      setFile(null);
      setError(
        "Unsupported format. Choose MP3, MP4, WAV, FLAC, OGG, AMR, or WEBM."
      );
      return;
    }

    if (selectedFile.size === 0) {
      setFile(null);
      setError("This file is empty. Choose a valid audio recording.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("The maximum supported file size is 25 MB.");
      return;
    }

    setFile(selectedFile);
  }

  async function analyzeRecording(event) {
    event.preventDefault();

    if (!file) {
      setError("Please select a recorded call first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setTranscript("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language_code", language);

    try {
      const controller = new AbortController();

      // Allow time for the backend to wait for Amazon Transcribe.
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        270000
      );

      let response;

      try {
        response = await fetch(`${API}/api/voiceguard/analyze`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `VoiceGuard failed with HTTP ${response.status}.`
          )
        );
      }

      if (!data.voiceguard?.transcript) {
        throw new Error(
          "The backend returned no transcript. Check the backend response."
        );
      }
      setTranscript(data.voiceguard.transcript);
      setResult(data);
    } catch (err) {
      if (err.name === "AbortError") {
        setError(
          "The request timed out. Check the backend terminal and AWS Transcribe job before trying again."
        );
      } else {
        setError(
          err.message ||
            "Unable to analyze the recording. Check that the PAUSE backend is running."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function resetAnalysis() {
    setFile(null);
    setResult(null);
    setTranscript("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const signals = Array.isArray(result?.signals)
    ? result.signals
    : [];

  const recommendations = Array.isArray(result?.recommendations)
    ? result.recommendations
    : [];

  const verification = Array.isArray(result?.verification)
    ? result.verification
    : [];

  return (
    <main className="vg-page">
      <button
        type="button"
        className="back-link"
        onClick={onBack}
        disabled={loading}
      >
        <ArrowLeft size={16} />
        Back to input selection
      </button>

      <section className="vg-hero">
        <div className="vg-eyebrow">
          <AudioLines size={16} />
          PAUSE VOICEGUARD
          <span className="vg-beta">BETA</span>
        </div>

        <h1>
          <span className="vg-title-highlight">Listen carefully.</span>
          <br />
          <span>Verify before you act.</span>
        </h1>

        <p>
          Analyze a recorded call for potential scam indicators,
          suspicious payment requests, artificial urgency, and
          requests for sensitive information.
        </p>

        <div className="vg-privacy">
          <LockKeyhole size={16} />
          <span>
            Upload only recordings you have permission to analyze.
            VoiceGuard reviews the transcript; it does not verify
            a caller's identity.
          </span>
        </div>
      </section>

      {!result && (
        <section className="vg-card">
          <div className="vg-card-heading">
            <div className="vg-heading-icon">
              <Mic size={22} />
            </div>

            <div>
              <h2>Analyze a recorded call</h2>
              <p>
                Upload an audio file and select the primary spoken
                language.
              </p>
            </div>
          </div>

          <form onSubmit={analyzeRecording}>
            <label className="vg-field-label" htmlFor="vg-language">
              Recording language
            </label>

            <select
              id="vg-language"
              className="vg-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={loading}
            >
              <option value="te-IN">Telugu</option>
              <option value="en-IN">English (India)</option>
              <option value="en-US">English (US)</option>
              <option value="hi-IN">Hindi</option>
            </select>

            <input
              ref={fileInputRef}
              id="vg-audio-file"
              className="vg-hidden-input"
              type="file"
              accept=".mp3,.mp4,.wav,.flac,.ogg,.amr,.webm,audio/*"
              onChange={(event) =>
                selectFile(event.target.files?.[0] || null)
              }
              disabled={loading}
            />

            <button
              type="button"
              className="vg-upload-zone"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <span className="vg-upload-icon">
                <Upload size={25} />
              </span>

              <strong>
                {file ? "Choose a different recording" : "Choose an audio file"}
              </strong>

              <span>
                MP3, MP4, WAV, FLAC, OGG, AMR, or WEBM · Max 25 MB
              </span>
            </button>

            {file && (
              <div className="vg-file-row">
                <FileAudio size={22} />

                <div className="vg-file-details">
                  <strong>{file.name}</strong>
                  <span>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                <button
                  type="button"
                  className="vg-icon-button"
                  aria-label="Remove selected recording"
                  onClick={() => selectFile(null)}
                  disabled={loading}
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {error && (
              <div className="vg-error" role="alert">
                <CircleAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="vg-primary-button"
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <LoaderCircle className="vg-spinner" size={18} />
                  Transcribing and analyzing...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Analyze recorded call
                </>
              )}
            </button>

            {loading && (
              <div className="vg-processing-panel" role="status">
                <LoaderCircle className="vg-spinner" size={20} />
                <div>
                  <strong>Transcribing and analyzing your call...</strong>
                  <p>
                    Amazon Transcribe is processing the recording. Your
                    transcript will appear when the backend returns it.
                  </p>
                </div>
              </div>
            )}
          </form>
        </section>
      )}

      {result && (
        <section className="vg-results">
          <div className="vg-results-header">
            <div>
              <div className="vg-eyebrow">
                <CheckCircle2 size={16} />
                ANALYSIS COMPLETE
              </div>

              <h2>Call analysis results</h2>

              <p className="vg-result-filename">
                {result.voiceguard.filename}
              </p>
            </div>

            <button
              type="button"
              className="vg-secondary-button"
              onClick={resetAnalysis}
            >
              Analyze another
            </button>
          </div>

          <article className="vg-card">
            <h3>
              <ShieldCheck size={19} />
              PAUSE assessment
            </h3>

            <div className={`vg-risk-banner ${getRiskClass(result)}`}>
              <span className="vg-risk-dot" />
              <strong>{getRiskLabel(result)}</strong>
            </div>

            {result.summary && <p>{result.summary}</p>}

            {result.evidence_summary && (
              <p>{result.evidence_summary}</p>
            )}

            {result.confidence_note && (
              <p className="vg-muted">{result.confidence_note}</p>
            )}
          </article>

          <article className="vg-card">
            <h3>
              <AudioLines size={19} />
              Transcription
            </h3>

            <div className="vg-transcript-meta">
              <span>
                Language: {result.voiceguard.language_code}
              </span>

              <span>
                {result.voiceguard.transcript_characters} characters
              </span>
            </div>

            <div className="vg-transcript">
              {transcript}
            </div>

            <p className="vg-muted">
              Speech recognition may mishear names, amounts, or words,
              especially when audio is noisy or speakers overlap.
              Verify important details against the original recording.
            </p>
          </article>

          {signals.length > 0 && (
            <article className="vg-card">
              <h3>
                <CircleAlert size={19} />
                Detected signals
              </h3>

              <div className="vg-list">
                {signals.map((signal, index) => {
                  const title =
                    typeof signal === "string"
                      ? signal
                      : signal.title ||
                        signal.name ||
                        signal.signal ||
                        "Potential concern";

                  const description =
                    typeof signal === "string"
                      ? ""
                      : signal.description ||
                        signal.explanation ||
                        signal.details ||
                        "";

                  return (
                    <div className="vg-list-item" key={index}>
                      <span className="vg-list-dot" />

                      <div>
                        <strong>{title}</strong>
                        {description && <p>{description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          )}

          {recommendations.length > 0 && (
            <article className="vg-card">
              <h3>Recommended actions</h3>

              <ol className="vg-recommendations">
                {recommendations.map((item, index) => (
                  <li key={index}>
                    {typeof item === "string"
                      ? item
                      : item.text || item.description || JSON.stringify(item)}
                  </li>
                ))}
              </ol>
            </article>
          )}

          {verification.length > 0 && (
            <article className="vg-card">
              <h3>What to verify independently</h3>

              <ul className="vg-recommendations">
                {verification.map((item, index) => (
                  <li key={index}>
                    {typeof item === "string"
                      ? item
                      : item.claim ||
                        item.description ||
                        JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            </article>
          )}

          <div className="vg-disclaimer">
            <LockKeyhole size={17} />

            <p>
              This assessment is based on speech recognition and
              automated text analysis. It is not proof of fraud or
              caller identity. Verify claims through trusted,
              independently obtained contact details.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}