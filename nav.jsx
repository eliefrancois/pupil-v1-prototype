// nav.jsx — sidebar + topbar + role-aware nav.

const NAV_STUDENT = [
  { id: "dashboard", label: "Dashboard", icon: I.home, route: "student/dashboard" },
  { id: "mentor",    label: "My Mentor", icon: I.user, route: "student/mentor" },
  { id: "book",      label: "Book Session", icon: I.cal, route: "student/book" },
  { id: "messages",  label: "Messages", icon: I.chat, route: "student/messages", badge: 1 },
  { id: "history",   label: "Session History", icon: I.list, route: "student/history" },
  { id: "settings",  label: "Settings", icon: I.gear, route: "student/settings" },
];

const NAV_MENTOR = [
  { id: "dashboard", label: "Dashboard", icon: I.home, route: "mentor/dashboard" },
  { id: "mentees",   label: "My Mentees", icon: I.user, route: "mentor/mentees" },
  { id: "schedule",  label: "Schedule", icon: I.cal, route: "mentor/schedule" },
  { id: "messages",  label: "Messages", icon: I.chat, route: "mentor/messages", badge: 2 },
  { id: "history",   label: "Session History", icon: I.list, route: "mentor/history" },
  { id: "settings",  label: "Settings", icon: I.gear, route: "mentor/settings" },
];

const NAV_ADMIN = [
  { id: "dashboard", label: "Dashboard", icon: I.home, route: "admin/dashboard" },
  { id: "matching",  label: "Matching Queue", icon: I.user, route: "admin/matching", badge: 4 },
  { id: "mentors",   label: "Mentors", icon: I.user, route: "admin/mentors" },
  { id: "students",  label: "Students", icon: I.list, route: "admin/students" },
  { id: "flags",     label: "Safety Flags", icon: I.flag, route: "admin/flags", badge: 4, badgeTone: "danger" },
  { id: "rules",     label: "Safety Rules", icon: I.shield, route: "admin/rules" },
  { id: "codes",     label: "Access Codes", icon: I.key, route: "admin/codes" },
  { id: "eligibility", label: "Eligibility", icon: I.check, route: "admin/eligibility", badge: 1 },
];

function Sidebar({ role, route, navigate }) {
  const items = role === "mentor" ? NAV_MENTOR : role === "admin" ? NAV_ADMIN : NAV_STUDENT;
  const me = role === "student"
    ? { name: "Riley Park", sub: "Grade 11 · Student", photo: null }
    : role === "mentor"
    ? { name: "Amara Okafor", sub: "Mentor · Stanford '26", photo: MENTORS[0].photo }
    : { name: "Sam (Admin)", sub: "Pupil Trust & Safety", photo: null };

  return (
    <aside style={{
      width: "var(--sidebar-w)", flex: "0 0 var(--sidebar-w)",
      borderRight: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex", flexDirection: "column",
      height: "100vh",
    }}>
      <div style={{ padding: "20px 22px 12px" }}>
        <button
          onClick={() => navigate(role === "mentor" ? "mentor/dashboard" : role === "admin" ? "admin/dashboard" : "student/dashboard")}
          style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}>
          <BrandMark size={22}/>
        </button>
      </div>

      <div className="scroll" style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(item => {
          const active = route === item.route || route.startsWith(item.route + "/");
          return (
            <button key={item.id} onClick={() => navigate(item.route)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "10px 12px", borderRadius: 8,
                background: active ? "var(--primary-light)" : "transparent",
                color: active ? "var(--primary)" : "var(--text)",
                border: 0, cursor: "pointer", fontSize: 14, fontWeight: 500,
                textAlign: "left", fontFamily: "inherit",
                transition: "background .15s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ display: "inline-flex" }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9,
                  background: item.badgeTone === "danger" ? "var(--danger)" : "var(--primary)",
                  color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar src={me.photo} name={me.name} size={36}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me.name}</div>
          <div className="muted" style={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me.sub}</div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, subtitle, right }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "20px 32px", borderBottom: "1px solid var(--border)",
      gap: 16,
    }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>{title}</h1>
        {subtitle && <p className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{right}</div>
    </div>
  );
}

function PublicNav({ navigate, route }) {
  const links = [
    { id: "how", label: "How it works" },
    { id: "mentors", label: "Mentors" },
    { id: "pricing", label: "Pricing", route: "public/pricing" },
    { id: "faq", label: "FAQ" },
  ];
  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "20px 40px", borderBottom: "1px solid var(--border)",
      position: "sticky", top: 0, background: "rgba(251,250,247,.85)",
      backdropFilter: "blur(20px)", zIndex: 50,
    }}>
      <button onClick={() => navigate("public/landing")}
        style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}>
        <BrandMark size={22}/>
      </button>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {links.map(l => (
          <button key={l.id}
            onClick={() => l.route ? navigate(l.route) : null}
            style={{
              background: "none", border: 0, cursor: "pointer", padding: 0,
              color: route === l.route ? "var(--primary)" : "var(--text)",
              fontSize: 14, fontFamily: "inherit", fontWeight: 500,
            }}>{l.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate("public/login")}>Log in</Button>
        <Button variant="primary" size="sm" onClick={() => navigate("public/pricing")}>Get Early Access</Button>
      </div>
    </nav>
  );
}

Object.assign(window, { Sidebar, Topbar, PublicNav, NAV_STUDENT, NAV_MENTOR, NAV_ADMIN });
