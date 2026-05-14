import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════ */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const Icons = {
  dashboard:  <Icon d={<><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/></>}/>,
  agenda:     <Icon d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>,
  history:    <Icon d={<><path d="M12 8v4l3 3"/><path d="M3.05 11a9 9 0 1 1 .5 4M3 16V11H8"/></>}/>,
  games:      <Icon d={<><rect x="2" y="6" width="20" height="13" rx="3"/><path d="M8 12h4m-2-2v4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="13" r="1" fill="currentColor" stroke="none"/></>}/>,
  settings:   <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></>}/>,
  patients:   <Icon d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}/>,
  reports:    <Icon d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>}/>,
  video:      <Icon d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>}/>,
  chat:       <Icon d={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}/>,
  stats:      <Icon d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>}/>,
  billing:    <Icon d={<><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>}/>,
  horario:    <Icon d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>,
  signout:    <Icon d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}/>,
  chevron:    <Icon d={<path strokeWidth={2} d="m6 9 6 6 6-6"/>}/>,
  menu:       <Icon d={<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/></>}/>,
  close:      <Icon d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>,
  default:    <Icon d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/></>}/>,
};

function getIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("dashboard") || n.includes("inicio")) return Icons.dashboard;
  if (n.includes("agenda") || n.includes("cita") || n.includes("calendar")) return Icons.agenda;
  if (n.includes("histor")) return Icons.history;
  if (n.includes("jueg") || n.includes("game")) return Icons.games;
  if (n.includes("horario")) return Icons.horario;
  if (n.includes("config") || n.includes("setting")) return Icons.settings;
  if (n.includes("paciente") || n.includes("patient") || n.includes("usuario") || n.includes("user")) return Icons.patients;
  if (n.includes("reporte") || n.includes("report") || n.includes("informe")) return Icons.reports;
  if (n.includes("video") || n.includes("meet") || n.includes("llamada")) return Icons.video;
  if (n.includes("chat") || n.includes("mensaje")) return Icons.chat;
  if (n.includes("estadistica") || n.includes("stat") || n.includes("analytic")) return Icons.stats;
  if (n.includes("pago") || n.includes("billing") || n.includes("factura") || n.includes("metodo")) return Icons.billing;
  return Icons.default;
}

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════ */
const T = {
  bg:          "#ffffff",
  border:      "#f0f0f4",
  text:        "#1c1c2e",
  muted:       "#9395a5",
  accent:      "#6366f1",
  accentSoft:  "#eef2ff",
  accentText:  "#4f46e5",
  hover:       "#f7f7fb",
  iconBg:      "#f3f3f8",
  iconBgHover: "#eef2ff",
  danger:      "#ef4444",
  dangerSoft:  "#fff5f5",
  dangerHover: "#fee2e2",
  sectionLabel:"#a8aab8",
  subBorder:   "#ebebf4",
};

/* ═══════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════ */
function IconBox({ children, active, danger, hover }) {
  return (
    <span style={{
      width: 32, height: 32,
      minWidth: 32,
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: 8,
      background: danger
        ? T.dangerSoft
        : active || hover ? T.iconBgHover : T.iconBg,
      color: danger
        ? T.danger
        : active || hover ? T.accentText : T.muted,
      transition: "background .15s, color .15s",
      flexShrink: 0,
    }}>
      {children}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      margin: "16px 8px 4px",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: ".1em",
      textTransform: "uppercase",
      color: T.sectionLabel,
      fontFamily: "system-ui, sans-serif",
    }}>
      {children}
    </p>
  );
}

/* ═══════════════════════════════════════════════════
   NAV ITEM
═══════════════════════════════════════════════════ */
function NavItem({ label, href, icon, active, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  const isOn = active || hovered;

  return (
    <li>
      <a
        href={href}
        onClick={e => { e.preventDefault(); onNavigate(href); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "7px 10px",
          borderRadius: 9,
          textDecoration: "none",
          background: active ? T.accentSoft : hovered ? T.hover : "transparent",
          color: active ? T.accentText : hovered ? T.text : "#4b5068",
          fontWeight: active ? 600 : 500,
          fontSize: 13.5,
          fontFamily: "system-ui, sans-serif",
          transition: "background .14s, color .14s",
          cursor: "pointer",
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Active bar */}
        {active && (
          <span style={{
            position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
            width: 3, height: "55%", borderRadius: "0 3px 3px 0",
            background: T.accent,
          }}/>
        )}
        <IconBox active={active} hover={hovered}>{icon}</IconBox>
        <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </span>
      </a>
    </li>
  );
}

/* ═══════════════════════════════════════════════════
   DROPDOWN ITEM
═══════════════════════════════════════════════════ */
function DropdownItem({ label, icon, subs, basePath, currentPath, onNavigate }) {
  const anyActive = subs.some(s => currentPath === `${basePath}/${s.name}`);
  const [open, setOpen] = useState(anyActive);
  const [hovered, setHovered] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "7px 10px",
          borderRadius: 9, border: "none",
          background: hovered ? T.hover : "transparent",
          color: hovered ? T.text : "#4b5068",
          fontWeight: 500, fontSize: 13.5,
          fontFamily: "system-ui, sans-serif",
          cursor: "pointer",
          transition: "background .14s, color .14s",
          boxSizing: "border-box",
        }}
      >
        <IconBox hover={hovered}>{icon}</IconBox>
        <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </span>
        <span style={{
          color: T.muted, flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform .2s",
          display: "flex",
        }}>
          {Icons.chevron}
        </span>
      </button>

      {/* Sublist */}
      <div style={{
        overflow: "hidden",
        maxHeight: open ? 400 : 0,
        transition: "max-height .25s cubic-bezier(.4,0,.2,1)",
      }}>
        <ul style={{
          listStyle: "none", margin: "3px 0 3px 20px", padding: "0 0 0 12px",
          borderLeft: `1.5px solid ${T.subBorder}`,
          display: "flex", flexDirection: "column", gap: 1,
        }}>
          {subs.map(s => {
            const subPath = `${basePath}/${s.name}`;
            const subActive = currentPath === subPath;
            return (
              <SubItem
                key={s.name}
                label={s.nametext || s.name}
                href={subPath}
                active={subActive}
                onNavigate={onNavigate}
              />
            );
          })}
        </ul>
      </div>
    </li>
  );
}

