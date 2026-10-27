import { ArrowUpRight, CheckCircle2, FlaskConical, Layers3 } from "lucide-react";
import { Link } from "wouter";
import { SAMPLE_CASES } from "@/lib/checker";
import AppShell from "@/components/AppShell";

export default function Examples() {
  return <AppShell><main className="page">
    <div className="page-heading"><div><div className="eyebrow">Reference set / five cases</div><h1>Examples that teach by contrast.</h1><p className="lede">Load a case into the checker, step through its tableau, and compare a proof witness with a lossy counterexample.</p></div><Link href="/" className="button button-primary"><FlaskConical size={14} /> Open checker</Link></div>
    <div className="example-list">{SAMPLE_CASES.map((example, index) => <article className="example-card" key={example.id}><div style={{ minWidth: 0 }}><div className="history-meta"><span className="mono">CASE {String(index + 1).padStart(2, "0")}</span><span>·</span><span>{index === 2 || index === 4 ? "counterexample" : "worked proof"}</span></div><h3 style={{ marginTop: 9 }}>{example.label}</h3><p>{example.description}</p><div className="example-code">R = {example.input.relationSchema}{`\n`}{example.input.decompositions}{`\n`}{example.input.functionalDependencies || "(no dependencies supplied)"}</div></div><Link href="/" className="icon-button" title="Open checker"><ArrowUpRight size={17} /></Link></article>)}</div>
    <div className="card-grid" style={{ marginTop: 18 }}><div className="info-card"><div className="icon-wrap"><Layers3 size={18} /></div><h3>How to use these cases</h3><p>Start with Student · Course, where COURSE → DEPT closes a full row in one meaningful step. Then remove the dependency to see why the same split can become potentially lossy.</p></div><div className="info-card"><div className="icon-wrap"><CheckCircle2 size={18} /></div><h3>Expected output</h3><p>Lossless cases show a “proof closed” badge and a fully distinguished row. Lossy cases stop at a fixed point with at least one fresh symbol remaining in every row.</p></div></div>
  </main></AppShell>;
}
