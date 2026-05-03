// onboarding.jsx — 4-step wizard + complete.

function OnboardingShell({ step, children, onBack, onNext, nextLabel = "Next", nextDisabled }) {
  const total = 4;
  return (
    <div className="page-enter" style={{ minHeight: "100vh", height: "100vh", overflow: "auto", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandMark size={22}/>
        <span className="muted small">Step {step} of {total}</span>
      </div>
      <div style={{ height: 3, background: "var(--surface-2)" }}>
        <div style={{ height: "100%", width: `${(step / total) * 100}%`, background: "var(--primary)", transition: "width .35s cubic-bezier(.2,.7,.2,1)" }}/>
      </div>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "60px 32px 40px" }}>
        <div style={{ width: "100%", maxWidth: 640 }}>
          {children}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40 }}>
            {onBack ? <Button variant="ghost" onClick={onBack} icon={I.arrowL}>Back</Button> : <span/>}
            <Button onClick={onNext} disabled={nextDisabled} iconRight={I.arrowR}>{nextLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnbProfile({ navigate }) {
  return (
    <OnboardingShell step={1} onNext={() => navigate("onboarding/interests")}>
      <span className="tiny">About you</span>
      <h1 className="display" style={{ fontSize: 38, marginTop: 10, letterSpacing: "-0.02em" }}>Let's start with the basics.</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 32 }}>This helps us match you with mentors who've been where you are.</p>
      <div style={{ display: "grid", gap: 18 }}>
        <div>
          <label className="label">Grade level</label>
          <select className="select" defaultValue="11"><option>9</option><option>10</option><option>11</option><option>12</option></select>
        </div>
        <div>
          <label className="label">GPA range <span className="muted small" style={{ fontWeight: 400 }}>(optional)</span></label>
          <select className="select"><option>Prefer not to say</option><option>4.0+</option><option>3.7–3.9</option><option>3.4–3.6</option><option>3.0–3.3</option><option>Below 3.0</option></select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label className="label">City</label><input className="input" defaultValue="Albuquerque"/></div>
          <div><label className="label">State</label><input className="input" defaultValue="New Mexico"/></div>
        </div>
      </div>
    </OnboardingShell>
  );
}

function TagPicker({ label, options, defaultSelected = [], placeholder }) {
  const [selected, setSelected] = useState(defaultSelected);
  const [input, setInput] = useState("");
  const toggle = (o) => setSelected(s => s.includes(o) ? s.filter(x => x !== o) : [...s, o]);
  const filtered = options.filter(o => !selected.includes(o) && (!input || o.toLowerCase().includes(input.toLowerCase())));
  return (
    <div>
      <label className="label">{label}</label>
      <div style={{ minHeight: 42, padding: 6, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {selected.map(s => (
          <span key={s} style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "4px 10px", borderRadius: 99, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {s}
            <button onClick={() => toggle(s)} style={{ background: "none", border: 0, color: "var(--primary)", cursor: "pointer", padding: 0, display: "inline-flex" }}>{I.x}</button>
          </span>
        ))}
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={selected.length === 0 ? placeholder : ""}
          style={{ flex: 1, minWidth: 100, border: 0, outline: "none", padding: "6px 8px", background: "transparent", color: "var(--text)", fontFamily: "inherit", fontSize: 14 }}/>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {filtered.slice(0, 8).map(o => (
          <button key={o} onClick={() => toggle(o)} style={{
            border: "1px dashed var(--border-strong)", background: "transparent", padding: "4px 10px", borderRadius: 99,
            cursor: "pointer", fontSize: 12.5, color: "var(--text-2)", fontFamily: "inherit",
          }}>+ {o}</button>
        ))}
      </div>
    </div>
  );
}

function OnbInterests({ navigate }) {
  return (
    <OnboardingShell step={2} onBack={() => navigate("onboarding/profile")} onNext={() => navigate("onboarding/preferences")}>
      <span className="tiny">Interests</span>
      <h1 className="display" style={{ fontSize: 38, marginTop: 10, letterSpacing: "-0.02em" }}>What are you drawn to?</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 32 }}>Pick a few — you can always change these later.</p>
      <div style={{ display: "grid", gap: 22 }}>
        <TagPicker label="Colleges you're interested in" placeholder="Type or pick…"
          defaultSelected={["Stanford", "MIT", "UC Berkeley"]}
          options={["Brown", "Carnegie Mellon", "Yale", "Harvard", "Princeton", "Cornell", "Northwestern", "USC", "UCLA", "Vanderbilt", "Michigan"]}/>
        <TagPicker label="Possible majors" placeholder="Type or pick…"
          defaultSelected={["Computer Science", "Cognitive Science"]}
          options={["Engineering", "Mathematics", "Economics", "Biology", "English", "Psychology", "Public Policy", "Physics", "Design"]}/>
        <TagPicker label="Career interests" placeholder="Type or pick…"
          defaultSelected={["Software engineer"]}
          options={["Researcher", "Doctor", "Lawyer", "Founder", "Designer", "Journalist", "Teacher", "Policy"]}/>
      </div>
    </OnboardingShell>
  );
}

function OnbPreferences({ navigate }) {
  return (
    <OnboardingShell step={3} onBack={() => navigate("onboarding/interests")} onNext={() => navigate("onboarding/availability")}>
      <span className="tiny">Mentor preferences</span>
      <h1 className="display" style={{ fontSize: 38, marginTop: 10, letterSpacing: "-0.02em" }}>How would you like to be matched?</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 16, maxWidth: 540 }}>All optional. We use these to match you with someone who shares your background, never to share with schools.</p>
      <Card padding="20px" style={{ background: "var(--primary-soft)", borderColor: "var(--primary-light)", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ color: "var(--primary)" }}>{I.shield}</span>
          <p className="small" style={{ color: "var(--text)" }}>This information is private. It is used only for matching, never shown on your profile, and never shared with schools or third parties.</p>
        </div>
      </Card>
      <div style={{ display: "grid", gap: 22 }}>
        <div>
          <label className="label">Race / ethnicity</label>
          <select className="select" defaultValue=""><option value="">Prefer not to say</option><option>Asian / Asian American</option><option>Black / African American</option><option>Hispanic / Latinx</option><option>Native American</option><option>White</option><option>Multiracial</option><option>Other</option></select>
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="select" defaultValue=""><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Other</option></select>
        </div>
        <label style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 16, border: "1px solid var(--border)", borderRadius: "var(--radius)", cursor: "pointer" }}>
          <input type="checkbox" defaultChecked style={{ marginTop: 3 }}/>
          <div>
            <div style={{ fontWeight: 500 }}>I am a first-generation college student</div>
            <div className="muted small" style={{ marginTop: 2 }}>Neither of my parents completed a 4-year college degree.</div>
          </div>
        </label>
      </div>
    </OnboardingShell>
  );
}

