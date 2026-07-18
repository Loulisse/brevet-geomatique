import { useState, useEffect, useRef } from "react";

// ─── SUPABASE CONFIG ─────────────────────────────────────────────────────────
const SUPABASE_URL = "https://ycfdnrnlorioalnzslrg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZmRucm5sb3Jpb2FsbnpzbHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzODUwMzcsImV4cCI6MjA5NTk2MTAzN30.RK7MIZCWvgeAvc5FnPda2SqZXpIdK_vSZuu1uApq0xk";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}
async function dbGetAll(table) { return await sbFetch(`/${table}?order=created_at.asc`); }
async function dbUpsert(table, row) {
  return await sbFetch(`/${table}`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(row) });
}
async function dbDelete(table, id) { return await sbFetch(`/${table}?id=eq.${id}`, { method: "DELETE" }); }

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) { if (!d) return "—"; const [y, m, day] = d.split("-"); return `${day}.${m}.${y}`; }
function daysUntil(d) { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000); }
function progressColor(pct) {
  if (pct >= 100) return "#4ade80";
  if (pct >= 60) return "#facc15";
  if (pct >= 30) return "#fb923c";
  return "#f87171";
}
function computeProgress(p) {
  const subs = p.sub_objectives || [];
  if (!subs.length) return 0;
  return Math.round((subs.filter((s) => s.done).length / subs.length) * 100);
}
function enrich(list) { return list.map((p) => ({ ...p, progress: computeProgress(p) })); }
function totalTime(p) { return (p.time_entries || []).reduce((a, t) => a + (parseFloat(t.hours) || 0), 0); }
// Tri par deadline (plus proche en haut, sans deadline à la fin)
function byDeadline(a, b) {
  if (!a.deadline && !b.deadline) return 0;
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return a.deadline.localeCompare(b.deadline);
}
function byDate(a, b) { return (b.date || "").localeCompare(a.date || ""); }

// ─── DESIGN ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d0f14", surface: "#111318", border: "#1e2029",
  text: "#e8eaf0", muted: "#555a6e", soft: "#8b8fa8",
  accent: "#5b9cf6", purple: "#a78bfa", green: "#4ade80",
  yellow: "#facc15", orange: "#fb923c", danger: "#ef4444", teal: "#2dd4bf",
};
const S = {
  input: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "11px 13px", fontSize: 15, color: C.text, width: "100%", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  textarea: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "11px 13px", fontSize: 15, color: C.text, width: "100%", outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 100, fontFamily: "inherit" },
  label: { fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7, display: "block" },
  fg: { marginBottom: 16 },
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 14 },
  ct: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: 14 },
  badge: (color) => ({ display: "inline-block", padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: color + "22", color }),
  tag: { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: C.border, borderRadius: 6, fontSize: 11, color: C.soft },
  pb: { height: 6, background: C.border, borderRadius: 999, overflow: "hidden", marginTop: 7 },
  pf: (pct, color) => ({ height: "100%", width: `${Math.min(pct, 100)}%`, background: color || C.accent, borderRadius: 999, transition: "width 0.4s" }),
  btn: (v = "primary") => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none", background: v === "primary" ? C.accent : v === "danger" ? C.danger : C.border, color: v === "ghost" ? C.soft : "#fff" }),
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  mbox: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 600, maxHeight: "92vh", overflowY: "auto" },
};

const Ico = {
  dash: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  obj: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  jour: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  rep: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  set: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  edit: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  flag: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  clock: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  link: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  chk: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  chev: (open) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>,
};

