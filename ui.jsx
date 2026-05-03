// ui.jsx — shared primitives used across the prototype.

const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

// ---------- Brand ----------
function PupilLogo({ size = 28, mono = false }) {
  return (
    <img
      src="assets/pupil-logo-real.png"
      alt="Pupil"
      style={{
        height: size * 1.3,
        width: "auto",
        display: "block",
        filter: mono ? "brightness(0) invert(1)" : "none",
      }}
      aria-hidden="true"
    />
  );
}

function BrandMark({ size = 24, hideWord = false }) {
  return (
    <span className="brand-mark" style={{ fontSize: size * 0.95 }}>
      <PupilLogo size={size}/>
    </span>
  );
}

// ---------- Avatar ----------
function Avatar({ src, name, size = 40, online, ring }) {
  const [err, setErr] = useState(false);
  const initials = (name || "")
    .split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase();
  const hue = useMemo(() => {
    let h = 0;
    for (const c of (name || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 360;
  }, [name]);
  return (
    <span style={{
      position: "relative",
      width: size, height: size, display: "inline-flex", flex: "0 0 auto",
    }}>
      <span style={{
        width: size, height: size, borderRadius: "50%",
        overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: `oklch(72% 0.10 ${hue})`,
        color: "white", fontWeight: 600, fontSize: size * 0.4,
        boxShadow: ring ? `0 0 0 3px var(--surface), 0 0 0 5px var(--primary)` : "none",
      }}>
        {src && !err ? (
          <img src={src} alt="" onError={() => setErr(true)}
               style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
        ) : initials || "·"}
      </span>
      {online !== undefined && (
        <span style={{
          position: "absolute", right: 0, bottom: 0,
          width: size * 0.28, height: size * 0.28, borderRadius: "50%",
          background: online ? "var(--success)" : "var(--text-3)",
          boxShadow: "0 0 0 2px var(--surface)",
        }}/>
      )}
    </span>
  );
}

// ---------- Button ----------
function Button({ children, variant = "primary", size = "md", icon, iconRight, onClick, disabled, type = "button", style, full, as = "button", href, ...rest }) {
  const sizes = {
    sm: { h: 32, px: 12, fs: 13 },
    md: { h: 42, px: 18, fs: 14 },
    lg: { h: 52, px: 24, fs: 16 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: "var(--primary)", fg: "white", border: "var(--primary)", hover: "var(--primary-hover)" },
    secondary: { bg: "var(--surface)", fg: "var(--text)", border: "var(--border-strong)", hover: "var(--surface-2)" },
    ghost: { bg: "transparent", fg: "var(--text)", border: "transparent", hover: "var(--surface-2)" },
    soft: { bg: "var(--primary-light)", fg: "var(--primary)", border: "transparent", hover: "var(--primary-soft)" },
    danger: { bg: "var(--danger)", fg: "white", border: "var(--danger)", hover: "#DC2626" },
    success: { bg: "var(--success)", fg: "white", border: "var(--success)", hover: "#0EA371" },
  };
  const v = variants[variant];
  const [hover, setHover] = useState(false);
  const Cmp = as;
  return (
    <Cmp
      type={as === "button" ? type : undefined}
      href={href}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: 8,
        height: s.h, padding: `0 ${s.px}px`, fontSize: s.fs, fontWeight: 500,
        background: hover && !disabled ? v.hover : v.bg,
        color: v.fg,
        border: `1px solid ${v.border}`,
        borderRadius: variant === "ghost" ? "var(--radius-sm)" : "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background .15s, color .15s, transform .05s",
        transform: hover && !disabled ? "translateY(-0.5px)" : "none",
        textDecoration: "none",
        width: full ? "100%" : "auto",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
        ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      <span>{children}</span>
      {iconRight && <span style={{ display: "inline-flex" }}>{iconRight}</span>}
    </Cmp>
  );
}

// ---------- Card ----------
function Card({ children, padding = "var(--pad)", style, accent, hover, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: accent ? `3px solid var(--primary)` : "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding,
        boxShadow: hover && h ? "var(--shadow)" : "var(--shadow-sm)",
        transition: "box-shadow .18s, transform .18s, border-color .18s",
        transform: hover && h ? "translateY(-1px)" : "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}>
      {children}
    </div>
  );
}

// ---------- Badge ----------
function Badge({ children, tone = "neutral", size = "md", icon }) {
  const tones = {
    neutral:{ bg: "var(--surface-2)", fg: "var(--text-2)" },
    purple: { bg: "var(--primary-light)", fg: "var(--primary)" },
    success:{ bg: "rgba(16,185,129,.12)", fg: "#0F8A66" },
    warning:{ bg: "rgba(245,158,11,.12)", fg: "#B45309" },
    danger: { bg: "rgba(239,68,68,.12)", fg: "#B91C1C" },
    outline:{ bg: "transparent", fg: "var(--text-2)", border: "var(--border)" },
  };
  const t = tones[tone];
  const fs = size === "sm" ? 11 : 12;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: size === "sm" ? "2px 8px" : "4px 10px",
      background: t.bg, color: t.fg,
      border: t.border ? `1px solid ${t.border}` : "none",
      borderRadius: 999, fontSize: fs, fontWeight: 500,
      lineHeight: 1.4,
    }}>{icon}{children}</span>
  );
}

