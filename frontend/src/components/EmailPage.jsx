import React, { useRef, useState } from "react";
import {
  ArrowLeft,
  Mail,
  Upload,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  X,
  ScanSearch,
} from "lucide-react";

const API = "http://127.0.0.1:8000";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function parseHeaders(rawHeaders) {
  const unfolded = rawHeaders.replace(/\r?\n[ \t]+/g, " ");
  const headers = {};

  unfolded.split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(":");

    if (separator > 0) {
      const name = line.slice(0, separator).trim().toLowerCase();
      const value = line.slice(separator + 1).trim();

      headers[name] = headers[name]
        ? `${headers[name]}, ${value}`
        : value;
    }
  });

  return headers;
}

function decodeQuotedPrintable(text) {
  return text
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

function decodeBase64(text) {
  try {
    const cleaned = text.replace(/\s/g, "");
    const binary = atob(cleaned);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return text;
  }
}

function stripHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCodePoint(Number(n))
    )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractEmailContent(rawEmail) {
  const normalized = rawEmail.replace(/\r\n/g, "\n");
  const headerEnd = normalized.indexOf("\n\n");

  if (headerEnd === -1) {
    throw new Error(
      "This file does not appear to contain a valid email header and body."
    );
  }

  const headers = parseHeaders(normalized.slice(0, headerEnd));
  const body = normalized.slice(headerEnd + 2);

  let content = body;
  const contentType = headers["content-type"] || "text/plain";
  const transferEncoding = (
    headers["content-transfer-encoding"] || ""
  ).toLowerCase();

  // Handle common single-part text emails.
  if (transferEncoding === "base64") {
    content = decodeBase64(content);
  } else if (transferEncoding === "quoted-printable") {
    content = decodeQuotedPrintable(content);
  }

  // For multipart emails, select the text/plain part where possible.
  // This is a lightweight client-side parser, not a complete MIME parser.
  const boundaryMatch = contentType.match(/boundary="?([^";]+)"?/i);

  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = content.split(`--${boundary}`);
    let plainText = "";
    let htmlText = "";

    for (const part of parts) {
      const separator = part.indexOf("\n\n");
      if (separator === -1) continue;

      const partHeaders = parseHeaders(part.slice(0, separator));
      let partBody = part.slice(separator + 2).trim();

      const partType = (
        partHeaders["content-type"] || ""
      ).toLowerCase();

      const encoding = (
        partHeaders["content-transfer-encoding"] || ""
      ).toLowerCase();

      if (encoding === "base64") {
        partBody = decodeBase64(partBody);
      } else if (encoding === "quoted-printable") {
        partBody = decodeQuotedPrintable(partBody);
      }

      if (partType.includes("text/plain") && !plainText) {
        plainText = partBody;
      } else if (partType.includes("text/html") && !htmlText) {
        htmlText = partBody;
      }
    }

    content = plainText || htmlText || content;
  }

  if (
    (headers["content-type"] || "").toLowerCase().includes("text/html") ||
    /<html[\s>]/i.test(content)
  ) {
    content = stripHtml(content);
  }

  return {
    sender: headers.from || "",
    subject: headers.subject || "",
    recipient: headers.to || "",
    body: content.trim(),
    headers,
  };
}

