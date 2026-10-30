import { ArrowLeft, Sparkles, Check, Clock3, LockKeyhole, ArrowRight } from "lucide-react";
import { inputTypes } from "../config";

function InputChooser({ onChoose, onBack }) {
  return <main className="chooser-page">
    <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Back to home</button>
    <div className="page-heading"><div className="eyebrow"><Sparkles size={15} /> BEFORE YOU TRUST IT, PAUSE.</div><h1>What made you<br /><span>PAUSE today?</span></h1><p>Choose the kind of content you received. We'll guide you through the next step.</p></div>
    <div className="input-grid">
      {inputTypes.map(({ id, title, description, icon: Icon, available, label, color }) => <button key={id} className={`input-option ${color} ${!available ? "is-coming" : ""}`} onClick={() => available && onChoose(id)} disabled={!available}>
        <div className="input-option-top"><div className="input-icon"><Icon size={23} /></div><span className={`availability ${available ? "available" : "coming"}`}>{available && <Check size={11} />}{label}</span></div>
        <h2>{title}</h2><p>{description}</p><div className="input-option-bottom"><span>{available ? "Choose input" : "Not enabled yet"}</span>{available ? <ArrowRight size={17} /> : <Clock3 size={15} />}</div>
      </button>)}
    </div>
    <div className="chooser-privacy"><LockKeyhole size={15} /><span>Message,Screenshot,Emai,Url,Document analysis and Recorded calls are available. Only upload recordings you have permission to analyze.</span></div>
  </main>;
}

export default InputChooser;
