import { ArrowRight } from "lucide-react";
import Brand from "./Brand";

function Header({ page, onHome, onStart }) {
  return <header className="topbar">
    <button className="brand-button" onClick={onHome} aria-label="PAUSE home"><Brand /></button>
    <nav className="top-nav" aria-label="Main navigation">
      <button className={page === "home" ? "nav-active" : ""} onClick={onHome}>Home</button>
      <button onClick={onStart}>Start analysis <ArrowRight size={14} /></button>
    </nav>
    <div className="status-pill"><i /> DIGITAL DECISION SAFETY</div>
  </header>;
}

export default Header;
