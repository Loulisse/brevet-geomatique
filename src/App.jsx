import { useState, useEffect, useRef } from "react";

// ─── SUPABASE CONFIG ────────────────────────────────────────────────────────
// Replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = "https://ycfdnrnlorioalnzslrg.supabase.co/rest/v1/";
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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().split("T")[0];
}
function formatDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}
function daysUntil(d) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
  return diff;
}
function progressColor(pct) {
  if (pct >= 100) return "#4ade80";
  if (pct >= 60) return "#facc15";
  if (pct >= 30) return "#fb923c";
  return "#f87171";
}

// ─── ICONS (inline SVG) ─────────────────────────────────────────────────────
const Icon = {
  dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  ),
  objectives: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  ),
  journal: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ),
  reports: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
  ),
  settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
  ),
  plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
  ),
  edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  ),
  chevron: (open) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>
  ),
  clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  flag: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
  ),
  qr: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="16" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/></svg>
  ),
};

// ─── STYLES ─────────────────────────────────────────────────────────────────
const S = {
  app: {
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    background: "#0d0f14",
    color: "#e8eaf0",
    minHeight: "100vh",
    display: "flex",
  },
  sidebar: {
    width: 220,
    background: "#111318",
    borderRight: "1px solid #1e2029",
    display: "flex",
    flexDirection: "column",
    padding: "28px 0",
    position: "sticky",
    top: 0,
    height: "100vh",
    flexShrink: 0,
  },
  logo: {
    padding: "0 24px 28px",
    borderBottom: "1px solid #1e2029",
    marginBottom: 16,
  },
  logoTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.15em",
    color: "#5b9cf6",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  logoSub: {
    fontSize: 12,
    color: "#555a6e",
  },
  navItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 24px",
    cursor: "pointer",
    color: active ? "#e8eaf0" : "#555a6e",
    background: active ? "#1a1d27" : "transparent",
    borderLeft: active ? "2px solid #5b9cf6" : "2px solid transparent",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    transition: "all 0.15s",
    userSelect: "none",
  }),
  main: {
    flex: 1,
    padding: "36px 40px",
    overflow: "auto",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
    letterSpacing: "-0.02em",
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#555a6e",
    marginBottom: 32,
  },
  card: {
    background: "#111318",
    border: "1px solid #1e2029",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#555a6e",
    marginBottom: 16,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 20,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    background: "#111318",
    border: "1px solid #1e2029",
    borderRadius: 12,
    padding: "20px 24px",
  },
  statVal: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#555a6e",
    fontWeight: 500,
  },
  btn: (variant = "primary") => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: "all 0.15s",
    background: variant === "primary" ? "#5b9cf6" : variant === "danger" ? "#ef4444" : "#1e2029",
    color: variant === "ghost" ? "#8b8fa8" : "#fff",
  }),
  input: {
    background: "#0d0f14",
    border: "1px solid #1e2029",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 13,
    color: "#e8eaf0",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    background: "#0d0f14",
    border: "1px solid #1e2029",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 13,
    color: "#e8eaf0",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 80,
    fontFamily: "inherit",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#555a6e",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
  },
  formGroup: {
    marginBottom: 16,
  },
  progressBar: (pct, color) => ({
    height: 6,
    background: "#1e2029",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 8,
  }),
  progressFill: (pct, color) => ({
    height: "100%",
    width: `${Math.min(pct, 100)}%`,
    background: color || "#5b9cf6",
    borderRadius: 999,
    transition: "width 0.4s ease",
  }),
  badge: (color) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: color + "22",
    color: color,
    letterSpacing: "0.04em",
  }),
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modalBox: {
    background: "#111318",
    border: "1px solid #1e2029",
    borderRadius: 16,
    padding: 32,
    width: 480,
    maxWidth: "90vw",
    maxHeight: "85vh",
    overflowY: "auto",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 20,
    letterSpacing: "-0.01em",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    background: "#1e2029",
    borderRadius: 6,
    fontSize: 11,
    color: "#8b8fa8",
    marginRight: 6,
  },
  divider: {
    borderTop: "1px solid #1e2029",
    margin: "20px 0",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
};

