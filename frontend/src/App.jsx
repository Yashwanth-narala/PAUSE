
import React, { useState } from "react";
import { ShieldCheck, ArrowRight } from "lucide-react";
import "./styles.css";

import Brand from "./components/Brand";
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";
import InputChooser from "./components/InputChooser";
import AnalysisPage from "./components/AnalysisPage";
import ScreenshotPage from "./components/ScreenshotPage";
import EmailPage from "./components/EmailPage";
import UrlPage from "./components/UrlPage";
import DocPage from "./components/Doc";

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedType, setSelectedType] = useState("message");
  const [prefillText, setPrefillText] = useState("");

  function start() {
    setPage("choose");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    setPage("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseInput(type) {
    setSelectedType(type);
    setPrefillText("");
    setPage("analysis");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Return to the input selection page
  function handleBack() {
    setPage("choose");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-blue" />
      <div className="ambient ambient-orange" />

      <div className="site-container">
        <Header
          page={page}
          onHome={goHome}
          onStart={start}
        />

        {page === "home" && (
          <LandingPage onStart={start} />
        )}

        {page === "choose" && (
          <InputChooser
            onChoose={chooseInput}
            onBack={goHome}
          />
        )}

        {page === "analysis" && selectedType === "message" && (
          <AnalysisPage
            key={prefillText}
            initialText={prefillText}
            onBack={handleBack}
          />
        )}

        {page === "analysis" && selectedType === "screenshot" && (
          <ScreenshotPage onBack={handleBack} />
        )}

        {page === "analysis" && selectedType === "email" && (
          <EmailPage onBack={handleBack} />
        )}

        {page === "analysis" && selectedType === "url" && (
          <UrlPage onBack={handleBack} />
        )}

        {page === "analysis" && selectedType === "document" && (
          <DocPage onBack={handleBack} />
        )}

        <footer className="site-footer">
          <Brand compact />
          <span className="footer-motto">
            Understand. Verify. Then act.
          </span>
          <small>BUILT FOR DIGITAL SAFETY</small>
        </footer>
      </div>
    </div>
  );
}
