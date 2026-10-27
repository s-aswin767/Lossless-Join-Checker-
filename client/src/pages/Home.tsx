import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Download, Pause, Play, RotateCcw, Save, Sparkles, Table2, TriangleAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CheckerInput, CheckerResult, SAMPLE_CASES, defaultInput, downloadReport, loadLocalHistory, saveLocalHistory } from "@/lib/checker";
import AppShell from "@/components/AppShell";

function InputRail({ input, setInput, onRun, running, errors, recent, onLoadRecent, onClearRecent }: { input: CheckerInput; setInput: (input: CheckerInput) => void; onRun: () => void; running: boolean; errors: string[]; recent: any[]; onLoadRecent: (entry: any) => void; onClearRecent: () => void }) {
  const setField = (key: keyof CheckerInput, value: string) => setInput({ ...input, [key]: value });
  return <section className="input-rail" aria-label="Input">
    <div className="field"><label htmlFor="relation-schema">Relation R — attributes</label><div className="field-hint">Comma or space separated. Names may be multi-character.</div><input id="relation-schema" className="text-input" value={input.relationSchema} onChange={e => setField("relationSchema", e.target.value)} /></div>
    <div className="field"><label htmlFor="dependencies">Functional dependencies</label><div className="field-hint">One per line, e.g. <code>A -&gt; C</code></div><textarea id="dependencies" className="textarea" rows={6} value={input.functionalDependencies} onChange={e => setField("functionalDependencies", e.target.value)} /></div>
    <div className="field"><label htmlFor="decompositions">Decomposition</label><div className="field-hint">One sub-relation per line, e.g. <code>R1: A, D</code></div><textarea id="decompositions" className="textarea" rows={6} value={input.decompositions} onChange={e => setField("decompositions", e.target.value)} /></div>
    <div className="action-row"><button className="button button-primary" style={{ flex: 1 }} onClick={onRun} disabled={running}><Play size={13} /> {running ? "Checking…" : "Check decomposition"}</button><button className="button" onClick={() => setInput(defaultInput)}><RotateCcw size={13} /> Clear</button></div>
    {errors.length > 0 && <ul className="msgs"><li className="err"><TriangleAlert size={14} /> {errors.join(" ")}</li></ul>}
    <div className="sec-title">Recent checks</div>
    <div className="hist">{recent.length === 0 ? <p className="smallnote">Runs you make are listed here so you can reload them.</p> : recent.map(entry => <button key={entry.id} onClick={() => onLoadRecent(entry)}><div>{entry.verdict === "Lossless join" ? "✓ Lossless" : "✗ Lossy"} · {entry.relationSchema}</div><div className="smallnote">{entry.decompositions.split("\n").length} fragments · {new Date(entry.createdAt).toLocaleString()}</div></button>)}{recent.length > 0 && <button className="button tiny" onClick={onClearRecent}>Clear history</button>}</div>
  </section>;
}

function Verdict({ result }: { result: CheckerResult }) {
  if (!result.ok) return <div className="verdict idle"><div className="verdict-copy"><strong>Ready</strong><span className="why">Enter a schema and press “Check decomposition”, or pick an example above.</span></div></div>;
  return <div className={`verdict ${result.lossless ? "good" : "bad"}`}><div className="verdict-copy"><strong>{result.lossless ? "Lossless join" : "Lossy join"}</strong><span className="why">{result.summary}</span></div>{result.lossless ? <Check size={17} /> : <XCircle size={17} />}</div>;
}

function Tableau({ result, activeIndex }: { result: CheckerResult; activeIndex: number }) {
  const step = result.steps[activeIndex];
  if (!step) return <div className="empty-state"><TriangleAlert size={22} /><h3>Run a check to build the tableau</h3><p>The chase visualization will appear here.</p></div>;
  return <div className="tab-wrap"><table className="tableau"><thead><tr><th>fragment</th>{result.relationAttributes.map(attribute => <th key={attribute}>{attribute}</th>)}</tr></thead><tbody>{step.rows.map(row => <tr key={row.relation}><th>{row.relation} ({row.cells.filter(c => c.distinguished).map(c => c.value.slice(1)).join(", ")})</th>{row.cells.map((cell, index) => <td key={index} className={`${cell.distinguished ? "cell-a" : "cell-b"} ${cell.changed ? "cell-changed" : ""}`} aria-label={`${row.relation} ${result.relationAttributes[index]} = ${cell.value}`}>{cell.value[0]}<sub>{cell.value.slice(1)}</sub></td>)}</tr>)}</tbody></table></div>;
}