function SubItem({ label, href, active, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <li>
      <a
        href={href}
        onClick={e => { e.preventDefault(); onNavigate(href); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "block", padding: "6px 8px",
          borderRadius: 7,
          fontSize: 12.5, fontWeight: active ? 600 : 400,
          fontFamily: "system-ui, sans-serif",
          color: active ? T.accentText : hovered ? T.text : T.muted,
          background: active ? T.accentSoft : hovered ? T.hover : "transparent",
          textDecoration: "none",
          transition: "background .14s, color .14s",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}
      >
        {label}
      </a>
    </li>
  );
}

/* ═══════════════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════════════ */
function Skeleton() {
  return (
    <>
      {[65, 50, 75, 55].map((w, i) => (
        <li key={i} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "7px 10px",
          animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
        }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: "#ebebf2", flexShrink: 0 }}/>
          <span style={{ height: 10, borderRadius: 20, background: "#ebebf2", width: `${w}%` }}/>
        </li>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   NAVIGATION — delegates to Astro ClientRouter
   (native View Transitions API)
═══════════════════════════════════════════════════ */
const _listeners = [];

function onPathChange(cb) { _listeners.push(cb); }

// Listen to Astro's page transition events (fired by ClientRouter)
if (typeof document !== "undefined") {
  document.addEventListener("astro:page-load", () => {
    const url = window.location.pathname;
    _listeners.forEach(cb => cb(url));
  });
}

function navigateTo(url) {
  if (window.location.pathname === url) return;
  // navigate() from astro:transitions/client triggers the SPA transition
  // without a full page reload
  import("astro:transitions/client").then(({ navigate }) => {
    navigate(url);
  });
}

/* ═══════════════════════════════════════════════════
   MAIN SIDEBAR COMPONENT
═══════════════════════════════════════════════════ */
export default function Sidebar() {
  const [open, setOpen] = useState(false);         // mobile
  const [currentPath, setCurrentPath] = useState(typeof window !== "undefined" ? window.location.pathname : "/");
  const [menuItems, setMenuItems] = useState(null); // null = loading

  // Sync path with Astro ClientRouter transitions
  useEffect(() => {
    const handlePageLoad = () => {
      const url = window.location.pathname;
      setCurrentPath(url);
      if (window.innerWidth < 640) setOpen(false);
    };

    // astro:page-load fires after every ClientRouter navigation (including first load)
    document.addEventListener("astro:page-load", handlePageLoad);
    // popstate for browser back/forward
    window.addEventListener("popstate", handlePageLoad);

    return () => {
      document.removeEventListener("astro:page-load", handlePageLoad);
      window.removeEventListener("popstate", handlePageLoad);
    };
  }, []);

  // Load dynamic menu
  useEffect(() => {
    if (currentPath.includes("/agenda/meet")) return;
    fetch("/api/settings/games/menu", { credentials: "include" })
      .then(r => r.json())
      .then(data => setMenuItems(data[0]?.menu?.menu || []))
      .catch(() => setTimeout(() => setMenuItems([]), 5000));
  }, []);

  const navigate = useCallback((url) => {
    // Astro ClientRouter intercepts <a> clicks automatically.
    // For programmatic navigation we use the navigate helper.
    // Optimistically update active state for instant feedback.
    setCurrentPath(url);
    navigateTo(url);
  }, []);

  const isActive = (href) =>
    href === currentPath || (href !== "/client" && currentPath.startsWith(href));

  // Sidebar width
  const W = 232;

  return (
    <>
      {/* ── Mobile toggle ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        style={{
          display: "none",
          position: "fixed", top: 12, left: 12, zIndex: 60,
          width: 36, height: 36,
          alignItems: "center", justifyContent: "center",
          borderRadius: 8,
          background: T.bg, border: `1px solid ${T.border}`,
          boxShadow: "0 1px 4px rgba(0,0,0,.08)",
          cursor: "pointer",
        }}
        className="sidebar-mobile-btn"
      >
        {Icons.menu}
      </button>

      {/* ── Overlay ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,.4)",
            backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        id="separator-sidebar"
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 50,
          width: W, height: "100dvh",
          background: T.bg,
          borderRight: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : undefined,
          transition: "transform .28s cubic-bezier(.4,0,.2,1), box-shadow .28s",
          boxShadow: open ? "4px 0 32px rgba(0,0,0,.12)" : "none",
          overflowY: "hidden",
        }}
        className="sidebar-panel"
      >
        {/* ── Brand ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "16px 14px",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: T.accentSoft,
            boxShadow: `0 0 0 1px rgba(99,102,241,.18)`,
          }}>
            <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="url(#sbGrad)"/>
              <path d="M18 9c-2.2 0-4 1.8-4 4 0 1.6.9 3 2.2 3.7v2.3h3.6v-2.3C21.1 16 22 14.6 22 13c0-2.2-1.8-4-4-4Z" fill="white" opacity=".95"/>
              <path d="M13.5 21h9l1.3 6H12.2L13.5 21Z" fill="white" opacity=".72"/>
              <defs>
                <linearGradient id="sbGrad" x1="0" y1="0" x2="36" y2="36">
                  <stop stopColor="#6366f1"/><stop offset="1" stopColor="#7c3aed"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <span style={{
            flex: 1, fontSize: 15, fontWeight: 800,
            letterSpacing: "-.03em",
            background: "linear-gradient(135deg, #6366f1, #7c3aed)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontFamily: "system-ui, sans-serif",
          }}>
            Psicologic
          </span>

          {/* Close (mobile only) */}
          <button
            onClick={() => setOpen(false)}
            className="sidebar-close-btn"
            style={{
              width: 28, height: 28, borderRadius: 6, border: "none",
              background: "transparent", color: T.muted, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .14s",
            }}
          >
            {Icons.close}
          </button>
        </div>

        {/* ── Nav ── */}
        <nav style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          padding: "8px 8px",
          display: "flex", flexDirection: "column",
        }}>
          {/* Static: Dashboard */}
          <SectionLabel>Principal</SectionLabel>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            <NavItem
              label="Dashboard" href="/client"
              icon={Icons.dashboard}
              active={isActive("/client")}
              onNavigate={navigate}
            />
          </ul>

          {/* Dynamic items */}
          <SectionLabel>Módulos</SectionLabel>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            {menuItems === null ? (
              <Skeleton />
            ) : (
              menuItems.filter(i => i.status !== false).map(i => {
                const label = i.name === "config_agend" ? "Config. Horario" : (i.nametext || i.name);
                const hasSubs = Array.isArray(i.subItem) && i.subItem.length > 0;

                if (hasSubs) {
                  const isGames = label.toLowerCase().includes("jueg");
                  const basePath = isGames ? "/client/games" : "/client/settings";
                  return (
                    <DropdownItem
                      key={i.name}
                      label={label}
                      icon={getIcon(label)}
                      subs={i.subItem}
                      basePath={basePath}
                      currentPath={currentPath}
                      onNavigate={navigate}
                    />
                  );
                }

                const path = i.name === "Historia Clinica"
                  ? "/client/history/historias"
                  : `/client/${i.name}`;

                return (
                  <NavItem
                    key={i.name}
                    label={label}
                    href={path}
                    icon={getIcon(label)}
                    active={isActive(path)}
                    onNavigate={navigate}
                  />
                );
              })
            )}
          </ul>
        </nav>

        {/* ── Footer: sign out ── */}
        <div style={{ flexShrink: 0, padding: "8px 8px 12px", borderTop: `1px solid ${T.border}` }}>
          <button
            onClick={async () => {
              // Clerk expone window.Clerk en el cliente cuando está inicializado
              if (window.Clerk) {
                await window.Clerk.signOut();
                window.location.href = "/";
              } else {
                window.location.href = "/";
              }
            }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "7px 10px",
              borderRadius: 9, border: "none",
              background: "transparent", color: T.danger,
              fontSize: 13.5, fontWeight: 500,
              fontFamily: "system-ui, sans-serif",
              cursor: "pointer",
              transition: "background .14s",
              boxSizing: "border-box",
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.dangerSoft}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <IconBox danger>{Icons.signout}</IconBox>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Responsive CSS ── */}
      <style>{`
        .sidebar-panel {
          transform: translateX(-100%);
        }
        @media (min-width: 640px) {
          .sidebar-panel { transform: translateX(0) !important; }
          .sidebar-mobile-btn { display: none !important; }
          .sidebar-close-btn { display: none !important; }
        }
        @media (max-width: 639px) {
          .sidebar-mobile-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}