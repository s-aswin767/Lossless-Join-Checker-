import { Clock3, ExternalLink, FileText, History as HistoryIcon, RotateCcw, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import AppShell from "@/components/AppShell";
import { HistoryItem, loadLocalHistory, saveLocalHistory } from "@/lib/checker";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";

export default function HistoryPage() {
  const [, navigate] = useLocation();
  const remote = trpc.history.list.useQuery(undefined, { staleTime: 20_000 });
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>(() => loadLocalHistory());
  const items = useMemo(() => {
    const remoteItems = (remote.data ?? []) as HistoryItem[];
    const seen = new Set(remoteItems.map(item => `${item.createdAt}-${item.summary}`));
    return [...remoteItems, ...localHistory.filter(item => !seen.has(`${item.createdAt}-${item.summary}`))].slice(0, 20);
  }, [remote.data, localHistory]);
  const clearLocal = () => { setLocalHistory([]); saveLocalHistory([]); };
  const reopen = (item: HistoryItem) => {
    sessionStorage.setItem("lossless-reopen", JSON.stringify(item));
    navigate("/");
  };
  return <AppShell><main className="page">
    <div className="page-heading"><div><div className="eyebrow">Run archive / transparent by default</div><h1>History you can revisit.</h1><p className="lede">Every saved run keeps its inputs, proof summary, and tableau result so you can explain your reasoning again later.</p></div><div className="action-row"><button className="button button-ghost" onClick={clearLocal} disabled={!localHistory.length}><Trash2 size={14} /> Clear local cache</button><Link href="/" className="button button-primary"><FileText size={14} /> New analysis</Link></div></div>
    {items.length === 0 ? <div className="empty-state"><HistoryIcon size={24} /><h3>No saved analyses yet</h3><p>Run the checker, then choose “Save run” to build your archive.</p></div> : <div className="history-list">{items.map(item => <article className="history-item" key={`${item.id}-${item.createdAt}`}><div><div className="history-meta"><Clock3 size={13} /><span>{new Date(item.createdAt).toLocaleString()}</span><span>·</span><span>{item.result?.steps?.length ?? 0} steps</span></div><h3 style={{ marginTop: 9 }}>{item.relationSchema}</h3><p className="muted" style={{ marginTop: 5, fontSize: 12 }}>{item.summary}</p></div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className={`status-pill ${item.verdict === "Lossless join" ? "" : "lossy"}`}>{item.verdict === "Lossless join" ? "LOSSLESS" : "LOSSY"}</span><button className="button button-ghost" onClick={() => reopen(item)}><RotateCcw size={13} /> Reopen</button></div></article>)}</div>}
    <div className="info-card" style={{ marginTop: 18 }}><div className="history-meta"><ExternalLink size={13} /><span>Storage note</span></div><p style={{ marginTop: 8 }}>The app tries the managed database first and keeps a small browser-local fallback so a classroom demo stays usable even if the database is temporarily unavailable.</p></div>
  </main></AppShell>;
}