function OnbAvailability({ navigate }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const blocks = [["Morning", "9–12"], ["Afternoon", "12–5"], ["Evening", "5–9"]];
  const [grid, setGrid] = useState({
    "Tue-Afternoon": true, "Tue-Evening": true,
    "Wed-Evening": true,
    "Thu-Afternoon": true, "Thu-Evening": true,
    "Sat-Morning": true, "Sat-Afternoon": true,
    "Sun-Afternoon": true,
  });
  const [agree, setAgree] = useState(true);
  return (
    <OnboardingShell step={4} onBack={() => navigate("onboarding/preferences")} onNext={() => navigate("onboarding/complete")} nextDisabled={!agree} nextLabel="Complete setup">
      <span className="tiny">Availability</span>
      <h1 className="display" style={{ fontSize: 38, marginTop: 10, letterSpacing: "-0.02em" }}>When are you usually free?</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 28 }}>Tap any cell to toggle. We'll only book sessions in your selected windows.</p>
      <div style={{ display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", gap: 6 }}>
        <div/>
        {days.map(d => <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--text-2)", padding: 6 }}>{d}</div>)}
        {blocks.map(([b, hours]) => (
          <React.Fragment key={b}>
            <div style={{ padding: "10px 6px" }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{b}</div>
              <div className="muted" style={{ fontSize: 11 }}>{hours}</div>
            </div>
            {days.map(d => {
              const k = `${d}-${b}`;
              const on = grid[k];
              return (
                <button key={k} onClick={() => setGrid(g => ({ ...g, [k]: !g[k] }))}
                  style={{
                    height: 56, borderRadius: 8, border: `1px solid ${on ? "var(--primary)" : "var(--border)"}`,
                    background: on ? "var(--primary-light)" : "var(--surface)",
                    cursor: "pointer", transition: "all .15s",
                  }}/>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <label style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 32, padding: 16, border: "1px solid var(--border)", borderRadius: "var(--radius)", cursor: "pointer" }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3 }}/>
        <div className="small">I agree to Pupil's <a>terms of service</a> and <a>community guidelines</a>.</div>
      </label>
    </OnboardingShell>
  );
}

function OnbComplete({ navigate }) {
  // Confetti
  const colors = ["#7A60E4", "#10B981", "#F59E0B", "#EDE8FB", "#1A1A2E"];
  const pieces = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.6, color: colors[i % colors.length], size: 6 + Math.random() * 8,
  })), []);
  return (
    <div className="page-enter" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden", position: "relative" }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: `${p.left}%`, top: 0,
          width: p.size, height: p.size, background: p.color, borderRadius: 2,
          animation: `confetti-fall ${2 + Math.random()*1.4}s ${p.delay}s ease-in forwards`,
        }}/>
      ))}
      <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--border)" }}><BrandMark size={22}/></div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ width: 88, height: 88, borderRadius: 24, background: "var(--primary-light)", color: "var(--primary)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
          </div>
          <h1 className="display" style={{ fontSize: 44, letterSpacing: "-0.025em", marginBottom: 12 }}>You're all set, <em>Riley</em>.</h1>
          <p className="muted" style={{ fontSize: 16, marginBottom: 28 }}>We'll match you with a mentor within 24–48 hours. In the meantime, browse our directory.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Button size="lg" onClick={() => navigate("student/dashboard")}>Go to dashboard</Button>
            <Button size="lg" variant="secondary">Browse mentors</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OnbProfile, OnbInterests, OnbPreferences, OnbAvailability, OnbComplete });