// ─── MODAL COMPONENT ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={S.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={S.modalTitle}>{title}</div>
          <button onClick={onClose} style={{ ...S.btn("ghost"), padding: "4px 8px" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── GANTT / TIMELINE ───────────────────────────────────────────────────────
function GanttTimeline({ objectives }) {
  const all = [];
  objectives.forEach((obj) => {
    if (obj.deadline) all.push({ label: obj.title, date: obj.deadline, type: "obj", pct: obj.progress || 0 });
    (obj.sub_objectives || []).forEach((s) => {
      if (s.deadline) all.push({ label: s.title, date: s.deadline, type: "sub", pct: s.done ? 100 : 0 });
    });
  });
  all.sort((a, b) => a.date.localeCompare(b.date));
  if (!all.length) return <div style={{ color: "#555a6e", fontSize: 13 }}>Aucune deadline renseignée.</div>;

  const dates = all.map((x) => new Date(x.date));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const range = Math.max(maxDate - minDate, 1);

  return (
    <div style={{ overflowX: "auto" }}>
      {all.map((item, i) => {
        const pos = ((new Date(item.date) - minDate) / range) * 85;
        const du = daysUntil(item.date);
        const color = du === null ? "#5b9cf6" : du < 0 ? "#ef4444" : du < 7 ? "#fb923c" : du < 30 ? "#facc15" : "#5b9cf6";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 12 }}>
            <div style={{ width: 160, fontSize: 12, color: item.type === "obj" ? "#e8eaf0" : "#8b8fa8", flexShrink: 0, fontWeight: item.type === "obj" ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.label}
            </div>
            <div style={{ flex: 1, position: "relative", height: 24 }}>
              <div style={{ position: "absolute", left: `${pos}%`, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
                <div style={{
                  width: item.type === "obj" ? 12 : 8,
                  height: item.type === "obj" ? 12 : 8,
                  borderRadius: 999,
                  background: color,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${color}66`,
                }} />
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "#1e2029", zIndex: -1 }} />
            </div>
            <div style={{ width: 90, fontSize: 11, color, textAlign: "right", flexShrink: 0 }}>
              {formatDate(item.date)}
              {du !== null && <span style={{ color: "#555a6e", marginLeft: 4 }}>({du > 0 ? `J-${du}` : du === 0 ? "auj." : `+${-du}j`})</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
function Dashboard({ objectives, milestones, journalEntries }) {
  const totalSub = objectives.reduce((a, o) => a + (o.sub_objectives || []).length, 0);
  const doneSub = objectives.reduce((a, o) => a + (o.sub_objectives || []).filter((s) => s.done).length, 0);
  const globalPct = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;

  const totalEstimated = objectives.reduce((a, o) => a + (parseFloat(o.estimated_hours) || 0), 0);
  const totalActual = objectives.reduce((a, o) => a + (parseFloat(o.actual_hours) || 0), 0);

  const nextMilestone = milestones
    .filter((m) => m.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div>
      <div style={S.pageTitle}>Tableau de bord</div>
      <div style={S.pageSubtitle}>Vue d'ensemble de l'avancement du projet</div>

      <div style={S.grid3}>
        <div style={S.statCard}>
          <div style={{ ...S.statVal, color: progressColor(globalPct) }}>{globalPct}%</div>
          <div style={S.statLabel}>Progression globale</div>
          <div style={S.progressBar(globalPct)}>
            <div style={S.progressFill(globalPct, progressColor(globalPct))} />
          </div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statVal, color: "#5b9cf6" }}>{doneSub}<span style={{ fontSize: 16, color: "#555a6e" }}>/{totalSub}</span></div>
          <div style={S.statLabel}>Sous-objectifs accomplis</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statVal, color: "#a78bfa" }}>{totalActual}h<span style={{ fontSize: 16, color: "#555a6e" }}>/{totalEstimated}h</span></div>
          <div style={S.statLabel}>Heures travaillées / estimées</div>
          <div style={S.progressBar(totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0)}>
            <div style={S.progressFill(totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0, "#a78bfa")} />
          </div>
        </div>
      </div>

      {nextMilestone && (
        <div style={{ ...S.card, borderColor: "#5b9cf633", background: "#0f1320" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: "#5b9cf6" }}><Icon.flag /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Prochain jalon : {nextMilestone.title}</div>
              <div style={{ fontSize: 12, color: "#555a6e" }}>
                {formatDate(nextMilestone.date)} — dans {daysUntil(nextMilestone.date)} jour(s)
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        <div style={S.cardTitle}>Timeline des deadlines</div>
        <GanttTimeline objectives={objectives} />
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Objectifs</div>
          {objectives.map((obj) => {
            const pct = obj.progress || 0;
            return (
              <div key={obj.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{obj.title}</span>
                  <span style={{ color: progressColor(pct), fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={S.progressBar(pct)}>
                  <div style={S.progressFill(pct, progressColor(pct))} />
                </div>
              </div>
            );
          })}
          {objectives.length === 0 && <div style={{ color: "#555a6e", fontSize: 13 }}>Aucun objectif créé.</div>}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Dernières entrées carnet</div>
          {journalEntries.slice(-4).reverse().map((e) => (
            <div key={e.id} style={{ borderBottom: "1px solid #1e2029", paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#555a6e", marginBottom: 4 }}>{formatDate(e.date)} — {e.linked_objective || "Général"}</div>
              <div style={{ fontSize: 13, color: "#c8cad6", lineHeight: 1.5 }}>{e.content?.slice(0, 120)}{e.content?.length > 120 ? "…" : ""}</div>
            </div>
          ))}
          {journalEntries.length === 0 && <div style={{ color: "#555a6e", fontSize: 13 }}>Aucune entrée.</div>}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Comparaison Temps estimé vs Réel</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {objectives.map((obj) => {
            const est = parseFloat(obj.estimated_hours) || 0;
            const act = parseFloat(obj.actual_hours) || 0;
            const maxH = Math.max(est, act, 1);
            return (
              <div key={obj.id} style={{ textAlign: "center", minWidth: 80 }}>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", justifyContent: "center", height: 80 }}>
                  <div title={`Estimé: ${est}h`} style={{ width: 18, height: `${(est / maxH) * 70}px`, background: "#5b9cf6", borderRadius: "4px 4px 0 0", minHeight: 4 }} />
                  <div title={`Réel: ${act}h`} style={{ width: 18, height: `${(act / maxH) * 70}px`, background: act > est ? "#ef4444" : "#4ade80", borderRadius: "4px 4px 0 0", minHeight: 4 }} />
                </div>
                <div style={{ fontSize: 10, color: "#555a6e", marginTop: 4, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{obj.title}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          <div style={{ ...S.tag }}><div style={{ width: 8, height: 8, background: "#5b9cf6", borderRadius: 2 }} />Estimé</div>
          <div style={{ ...S.tag }}><div style={{ width: 8, height: 8, background: "#4ade80", borderRadius: 2 }} />Réel (dans budget)</div>
          <div style={{ ...S.tag }}><div style={{ width: 8, height: 8, background: "#ef4444", borderRadius: 2 }} />Réel (dépassement)</div>
        </div>
      </div>
    </div>
  );
}

// ─── OBJECTIVES ─────────────────────────────────────────────────────────────
function Objectives({ objectives, setObjectives, saveObjective, deleteObjective, saveSubObjective, deleteSubObjective }) {
  const [expandedObj, setExpandedObj] = useState({});
  const [showAddObj, setShowAddObj] = useState(false);
  const [editingObj, setEditingObj] = useState(null);
  const [showAddSub, setShowAddSub] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [showComment, setShowComment] = useState(null);

  const [objForm, setObjForm] = useState({ title: "", description: "", deadline: "", estimated_hours: "", actual_hours: "" });
  const [subForm, setSubForm] = useState({ title: "", deadline: "" });
  const [commentForm, setCommentForm] = useState({ text: "", date: today() });

  function openAddObj() { setObjForm({ title: "", description: "", deadline: "", estimated_hours: "", actual_hours: "" }); setEditingObj(null); setShowAddObj(true); }
  function openEditObj(obj) { setObjForm({ title: obj.title, description: obj.description || "", deadline: obj.deadline || "", estimated_hours: obj.estimated_hours || "", actual_hours: obj.actual_hours || "" }); setEditingObj(obj); setShowAddObj(true); }

  async function submitObj() {
    const data = { ...objForm };
    if (editingObj) {
      await saveObjective({ ...editingObj, ...data });
    } else {
      await saveObjective({ ...data, sub_objectives: [], comments: [] });
    }
    setShowAddObj(false);
  }

  function openAddSub(objId) { setSubForm({ title: "", deadline: "" }); setEditingSub(null); setShowAddSub(objId); }
  function openEditSub(obj, sub) { setSubForm({ title: sub.title, deadline: sub.deadline || "" }); setEditingSub({ obj, sub }); setShowAddSub(obj.id); }

  async function submitSub() {
    const parentObj = objectives.find((o) => o.id === showAddSub);
    if (!parentObj) return;
    if (editingSub) {
      await saveSubObjective(parentObj, { ...editingSub.sub, ...subForm });
    } else {
      await saveSubObjective(parentObj, { id: Date.now(), ...subForm, done: false });
    }
    setShowAddSub(null);
  }

  async function toggleSub(obj, sub) {
    await saveSubObjective(obj, { ...sub, done: !sub.done });
  }

  function openComment(item, type, parentObj) {
    setCommentForm({ text: "", date: today() });
    setShowComment({ item, type, parentObj });
  }

  async function submitComment() {
    const { item, type, parentObj } = showComment;
    const newComment = { id: Date.now(), text: commentForm.text, date: commentForm.date };
    if (type === "obj") {
      const updated = { ...item, comments: [...(item.comments || []), newComment] };
      await saveObjective(updated);
    } else {
      const updatedSub = { ...item, comments: [...(item.comments || []), newComment] };
      await saveSubObjective(parentObj, updatedSub);
    }
    setShowComment(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={S.pageTitle}>Objectifs</div>
          <div style={S.pageSubtitle}>Gestion des objectifs et sous-objectifs</div>
        </div>
        <button style={S.btn()} onClick={openAddObj}><Icon.plus /> Nouvel objectif</button>
      </div>

      {objectives.map((obj, idx) => {
        const subs = obj.sub_objectives || [];
        const done = subs.filter((s) => s.done).length;
        const pct = subs.length > 0 ? Math.round((done / subs.length) * 100) : 0;
        const open = expandedObj[obj.id];

        return (
          <div key={obj.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div
              onClick={() => setExpandedObj((e) => ({ ...e, [obj.id]: !e[obj.id] }))}
              style={{ padding: "18px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
            >
              <div style={{ color: "#555a6e" }}>{Icon.chevron(open)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Obj. {idx + 1} — {obj.title}</div>
                  <div style={S.badge(progressColor(pct))}>{pct}%</div>
                  {obj.deadline && (
                    <div style={S.tag}><Icon.flag /> {formatDate(obj.deadline)}</div>
                  )}
                </div>
                <div style={S.progressBar(pct)}>
                  <div style={S.progressFill(pct, progressColor(pct))} />
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12, color: "#555a6e" }}>
                  <span>{done}/{subs.length} sous-objectifs</span>
                  {obj.estimated_hours && <span><Icon.clock /> {obj.actual_hours || 0}h / {obj.estimated_hours}h</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                <button style={S.btn("ghost")} onClick={() => openComment(obj, "obj", null)}>+ Commentaire</button>
                <button style={S.btn("ghost")} onClick={() => openEditObj(obj)}><Icon.edit /></button>
                <button style={{ ...S.btn("ghost"), color: "#ef4444" }} onClick={() => deleteObjective(obj.id)}><Icon.trash /></button>
              </div>
            </div>

            {open && (
              <div style={{ borderTop: "1px solid #1e2029", padding: "16px 24px" }}>
                {obj.description && (
                  <div style={{ fontSize: 13, color: "#8b8fa8", marginBottom: 16, lineHeight: 1.6 }}>{obj.description}</div>
                )}

                {(obj.comments || []).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#555a6e", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Commentaires d'expert</div>
                    {(obj.comments || []).map((c) => (
                      <div key={c.id} style={{ background: "#ef444411", border: "1px solid #ef444433", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 4 }}>{formatDate(c.date)}</div>
                        <div style={{ fontSize: 13, color: "#c8cad6" }}>{c.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                {subs.map((sub) => (
                  <div key={sub.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #1e2029" }}>
                    <div
                      onClick={() => toggleSub(obj, sub)}
                      style={{
                        width: 18, height: 18, borderRadius: 4, border: "2px solid",
                        borderColor: sub.done ? "#4ade80" : "#1e2029",
                        background: sub.done ? "#4ade80" : "transparent",
                        cursor: "pointer", flexShrink: 0, marginTop: 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {sub.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: sub.done ? "#555a6e" : "#e8eaf0", textDecoration: sub.done ? "line-through" : "none" }}>{sub.title}</div>
                      {sub.deadline && <div style={{ fontSize: 11, color: "#555a6e", marginTop: 2 }}><Icon.flag /> {formatDate(sub.deadline)}</div>}
                      {(sub.comments || []).map((c) => (
                        <div key={c.id} style={{ background: "#ef444411", border: "1px solid #ef444433", borderRadius: 6, padding: "6px 10px", marginTop: 6, fontSize: 12 }}>
                          <span style={{ color: "#ef4444", marginRight: 8 }}>{formatDate(c.date)}</span>{c.text}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={S.btn("ghost")} onClick={() => openComment(sub, "sub", obj)}>+ Note</button>
                      <button style={S.btn("ghost")} onClick={() => openEditSub(obj, sub)}><Icon.edit /></button>
                      <button style={{ ...S.btn("ghost"), color: "#ef4444" }} onClick={() => deleteSubObjective(obj, sub.id)}><Icon.trash /></button>
                    </div>
                  </div>
                ))}

                <button style={{ ...S.btn("ghost"), marginTop: 12 }} onClick={() => openAddSub(obj.id)}><Icon.plus /> Ajouter un sous-objectif</button>
              </div>
            )}
          </div>
        );
      })}

      {objectives.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", color: "#555a6e", padding: 48 }}>
          Aucun objectif. Cliquez sur "Nouvel objectif" pour commencer.
        </div>
      )}

      {showAddObj && (
        <Modal title={editingObj ? "Modifier l'objectif" : "Nouvel objectif"} onClose={() => setShowAddObj(false)}>
          <div style={S.formGroup}><label style={S.label}>Intitulé</label><input style={S.input} value={objForm.title} onChange={(e) => setObjForm({ ...objForm, title: e.target.value })} placeholder="Titre de l'objectif" /></div>
          <div style={S.formGroup}><label style={S.label}>Description</label><textarea style={S.textarea} value={objForm.description} onChange={(e) => setObjForm({ ...objForm, description: e.target.value })} placeholder="Description, contexte, notes…" /></div>
          <div style={S.grid2}>
            <div style={S.formGroup}><label style={S.label}>Deadline</label><input type="date" style={S.input} value={objForm.deadline} onChange={(e) => setObjForm({ ...objForm, deadline: e.target.value })} /></div>
            <div />
          </div>
          <div style={S.grid2}>
            <div style={S.formGroup}><label style={S.label}>Heures estimées</label><input type="number" style={S.input} value={objForm.estimated_hours} onChange={(e) => setObjForm({ ...objForm, estimated_hours: e.target.value })} placeholder="ex: 12" /></div>
            <div style={S.formGroup}><label style={S.label}>Heures réelles</label><input type="number" style={S.input} value={objForm.actual_hours} onChange={(e) => setObjForm({ ...objForm, actual_hours: e.target.value })} placeholder="ex: 9.5" /></div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShowAddObj(false)}>Annuler</button>
            <button style={S.btn()} onClick={submitObj}>{editingObj ? "Sauvegarder" : "Créer"}</button>
          </div>
        </Modal>
      )}

      {showAddSub && (
        <Modal title={editingSub ? "Modifier le sous-objectif" : "Nouveau sous-objectif"} onClose={() => setShowAddSub(null)}>
          <div style={S.formGroup}><label style={S.label}>Intitulé</label><input style={S.input} value={subForm.title} onChange={(e) => setSubForm({ ...subForm, title: e.target.value })} placeholder="Titre du sous-objectif" /></div>
          <div style={S.formGroup}><label style={S.label}>Deadline personnelle</label><input type="date" style={S.input} value={subForm.deadline} onChange={(e) => setSubForm({ ...subForm, deadline: e.target.value })} /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShowAddSub(null)}>Annuler</button>
            <button style={S.btn()} onClick={submitSub}>{editingSub ? "Sauvegarder" : "Ajouter"}</button>
          </div>
        </Modal>
      )}

      {showComment && (
        <Modal title="Ajouter un commentaire / remarque" onClose={() => setShowComment(null)}>
          <div style={S.formGroup}><label style={S.label}>Date de la séance</label><input type="date" style={S.input} value={commentForm.date} onChange={(e) => setCommentForm({ ...commentForm, date: e.target.value })} /></div>
          <div style={S.formGroup}><label style={S.label}>Remarque</label><textarea style={S.textarea} value={commentForm.text} onChange={(e) => setCommentForm({ ...commentForm, text: e.target.value })} placeholder="Remarque de l'expert, note de séance…" /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShowComment(null)}>Annuler</button>
            <button style={S.btn()} onClick={submitComment}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── JOURNAL ────────────────────────────────────────────────────────────────
function Journal({ entries, setEntries, objectives, saveEntry, deleteEntry }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: today(), content: "", linked_objective: "", image_url: "" });

  async function submit() {
    await saveEntry({ ...form, id: Date.now() });
    setShowAdd(false);
    setForm({ date: today(), content: "", linked_objective: "", image_url: "" });
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={S.pageTitle}>Carnet de route</div>
          <div style={S.pageSubtitle}>Journal de bord chronologique lié aux objectifs</div>
        </div>
        <button style={S.btn()} onClick={() => setShowAdd(true)}><Icon.plus /> Nouvelle entrée</button>
      </div>

      {sorted.map((entry) => (
        <div key={entry.id} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#5b9cf6" }}>{formatDate(entry.date)}</div>
              {entry.linked_objective && <div style={S.badge("#a78bfa")}>{entry.linked_objective}</div>}
            </div>
            <button style={{ ...S.btn("ghost"), color: "#ef4444" }} onClick={() => deleteEntry(entry.id)}><Icon.trash /></button>
          </div>
          <div style={{ fontSize: 14, color: "#c8cad6", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{entry.content}</div>
          {entry.image_url && (
            <div style={{ marginTop: 12 }}>
              <img src={entry.image_url} alt="capture" style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #1e2029" }} onError={(e) => { e.target.style.display = "none"; }} />
            </div>
          )}
        </div>
      ))}

      {entries.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", color: "#555a6e", padding: 48 }}>
          Aucune entrée dans le carnet. Commencez à documenter votre progression.
        </div>
      )}

      {showAdd && (
        <Modal title="Nouvelle entrée" onClose={() => setShowAdd(false)}>
          <div style={S.formGroup}><label style={S.label}>Date</label><input type="date" style={S.input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div style={S.formGroup}>
            <label style={S.label}>Lié à l'objectif</label>
            <select style={S.input} value={form.linked_objective} onChange={(e) => setForm({ ...form, linked_objective: e.target.value })}>
              <option value="">— Général —</option>
              {objectives.map((o) => <option key={o.id} value={o.title}>{o.title}</option>)}
            </select>
          </div>
          <div style={S.formGroup}><label style={S.label}>Note / Entrée</label><textarea style={{ ...S.textarea, minHeight: 120 }} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Décrivez votre avancement, difficultés, décisions prises…" /></div>
          <div style={S.formGroup}><label style={S.label}>URL image / capture (optionnel)</label><input style={S.input} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://... ou lien Google Drive public" /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShowAdd(false)}>Annuler</button>
            <button style={S.btn()} onClick={submit}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── REPORTS ────────────────────────────────────────────────────────────────
function Reports({ objectives, reports, saveReport, deleteReport }) {
  const [showCreate, setShowCreate] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [compareReport, setCompareReport] = useState(null);
  const [form, setForm] = useState({ title: "", type: "initial", compare_with: "" });

  function snapshotObjectives() {
    return objectives.map((obj) => ({
      id: obj.id, title: obj.title, description: obj.description,
      deadline: obj.deadline, progress: obj.progress,
      estimated_hours: obj.estimated_hours, actual_hours: obj.actual_hours,
      comments: obj.comments || [],
      sub_objectives: (obj.sub_objectives || []).map((s) => ({
        id: s.id, title: s.title, deadline: s.deadline, done: s.done, comments: s.comments || []
      })),
    }));
  }

  function diffReports(base, current) {
    const result = [];
    const baseMap = Object.fromEntries(base.map((o) => [o.id, o]));
    const currMap = Object.fromEntries(current.map((o) => [o.id, o]));
    const allIds = new Set([...Object.keys(baseMap), ...Object.keys(currMap)]);

    allIds.forEach((id) => {
      const b = baseMap[id];
      const c = currMap[id];
      if (!b && c) { result.push({ ...c, _status: "new" }); return; }
      if (b && !c) { result.push({ ...b, _status: "deleted" }); return; }
      const changed = b.title !== c.title || b.deadline !== c.deadline || b.progress !== c.progress || b.description !== c.description;
      result.push({
        ...c, _status: changed ? "modified" : "unchanged",
        sub_objectives: diffSubs(b.sub_objectives || [], c.sub_objectives || []),
      });
    });
    return result;
  }

  function diffSubs(base, current) {
    const baseMap = Object.fromEntries(base.map((s) => [s.id, s]));
    const currMap = Object.fromEntries(current.map((s) => [s.id, s]));
    const allIds = new Set([...Object.keys(baseMap), ...Object.keys(currMap)]);
    const result = [];
    allIds.forEach((id) => {
      const b = baseMap[id];
      const c = currMap[id];
      if (!b && c) { result.push({ ...c, _status: "new" }); return; }
      if (b && !c) { result.push({ ...b, _status: "deleted" }); return; }
      const changed = b.title !== c.title || b.deadline !== c.deadline || b.done !== c.done;
      result.push({ ...c, _status: changed ? "modified" : "unchanged" });
    });
    return result;
  }

  function statusColor(s) {
    if (s === "new") return "#4ade80";
    if (s === "deleted") return "#facc15";
    if (s === "modified") return "#5b9cf6";
    return "#555a6e";
  }
  function statusLabel(s) {
    if (s === "new") return "Nouveau";
    if (s === "deleted") return "Supprimé";
    if (s === "modified") return "Modifié";
    return "";
  }

  async function createReport() {
    const snap = snapshotObjectives();
    let diff = null;
    if (form.compare_with) {
      const base = reports.find((r) => r.id === parseInt(form.compare_with));
      if (base) diff = diffReports(base.snapshot, snap);
    }
    await saveReport({
      id: Date.now(),
      title: form.title || `Rapport du ${formatDate(today())}`,
      type: form.type,
      date: today(),
      snapshot: snap,
      diff,
      compare_with_id: form.compare_with ? parseInt(form.compare_with) : null,
      questions: "",
    });
    setShowCreate(false);
    setForm({ title: "", type: "initial", compare_with: "" });
  }

  const reportColors = {
    initial: "#5b9cf6",
    intermediate: "#a78bfa",
    final: "#4ade80",
    comparison: "#facc15",
  };
  const reportLabels = {
    initial: "Démarrage",
    intermediate: "Intermédiaire",
    final: "Final",
    comparison: "Comparaison",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={S.pageTitle}>Rapports</div>
          <div style={S.pageSubtitle}>Génération et historique des rapports d'avancement</div>
        </div>
        <button style={S.btn()} onClick={() => setShowCreate(true)}><Icon.plus /> Nouveau rapport</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {reports.map((r) => (
          <div key={r.id} style={{ ...S.card, cursor: "pointer", borderColor: reportColors[r.type] + "44" }} onClick={() => setViewReport(r)}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={S.badge(reportColors[r.type])}>{reportLabels[r.type]}</div>
              <div style={{ fontSize: 11, color: "#555a6e" }}>{formatDate(r.date)}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: "#555a6e" }}>{r.snapshot?.length || 0} objectifs • {r.diff ? "Avec comparaison" : "Rapport initial"}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
              <button style={S.btn("ghost")} onClick={() => setViewReport(r)}>Ouvrir</button>
              <button style={{ ...S.btn("ghost"), color: "#ef4444" }} onClick={() => deleteReport(r.id)}><Icon.trash /></button>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", color: "#555a6e", padding: 48 }}>
          Aucun rapport créé. Générez votre premier rapport avant la séance de démarrage.
        </div>
      )}

      {showCreate && (
        <Modal title="Nouveau rapport" onClose={() => setShowCreate(false)}>
          <div style={S.formGroup}><label style={S.label}>Titre</label><input style={S.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={`Rapport du ${formatDate(today())}`} /></div>
          <div style={S.formGroup}>
            <label style={S.label}>Type</label>
            <select style={S.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="initial">Rapport de démarrage</option>
              <option value="intermediate">Rapport intermédiaire</option>
              <option value="final">Rapport final</option>
              <option value="comparison">Rapport de comparaison</option>
            </select>
          </div>
          {reports.length > 0 && (
            <div style={S.formGroup}>
              <label style={S.label}>Comparer avec (optionnel)</label>
              <select style={S.input} value={form.compare_with} onChange={(e) => setForm({ ...form, compare_with: e.target.value })}>
                <option value="">— Aucune comparaison —</option>
                {reports.map((r) => <option key={r.id} value={r.id}>{r.title} ({formatDate(r.date)})</option>)}
              </select>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={S.btn("ghost")} onClick={() => setShowCreate(false)}>Annuler</button>
            <button style={S.btn()} onClick={createReport}>Générer</button>
          </div>
        </Modal>
      )}

      {viewReport && (
        <Modal title={viewReport.title} onClose={() => setViewReport(null)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={S.badge(reportColors[viewReport.type])}>{reportLabels[viewReport.type]}</div>
            <div style={S.tag}>{formatDate(viewReport.date)}</div>
          </div>

          {viewReport.diff ? (
            <div>
              <div style={{ fontSize: 12, color: "#555a6e", marginBottom: 12 }}>Comparaison automatique des modifications</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {[["new", "#4ade80", "Nouveau"], ["deleted", "#facc15", "Supprimé"], ["modified", "#5b9cf6", "Modifié"], ["unchanged", "#555a6e", "Inchangé"]].map(([s, c, l]) => (
                  <div key={s} style={{ ...S.tag }}><div style={{ width: 8, height: 8, background: c, borderRadius: 2 }} />{l}</div>
                ))}
              </div>
              {viewReport.diff.map((obj) => (
                <div key={obj.id} style={{ borderLeft: `3px solid ${statusColor(obj._status)}`, paddingLeft: 12, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{obj.title}</div>
                    {obj._status !== "unchanged" && <div style={S.badge(statusColor(obj._status))}>{statusLabel(obj._status)}</div>}
                  </div>
                  {(obj.sub_objectives || []).map((s) => (
                    <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: statusColor(s._status), paddingLeft: 8, marginBottom: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 999, background: statusColor(s._status), flexShrink: 0 }} />
                      {s.title} {s._status !== "unchanged" && `(${statusLabel(s._status)})`}
                      {s.done && " ✓"}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div>
              {viewReport.snapshot?.map((obj) => (
                <div key={obj.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{obj.title}</div>
                  {(obj.sub_objectives || []).map((s) => (
                    <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: s.done ? "#4ade80" : "#8b8fa8", paddingLeft: 8, marginBottom: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 999, background: s.done ? "#4ade80" : "#555a6e", flexShrink: 0 }} />
                      {s.title} {s.done ? "✓" : ""}
                    </div>
                  ))}
                  {(obj.comments || []).map((c) => (
                    <div key={c.id} style={{ background: "#ef444411", border: "1px solid #ef444433", borderRadius: 6, padding: "6px 10px", marginTop: 6, fontSize: 12 }}>
                      <span style={{ color: "#ef4444", marginRight: 8 }}>{formatDate(c.date)}</span>{c.text}
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

// ─── MILESTONES / SETTINGS ───────────────────────────────────────────────────
function Settings({ milestones, saveMilestone, deleteMilestone }) {
  const [form, setForm] = useState({ title: "", date: "", type: "official" });

  async function submit() {
    if (!form.title || !form.date) return;
    await saveMilestone({ ...form, id: Date.now() });
    setForm({ title: "", date: "", type: "official" });
  }

  const typeColors = { official: "#5b9cf6", personal: "#a78bfa", delivery: "#4ade80", defense: "#facc15" };
  const typeLabels = { official: "Officiel", personal: "Personnel", delivery: "Remise", defense: "Défense" };

  return (
    <div>
      <div style={S.pageTitle}>Jalons & Paramètres</div>
      <div style={S.pageSubtitle}>Gérez vos dates clés et séances</div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Ajouter un jalon</div>
          <div style={S.formGroup}><label style={S.label}>Intitulé</label><input style={S.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ex: Séance de démarrage" /></div>
          <div style={S.formGroup}><label style={S.label}>Date</label><input type="date" style={S.input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div style={S.formGroup}>
            <label style={S.label}>Type</label>
            <select style={S.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="official">Officiel</option>
              <option value="personal">Personnel</option>
              <option value="delivery">Remise de travail</option>
              <option value="defense">Défense orale</option>
            </select>
          </div>
          <button style={S.btn()} onClick={submit}><Icon.plus /> Ajouter</button>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>Jalons enregistrés</div>
          {milestones.sort((a, b) => a.date.localeCompare(b.date)).map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e2029" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, display: "flex", gap: 8, alignItems: "center" }}>
                  {m.title}
                  <div style={S.badge(typeColors[m.type])}>{typeLabels[m.type]}</div>
                </div>
                <div style={{ fontSize: 12, color: "#555a6e", marginTop: 2 }}>
                  {formatDate(m.date)}
                  {daysUntil(m.date) !== null && (
                    <span style={{ marginLeft: 8, color: daysUntil(m.date) < 0 ? "#ef4444" : daysUntil(m.date) < 14 ? "#fb923c" : "#555a6e" }}>
                      {daysUntil(m.date) >= 0 ? `J-${daysUntil(m.date)}` : `Passé`}
                    </span>
                  )}
                </div>
              </div>
              <button style={{ ...S.btn("ghost"), color: "#ef4444" }} onClick={() => deleteMilestone(m.id)}><Icon.trash /></button>
            </div>
          ))}
          {milestones.length === 0 && <div style={{ color: "#555a6e", fontSize: 13 }}>Aucun jalon.</div>}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>QR Code & Partage</div>
        <div style={{ fontSize: 13, color: "#8b8fa8", marginBottom: 16 }}>
          Une fois l'application déployée sur GitHub Pages, votre URL publique permettra le partage avec les experts.
          Le QR code peut être imprimé sur vos documents de présentation.
        </div>
        <div style={{ background: "#0d0f14", border: "1px solid #1e2029", borderRadius: 8, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#5b9cf6" }}>
          https://[votre-username].github.io/brevet-geomatique/
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#555a6e" }}>
          Configurez votre URL dans Settings → Paramètres après le déploiement GitHub Pages.
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Configuration Supabase</div>
        <div style={{ fontSize: 13, color: "#8b8fa8", marginBottom: 12 }}>
          Remplacez SUPABASE_URL et SUPABASE_ANON_KEY dans le code source avec vos vraies clés Supabase pour activer la synchronisation.
        </div>
        <div style={{ background: "#0d0f14", border: "1px solid #facc1533", borderRadius: 8, padding: 16, fontSize: 12, color: "#facc15" }}>
          ⚠ Données actuellement en localStorage — configurez Supabase pour la synchro multi-appareils
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [objectives, setObjectives] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [reports, setReports] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("brevet_data");
      if (raw) {
        const d = JSON.parse(raw);
        setObjectives(d.objectives || []);
        setMilestones(d.milestones || []);
        setJournalEntries(d.journalEntries || []);
        setReports(d.reports || []);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    const data = { objectives, milestones, journalEntries, reports };
    localStorage.setItem("brevet_data", JSON.stringify(data));
  }, [objectives, milestones, journalEntries, reports, loaded]);

  // Compute progress for each objective
  function computeProgress(obj) {
    const subs = obj.sub_objectives || [];
    if (!subs.length) return 0;
    return Math.round((subs.filter((s) => s.done).length / subs.length) * 100);
  }

  function enrichObjectives(objs) {
    return objs.map((o) => ({ ...o, progress: computeProgress(o) }));
  }

  // CRUD
  async function saveObjective(obj) {
    setObjectives((prev) => {
      const exists = prev.find((o) => o.id === obj.id);
      const updated = exists ? prev.map((o) => o.id === obj.id ? obj : o) : [...prev, { ...obj, id: Date.now(), sub_objectives: [], comments: [] }];
      return enrichObjectives(updated);
    });
  }
  async function deleteObjective(id) {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  }
  async function saveSubObjective(parentObj, sub) {
    setObjectives((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== parentObj.id) return o;
        const subs = o.sub_objectives || [];
        const exists = subs.find((s) => s.id === sub.id);
        const newSubs = exists ? subs.map((s) => s.id === sub.id ? sub : s) : [...subs, sub];
        return { ...o, sub_objectives: newSubs };
      });
      return enrichObjectives(updated);
    });
  }
  async function deleteSubObjective(parentObj, subId) {
    setObjectives((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== parentObj.id) return o;
        return { ...o, sub_objectives: (o.sub_objectives || []).filter((s) => s.id !== subId) };
      });
      return enrichObjectives(updated);
    });
  }
  async function saveMilestone(m) {
    setMilestones((prev) => {
      const exists = prev.find((x) => x.id === m.id);
      return exists ? prev.map((x) => x.id === m.id ? m : x) : [...prev, m];
    });
  }
  async function deleteMilestone(id) {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  }
  async function saveEntry(e) {
    setJournalEntries((prev) => {
      const exists = prev.find((x) => x.id === e.id);
      return exists ? prev.map((x) => x.id === e.id ? e : x) : [...prev, e];
    });
  }
  async function deleteEntry(id) {
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
  }
  async function saveReport(r) {
    setReports((prev) => {
      const exists = prev.find((x) => x.id === r.id);
      return exists ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r];
    });
  }
  async function deleteReport(id) {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Icon.dashboard },
    { id: "objectives", label: "Objectifs", icon: Icon.objectives },
    { id: "journal", label: "Carnet de route", icon: Icon.journal },
    { id: "reports", label: "Rapports", icon: Icon.reports },
    { id: "settings", label: "Jalons & Params", icon: Icon.settings },
  ];

  const enriched = enrichObjectives(objectives);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={S.app}>
        <div style={S.sidebar}>
          <div style={S.logo}>
            <div style={S.logoTitle}>Brevet Géomatique</div>
            <div style={S.logoSub}>Suivi de projet</div>
          </div>
          {navItems.map(({ id, label, icon: Ico }) => (
            <div key={id} style={S.navItem(tab === id)} onClick={() => setTab(id)}>
              <Ico />{label}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: "0 24px" }}>
            <div style={{ fontSize: 11, color: "#2a2d3a", fontWeight: 600, letterSpacing: "0.06em" }}>
              {new Date().toLocaleDateString("fr-CH")}
            </div>
          </div>
        </div>

        <div style={S.main}>
          {tab === "dashboard" && <Dashboard objectives={enriched} milestones={milestones} journalEntries={journalEntries} />}
          {tab === "objectives" && <Objectives objectives={enriched} setObjectives={setObjectives} saveObjective={saveObjective} deleteObjective={deleteObjective} saveSubObjective={saveSubObjective} deleteSubObjective={deleteSubObjective} />}
          {tab === "journal" && <Journal entries={journalEntries} setEntries={setJournalEntries} objectives={enriched} saveEntry={saveEntry} deleteEntry={deleteEntry} />}
          {tab === "reports" && <Reports objectives={enriched} reports={reports} saveReport={saveReport} deleteReport={deleteReport} />}
          {tab === "settings" && <Settings milestones={milestones} saveMilestone={saveMilestone} deleteMilestone={deleteMilestone} />}
        </div>
      </div>
    </>
  );
}
