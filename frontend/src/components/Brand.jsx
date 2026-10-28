import { ShieldCheck } from "lucide-react";

function Brand({ compact = false }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}>
    <div className="brand-mark"><ShieldCheck size={23} strokeWidth={1.8} /></div>
    <div className="brand-copy"><b>PAUSE<span>.</span></b><small>PERSONAL AI UNDERSTANDING &amp; SAFETY ENGINE</small></div>
  </div>;
}

export default Brand;