// ---------- Stars ----------
function Stars({ value = 0, size = 14, interactive, onChange, color = "var(--primary)" }) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => {
        const filled = (hover || value) >= i;
        return (
          <span key={i}
            onMouseEnter={() => interactive && setHover(i)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onChange && onChange(i)}
            style={{ cursor: interactive ? "pointer" : "default", lineHeight: 0, transition: "transform .1s", transform: interactive && hover === i ? "scale(1.15)" : "none" }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={filled ? color : "var(--border-strong)"} strokeWidth="1.5">
              <path d="M12 2l2.9 6.5 7.1.7-5.4 4.8 1.6 7L12 17.7 5.8 21l1.6-7L2 9.2l7.1-.7L12 2z"/>
            </svg>
          </span>
        );
      })}
    </span>
  );
}

// ---------- Icon set (line) ----------
const I = {
  home:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>,
  user:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 5-6 8-6s7 2 8 6"/></svg>,
  cal:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
  chat:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11 7.5L4 21l1.5-5.5A8 8 0 1 1 21 12z"/></svg>,
  list:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
  gear:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2L5.1 6 3.1 9.4l2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></svg>,
  bell:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>,
  shield:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></svg>,
  flag:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4M4 5h12l-2 4 2 4H4"/></svg>,
  key:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></svg>,
  check:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>,
  x:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  arrowR:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  arrowL:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>,
  plus:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  video:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>,
  send:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l18-9-7 18-3-7-8-2z"/></svg>,
  mic:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>,
  search:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>,
  google:  <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 8-21l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13a12 12 0 0 1 8 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/><path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.2 5.3A20 20 0 0 0 44 24c0-1.2-.1-2.4-.4-3.5z"/></svg>,
};

// ---------- Modal ----------
function Modal({ open, onClose, children, width = 480, label }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      role="dialog" aria-label={label}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(20, 16, 32, .42)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
        animation: "pg-in .18s ease both",
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: width,
          background: "var(--surface)", borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          padding: 28,
          maxHeight: "90vh", overflowY: "auto",
          animation: "pg-in .24s cubic-bezier(.2,.7,.2,1) both",
        }}>
        {children}
      </div>
    </div>
  );
}

// ---------- Toast ----------
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(arr => [...arr, { id, ...t }]);
    setTimeout(() => setToasts(arr => arr.filter(x => x.id !== id)), t.duration || 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 2000, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.kind === "error" ? "var(--danger)" : t.kind === "warn" ? "var(--warning)" : "var(--text)",
            color: "white",
            padding: "10px 16px", borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-lg)", fontSize: 14,
            animation: "pg-in .25s ease both", maxWidth: 360,
          }}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
function useToast() { return useContext(ToastCtx); }

// ---------- Empty state ----------
function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "48px 24px", textAlign: "center",
      borderRadius: "var(--radius)", border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--primary-light)", color: "var(--primary)", marginBottom: 16,
      }}>{icon}</div>
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      {subtitle && <p className="muted" style={{ maxWidth: 360, marginBottom: 20 }}>{subtitle}</p>}
      {action}
    </div>
  );
}

// ---------- Stat Card ----------
function StatCard({ label, value, trend, tone = "neutral", icon }) {
  const tones = {
    neutral: "var(--text)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    success: "var(--success)",
  };
  return (
    <Card padding="20px">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span className="tiny">{label}</span>
        {icon && <span style={{ color: "var(--text-3)" }}>{icon}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em", color: tones[tone] }}>{value}</span>
        {trend && <span style={{ fontSize: 13, color: trend.startsWith("+") ? "var(--success)" : "var(--text-2)" }}>{trend}</span>}
      </div>
    </Card>
  );
}

// ---------- Time helpers ----------
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function fmtDateShort(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function fmtRelative(iso) {
  const d = new Date(iso);
  const diff = (d - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return diff > 0 ? "in moments" : "just now";
  if (abs < 3600) { const m = Math.round(abs / 60); return diff > 0 ? `in ${m}m` : `${m}m ago`; }
  if (abs < 86400) { const h = Math.round(abs / 3600); return diff > 0 ? `in ${h}h` : `${h}h ago`; }
  const dd = Math.round(abs / 86400);
  return diff > 0 ? `in ${dd}d` : `${dd}d ago`;
}
function countdown(iso) {
  const diff = new Date(iso) - Date.now();
  if (diff <= 0) return "now";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `in ${d} day${d>1?'s':''}`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

// ---------- Striped placeholder ----------
function Placeholder({ width = "100%", height = 200, label, radius = "var(--radius)" }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      backgroundImage: "repeating-linear-gradient(135deg, var(--surface-2) 0 8px, var(--surface) 8px 16px)",
      border: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".05em",
    }}>{label}</div>
  );
}

Object.assign(window, {
  PupilLogo, BrandMark, Avatar, Button, Card, Badge, Stars, I,
  Modal, ToastProvider, useToast, EmptyState, StatCard, Placeholder,
  fmtDate, fmtDateShort, fmtTime, fmtRelative, countdown,
});
