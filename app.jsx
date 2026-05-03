// app.jsx — root: hash router, role switching, tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "role": "student",
  "matched": true,
  "dark": false,
  "density": "regular",
  "accentHue": 264,
  "fontPairing": "geist-newsreader"
}/*EDITMODE-END*/;

const FONT_PAIRINGS = {
  "geist-newsreader": { ui: "Geist", display: "Newsreader", label: "Geist + Newsreader" },
  "inter-newsreader": { ui: "Inter", display: "Newsreader", label: "Inter + Newsreader" },
  "ibm-newsreader":   { ui: "IBM Plex Sans", display: "Newsreader", label: "IBM Plex + Newsreader" },
  "geist-geist":      { ui: "Geist", display: "Geist", label: "Geist (sans only)" },
  "inter-tight":      { ui: "Inter", display: "Inter Tight", label: "Inter + Inter Tight" },
};

function useHashRoute() {
  const get = () => (window.location.hash || "#public/landing").slice(1);
  const [route, setRoute] = useState(get());
  useEffect(() => {
    const h = () => setRoute(get());
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  const navigate = (r) => { window.location.hash = r; };
  return [route, navigate];
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, navigate] = useHashRoute();
  const [ratingOpen, setRatingOpen] = useState(false);

  // apply theme tokens
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", t.dark ? "dark" : "light");
    root.setAttribute("data-density", t.density);
    const h = t.accentHue;
    root.style.setProperty("--primary", `oklch(60% 0.20 ${h})`);
    root.style.setProperty("--primary-hover", `oklch(54% 0.20 ${h})`);
    root.style.setProperty("--primary-light", t.dark ? `oklch(28% 0.10 ${h})` : `oklch(95% 0.04 ${h})`);
    root.style.setProperty("--primary-soft", t.dark ? `oklch(22% 0.08 ${h})` : `oklch(98% 0.02 ${h})`);
    const fp = FONT_PAIRINGS[t.fontPairing];
    root.style.setProperty("--font-ui", `"${fp.ui}", ui-sans-serif, system-ui, sans-serif`);
    root.style.setProperty("--font-display", `"${fp.display}", "${fp.ui}", serif`);
  }, [t.dark, t.density, t.accentHue, t.fontPairing]);

  // sync role with route
  useEffect(() => {
    if (route.startsWith("public/") || route.startsWith("onboarding/")) return;
    const r = route.split("/")[0];
    if ((r === "student" || r === "mentor" || r === "admin") && r !== t.role) setTweak("role", r);
  }, [route]);

  // when tweak role changes, jump to that role's home
  useEffect(() => {
    if (route.startsWith("public/") || route.startsWith("onboarding/")) return;
    const cur = route.split("/")[0];
    if (cur !== t.role) navigate(`${t.role}/dashboard`);
  }, [t.role]);

  // Trigger rating modal once when student dashboard loads (showcase)
  useEffect(() => {
    if (route === "student/dashboard" && t.matched && !sessionStorage.getItem("rated_demo")) {
      const tt = setTimeout(() => { setRatingOpen(true); sessionStorage.setItem("rated_demo", "1"); }, 1500);
      return () => clearTimeout(tt);
    }
  }, [route, t.matched]);

  // ROUTING
  let content;
  if (route.startsWith("public/")) {
    if (route === "public/pricing") content = <PricingPage navigate={navigate}/>;
    else if (route === "public/login") content = <LoginPage navigate={navigate}/>;
    else if (route === "public/apply") content = <ApplyPage navigate={navigate}/>;
    else if (route === "public/redeem") content = <RedeemPage navigate={navigate}/>;
    else content = <LandingPage navigate={navigate}/>;
    return <ToastProvider>{content}<TweaksUI t={t} setTweak={setTweak}/></ToastProvider>;
  }
  if (route.startsWith("onboarding/")) {
    const step = route.split("/")[1];
    if (step === "interests") content = <OnbInterests navigate={navigate}/>;
    else if (step === "preferences") content = <OnbPreferences navigate={navigate}/>;
    else if (step === "availability") content = <OnbAvailability navigate={navigate}/>;
    else if (step === "complete") content = <OnbComplete navigate={navigate}/>;
    else content = <OnbProfile navigate={navigate}/>;
    return <ToastProvider>{content}<TweaksUI t={t} setTweak={setTweak}/></ToastProvider>;
  }

  // Video room — full bleed
  if (route.match(/^(student|mentor)\/room\//)) {
    const id = route.split("/").pop();
    return <ToastProvider><VideoRoom navigate={navigate} sessionId={id}/><TweaksUI t={t} setTweak={setTweak}/></ToastProvider>;
  }

  // App shell
  let inner;
  const role = t.role;
  if (role === "student") {
    if (route === "student/dashboard") inner = <StudentDashboard navigate={navigate} matched={t.matched}/>;
    else if (route === "student/mentor") inner = <StudentMentorProfile navigate={navigate}/>;
    else if (route === "student/book") inner = <StudentBooking navigate={navigate}/>;
    else if (route === "student/messages") inner = <Messages navigate={navigate} role="student"/>;
    else if (route === "student/history") inner = <SessionHistory navigate={navigate} role="student"/>;
    else if (route === "student/settings") inner = <SettingsPlaceholder/>;
    else if (route.startsWith("student/session/")) inner = <StudentPreCall navigate={navigate} sessionId={route.split("/").pop()}/>;
    else if (route.startsWith("student/breakdown/")) {
      const idAndQuery = route.split("/").pop();
      const [id, q] = idAndQuery.split("?");
      inner = <Breakdown navigate={navigate} sessionId={id} fresh={q && q.includes("fresh")}/>;
    }
    else inner = <StudentDashboard navigate={navigate} matched={t.matched}/>;
  } else if (role === "mentor") {
    if (route === "mentor/dashboard") inner = <MentorDashboard navigate={navigate}/>;
    else if (route === "mentor/mentees") inner = <MentorMentees navigate={navigate}/>;
    else if (route === "mentor/schedule") inner = <MentorSchedule/>;
    else if (route === "mentor/messages") inner = <Messages navigate={navigate} role="mentor"/>;
    else if (route === "mentor/history") inner = <SessionHistory navigate={navigate} role="mentor"/>;
    else if (route === "mentor/settings") inner = <SettingsPlaceholder/>;
    else if (route.startsWith("mentor/breakdown/")) inner = <Breakdown navigate={navigate} sessionId={route.split("/").pop()}/>;
    else inner = <MentorDashboard navigate={navigate}/>;
  } else {
    if (route === "admin/dashboard") inner = <AdminHome navigate={navigate}/>;
    else if (route === "admin/matching") inner = <MatchingQueue/>;
    else if (route === "admin/mentors") inner = <AdminMentors/>;
    else if (route === "admin/students") inner = <AdminStudents/>;
    else if (route === "admin/flags") inner = <FlagsQueue/>;
    else if (route === "admin/rules") inner = <SafetyRules/>;
    else if (route === "admin/codes") inner = <AccessCodes/>;
    else if (route === "admin/eligibility") inner = <EligibilityReview/>;
    else inner = <AdminHome navigate={navigate}/>;
  }

  return (
    <ToastProvider>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar role={role} route={route} navigate={navigate}/>
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }} key={route}>
          {inner}
        </main>
      </div>
      <RatingModal open={ratingOpen} onClose={() => setRatingOpen(false)} mentor={MENTORS[0]}/>
      <TweaksUI t={t} setTweak={setTweak} navigate={navigate}/>
    </ToastProvider>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Settings" subtitle="Account, notifications, and privacy"/>
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card padding="24px">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Profile</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <div><label className="label">Email</label><input className="input" defaultValue="riley@example.org"/></div>
            <div><label className="label">Phone (parent)</label><input className="input" defaultValue="(505) 555-0142"/></div>
            <div><label className="label">Timezone</label><select className="select"><option>Mountain Time</option></select></div>
          </div>
        </Card>
        <Card padding="24px">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Notifications</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {[["Session reminders","24h and 1h before"],["Messages","when your mentor replies"],["Breakdowns","when ready"],["Marketing","newsletter, product updates"]].map(([t, d], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <div><div style={{ fontWeight: 500 }}>{t}</div><div className="muted small">{d}</div></div>
                <Toggle value={i < 3} onChange={() => {}}/>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TweaksUI({ t, setTweak, navigate }) {
  return (
    <TweaksPanel>
      <TweakSection label="Role"/>
      <TweakRadio label="Logged in as" value={t.role}
        options={[{ value: "student", label: "Student" }, { value: "mentor", label: "Mentor" }, { value: "admin", label: "Admin" }]}
        onChange={(v) => setTweak("role", v)}/>
      <TweakToggle label="Mentor matched" value={t.matched} onChange={(v) => setTweak("matched", v)}/>
      <TweakSection label="Public flow"/>
      <TweakButton label="Jump to landing" onClick={() => navigate && navigate("public/landing")}/>
      <TweakButton label="Jump to onboarding" onClick={() => navigate && navigate("onboarding/profile")}/>
      <TweakSection label="Theme"/>
      <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)}/>
      <TweakSlider label="Accent hue" min={0} max={360} step={1} value={t.accentHue} onChange={(v) => setTweak("accentHue", v)} unit="°"/>
      <TweakRadio label="Density" value={t.density}
        options={[{ value: "compact", label: "Compact" }, { value: "regular", label: "Regular" }, { value: "comfy", label: "Comfy" }]}
        onChange={(v) => setTweak("density", v)}/>
      <TweakSection label="Type"/>
      <TweakSelect label="Font pairing" value={t.fontPairing}
        options={Object.entries(FONT_PAIRINGS).map(([k, v]) => ({ value: k, label: v.label }))}
        onChange={(v) => setTweak("fontPairing", v)}/>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