function ResultValue({ value }) {
  if (value === null || value === undefined) return null;

  if (typeof value === "boolean" || typeof value === "number") {
    return <span>{String(value)}</span>;
  }

  if (typeof value === "string") {
    return <span>{value}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <ul className="email-result-list">
        {value.map((item, index) => (
          <li key={index}>
            {typeof item === "object" ? (
              <ResultValue value={item} />
            ) : (
              String(item)
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="email-result-object">
        {Object.entries(value).map(([key, item]) => (
          <div className="email-result-row" key={key}>
            <strong>
              {key.replace(/_/g, " ")}
            </strong>
            <div>
              <ResultValue value={item} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

export default function EmailPage({ onBack }) {
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState("paste");
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function resetResult() {
    setError("");
    setResult(null);
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    resetResult();
  }

  function handleFile(file) {
    resetResult();

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".eml")) {
      setError("Please select an email file with the .eml extension.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The email file must be smaller than 5 MB.");
      return;
    }

    if (file.size === 0) {
      setError("The selected email file is empty.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const rawEmail = String(reader.result || "");
        const extracted = extractEmailContent(rawEmail);

        if (!extracted.body) {
          throw new Error(
            "No readable email body was found. This email may use an unsupported format."
          );
        }

        setSender(extracted.sender);
        setRecipient(extracted.recipient);
        setSubject(extracted.subject);
        setBody(extracted.body);
        setFileName(file.name);
        setMode("paste");
        setError("");
      } catch (err) {
        setError(err.message || "Could not read this email file.");
      }
    };

    reader.onerror = () => {
      setError("The email file could not be read.");
    };

    reader.readAsText(file);
  }

  
async function analyzeEmail(event) {
  event.preventDefault();
  resetResult();

  const emailBody = body.trim();

  if (!emailBody) {
    setError("Please paste an email or upload a readable .eml file.");
    return;
  }

  if (emailBody.length > 12000) {
    setError("Please keep the email body within 12,000 characters.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API}/api/analyze-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: sender.trim(),
        recipient: recipient.trim(),
        subject: subject.trim(),
        body: emailBody,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.message ||
          `Analysis failed with status ${response.status}.`
      );
    }

    setResult(data);
  } catch (err) {
    setError(
      err.message ||
        "Could not connect to PAUSE. Check that your backend is running."
    );
  } finally {
    setLoading(false);
  }
}


  function clearEmail() {
    setSender("");
    setRecipient("");
    setSubject("");
    setBody("");
    setFileName("");
    setError("");
    setResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <main className="email-page">
      <div className="email-page-heading">
        <button
          type="button"
          className="email-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="email-heading-icon">
          <Mail size={25} />
        </div>

        <p className="eyebrow">PAUSE / EMAIL SECURITY</p>
        <h1>Analyze an email.</h1>
        <p className="email-subtitle">
          Inspect suspicious messages before clicking links,
          opening attachments, or sharing personal information.
        </p>
      </div>

      <section className="email-workspace">
        <div className="email-mode-tabs">
          <button
            type="button"
            className={mode === "paste" ? "active" : ""}
            onClick={() => selectMode("paste")}
          >
            <FileText size={17} />
            Paste email
          </button>

          <button
            type="button"
            className={mode === "upload" ? "active" : ""}
            onClick={() => selectMode("upload")}
          >
            <Upload size={17} />
            Upload .eml
          </button>
        </div>

        {mode === "upload" && (
          <div
            className="email-upload-area"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFile(event.dataTransfer.files?.[0]);
            }}
          >
            <div className="email-upload-icon">
              <Upload size={26} />
            </div>

            <h3>Upload an email file</h3>
            <p>
              Select a saved .eml file to extract its sender,
              subject, and readable message body.
            </p>

            <button
              type="button"
              className="email-secondary-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose .eml file
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".eml,message/rfc822"
              hidden
              onChange={(event) =>
                handleFile(event.target.files?.[0])
              }
            />

            <small>EML files only · Maximum size 5 MB</small>

            {fileName && (
              <div className="email-selected-file">
                <FileText size={17} />
                <span>{fileName}</span>
                <button
                  type="button"
                  onClick={clearEmail}
                  aria-label="Clear email"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={analyzeEmail} className="email-form">
          <div className="email-form-heading">
            <div>
              <h2>Email details</h2>
              <p>
                Review the extracted information and edit it if needed.
              </p>
            </div>

            <button
              type="button"
              className="email-clear-button"
              onClick={clearEmail}
            >
              Clear
            </button>
          </div>

          <div className="email-field">
            <label htmlFor="email-sender">Sender address</label>
            <input
              id="email-sender"
              type="text"
              value={sender}
              onChange={(event) => setSender(event.target.value)}
              placeholder="example@company.com"
              maxLength={320}
            />
          </div>

          <div className="email-field">
            <label htmlFor="email-recipient">Recipient (optional)</label>
            <input
              id="email-recipient"
              type="text"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="you@example.com"
              maxLength={320}
            />
          </div>

          <div className="email-field">
            <label htmlFor="email-subject">Subject</label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Enter the email subject"
              maxLength={500}
            />
          </div>

          <div className="email-field">
            <label htmlFor="email-body">Email body</label>
            <textarea
              id="email-body"
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                resetResult();
              }}
              placeholder="Paste the complete email content here..."
              rows={10}
              maxLength={12000}
              required
            />

            <div className="email-character-count">
              {body.length.toLocaleString()} / 12,000 characters
            </div>
          </div>

          <div className="email-safety-note">
            <ShieldCheck size={19} />
            <p>
              PAUSE analyzes the content you provide. It does not open
              links or attachments. A low-risk result does not guarantee
              that an email is genuine.
            </p>
          </div>

          {error && (
            <div className="email-error" role="alert">
              <AlertTriangle size={19} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="email-analyze-button"
            disabled={loading || !body.trim()}
          >
            {loading ? (
              <>
                <LoaderCircle size={19} className="email-spinner" />
                Analyzing email...
              </>
            ) : (
              <>
                <ScanSearch size={19} />
                Analyze email
              </>
            )}
          </button>
        </form>
      </section>

      {result && (
        <section className="email-results" aria-live="polite">
          <div className="email-results-heading">
            <div className="email-results-icon">
              <CheckCircle2 size={23} />
            </div>
            <div>
              <p className="eyebrow">ANALYSIS COMPLETE</p>
              <h2>Email assessment</h2>
              <p>Review the assessment returned by PAUSE.</p>
            </div>
          </div>

          <div className="email-result-card">
            <ResultValue value={result} />
          </div>

          <button
            type="button"
            className="email-secondary-button"
            onClick={() => {
              setResult(null);
              setError("");
            }}
          >
            Analyze again
          </button>
        </section>
      )}
    </main>
  );
}