function Modal({ title, onClose, children }) {
  return (
    <div style={S.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.mbox}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ ...S.btn("ghost"), padding: "6px 12px" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── GANTT (phases + jalons) ─────────────────────────────────────────────────
function Gantt({ phases, milestones }) {
  const all = [];
  phases.forEach((p) => {
    if (p.deadline) all.push({ label: p.title, date: p.deadline, kind: "phase" });
    (p.sub_objectives || []).forEach((s) => { if (s.deadline) all.push({ label: s.title, date: s.deadline, kind: "sub" }); });
  });
  milestones.forEach((m) => { if (m.date) all.push({ label: m.title, date: m.date, kind: "milestone", done: m.done }); });
  all.sort((a, b) => a.date.localeCompare(b.date));
  if (!all.length) return <div style={{ color: C.muted, fontSize: 13 }}>Aucune deadline renseignée.</div>;
  const dates = all.map((x) => new Date(x.date));
  const min = new Date(Math.min(...dates)), max = new Date(Math.max(...dates));
  const range = Math.max(max - min, 1);
  return (
    <div>
      {all.map((item, i) => {
        const pos = ((new Date(item.date) - min) / range) * 78;
        const du = daysUntil(item.date);
        let col;
        if (item.kind === "milestone") col = item.done ? C.muted : C.teal;
        else col = du === null ? C.accent : du < 0 ? C.danger : du < 7 ? C.orange : du < 30 ? C.yellow : C.accent;
        const isM = item.kind === "milestone";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 9, gap: 8 }}>
            <div style={{ width: 108, fontSize: 11, color: item.kind === "phase" ? C.text : isM ? C.teal : C.soft, flexShrink: 0, fontWeight: item.kind === "sub" ? 400 : 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isM ? "◆ " : ""}{item.label}</div>
            <div style={{ flex: 1, position: "relative", height: 20 }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: C.border }} />
              <div style={{ position: "absolute", left: `${pos}%`, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
                {isM ? (
                  <div style={{ width: 11, height: 11, background: col, transform: "rotate(45deg)", boxShadow: `0 0 6px ${col}99` }} />
                ) : (
                  <div style={{ width: item.kind === "phase" ? 11 : 7, height: item.kind === "phase" ? 11 : 7, borderRadius: 999, background: col, boxShadow: `0 0 6px ${col}99` }} />
                )}
              </div>
            </div>
            <div style={{ width: 66, fontSize: 10, color: col, textAlign: "right", flexShrink: 0 }}>
              {formatDate(item.date)}{du !== null && !isM && <span style={{ color: C.muted }}> ({du > 0 ? `J-${du}` : du === 0 ? "auj." : `+${-du}j`})</span>}
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.soft }}><div style={{ width: 9, height: 9, borderRadius: 999, background: C.accent }} />Phase</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.soft }}><div style={{ width: 9, height: 9, background: C.teal, transform: "rotate(45deg)" }} />Jalon officiel</div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ phases, milestones, docs }) {
  const ts = phases.reduce((a, p) => a + (p.sub_objectives || []).length, 0);
  const ds = phases.reduce((a, p) => a + (p.sub_objectives || []).filter((s) => s.done).length, 0);
  const gp = ts > 0 ? Math.round((ds / ts) * 100) : 0;
  const te = phases.reduce((a, p) => a + (parseFloat(p.estimated_hours) || 0), 0);
  const ta = phases.reduce((a, p) => a + totalTime(p), 0);
  const nextItems = [
    ...phases.filter((p) => p.deadline && p.deadline >= today()).map((p) => ({ title: p.title, date: p.deadline, kind: "Phase" })),
    ...milestones.filter((m) => m.date >= today() && !m.done).map((m) => ({ title: m.title, date: m.date, kind: "Jalon" })),
  ].sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[[gp + "%", "Progression", progressColor(gp), gp], [ds + "/" + ts, "Sous-phases", C.accent, null], [ta + "h", "/ " + te + "h prévu", C.purple, te > 0 ? (ta / te) * 100 : 0]].map(([val, label, color, bar], i) => (
          <div key={i} style={{ ...S.card, marginBottom: 0, padding: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 4 }}>{label}</div>
            {bar !== null && <div style={S.pb}><div style={S.pf(bar, color)} /></div>}
          </div>
        ))}
      </div>
      {nextItems && (
        <div style={{ ...S.card, borderColor: C.accent + "44", background: "#0e1220", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Prochaine échéance · {nextItems.kind}</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{nextItems.title}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{formatDate(nextItems.date)} — J-{daysUntil(nextItems.date)}</div>
        </div>
      )}
      <div style={S.card}>
        <div style={S.ct}>Timeline</div>
        <Gantt phases={phases} milestones={milestones} />
      </div>
      <div style={S.card}>
        <div style={S.ct}>Phases</div>
        {[...phases].sort(byDeadline).map((p) => (
          <div key={p.id} style={{ marginBottom: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72%" }}>{p.title}</span>
              <span style={{ color: progressColor(p.progress || 0), fontWeight: 700 }}>{p.progress || 0}%</span>
            </div>
            <div style={S.pb}><div style={S.pf(p.progress || 0, progressColor(p.progress || 0))} /></div>
          </div>
        ))}
        {!phases.length && <div style={{ color: C.muted, fontSize: 13 }}>Aucune phase créée.</div>}
      </div>
      <div style={S.card}>
        <div style={S.ct}>Temps prévu vs passé</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          {[...phases].sort(byDeadline).map((p) => {
            const e = parseFloat(p.estimated_hours) || 0;
            const a = totalTime(p);
            const m = Math.max(e, a, 1);
            return (
              <div key={p.id} style={{ textAlign: "center", minWidth: 44 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", justifyContent: "center", height: 56 }}>
                  <div style={{ width: 13, height: `${(e / m) * 52}px`, background: C.accent, borderRadius: "3px 3px 0 0", minHeight: 3 }} />
                  <div style={{ width: 13, height: `${(a / m) * 52}px`, background: a > e ? C.danger : C.green, borderRadius: "3px 3px 0 0", minHeight: 3 }} />
                </div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 3, maxWidth: 44, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
          {[[C.accent, "Prévu"], [C.green, "Passé OK"], [C.danger, "Dépassé"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.soft }}><div style={{ width: 8, height: 8, background: c, borderRadius: 2 }} />{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PHASES ──────────────────────────────────────────────────────────────────
function Phases({ phases, savePhase, deletePhase, saveSub, deleteSub }) {
  const [exp, setExp] = useState({});
  const [showAP, setShowAP] = useState(false);
  const [editP, setEditP] = useState(null);
  const [showAS, setShowAS] = useState(null);
  const [editS, setEditS] = useState(null);
  const [showCom, setShowCom] = useState(null);
  const [showTime, setShowTime] = useState(null);
  const [pf, setPf] = useState({ title: "", description: "", deadline: "", estimated_hours: "" });
  const [sf, setSf] = useState({ title: "", deadline: "" });
  const [cf, setCf] = useState({ text: "", date: today() });
  const [tf, setTf] = useState({ hours: "", date: today(), note: "" });

  async function submitP() {
    if (!pf.title || !pf.estimated_hours) return;
    if (editP) await savePhase({ ...editP, ...pf });
    else await savePhase({ id: Date.now(), ...pf, sub_objectives: [], comments: [], time_entries: [] });
    setShowAP(false);
  }
  async function submitS() {
    const p = phases.find((x) => x.id === showAS);
    if (!p || !sf.title) return;
    if (editS) await saveSub(p, { ...editS.sub, ...sf });
    else await saveSub(p, { id: Date.now(), ...sf, done: false, comments: [] });
    setShowAS(null);
  }
  async function submitC() {
    const { item, type, parent } = showCom;
    const nc = { id: Date.now(), text: cf.text, date: cf.date };
    if (type === "phase") await savePhase({ ...item, comments: [...(item.comments || []), nc] });
    else await saveSub(parent, { ...item, comments: [...(item.comments || []), nc] });
    setShowCom(null);
  }
  async function submitT() {
    if (!tf.hours) return;
    const p = showTime;
    const nt = { id: Date.now(), hours: parseFloat(tf.hours), date: tf.date, note: tf.note };
    await savePhase({ ...p, time_entries: [...(p.time_entries || []), nt] });
    setShowTime(null);
    setTf({ hours: "", date: today(), note: "" });
  }

  const sorted = [...phases].sort(byDeadline);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Phases</div>
        <button style={S.btn()} onClick={() => { setPf({ title: "", description: "", deadline: "", estimated_hours: "" }); setEditP(null); setShowAP(true); }}>{Ico.plus} Phase</button>
      </div>

      {sorted.map((phase) => {
        const subs = phase.sub_objectives || [];
        const done = subs.filter((s) => s.done).length;
        const pct = phase.progress || 0;
        const open = exp[phase.id];
        const tt = totalTime(phase);
        const est = parseFloat(phase.estimated_hours) || 0;
        const du = daysUntil(phase.deadline);
        return (
          <div key={phase.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div onClick={() => setExp((e) => ({ ...e, [phase.id]: !e[phase.id] }))} style={{ padding: "16px", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <div style={{ color: C.muted }}>{Ico.chev(open)}</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{phase.title}</div>
                <div style={S.badge(progressColor(pct))}>{pct}%</div>
              </div>
              <div style={S.pb}><div style={S.pf(pct, progressColor(pct))} /></div>
              <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: C.muted, flexWrap: "wrap" }}>
                <span>{done}/{subs.length} sous-phases</span>
                {phase.deadline && <span style={{ color: du < 0 ? C.danger : du < 7 ? C.orange : C.muted }}>{Ico.flag} {formatDate(phase.deadline)} {du !== null && (du >= 0 ? `J-${du}` : "passé")}</span>}
                <span style={{ color: tt > est ? C.danger : C.muted }}>{Ico.clock} {tt}h / {est}h</span>
              </div>
            </div>
            {open && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  <button style={{ ...S.btn("primary"), padding: "8px 12px", fontSize: 13 }} onClick={() => { setTf({ hours: "", date: today(), note: "" }); setShowTime(phase); }}>{Ico.clock} + Temps</button>
                  <button style={{ ...S.btn("ghost"), padding: "8px 12px", fontSize: 13 }} onClick={() => { setSf({ title: "", deadline: "" }); setEditS(null); setShowAS(phase.id); }}>{Ico.plus} Sous-phase</button>
                  <button style={{ ...S.btn("ghost"), padding: "8px 12px", fontSize: 13 }} onClick={() => { setCf({ text: "", date: today() }); setShowCom({ item: phase, type: "phase", parent: null }); }}>+ Remarque</button>
                  <button style={{ ...S.btn("ghost"), padding: "8px 12px" }} onClick={() => { setPf({ title: phase.title, description: phase.description || "", deadline: phase.deadline || "", estimated_hours: phase.estimated_hours || "" }); setEditP(phase); setShowAP(true); }}>{Ico.edit}</button>
                  <button style={{ ...S.btn("ghost"), padding: "8px 12px", color: C.danger }} onClick={() => deletePhase(phase.id)}>{Ico.trash}</button>
                </div>
                {phase.description && <div style={{ fontSize: 13, color: C.soft, marginBottom: 12, lineHeight: 1.6 }}>{phase.description}</div>}

                {(phase.time_entries || []).length > 0 && (
                  <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Historique du temps · {tt}h</div>
                    {[...(phase.time_entries || [])].sort(byDate).map((t) => (
                      <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.soft, padding: "3px 0" }}>
                        <span>{formatDate(t.date)} {t.note && `· ${t.note}`}</span>
                        <span style={{ color: C.purple, fontWeight: 600 }}>{t.hours}h</span>
                      </div>
                    ))}
                  </div>
                )}

                {(phase.comments || []).map((c) => (
                  <div key={c.id} style={{ background: C.danger + "11", border: `1px solid ${C.danger}33`, borderRadius: 8, padding: "9px 13px", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: C.danger, marginBottom: 3 }}>{formatDate(c.date)}</div>
                    <div style={{ fontSize: 13, color: "#c8cad6" }}>{c.text}</div>
                  </div>
                ))}

                {[...subs].sort(byDeadline).map((sub) => (
                  <div key={sub.id} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div onClick={() => saveSub(phase, { ...sub, done: !sub.done })} style={{ width: 20, height: 20, borderRadius: 5, border: "2px solid", borderColor: sub.done ? C.green : C.border, background: sub.done ? C.green : "transparent", cursor: "pointer", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{sub.done && Ico.chk}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: sub.done ? C.muted : C.text, textDecoration: sub.done ? "line-through" : "none" }}>{sub.title}</div>
                      {sub.deadline && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{Ico.flag} {formatDate(sub.deadline)}</div>}
                      {(sub.comments || []).map((c) => (
                        <div key={c.id} style={{ background: C.danger + "11", border: `1px solid ${C.danger}33`, borderRadius: 6, padding: "6px 9px", marginTop: 5, fontSize: 12 }}><span style={{ color: C.danger, marginRight: 6 }}>{formatDate(c.date)}</span>{c.text}</div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button style={{ ...S.btn("ghost"), padding: "5px 9px", fontSize: 12 }} onClick={() => { setCf({ text: "", date: today() }); setShowCom({ item: sub, type: "sub", parent: phase }); }}>+</button>
                      <button style={{ ...S.btn("ghost"), padding: "5px 9px" }} onClick={() => { setSf({ title: sub.title, deadline: sub.deadline || "" }); setEditS({ sub }); setShowAS(phase.id); }}>{Ico.edit}</button>
                      <button style={{ ...S.btn("ghost"), padding: "5px 9px", color: C.danger }} onClick={() => deleteSub(phase, sub.id)}>{Ico.trash}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {!phases.length && <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 44 }}>Aucune phase. Commencez par en créer une.</div>}

      {showAP && (
        <Modal title={editP ? "Modifier la phase" : "Nouvelle phase"} onClose={() => setShowAP(false)}>
          <div style={S.fg}><label style={S.label}>Intitulé *</label><input style={S.input} value={pf.title} onChange={(e) => setPf({ ...pf, title: e.target.value })} placeholder="Titre de la phase" /></div>
          <div style={S.fg}><label style={S.label}>Description</label><textarea style={S.textarea} value={pf.description} onChange={(e) => setPf({ ...pf, description: e.target.value })} placeholder="Contexte…" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={S.fg}><label style={S.label}>Deadline</label><input type="date" style={S.input} value={pf.deadline} onChange={(e) => setPf({ ...pf, deadline: e.target.value })} /></div>
            <div style={S.fg}><label style={S.label}>Heures prévues *</label><input type="number" style={S.input} value={pf.estimated_hours} onChange={(e) => setPf({ ...pf, estimated_hours: e.target.value })} placeholder="12" /></div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShowAP(false)}>Annuler</button>
            <button style={{ ...S.btn(), opacity: (!pf.title || !pf.estimated_hours) ? 0.5 : 1 }} onClick={submitP}>{editP ? "Sauvegarder" : "Créer"}</button>
          </div>
        </Modal>
      )}
      {showTime && (
        <Modal title="Ajouter du temps passé" onClose={() => setShowTime(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={S.fg}><label style={S.label}>Heures *</label><input type="number" step="0.25" style={S.input} value={tf.hours} onChange={(e) => setTf({ ...tf, hours: e.target.value })} placeholder="2.5" /></div>
            <div style={S.fg}><label style={S.label}>Date</label><input type="date" style={S.input} value={tf.date} onChange={(e) => setTf({ ...tf, date: e.target.value })} /></div>
          </div>
          <div style={S.fg}><label style={S.label}>Note (optionnel)</label><input style={S.input} value={tf.note} onChange={(e) => setTf({ ...tf, note: e.target.value })} placeholder="ex: traitement des données" /></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShowTime(null)}>Annuler</button>
            <button style={S.btn()} onClick={submitT}>Ajouter</button>
          </div>
        </Modal>
      )}
      {showAS && (
        <Modal title={editS ? "Modifier" : "Nouvelle sous-phase"} onClose={() => setShowAS(null)}>
          <div style={S.fg}><label style={S.label}>Intitulé *</label><input style={S.input} value={sf.title} onChange={(e) => setSf({ ...sf, title: e.target.value })} placeholder="Titre" /></div>
          <div style={S.fg}><label style={S.label}>Deadline personnelle</label><input type="date" style={S.input} value={sf.deadline} onChange={(e) => setSf({ ...sf, deadline: e.target.value })} /></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShowAS(null)}>Annuler</button>
            <button style={S.btn()} onClick={submitS}>{editS ? "Sauvegarder" : "Ajouter"}</button>
          </div>
        </Modal>
      )}
      {showCom && (
        <Modal title="Ajouter une remarque" onClose={() => setShowCom(null)}>
          <div style={S.fg}><label style={S.label}>Date de séance</label><input type="date" style={S.input} value={cf.date} onChange={(e) => setCf({ ...cf, date: e.target.value })} /></div>
          <div style={S.fg}><label style={S.label}>Remarque</label><textarea style={S.textarea} value={cf.text} onChange={(e) => setCf({ ...cf, text: e.target.value })} placeholder="Remarque de l'expert…" /></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShowCom(null)}>Annuler</button>
            <button style={S.btn()} onClick={submitC}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── DOCUMENTATION (éditeur riche) ───────────────────────────────────────────
function Documentation({ docs, phases, saveDoc, deleteDoc }) {
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [view, setView] = useState(null);
  const [f, setF] = useState({ date: today(), title: "", content: "", linked_objective: "", links: [] });
  const editorRef = useRef(null);
  const [linkForm, setLinkForm] = useState({ label: "", url: "" });

  function openNew() { setF({ date: today(), title: "", content: "", linked_objective: "", links: [] }); setEdit(null); setShow(true); }
  function openEdit(d) { setF({ date: d.date, title: d.title || "", content: d.content || "", linked_objective: d.linked_objective || "", links: d.links || [] }); setEdit(d); setShow(true); }

  useEffect(() => {
    if (show && editorRef.current) editorRef.current.innerHTML = f.content || "";
  }, [show]);

  function exec(cmd, val) { document.execCommand(cmd, false, val); editorRef.current.focus(); }

  async function submit() {
    if (!f.title) return;
    const content = editorRef.current ? editorRef.current.innerHTML : f.content;
    if (edit) await saveDoc({ ...edit, ...f, content });
    else await saveDoc({ id: Date.now(), ...f, content });
    setShow(false);
  }
  function addLink() {
    if (!linkForm.url) return;
    setF({ ...f, links: [...f.links, { id: Date.now(), label: linkForm.label || linkForm.url, url: linkForm.url }] });
    setLinkForm({ label: "", url: "" });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Documentation</div>
        <button style={S.btn()} onClick={openNew}>{Ico.plus} Entrée</button>
      </div>
      {[...docs].sort(byDate).map((d) => (
        <div key={d.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => setView(d)}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{formatDate(d.date)}</div>
              {d.linked_objective && <div style={S.badge(C.purple)}>{d.linked_objective}</div>}
            </div>
            <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
              <button style={{ ...S.btn("ghost"), padding: "5px 9px" }} onClick={() => openEdit(d)}>{Ico.edit}</button>
              <button style={{ ...S.btn("ghost"), color: C.danger, padding: "5px 9px" }} onClick={() => deleteDoc(d.id)}>{Ico.trash}</button>
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{d.title}</div>
          <div style={{ fontSize: 13, color: "#c8cad6", lineHeight: 1.6, maxHeight: 60, overflow: "hidden" }} dangerouslySetInnerHTML={{ __html: d.content || "" }} />
          {(d.links || []).length > 0 && <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>{Ico.link} {d.links.length} lien(s)</div>}
        </div>
      ))}
      {!docs.length && <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 44 }}>Aucune entrée. Documentez votre travail.</div>}

      {view && (
        <Modal title={view.title} onClose={() => setView(null)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={S.tag}>{formatDate(view.date)}</div>
            {view.linked_objective && <div style={S.badge(C.purple)}>{view.linked_objective}</div>}
          </div>
          <div style={{ fontSize: 14, color: "#c8cad6", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: view.content || "" }} />
          {(view.links || []).length > 0 && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Liens & Fichiers</div>
              {view.links.map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: C.bg, borderRadius: 8, marginBottom: 6, color: C.accent, textDecoration: "none", fontSize: 13 }}>{Ico.link} {l.label}</a>
              ))}
            </div>
          )}
        </Modal>
      )}

      {show && (
        <Modal title={edit ? "Modifier l'entrée" : "Nouvelle entrée"} onClose={() => setShow(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={S.fg}><label style={S.label}>Date</label><input type="date" style={S.input} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            <div style={S.fg}><label style={S.label}>Phase liée</label>
              <select style={S.input} value={f.linked_objective} onChange={(e) => setF({ ...f, linked_objective: e.target.value })}>
                <option value="">— Général —</option>
                {phases.map((p) => <option key={p.id} value={p.title}>{p.title}</option>)}
              </select>
            </div>
          </div>
          <div style={S.fg}><label style={S.label}>Titre *</label><input style={S.input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Titre de l'entrée" /></div>
          <div style={S.fg}>
            <label style={S.label}>Contenu</label>
            <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
              <button type="button" onClick={() => exec("bold")} style={{ ...S.btn("ghost"), padding: "6px 12px", fontWeight: 800 }}>B</button>
              <button type="button" onClick={() => exec("italic")} style={{ ...S.btn("ghost"), padding: "6px 12px", fontStyle: "italic" }}>I</button>
              <button type="button" onClick={() => exec("underline")} style={{ ...S.btn("ghost"), padding: "6px 12px", textDecoration: "underline" }}>U</button>
              <button type="button" onClick={() => exec("hiliteColor", "#facc1566")} style={{ ...S.btn("ghost"), padding: "6px 10px", background: "#facc1533" }}>Surligner</button>
              <button type="button" onClick={() => exec("foreColor", "#5b9cf6")} style={{ ...S.btn("ghost"), padding: "6px 10px", color: C.accent }}>Bleu</button>
              <button type="button" onClick={() => exec("foreColor", "#ef4444")} style={{ ...S.btn("ghost"), padding: "6px 10px", color: C.danger }}>Rouge</button>
              <button type="button" onClick={() => exec("insertUnorderedList")} style={{ ...S.btn("ghost"), padding: "6px 10px" }}>• Liste</button>
            </div>
            <div ref={editorRef} contentEditable suppressContentEditableWarning style={{ ...S.textarea, minHeight: 160, overflowY: "auto" }} />
          </div>
          <div style={S.fg}>
            <label style={S.label}>Liens / Fichiers (où c'est classé)</label>
            {f.links.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: C.accent }}>{Ico.link} {l.label}</span>
                <button style={{ ...S.btn("ghost"), color: C.danger, padding: "3px 8px" }} onClick={() => setF({ ...f, links: f.links.filter((x) => x.id !== l.id) })}>{Ico.trash}</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input style={{ ...S.input, flex: 1 }} value={linkForm.label} onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })} placeholder="Libellé (ex: Screenshot résultat)" />
              <input style={{ ...S.input, flex: 1 }} value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} placeholder="URL ou emplacement" />
              <button style={{ ...S.btn(), padding: "10px 14px" }} onClick={addLink}>{Ico.plus}</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShow(false)}>Annuler</button>
            <button style={S.btn()} onClick={submit}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── RAPPORTS ────────────────────────────────────────────────────────────────
function Reports({ phases, milestones, docs, reports, saveReport, deleteReport }) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ title: "", type: "initial" });

  function generateHTML(title, type) {
    const ts = phases.reduce((a, p) => a + (p.sub_objectives || []).length, 0);
    const ds = phases.reduce((a, p) => a + (p.sub_objectives || []).filter((s) => s.done).length, 0);
    const gp = ts > 0 ? Math.round((ds / ts) * 100) : 0;
    const te = phases.reduce((a, p) => a + (parseFloat(p.estimated_hours) || 0), 0);
    const ta = phases.reduce((a, p) => a + totalTime(p), 0);
    const remaining = Math.max(te - ta, 0);
    const sortedP = [...phases].sort(byDeadline);
    const maxBar = Math.max(te, ta, 1);

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
@page { margin: 2cm; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
h1 { font-size: 26px; border-bottom: 3px solid #5b9cf6; padding-bottom: 12px; margin-bottom: 4px; }
.sub { color: #888; font-size: 13px; margin-bottom: 30px; }
h2 { font-size: 17px; color: #5b9cf6; margin-top: 30px; border-left: 4px solid #5b9cf6; padding-left: 10px; }
.stat-row { display: flex; gap: 16px; margin: 20px 0; }
.stat { flex: 1; background: #f5f7fa; border-radius: 10px; padding: 16px; text-align: center; }
.stat-val { font-size: 28px; font-weight: 800; color: #5b9cf6; }
.stat-lbl { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
.phase { margin: 16px 0; padding: 14px; background: #fafbfc; border-radius: 10px; border: 1px solid #eee; }
.phase-head { display: flex; justify-content: space-between; font-weight: 700; font-size: 15px; }
.bar { height: 8px; background: #eee; border-radius: 5px; margin-top: 8px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 5px; }
.sub-item { font-size: 13px; padding: 3px 0 3px 16px; color: #555; }
.done { color: #22a06b; }
.pending { color: #999; }
.comment { background: #fff5f5; border: 1px solid #ffdddd; border-radius: 6px; padding: 8px 12px; margin: 6px 0; font-size: 13px; }
.milestone { padding: 10px 14px; background: #f0fdfa; border-radius: 8px; margin: 8px 0; border: 1px solid #ccfbf1; }
.doc-entry { margin: 14px 0; padding: 12px; border-left: 3px solid #a78bfa; background: #faf9ff; }
.doc-date { font-size: 12px; color: #a78bfa; font-weight: 700; }
.doc-title { font-weight: 700; margin: 4px 0; }
.chart { display: flex; gap: 30px; align-items: flex-end; height: 180px; margin: 20px 0; padding: 20px; background: #f5f7fa; border-radius: 10px; }
.chart-col { text-align: center; flex: 1; }
.chart-bar { margin: 0 auto; border-radius: 6px 6px 0 0; width: 60px; }
.foot { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
</style></head><body>
<h1>${title}</h1>
<div class="sub">Rapport généré le ${formatDate(today())} · Brevet de technicien en géomatique</div>

<h2>Résumé de l'avancement</h2>
<div class="stat-row">
  <div class="stat"><div class="stat-val">${gp}%</div><div class="stat-lbl">Progression</div></div>
  <div class="stat"><div class="stat-val">${ds}/${ts}</div><div class="stat-lbl">Sous-phases</div></div>
  <div class="stat"><div class="stat-val">${ta}h</div><div class="stat-lbl">Temps passé</div></div>
  <div class="stat"><div class="stat-val">${remaining}h</div><div class="stat-lbl">Restant estimé</div></div>
</div>

<h2>Détail des phases</h2>
${sortedP.map((p) => {
  const pct = computeProgress(p);
  const tt = totalTime(p);
  const est = parseFloat(p.estimated_hours) || 0;
  const subs = p.sub_objectives || [];
  return `<div class="phase">
    <div class="phase-head"><span>${p.title}</span><span style="color:${pct>=100?'#22a06b':pct>=50?'#d4a017':'#e05555'}">${pct}%</span></div>
    <div style="font-size:12px;color:#888;margin-top:4px">${p.deadline ? 'Échéance : ' + formatDate(p.deadline) + ' · ' : ''}${tt}h / ${est}h prévues</div>
    <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${pct>=100?'#22a06b':pct>=50?'#d4a017':'#e05555'}"></div></div>
    ${subs.map((s) => `<div class="sub-item ${s.done ? 'done' : 'pending'}">${s.done ? '✓' : '○'} ${s.title}</div>`).join('')}
    ${(p.comments || []).map((c) => `<div class="comment"><b>${formatDate(c.date)}</b> — ${c.text}</div>`).join('')}
  </div>`;
}).join('')}

${milestones.length ? `<h2>Jalons officiels</h2>
${[...milestones].sort((a,b)=>a.date.localeCompare(b.date)).map((m) => `<div class="milestone">
  <b>${m.done ? '✓ ' : ''}${m.title}</b> — ${formatDate(m.date)}
  ${(m.deliverables || []).map((d) => `<div class="sub-item ${d.done ? 'done' : 'pending'}">${d.done ? '✓' : '○'} ${d.label}</div>`).join('')}
</div>`).join('')}` : ''}

${docs.length ? `<h2>Notes de documentation</h2>
${[...docs].sort((a,b)=>a.date.localeCompare(b.date)).map((d) => `<div class="doc-entry">
  <div class="doc-date">${formatDate(d.date)}${d.linked_objective ? ' · ' + d.linked_objective : ''}</div>
  <div class="doc-title">${d.title}</div>
  <div>${d.content || ''}</div>
  ${(d.links || []).map((l) => `<div style="font-size:12px;color:#5b9cf6">🔗 ${l.label} — ${l.url}</div>`).join('')}
</div>`).join('')}` : ''}

<h2>Temps : prévu vs passé</h2>
<div class="chart">
  <div class="chart-col"><div class="chart-bar" style="height:${(te/maxBar)*140}px;background:#5b9cf6"></div><div style="margin-top:8px;font-weight:700">${te}h</div><div class="stat-lbl">Prévu</div></div>
  <div class="chart-col"><div class="chart-bar" style="height:${(ta/maxBar)*140}px;background:${ta>te?'#e05555':'#22a06b'}"></div><div style="margin-top:8px;font-weight:700">${ta}h</div><div class="stat-lbl">Passé</div></div>
  <div class="chart-col"><div class="chart-bar" style="height:${(remaining/maxBar)*140}px;background:#d4a017"></div><div style="margin-top:8px;font-weight:700">${remaining}h</div><div class="stat-lbl">Restant</div></div>
</div>

<div class="foot">Document généré automatiquement — Suivi de projet Brevet Géomatique</div>
</body></html>`;
  }

  function exportReport(type) {
    const title = f.title || (type === "doc" ? `Documentation ${formatDate(today())}` : `Rapport ${formatDate(today())}`);
    let html;
    if (type === "doc") {
      html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>@page{margin:2cm}body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;line-height:1.6;max-width:800px;margin:0 auto;padding:20px}h1{font-size:24px;border-bottom:3px solid #a78bfa;padding-bottom:10px}.doc-entry{margin:18px 0;padding:14px;border-left:3px solid #a78bfa;background:#faf9ff}.doc-date{font-size:12px;color:#a78bfa;font-weight:700}.doc-title{font-weight:700;font-size:16px;margin:4px 0}</style></head><body>
<h1>${title}</h1>
${[...docs].sort((a,b)=>a.date.localeCompare(b.date)).map((d) => `<div class="doc-entry"><div class="doc-date">${formatDate(d.date)}${d.linked_objective ? ' · ' + d.linked_objective : ''}</div><div class="doc-title">${d.title}</div><div>${d.content || ''}</div>${(d.links || []).map((l) => `<div style="font-size:12px;color:#5b9cf6">🔗 ${l.label} — ${l.url}</div>`).join('')}</div>`).join('')}
</body></html>`;
    } else {
      html = generateHTML(title, type);
    }
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
    setShow(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Rapports</div>
      </div>
      <div style={S.card}>
        <div style={S.ct}>Générer un rapport PDF</div>
        <div style={{ fontSize: 13, color: C.soft, marginBottom: 16, lineHeight: 1.6 }}>
          Le rapport compile l'avancement des phases, les jalons, les notes de documentation, ce qui reste à accomplir, et un graphique temps prévu / passé / restant. L'aperçu s'ouvre pour impression ou sauvegarde en PDF.
        </div>
        <div style={S.fg}><label style={S.label}>Titre du rapport</label><input style={S.input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={`Rapport ${formatDate(today())}`} /></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={S.btn()} onClick={() => exportReport("full")}>{Ico.rep} Rapport complet PDF</button>
          <button style={S.btn("secondary")} onClick={() => exportReport("doc")}>{Ico.jour} Documentation seule</button>
        </div>
      </div>
      <div style={{ ...S.card, background: "#0e1220", borderColor: C.accent + "33" }}>
        <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.7 }}>
          <strong style={{ color: C.text }}>Astuce iPhone :</strong> quand l'aperçu s'ouvre, choisis "Partager" puis "Enregistrer dans Fichiers" ou "Imprimer" → pincer pour agrandir → partager en PDF.
        </div>
      </div>
    </div>
  );
}

// ─── JALONS & SETTINGS ───────────────────────────────────────────────────────
function Settings({ milestones, saveMilestone, deleteMilestone }) {
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [f, setF] = useState({ title: "", date: "", deliverables: [], done: false });
  const [delForm, setDelForm] = useState("");

  function openNew() { setF({ title: "", date: "", deliverables: [], done: false }); setEdit(null); setShow(true); }
  function openEdit(m) { setF({ title: m.title, date: m.date, deliverables: m.deliverables || [], done: m.done || false }); setEdit(m); setShow(true); }
  async function submit() {
    if (!f.title || !f.date) return;
    if (edit) await saveMilestone({ ...edit, ...f });
    else await saveMilestone({ id: Date.now(), ...f });
    setShow(false);
  }
  function addDel() {
    if (!delForm) return;
    setF({ ...f, deliverables: [...f.deliverables, { id: Date.now(), label: delForm, done: false }] });
    setDelForm("");
  }
  async function toggleDel(m, delId) {
    const dels = (m.deliverables || []).map((d) => d.id === delId ? { ...d, done: !d.done } : d);
    await saveMilestone({ ...m, deliverables: dels });
  }
  async function toggleDone(m) { await saveMilestone({ ...m, done: !m.done }); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Jalons officiels</div>
        <button style={S.btn()} onClick={openNew}>{Ico.plus} Jalon</button>
      </div>

      {[...milestones].sort((a, b) => a.date.localeCompare(b.date)).map((m) => {
        const dels = m.deliverables || [];
        const doneDel = dels.filter((d) => d.done).length;
        const du = daysUntil(m.date);
        return (
          <div key={m.id} style={{ ...S.card, borderColor: m.done ? C.border : C.teal + "44" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ width: 12, height: 12, background: m.done ? C.muted : C.teal, transform: "rotate(45deg)", flexShrink: 0 }} />
                  <div style={{ fontSize: 15, fontWeight: 700, textDecoration: m.done ? "line-through" : "none", color: m.done ? C.muted : C.text }}>{m.title}</div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, marginLeft: 20 }}>
                  {formatDate(m.date)} {du !== null && <span style={{ color: du < 0 ? C.danger : du < 14 ? C.orange : C.muted }}>· {du >= 0 ? `J-${du}` : "passé"}</span>}
                  {dels.length > 0 && ` · ${doneDel}/${dels.length} éléments`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button style={{ ...S.btn("ghost"), padding: "5px 9px" }} onClick={() => openEdit(m)}>{Ico.edit}</button>
                <button style={{ ...S.btn("ghost"), color: C.danger, padding: "5px 9px" }} onClick={() => deleteMilestone(m.id)}>{Ico.trash}</button>
              </div>
            </div>
            {dels.map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", paddingLeft: 20 }}>
                <div onClick={() => toggleDel(m, d.id)} style={{ width: 18, height: 18, borderRadius: 5, border: "2px solid", borderColor: d.done ? C.green : C.border, background: d.done ? C.green : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{d.done && Ico.chk}</div>
                <div style={{ fontSize: 14, color: d.done ? C.muted : C.text, textDecoration: d.done ? "line-through" : "none" }}>{d.label}</div>
              </div>
            ))}
            <button style={{ ...S.btn(m.done ? "secondary" : "primary"), marginTop: 10, width: "100%", justifyContent: "center", background: m.done ? C.border : C.teal }} onClick={() => toggleDone(m)}>
              {m.done ? "Marquer non terminé" : "✓ Marquer le jalon terminé"}
            </button>
          </div>
        );
      })}
      {!milestones.length && <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 44 }}>Aucun jalon officiel.</div>}

      <div style={S.card}>
        <div style={S.ct}>Écran d'accueil iPhone</div>
        <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.9 }}>
          1. Ouvre dans <strong style={{ color: C.text }}>Safari</strong> · 2. Bouton <strong style={{ color: C.text }}>Partager</strong> · 3. <strong style={{ color: C.text }}>"Sur l'écran d'accueil"</strong>
        </div>
      </div>

      {show && (
        <Modal title={edit ? "Modifier le jalon" : "Nouveau jalon"} onClose={() => setShow(false)}>
          <div style={S.fg}><label style={S.label}>Intitulé *</label><input style={S.input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="ex: Inscription" /></div>
          <div style={S.fg}><label style={S.label}>Date officielle *</label><input type="date" style={S.input} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
          <div style={S.fg}>
            <label style={S.label}>Éléments à rendre</label>
            {f.deliverables.map((d) => (
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontSize: 14 }}>
                <span>{d.label}</span>
                <button style={{ ...S.btn("ghost"), color: C.danger, padding: "3px 8px" }} onClick={() => setF({ ...f, deliverables: f.deliverables.filter((x) => x.id !== d.id) })}>{Ico.trash}</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input style={{ ...S.input, flex: 1 }} value={delForm} onChange={(e) => setDelForm(e.target.value)} placeholder="ex: Document de proposition" onKeyDown={(e) => e.key === "Enter" && addDel()} />
              <button style={{ ...S.btn(), padding: "10px 14px" }} onClick={addDel}>{Ico.plus}</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShow(false)}>Annuler</button>
            <button style={S.btn()} onClick={submit}>{edit ? "Sauvegarder" : "Créer"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [phases, setPhases] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [docs, setDocs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [objs, miles, jour, reps] = await Promise.all([dbGetAll("objectives"), dbGetAll("milestones"), dbGetAll("journal_entries"), dbGetAll("reports")]);
        setPhases(objs.map((o) => ({ ...o, sub_objectives: o.sub_objectives || [], comments: o.comments || [], time_entries: o.time_entries || [] })));
        setMilestones(miles.map((m) => ({ ...m, deliverables: m.deliverables || [], done: m.done || false })));
        setDocs(jour.map((d) => ({ ...d, links: d.links || [] })));
        setReports(reps);
      } catch (e) { setError(e.message); }
      setLoading(false);
    }
    load();
  }, []);

  function enriched() { return enrich(phases); }

  async function savePhase(p) {
    await dbUpsert("objectives", p);
    setPhases((prev) => { const e = prev.find((x) => x.id === p.id); return e ? prev.map((x) => x.id === p.id ? p : x) : [...prev, p]; });
  }
  async function deletePhase(id) { await dbDelete("objectives", id); setPhases((prev) => prev.filter((x) => x.id !== id)); }
  async function saveSub(parent, sub) {
    const subs = parent.sub_objectives || [];
    const newSubs = subs.find((s) => s.id === sub.id) ? subs.map((s) => s.id === sub.id ? sub : s) : [...subs, sub];
    await savePhase({ ...parent, sub_objectives: newSubs });
  }
  async function deleteSub(parent, subId) { await savePhase({ ...parent, sub_objectives: (parent.sub_objectives || []).filter((s) => s.id !== subId) }); }
  async function saveMilestone(m) {
    await dbUpsert("milestones", m);
    setMilestones((prev) => { const e = prev.find((x) => x.id === m.id); return e ? prev.map((x) => x.id === m.id ? m : x) : [...prev, m]; });
  }
  async function deleteMilestone(id) { await dbDelete("milestones", id); setMilestones((prev) => prev.filter((m) => m.id !== id)); }
  async function saveDoc(d) {
    await dbUpsert("journal_entries", d);
    setDocs((prev) => { const e = prev.find((x) => x.id === d.id); return e ? prev.map((x) => x.id === d.id ? d : x) : [...prev, d]; });
  }
  async function deleteDoc(id) { await dbDelete("journal_entries", id); setDocs((prev) => prev.filter((d) => d.id !== id)); }
  async function saveReport(r) { await dbUpsert("reports", r); setReports((prev) => [...prev, r]); }
  async function deleteReport(id) { await dbDelete("reports", id); setReports((prev) => prev.filter((r) => r.id !== id)); }

  const nav = [
    { id: "dashboard", label: "Accueil", ico: Ico.dash },
    { id: "phases", label: "Phases", ico: Ico.obj },
    { id: "docs", label: "Doc", ico: Ico.jour },
    { id: "reports", label: "Rapports", ico: Ico.rep },
    { id: "settings", label: "Jalons", ico: Ico.set },
  ];

  if (loading) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontFamily: "DM Sans, sans-serif", fontSize: 15 }}>Chargement…</div>;
  if (error) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.danger, fontFamily: "DM Sans, sans-serif", padding: 24, textAlign: "center", gap: 12 }}><div style={{ fontSize: 16, fontWeight: 700 }}>Erreur Supabase</div><div style={{ fontSize: 13, color: C.muted, maxWidth: 320 }}>{error}</div></div>;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        select option { background: ${C.surface}; color: ${C.text}; }
        button:active { opacity: 0.75; }
        [contenteditable]:empty:before { content: "Prenez vos notes ici…"; color: ${C.muted}; }
        [contenteditable]:focus { border-color: ${C.accent}; }
      `}</style>
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, color: C.text, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", color: C.accent, textTransform: "uppercase" }}>Brevet Géomatique</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Suivi de projet</div>
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>{new Date().toLocaleDateString("fr-CH")}</div>
        </div>
        <div style={{ flex: 1, padding: "18px 16px 100px", maxWidth: 680, width: "100%", margin: "0 auto" }}>
          {tab === "dashboard" && <Dashboard phases={enriched()} milestones={milestones} docs={docs} />}
          {tab === "phases" && <Phases phases={enriched()} savePhase={savePhase} deletePhase={deletePhase} saveSub={saveSub} deleteSub={deleteSub} />}
          {tab === "docs" && <Documentation docs={docs} phases={enriched()} saveDoc={saveDoc} deleteDoc={deleteDoc} />}
          {tab === "reports" && <Reports phases={enriched()} milestones={milestones} docs={docs} reports={reports} saveReport={saveReport} deleteReport={deleteReport} />}
          {tab === "settings" && <Settings milestones={milestones} saveMilestone={saveMilestone} deleteMilestone={deleteMilestone} />}
        </div>
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {nav.map(({ id, label, ico }) => (
            <div key={id} onClick={() => setTab(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "11px 4px 9px", cursor: "pointer", color: tab === id ? C.accent : C.muted, borderTop: tab === id ? `2px solid ${C.accent}` : "2px solid transparent", transition: "color 0.15s", userSelect: "none" }}>
              {ico}
              <div style={{ fontSize: 10, fontWeight: 600, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