function Explanation({ result, activeIndex }: { result: CheckerResult; activeIndex: number }) {
  const step = result.steps[activeIndex];
  return <section className="explanation-rail" aria-label="Explanation">
    <div className="sec-title" style={{ marginTop: 0 }}>What just happened</div>
    <div className="step-card" aria-live="polite"><div className="k">Step {step ? `${activeIndex + 1} of ${result.steps.length}` : "—"}</div><div>{step?.title ?? "Run a check to see the chase explained one step at a time."}</div>{step && <p>{step.description}</p>}</div>
    <div className="log">{result.steps.map((item, index) => <button key={`${item.index}-${item.title}`} aria-current={index === activeIndex} onClick={() => window.dispatchEvent(new CustomEvent("lj-step", { detail: index }))}>{index + 1}. {item.title}</button>)}</div>
    <div className="sec-title">Report</div>
    <div className="action-row"><button className="button tiny" style={{ flex: 1 }} onClick={() => window.dispatchEvent(new Event("lj-export"))}><Download size={13} /> Download report</button><button className="button tiny" onClick={() => window.dispatchEvent(new Event("lj-save"))}><Save size={13} /> Save</button></div>
    <p className="smallnote" style={{ marginTop: 6 }}>Markdown report with inputs, every chase step, and the verdict.</p>
    <div className="sec-title">AI tutor</div>
    <div className="aibox">{!result.ok ? "Run a valid check to activate the tutor." : result.lossless ? "A full row of a-symbols is the proof witness. The decomposition can reconstruct the original tuples without spurious combinations." : "No row became all a-symbols. The dependencies are not strong enough to tie the fragments back together."}</div>
  </section>;
}

