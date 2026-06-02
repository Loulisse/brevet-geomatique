import { useState, useEffect } from "react";

// ─── SUPABASE CONFIG ── Remplace par tes vraies clés ────────────────────────
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

async function dbGetAll(table) {
  return await sbFetch(`/${table}?order=created_at.asc`);
}
async function dbUpsert(table, row) {
  return await sbFetch(`/${table}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
}
async function dbDelete(table, id) {
  return await sbFetch(`/${table}?id=eq.${id}`, { method: "DELETE" });
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}
function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}
function progressColor(pct) {
  if (pct >= 100) return "#4ade80";
  if (pct >= 60) return "#facc15";
  if (pct >= 30) return "#fb923c";
  return "#f87171";
}
function computeProgress(obj) {
  const subs = obj.sub_objectives || [];
  if (!subs.length) return 0;
  return Math.round((subs.filter((s) => s.done).length / subs.length) * 100);
}
function enrich(objs) { return objs.map((o) => ({ ...o, progress: computeProgress(o) })); }

// ─── DESIGN ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d0f14", surface: "#111318", border: "#1e2029",
  text: "#e8eaf0", muted: "#555a6e", soft: "#8b8fa8",
  accent: "#5b9cf6", purple: "#a78bfa", green: "#4ade80",
  yellow: "#facc15", orange: "#fb923c", danger: "#ef4444",
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
  mbox: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" },
};

// ─── ICONS ──────────────────────────────────────────────────────────────────
const Ico = {
  dash: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  obj: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  jour: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  rep: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  set: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  edit: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  flag: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  chk: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  chev: (open) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>,
};

// ─── MODAL ──────────────────────────────────────────────────────────────────
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

// ─── GANTT ──────────────────────────────────────────────────────────────────
function Gantt({ objectives }) {
  const all = [];
  objectives.forEach((o) => {
    if (o.deadline) all.push({ label: o.title, date: o.deadline, type: "obj" });
    (o.sub_objectives || []).forEach((s) => { if (s.deadline) all.push({ label: s.title, date: s.deadline, type: "sub" }); });
  });
  all.sort((a, b) => a.date.localeCompare(b.date));
  if (!all.length) return <div style={{ color: C.muted, fontSize: 13 }}>Aucune deadline renseignée.</div>;
  const dates = all.map((x) => new Date(x.date));
  const min = new Date(Math.min(...dates)), max = new Date(Math.max(...dates));
  const range = Math.max(max - min, 1);
  return (
    <div>
      {all.map((item, i) => {
        const pos = ((new Date(item.date) - min) / range) * 80;
        const du = daysUntil(item.date);
        const col = du === null ? C.accent : du < 0 ? C.danger : du < 7 ? C.orange : du < 30 ? C.yellow : C.accent;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 9, gap: 8 }}>
            <div style={{ width: 110, fontSize: 11, color: item.type === "obj" ? C.text : C.soft, flexShrink: 0, fontWeight: item.type === "obj" ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
            <div style={{ flex: 1, position: "relative", height: 20 }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: C.border }} />
              <div style={{ position: "absolute", left: `${pos}%`, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
                <div style={{ width: item.type === "obj" ? 11 : 7, height: item.type === "obj" ? 11 : 7, borderRadius: 999, background: col, boxShadow: `0 0 6px ${col}99` }} />
              </div>
            </div>
            <div style={{ width: 68, fontSize: 10, color: col, textAlign: "right", flexShrink: 0 }}>
              {formatDate(item.date)}{du !== null && <span style={{ color: C.muted }}> ({du > 0 ? `J-${du}` : du === 0 ? "auj." : `+${-du}j`})</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
function Dashboard({ objectives, milestones, journal }) {
  const ts = objectives.reduce((a, o) => a + (o.sub_objectives || []).length, 0);
  const ds = objectives.reduce((a, o) => a + (o.sub_objectives || []).filter((s) => s.done).length, 0);
  const gp = ts > 0 ? Math.round((ds / ts) * 100) : 0;
  const te = objectives.reduce((a, o) => a + (parseFloat(o.estimated_hours) || 0), 0);
  const ta = objectives.reduce((a, o) => a + (parseFloat(o.actual_hours) || 0), 0);
  const nm = milestones.filter((m) => m.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          [gp + "%", "Progression", progressColor(gp), gp],
          [ds + "/" + ts, "Sous-obj.", C.accent, null],
          [ta + "h/" + te + "h", "Heures", C.purple, te > 0 ? (ta / te) * 100 : 0],
        ].map(([val, label, color, bar], i) => (
          <div key={i} style={{ ...S.card, marginBottom: 0, padding: 14 }}>
            <div style={{ fontSize: i === 2 ? 16 : 22, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 4 }}>{label}</div>
            {bar !== null && <div style={S.pb}><div style={S.pf(bar, color)} /></div>}
          </div>
        ))}
      </div>

      {nm && (
        <div style={{ ...S.card, borderColor: C.accent + "44", background: "#0e1220", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Prochain jalon</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{nm.title}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{formatDate(nm.date)} — J-{daysUntil(nm.date)}</div>
        </div>
      )}

      <div style={S.card}>
        <div style={S.ct}>Timeline deadlines</div>
        <Gantt objectives={objectives} />
      </div>

      <div style={S.card}>
        <div style={S.ct}>Objectifs</div>
        {objectives.map((o) => (
          <div key={o.id} style={{ marginBottom: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "78%" }}>{o.title}</span>
              <span style={{ color: progressColor(o.progress || 0), fontWeight: 700 }}>{o.progress || 0}%</span>
            </div>
            <div style={S.pb}><div style={S.pf(o.progress || 0, progressColor(o.progress || 0))} /></div>
          </div>
        ))}
        {!objectives.length && <div style={{ color: C.muted, fontSize: 13 }}>Aucun objectif créé.</div>}
      </div>

      <div style={S.card}>
        <div style={S.ct}>Temps estimé vs réel</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          {objectives.map((o) => {
            const e = parseFloat(o.estimated_hours) || 0;
            const a = parseFloat(o.actual_hours) || 0;
            const m = Math.max(e, a, 1);
            return (
              <div key={o.id} style={{ textAlign: "center", minWidth: 44 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", justifyContent: "center", height: 56 }}>
                  <div style={{ width: 13, height: `${(e / m) * 52}px`, background: C.accent, borderRadius: "3px 3px 0 0", minHeight: 3 }} />
                  <div style={{ width: 13, height: `${(a / m) * 52}px`, background: a > e ? C.danger : C.green, borderRadius: "3px 3px 0 0", minHeight: 3 }} />
                </div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 3, maxWidth: 44, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
          {[[C.accent, "Estimé"], [C.green, "Réel OK"], [C.danger, "Dépassé"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.soft }}><div style={{ width: 8, height: 8, background: c, borderRadius: 2 }} />{l}</div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.ct}>Dernières entrées carnet</div>
        {[...journal].reverse().slice(0, 3).map((e) => (
          <div key={e.id} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{formatDate(e.date)}{e.linked_objective && ` · ${e.linked_objective}`}</div>
            <div style={{ fontSize: 13, color: "#c8cad6", lineHeight: 1.5 }}>{e.content?.slice(0, 100)}{e.content?.length > 100 ? "…" : ""}</div>
          </div>
        ))}
        {!journal.length && <div style={{ color: C.muted, fontSize: 13 }}>Aucune entrée.</div>}
      </div>
    </div>
  );
}

// ─── OBJECTIVES ─────────────────────────────────────────────────────────────
function Objectives({ objectives, saveObjective, deleteObjective, saveSubObjective, deleteSubObjective }) {
  const [exp, setExp] = useState({});
  const [showAO, setShowAO] = useState(false);
  const [editO, setEditO] = useState(null);
  const [showAS, setShowAS] = useState(null);
  const [editS, setEditS] = useState(null);
  const [showCom, setShowCom] = useState(null);
  const [of, setOf] = useState({ title: "", description: "", deadline: "", estimated_hours: "", actual_hours: "" });
  const [sf, setSf] = useState({ title: "", deadline: "" });
  const [cf, setCf] = useState({ text: "", date: today() });

  async function submitO() {
    if (editO) await saveObjective({ ...editO, ...of });
    else await saveObjective({ id: Date.now(), ...of, sub_objectives: [], comments: [] });
    setShowAO(false);
  }
  async function submitS() {
    const p = objectives.find((o) => o.id === showAS);
    if (!p) return;
    if (editS) await saveSubObjective(p, { ...editS.sub, ...sf });
    else await saveSubObjective(p, { id: Date.now(), ...sf, done: false, comments: [] });
    setShowAS(null);
  }
  async function submitC() {
    const { item, type, parent } = showCom;
    const nc = { id: Date.now(), text: cf.text, date: cf.date };
    if (type === "obj") await saveObjective({ ...item, comments: [...(item.comments || []), nc] });
    else await saveSubObjective(parent, { ...item, comments: [...(item.comments || []), nc] });
    setShowCom(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Objectifs</div>
        <button style={S.btn()} onClick={() => { setOf({ title: "", description: "", deadline: "", estimated_hours: "", actual_hours: "" }); setEditO(null); setShowAO(true); }}>{Ico.plus} Nouveau</button>
      </div>

      {objectives.map((obj, idx) => {
        const subs = obj.sub_objectives || [];
        const done = subs.filter((s) => s.done).length;
        const pct = obj.progress || 0;
        const open = exp[obj.id];
        return (
          <div key={obj.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div onClick={() => setExp((e) => ({ ...e, [obj.id]: !e[obj.id] }))} style={{ padding: "16px", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <div style={{ color: C.muted }}>{Ico.chev(open)}</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Obj. {idx + 1} — {obj.title}</div>
                <div style={S.badge(progressColor(pct))}>{pct}%</div>
              </div>
              <div style={S.pb}><div style={S.pf(pct, progressColor(pct))} /></div>
              <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: C.muted }}>
                <span>{done}/{subs.length} sous-obj.</span>
                {obj.deadline && <span>{Ico.flag} {formatDate(obj.deadline)}</span>}
              </div>
            </div>

            {open && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <button style={{ ...S.btn("ghost"), padding: "8px 12px", fontSize: 13 }} onClick={() => { setCf({ text: "", date: today() }); setShowCom({ item: obj, type: "obj", parent: null }); }}>+ Remarque</button>
                  <button style={{ ...S.btn("ghost"), padding: "8px 12px" }} onClick={() => { setOf({ title: obj.title, description: obj.description || "", deadline: obj.deadline || "", estimated_hours: obj.estimated_hours || "", actual_hours: obj.actual_hours || "" }); setEditO(obj); setShowAO(true); }}>{Ico.edit}</button>
                  <button style={{ ...S.btn("ghost"), padding: "8px 12px", color: C.danger }} onClick={() => deleteObjective(obj.id)}>{Ico.trash}</button>
                </div>
                {obj.description && <div style={{ fontSize: 13, color: C.soft, marginBottom: 12, lineHeight: 1.6 }}>{obj.description}</div>}
                {(obj.comments || []).map((c) => (
                  <div key={c.id} style={{ background: C.danger + "11", border: `1px solid ${C.danger}33`, borderRadius: 8, padding: "9px 13px", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: C.danger, marginBottom: 3 }}>{formatDate(c.date)}</div>
                    <div style={{ fontSize: 13, color: "#c8cad6" }}>{c.text}</div>
                  </div>
                ))}
                {subs.map((sub) => (
                  <div key={sub.id} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div onClick={() => saveSubObjective(obj, { ...sub, done: !sub.done })} style={{ width: 20, height: 20, borderRadius: 5, border: "2px solid", borderColor: sub.done ? C.green : C.border, background: sub.done ? C.green : "transparent", cursor: "pointer", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {sub.done && Ico.chk}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: sub.done ? C.muted : C.text, textDecoration: sub.done ? "line-through" : "none" }}>{sub.title}</div>
                      {sub.deadline && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{Ico.flag} {formatDate(sub.deadline)}</div>}
                      {(sub.comments || []).map((c) => (
                        <div key={c.id} style={{ background: C.danger + "11", border: `1px solid ${C.danger}33`, borderRadius: 6, padding: "6px 9px", marginTop: 5, fontSize: 12 }}>
                          <span style={{ color: C.danger, marginRight: 6 }}>{formatDate(c.date)}</span>{c.text}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button style={{ ...S.btn("ghost"), padding: "5px 9px", fontSize: 12 }} onClick={() => { setCf({ text: "", date: today() }); setShowCom({ item: sub, type: "sub", parent: obj }); }}>+</button>
                      <button style={{ ...S.btn("ghost"), padding: "5px 9px" }} onClick={() => { setSf({ title: sub.title, deadline: sub.deadline || "" }); setEditS({ sub }); setShowAS(obj.id); }}>{Ico.edit}</button>
                      <button style={{ ...S.btn("ghost"), padding: "5px 9px", color: C.danger }} onClick={() => deleteSubObjective(obj, sub.id)}>{Ico.trash}</button>
                    </div>
                  </div>
                ))}
                <button style={{ ...S.btn("ghost"), marginTop: 12, fontSize: 13 }} onClick={() => { setSf({ title: "", deadline: "" }); setEditS(null); setShowAS(obj.id); }}>{Ico.plus} Sous-objectif</button>
              </div>
            )}
          </div>
        );
      })}
      {!objectives.length && <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 44 }}>Aucun objectif. Commencez par en créer un.</div>}

      {showAO && (
        <Modal title={editO ? "Modifier" : "Nouvel objectif"} onClose={() => setShowAO(false)}>
          <div style={S.fg}><label style={S.label}>Intitulé</label><input style={S.input} value={of.title} onChange={(e) => setOf({ ...of, title: e.target.value })} placeholder="Titre" /></div>
          <div style={S.fg}><label style={S.label}>Description</label><textarea style={S.textarea} value={of.description} onChange={(e) => setOf({ ...of, description: e.target.value })} placeholder="Contexte, notes…" /></div>
          <div style={S.fg}><label style={S.label}>Deadline</label><input type="date" style={S.input} value={of.deadline} onChange={(e) => setOf({ ...of, deadline: e.target.value })} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={S.fg}><label style={S.label}>H. estimées</label><input type="number" style={S.input} value={of.estimated_hours} onChange={(e) => setOf({ ...of, estimated_hours: e.target.value })} placeholder="12" /></div>
            <div style={S.fg}><label style={S.label}>H. réelles</label><input type="number" style={S.input} value={of.actual_hours} onChange={(e) => setOf({ ...of, actual_hours: e.target.value })} placeholder="9" /></div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShowAO(false)}>Annuler</button>
            <button style={S.btn()} onClick={submitO}>{editO ? "Sauvegarder" : "Créer"}</button>
          </div>
        </Modal>
      )}
      {showAS && (
        <Modal title={editS ? "Modifier" : "Nouveau sous-objectif"} onClose={() => setShowAS(null)}>
          <div style={S.fg}><label style={S.label}>Intitulé</label><input style={S.input} value={sf.title} onChange={(e) => setSf({ ...sf, title: e.target.value })} placeholder="Titre" /></div>
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

// ─── JOURNAL ────────────────────────────────────────────────────────────────
function Journal({ entries, objectives, saveEntry, deleteEntry }) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ date: today(), content: "", linked_objective: "", image_url: "" });
  async function submit() { await saveEntry({ id: Date.now(), ...f }); setShow(false); setF({ date: today(), content: "", linked_objective: "", image_url: "" }); }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Carnet de route</div>
        <button style={S.btn()} onClick={() => setShow(true)}>{Ico.plus} Entrée</button>
      </div>
      {[...entries].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
        <div key={e.id} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{formatDate(e.date)}</div>
              {e.linked_objective && <div style={S.badge(C.purple)}>{e.linked_objective}</div>}
            </div>
            <button style={{ ...S.btn("ghost"), color: C.danger, padding: "5px 9px" }} onClick={() => deleteEntry(e.id)}>{Ico.trash}</button>
          </div>
          <div style={{ fontSize: 14, color: "#c8cad6", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{e.content}</div>
          {e.image_url && <img src={e.image_url} alt="" style={{ maxWidth: "100%", borderRadius: 8, border: `1px solid ${C.border}`, marginTop: 10 }} onError={(x) => { x.target.style.display = "none"; }} />}
        </div>
      ))}
      {!entries.length && <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 44 }}>Aucune entrée.</div>}
      {show && (
        <Modal title="Nouvelle entrée" onClose={() => setShow(false)}>
          <div style={S.fg}><label style={S.label}>Date</label><input type="date" style={S.input} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
          <div style={S.fg}><label style={S.label}>Objectif lié</label>
            <select style={S.input} value={f.linked_objective} onChange={(e) => setF({ ...f, linked_objective: e.target.value })}>
              <option value="">— Général —</option>
              {objectives.map((o) => <option key={o.id} value={o.title}>{o.title}</option>)}
            </select>
          </div>
          <div style={S.fg}><label style={S.label}>Note</label><textarea style={{ ...S.textarea, minHeight: 130 }} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} placeholder="Avancement, difficultés, décisions…" /></div>
          <div style={S.fg}><label style={S.label}>URL image (optionnel)</label><input style={S.input} value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} placeholder="https://…" /></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShow(false)}>Annuler</button>
            <button style={S.btn()} onClick={submit}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── REPORTS ────────────────────────────────────────────────────────────────
function Reports({ objectives, reports, saveReport, deleteReport }) {
  const [show, setShow] = useState(false);
  const [view, setView] = useState(null);
  const [f, setF] = useState({ title: "", type: "initial", compare_with: "" });

  function snap() {
    return objectives.map((o) => ({ id: o.id, title: o.title, description: o.description, deadline: o.deadline, progress: o.progress, estimated_hours: o.estimated_hours, actual_hours: o.actual_hours, comments: o.comments || [], sub_objectives: (o.sub_objectives || []).map((s) => ({ id: s.id, title: s.title, deadline: s.deadline, done: s.done, comments: s.comments || [] })) }));
  }
  function diffS(b, c) {
    const bm = Object.fromEntries(b.map((s) => [s.id, s])), cm = Object.fromEntries(c.map((s) => [s.id, s]));
    return [...new Set([...Object.keys(bm), ...Object.keys(cm)])].map((id) => { const bx = bm[id], cx = cm[id]; if (!bx) return { ...cx, _s: "new" }; if (!cx) return { ...bx, _s: "del" }; return { ...cx, _s: (bx.title !== cx.title || bx.done !== cx.done) ? "mod" : "same" }; });
  }
  function diffR(b, c) {
    const bm = Object.fromEntries(b.map((o) => [o.id, o])), cm = Object.fromEntries(c.map((o) => [o.id, o]));
    return [...new Set([...Object.keys(bm), ...Object.keys(cm)])].map((id) => { const bx = bm[id], cx = cm[id]; if (!bx) return { ...cx, _s: "new" }; if (!cx) return { ...bx, _s: "del" }; const ch = bx.title !== cx.title || bx.deadline !== cx.deadline || bx.progress !== cx.progress; return { ...cx, _s: ch ? "mod" : "same", sub_objectives: diffS(bx.sub_objectives || [], cx.sub_objectives || []) }; });
  }
  async function create() {
    const s = snap(); let diff = null;
    if (f.compare_with) { const base = reports.find((r) => r.id === parseInt(f.compare_with)); if (base) diff = diffR(base.snapshot, s); }
    await saveReport({ id: Date.now(), title: f.title || `Rapport ${formatDate(today())}`, type: f.type, date: today(), snapshot: s, diff });
    setShow(false);
  }
  const RC = { initial: C.accent, intermediate: C.purple, final: C.green, comparison: C.yellow };
  const RL = { initial: "Démarrage", intermediate: "Intermédiaire", final: "Final", comparison: "Comparaison" };
  const SC = (s) => ({ new: C.green, del: C.yellow, mod: C.accent, same: C.muted }[s]);
  const SL = (s) => ({ new: "Nouveau", del: "Supprimé", mod: "Modifié", same: "" }[s]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Rapports</div>
        <button style={S.btn()} onClick={() => setShow(true)}>{Ico.plus} Rapport</button>
      </div>
      {reports.map((r) => (
        <div key={r.id} style={{ ...S.card, borderColor: RC[r.type] + "44", cursor: "pointer" }} onClick={() => setView(r)}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={S.badge(RC[r.type])}>{RL[r.type]}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{formatDate(r.date)}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{r.title}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{r.snapshot?.length || 0} objectifs{r.diff ? " · Avec comparaison" : ""}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
            <button style={S.btn("ghost")} onClick={() => setView(r)}>Ouvrir</button>
            <button style={{ ...S.btn("ghost"), color: C.danger }} onClick={() => deleteReport(r.id)}>{Ico.trash}</button>
          </div>
        </div>
      ))}
      {!reports.length && <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 44 }}>Aucun rapport. Générez-en un avant chaque séance.</div>}

      {show && (
        <Modal title="Nouveau rapport" onClose={() => setShow(false)}>
          <div style={S.fg}><label style={S.label}>Titre</label><input style={S.input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={`Rapport ${formatDate(today())}`} /></div>
          <div style={S.fg}><label style={S.label}>Type</label>
            <select style={S.input} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              <option value="initial">Démarrage</option><option value="intermediate">Intermédiaire</option><option value="final">Final</option><option value="comparison">Comparaison</option>
            </select>
          </div>
          {reports.length > 0 && <div style={S.fg}><label style={S.label}>Comparer avec</label>
            <select style={S.input} value={f.compare_with} onChange={(e) => setF({ ...f, compare_with: e.target.value })}>
              <option value="">— Aucune —</option>{reports.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShow(false)}>Annuler</button>
            <button style={S.btn()} onClick={create}>Générer</button>
          </div>
        </Modal>
      )}
      {view && (
        <Modal title={view.title} onClose={() => setView(null)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}><div style={S.badge(RC[view.type])}>{RL[view.type]}</div><div style={S.tag}>{formatDate(view.date)}</div></div>
          {view.diff ? (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                {[["new", C.green, "Nouveau"], ["del", C.yellow, "Supprimé"], ["mod", C.accent, "Modifié"]].map(([s, c, l]) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.soft }}><div style={{ width: 8, height: 8, background: c, borderRadius: 2 }} />{l}</div>
                ))}
              </div>
              {view.diff.map((o) => (
                <div key={o.id} style={{ borderLeft: `3px solid ${SC(o._s)}`, paddingLeft: 12, marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{o.title}</div>
                    {o._s !== "same" && <div style={S.badge(SC(o._s))}>{SL(o._s)}</div>}
                  </div>
                  {(o.sub_objectives || []).map((s) => (
                    <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: SC(s._s), paddingLeft: 8, marginBottom: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: 999, background: SC(s._s), flexShrink: 0 }} />{s.title} {s._s !== "same" && `(${SL(s._s)})`} {s.done ? "✓" : ""}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div>
              {view.snapshot?.map((o) => (
                <div key={o.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{o.title} <span style={{ fontSize: 12, color: progressColor(o.progress || 0) }}>{o.progress || 0}%</span></div>
                  {(o.sub_objectives || []).map((s) => (
                    <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: s.done ? C.green : C.soft, paddingLeft: 8, marginBottom: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: 999, background: s.done ? C.green : C.muted, flexShrink: 0 }} />{s.title} {s.done ? "✓" : ""}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── SETTINGS ───────────────────────────────────────────────────────────────
function Settings({ milestones, saveMilestone, deleteMilestone }) {
  const [f, setF] = useState({ title: "", date: "", type: "official" });
  async function submit() { if (!f.title || !f.date) return; await saveMilestone({ id: Date.now(), ...f }); setF({ title: "", date: "", type: "official" }); }
  const TC = { official: C.accent, personal: C.purple, delivery: C.green, defense: C.yellow };
  const TL = { official: "Officiel", personal: "Personnel", delivery: "Remise", defense: "Défense" };
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Jalons & Paramètres</div>
      <div style={S.card}>
        <div style={S.ct}>Ajouter un jalon</div>
        <div style={S.fg}><label style={S.label}>Intitulé</label><input style={S.input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="ex: Séance de démarrage" /></div>
        <div style={S.fg}><label style={S.label}>Date</label><input type="date" style={S.input} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div style={S.fg}><label style={S.label}>Type</label>
          <select style={S.input} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option value="official">Officiel</option><option value="personal">Personnel</option><option value="delivery">Remise de travail</option><option value="defense">Défense orale</option>
          </select>
        </div>
        <button style={S.btn()} onClick={submit}>{Ico.plus} Ajouter</button>
      </div>
      <div style={S.card}>
        <div style={S.ct}>Jalons enregistrés</div>
        {[...milestones].sort((a, b) => a.date.localeCompare(b.date)).map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{m.title} <div style={S.badge(TC[m.type])}>{TL[m.type]}</div></div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{formatDate(m.date)}{daysUntil(m.date) !== null && <span style={{ marginLeft: 8, color: daysUntil(m.date) < 0 ? C.danger : daysUntil(m.date) < 14 ? C.orange : C.muted }}>{daysUntil(m.date) >= 0 ? `J-${daysUntil(m.date)}` : "Passé"}</span>}</div>
            </div>
            <button style={{ ...S.btn("ghost"), color: C.danger }} onClick={() => deleteMilestone(m.id)}>{Ico.trash}</button>
          </div>
        ))}
        {!milestones.length && <div style={{ color: C.muted, fontSize: 13 }}>Aucun jalon.</div>}
      </div>
      <div style={S.card}>
        <div style={S.ct}>Ajouter sur l'écran d'accueil iPhone</div>
        <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.9 }}>
          1. Ouvre l'app dans <strong style={{ color: C.text }}>Safari</strong><br />
          2. Bouton <strong style={{ color: C.text }}>Partager</strong> (carré + flèche)<br />
          3. <strong style={{ color: C.text }}>"Sur l'écran d'accueil"</strong><br />
          4. Nom : <strong style={{ color: C.accent }}>Brevet Géo</strong> → Ajouter
        </div>
        <div style={{ marginTop: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: C.accent, wordBreak: "break-all" }}>
          https://loulisse.github.io/brevet-geomatique/
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [objectives, setObjectives] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [journal, setJournal] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [objs, miles, jour, reps] = await Promise.all([
          dbGetAll("objectives"), dbGetAll("milestones"),
          dbGetAll("journal_entries"), dbGetAll("reports"),
        ]);
        setObjectives(objs.map((o) => ({ ...o, sub_objectives: o.sub_objectives || [], comments: o.comments || [] })));
        setMilestones(miles);
        setJournal(jour);
        setReports(reps.map((r) => ({ ...r, snapshot: r.snapshot || [], diff: r.diff || null })));
      } catch (e) { setError(e.message); }
      setLoading(false);
    }
    load();
  }, []);

  function enriched() { return enrich(objectives); }

  async function saveObjective(obj) {
    await dbUpsert("objectives", obj);
    setObjectives((prev) => { const e = prev.find((o) => o.id === obj.id); return e ? prev.map((o) => o.id === obj.id ? obj : o) : [...prev, obj]; });
  }
  async function deleteObjective(id) { await dbDelete("objectives", id); setObjectives((prev) => prev.filter((o) => o.id !== id)); }
  async function saveSubObjective(parent, sub) {
    const subs = parent.sub_objectives || [];
    const newSubs = subs.find((s) => s.id === sub.id) ? subs.map((s) => s.id === sub.id ? sub : s) : [...subs, sub];
    await saveObjective({ ...parent, sub_objectives: newSubs });
  }
  async function deleteSubObjective(parent, subId) { await saveObjective({ ...parent, sub_objectives: (parent.sub_objectives || []).filter((s) => s.id !== subId) }); }
  async function saveMilestone(m) {
    await dbUpsert("milestones", m);
    setMilestones((prev) => { const e = prev.find((x) => x.id === m.id); return e ? prev.map((x) => x.id === m.id ? m : x) : [...prev, m]; });
  }
  async function deleteMilestone(id) { await dbDelete("milestones", id); setMilestones((prev) => prev.filter((m) => m.id !== id)); }
  async function saveEntry(e) {
    await dbUpsert("journal_entries", e);
    setJournal((prev) => { const ex = prev.find((x) => x.id === e.id); return ex ? prev.map((x) => x.id === e.id ? e : x) : [...prev, e]; });
  }
  async function deleteEntry(id) { await dbDelete("journal_entries", id); setJournal((prev) => prev.filter((e) => e.id !== id)); }
  async function saveReport(r) {
    await dbUpsert("reports", r);
    setReports((prev) => { const e = prev.find((x) => x.id === r.id); return e ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r]; });
  }
  async function deleteReport(id) { await dbDelete("reports", id); setReports((prev) => prev.filter((r) => r.id !== id)); }

  const nav = [
    { id: "dashboard", label: "Dashboard", ico: Ico.dash },
    { id: "objectives", label: "Objectifs", ico: Ico.obj },
    { id: "journal", label: "Carnet", ico: Ico.jour },
    { id: "reports", label: "Rapports", ico: Ico.rep },
    { id: "settings", label: "Jalons", ico: Ico.set },
  ];

  if (loading) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontFamily: "DM Sans, sans-serif", fontSize: 15 }}>Chargement…</div>;
  if (error) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.danger, fontFamily: "DM Sans, sans-serif", padding: 24, textAlign: "center", gap: 12 }}><div style={{ fontSize: 16, fontWeight: 700 }}>Erreur de connexion Supabase</div><div style={{ fontSize: 13, color: C.muted, maxWidth: 320 }}>{error}</div></div>;

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
          {tab === "dashboard" && <Dashboard objectives={enriched()} milestones={milestones} journal={journal} />}
          {tab === "objectives" && <Objectives objectives={enriched()} saveObjective={saveObjective} deleteObjective={deleteObjective} saveSubObjective={saveSubObjective} deleteSubObjective={deleteSubObjective} />}
          {tab === "journal" && <Journal entries={journal} objectives={enriched()} saveEntry={saveEntry} deleteEntry={deleteEntry} />}
          {tab === "reports" && <Reports objectives={enriched()} reports={reports} saveReport={saveReport} deleteReport={deleteReport} />}
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