export default function Home() {
  const [input, setInput] = useState<CheckerInput>(defaultInput);
  const [runInput, setRunInput] = useState<CheckerInput>(defaultInput);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [localHistory, setLocalHistory] = useState<any[]>(() => loadLocalHistory());
  const resultQuery = trpc.checker.analyze.useQuery(runInput, { staleTime: Infinity });
  const result = resultQuery.data as CheckerResult | undefined;
  const saveMutation = trpc.history.create.useMutation();
  const activeResult = result ?? { ok: false, errors: [], relationAttributes: [], relations: [], dependencies: [], lossless: false, verdict: "Invalid input" as const, summary: "Run a check to begin.", steps: [], complexity: "—", iterations: 0 };
  useEffect(() => { setActiveIndex(0); setPlaying(false); }, [resultQuery.data]);
  useEffect(() => { const onStep = (event: Event) => setActiveIndex((event as CustomEvent<number>).detail); const onExport = () => result?.ok ? downloadReport(input, result) : toast.error("Run a check first."); const onSave = () => saveCurrent(); window.addEventListener("lj-step", onStep); window.addEventListener("lj-export", onExport); window.addEventListener("lj-save", onSave); return () => { window.removeEventListener("lj-step", onStep); window.removeEventListener("lj-export", onExport); window.removeEventListener("lj-save", onSave); }; });
  useEffect(() => { if (!playing || !result?.steps.length) return; const timer = window.setInterval(() => setActiveIndex(index => { if (index >= result.steps.length - 1) { setPlaying(false); return index; } return index + 1; }), 900); return () => window.clearInterval(timer); }, [playing, result?.steps.length]);
  const saveCurrent = () => { if (!result?.ok) return toast.error("Run a valid check before saving."); const item = { id: `local-${Date.now()}`, ...input, verdict: result.verdict, summary: result.summary, result, createdAt: new Date().toISOString() }; const next = [item, ...localHistory.filter(h => h.relationSchema !== input.relationSchema)].slice(0, 8); setLocalHistory(next); saveLocalHistory(next); saveMutation.mutate({ ...input, verdict: result.verdict, summary: result.summary, result }, { onSuccess: () => toast.success("Analysis saved."), onError: () => toast.success("Saved locally for this browser.") }); };
  const run = () => { setRunInput({ ...input }); setActiveIndex(0); };
  const loadExample = (id: string) => { const example = SAMPLE_CASES.find(item => item.id === id); if (!example) return; setInput({ ...example.input }); setRunInput({ ...example.input }); toast.success(`${example.label} loaded.`); };
  const loadRecent = (entry: any) => { const restored = { relationSchema: entry.relationSchema, decompositions: entry.decompositions, functionalDependencies: entry.functionalDependencies }; setInput(restored); setRunInput(restored); };
  return <AppShell><main className="page">
    <div className="page-heading"><div><div className="eyebrow">Module 03 / decomposition proof</div><h1>Lossless Join Checker</h1><p className="lede">Use the chase algorithm to test whether a decomposition preserves the original relation.</p></div><label className="smallnote" htmlFor="example-select">Example<select id="example-select" style={{ width: 230 }} onChange={e => loadExample(e.target.value)} defaultValue=""><option value="" disabled>Choose a worked case…</option>{SAMPLE_CASES.map(example => <option key={example.id} value={example.id}>{example.label}</option>)}</select></label></div>
    <div className="dashboard"><InputRail input={input} setInput={setInput} onRun={run} running={resultQuery.isFetching} errors={result?.errors ?? []} recent={localHistory} onLoadRecent={loadRecent} onClearRecent={() => { setLocalHistory([]); saveLocalHistory([]); }} />
      <section className="workbench" aria-label="Visualization"><Verdict result={activeResult} /><div className="tabs"><button className="active">Chase tableau</button><button onClick={() => toast.info("Binary rule view is available in the Learn page for this run.")}>Binary rule &amp; closures</button><button onClick={() => toast.info("Dependency preservation is covered in the theory notes.")}>Dependency preservation</button></div><Tableau result={activeResult} activeIndex={activeIndex} /><div className="controls"><button className="button tiny" onClick={() => setActiveIndex(0)} disabled={!result?.steps.length}>⏮</button><button className="button tiny" onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))} disabled={!result?.steps.length || activeIndex === 0}>◀</button><button className="button tiny button-primary" onClick={() => setPlaying(value => !value)} disabled={!result?.steps.length}>{playing ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Play</>}</button><button className="button tiny" onClick={() => setActiveIndex(Math.min((result?.steps.length ?? 1) - 1, activeIndex + 1))} disabled={!result?.steps.length || activeIndex >= (result?.steps.length ?? 1) - 1}>▶</button><button className="button tiny" onClick={() => setActiveIndex((result?.steps.length ?? 1) - 1)} disabled={!result?.steps.length}>⏭</button><span className="progress"><i style={{ width: result?.steps.length ? `${((activeIndex + 1) / result.steps.length) * 100}%` : "0%" }} /></span><span className="smallnote mono">{result?.steps.length ? `${activeIndex + 1} / ${result.steps.length}` : "0 / 0"}</span></div><div className="legend"><span><i className="swatch" style={{ background: "var(--a-bg)", borderColor: "var(--a-line)" }} /> a — value shared with the original row</span><span><i className="swatch" style={{ background: "var(--b-bg)", borderColor: "var(--b-line)" }} /> b — unknown / row-specific value</span><span><i className="swatch" style={{ background: "var(--focus-bg)", borderColor: "var(--focus)" }} /> changed by the current step</span></div></section>
      <Explanation result={activeResult} activeIndex={activeIndex} />
    </div>
    <details className="theory"><summary>Theory, algorithm and limitations</summary><div className="theory-grid"><div><h3>What lossless join means</h3><p>A decomposition of R into smaller relations is lossless if their natural join returns exactly the original rows—no lost facts and no spurious tuples.</p></div><div><h3>Algorithm</h3><p>Initialize the tableau, mark preserved values with a-symbols, apply functional dependencies until no changes remain, and look for a row containing only a-symbols.</p></div><div><h3>Limitations</h3><p>The proof depends on the functional dependencies supplied. Missing or incorrect dependencies can make a sound schema look uncertain.</p></div></div></details>
  </main></AppShell>;
}
