// admin.jsx — admin home, matching, flags, rules, codes, eligibility.

function AdminHome({ navigate }) {
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Trust & Safety dashboard" subtitle="Monday, April 30 · everything reviewed in last 24h"/>
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="Pending matches" value="4" tone="warning" icon={I.user}/>
        <StatCard label="Active flags" value="4" tone="danger" icon={I.flag}/>
        <StatCard label="Total students" value="1,840" trend="+62 this week"/>
        <StatCard label="Total mentors" value="142" trend="+5 this week"/>
      </div>

      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card padding="24px">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h3 style={{ fontSize: 16 }}>Recent activity</h3>
            <a style={{ fontSize: 13, cursor: "pointer" }}>View all →</a>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {[
              { i: I.flag, c: "var(--danger)", t: "Critical safety flag opened on session #s_4421", w: "12 minutes ago" },
              { i: I.user, c: "var(--primary)", t: "Sofia Reyes auto-matched with Diego Hernández (96% score)", w: "34 minutes ago" },
              { i: I.check, c: "var(--success)", t: "Eligibility approved for Tasha Williams (Roosevelt HS)", w: "2 hours ago" },
              { i: I.key, c: "var(--text-2)", t: "Bronx College Prep used 3 of 50 access codes today", w: "3 hours ago" },
              { i: I.shield, c: "var(--warning)", t: "Contact-info filter modified mentor message (Jonas Lindqvist)", w: "5 hours ago" },
            ].map((a, i) => (
              <li key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none", alignItems: "center" }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-2)", color: a.c, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{a.i}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{a.t}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{a.w}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding="20px" hover onClick={() => navigate("admin/matching")}><div style={{ fontWeight: 600 }}>Matching queue</div><div className="muted small" style={{ marginTop: 4 }}>4 students waiting · oldest is 26h</div></Card>
          <Card padding="20px" hover onClick={() => navigate("admin/flags")}><div style={{ fontWeight: 600, color: "var(--danger)" }}>1 critical flag</div><div className="muted small" style={{ marginTop: 4 }}>Investigating · review within 24h</div></Card>
          <Card padding="20px" hover onClick={() => navigate("admin/eligibility")}><div style={{ fontWeight: 600 }}>1 eligibility application</div><div className="muted small" style={{ marginTop: 4 }}>Counselor confirmed · ready for approval</div></Card>
        </div>
      </div>
    </div>
  );
}

function MatchingQueue() {
  const [open, setOpen] = useState(MATCHING_QUEUE[0].id);
  const [assigned, setAssigned] = useState({});
  const toast = useToast();
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Matching queue" subtitle={`${MATCHING_QUEUE.length} students awaiting a mentor`}/>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {MATCHING_QUEUE.map(q => {
          const isOpen = open === q.id;
          const a = assigned[q.id];
          return (
            <Card key={q.id} padding="0">
              <button onClick={() => setOpen(o => o === q.id ? null : q.id)} style={{
                width: "100%", padding: 20, background: "none", border: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar name={q.student.name} size={40}/>
                  <div>
                    <div style={{ fontWeight: 600 }}>{q.student.name} <span className="muted small" style={{ fontWeight: 400 }}>· Grade {q.student.grade} · {q.student.school}</span></div>
                    <div className="muted small">Interests: {q.student.interests.join(" · ")} · Top choices: {q.student.colleges.join(", ")}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {a ? <Badge tone="success">Assigned to {MENTORS.find(m => m.id === a).name.split(' ')[0]}</Badge> : <Badge tone="warning">Awaiting match</Badge>}
                  <span style={{ color: "var(--text-2)", transform: isOpen ? "rotate(45deg)" : "none", transition: "transform .2s" }}>{I.plus}</span>
                </div>
              </button>
              {isOpen && (
                <div style={{ borderTop: "1px solid var(--border)", padding: 20, background: "var(--surface-2)" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                    {q.student.identity.map(t => <Badge key={t} tone="purple">{t}</Badge>)}
                  </div>
                  <div className="tiny" style={{ marginBottom: 8 }}>Suggested mentors</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.candidates.map(c => {
                      const m = MENTORS.find(x => x.id === c.mentorId);
                      const score = Math.round(c.score * 100);
                      return (
                        <div key={c.mentorId} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
                          <Avatar src={m.photo} name={m.name} size={40}/>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{m.name} <span className="muted small">· {m.university} · {m.major}</span></div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                              {c.reasons.map(r => <Badge key={r} tone="neutral" size="sm">{r}</Badge>)}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div className="muted small">{m.activeMentees} mentees · ★ {m.rating}</div>
                            <div style={{ fontWeight: 700, color: score > 85 ? "var(--success)" : score > 70 ? "var(--primary)" : "var(--text-2)", fontFamily: "var(--font-mono)" }}>{score}%</div>
                          </div>
                          <Button size="sm" disabled={!!a} onClick={() => { setAssigned(s => ({ ...s, [q.id]: c.mentorId })); toast({ text: `Assigned ${m.name.split(' ')[0]} to ${q.student.name.split(' ')[0]}`, kind: "success" }); }}>
                            {a === c.mentorId ? "Assigned" : "Assign"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 12, textAlign: "right" }}>
                    <a className="muted small" style={{ cursor: "pointer" }}>No suitable mentor — flag for recruitment</a>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FlagsQueue() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? FLAGS : FLAGS.filter(f => f.type === filter);
  const tones = { critical: "danger", high: "danger", medium: "warning", low: "neutral" };
  const [resolved, setResolved] = useState({});
  const toast = useToast();
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Safety flags" subtitle="Every flag is reviewed by a human within 24 hours"/>
      <div style={{ display: "flex", gap: 6, marginTop: 20, marginBottom: 16, flexWrap: "wrap" }}>
        {[["all","All"],["message","Messages"],["session","Sessions"],["rating","Ratings"],["user","Users"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
            border: filter === k ? "1px solid var(--primary)" : "1px solid var(--border)",
            background: filter === k ? "var(--primary-light)" : "var(--surface)",
            color: filter === k ? "var(--primary)" : "var(--text)",
          }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(f => (
          <Card key={f.id} padding="20px" style={{ borderLeft: `3px solid ${f.severity === "critical" ? "var(--danger)" : f.severity === "high" ? "var(--danger)" : f.severity === "medium" ? "var(--warning)" : "var(--border-strong)"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                  <Badge tone={tones[f.severity]}>{f.severity}</Badge>
                  <Badge tone="neutral">{f.type}</Badge>
                  <span className="muted small">{fmtRelative(f.at)} · by {f.by}</span>
                  {resolved[f.id] && <Badge tone="success">{resolved[f.id]}</Badge>}
                </div>
                <p style={{ fontSize: 14.5, fontStyle: "italic", color: "var(--text-2)", marginBottom: 8 }}>"{f.preview}"</p>
                <p className="small" style={{ color: "var(--text)" }}>{f.full}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                <Button size="sm" variant="primary" disabled={!!resolved[f.id]} onClick={() => { setResolved(r => ({ ...r, [f.id]: "investigating" })); toast({ text: "Marked as investigating" }); }}>Investigate</Button>
                <Button size="sm" variant="success" disabled={!!resolved[f.id]} onClick={() => { setResolved(r => ({ ...r, [f.id]: "resolved" })); toast({ text: "Resolved" }); }}>Resolve</Button>
                <Button size="sm" variant="ghost" disabled={!!resolved[f.id]} onClick={() => { setResolved(r => ({ ...r, [f.id]: "dismissed" })); }}>Dismiss</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SafetyRules() {
  const [rules, setRules] = useState(SAFETY_RULES);
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Safety rules" subtitle="System-wide guardrails. Changes apply to all sessions immediately."/>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {rules.map(r => (
          <Card key={r.id} padding="20px">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 15 }}>{r.name}</h3>
                  <Badge tone={r.active ? "success" : "neutral"} size="sm">{r.active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="muted small" style={{ marginBottom: 10 }}>{r.description}</p>
                <input className="input" value={r.config} onChange={(e) => setRules(s => s.map(x => x.id === r.id ? { ...x, config: e.target.value } : x))} style={{ maxWidth: 360, fontFamily: "var(--font-mono)", fontSize: 13 }}/>
              </div>
              <Toggle value={r.active} onChange={(v) => setRules(s => s.map(x => x.id === r.id ? { ...x, active: v } : x))}/>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 44, height: 26, borderRadius: 13, border: 0, cursor: "pointer",
      background: value ? "var(--primary)" : "var(--border-strong)",
      position: "relative", transition: "background .2s", padding: 0, flex: "0 0 44px",
    }}>
      <span style={{
        position: "absolute", top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: 10, background: "white", transition: "left .2s",
        boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      }}/>
    </button>
  );
}

function AccessCodes() {
  const [codes, setCodes] = useState(ACCESS_CODES);
  const [school, setSchool] = useState("");
  const [count, setCount] = useState(25);
  const toast = useToast();
  const generate = (e) => {
    e.preventDefault();
    if (!school) return;
    const code = school.toUpperCase().replace(/\s+/g,'-').slice(0,16) + "-" + Math.random().toString(36).slice(2,6).toUpperCase();
    setCodes(c => [{ code, school, redeemed: 0, total: count, expires: "2027-06-30", status: "active" }, ...c]);
    setSchool(""); toast({ text: "Code generated", kind: "success" });
  };
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Access codes" subtitle="Schools and orgs redeem these for bulk seats"/>
      <Card padding="24px" style={{ marginTop: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Generate codes</h3>
        <form onSubmit={generate} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          <div><label className="label">School / org</label><input className="input" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Eastlake High School"/></div>
          <div><label className="label">Codes</label><input className="input" type="number" value={count} onChange={(e) => setCount(+e.target.value)}/></div>
          <div><label className="label">Sessions / code</label><select className="select"><option>6</option><option>8</option><option>10</option><option>12</option></select></div>
          <div><label className="label">Expires</label><input className="input" type="date" defaultValue="2027-06-30"/></div>
          <Button type="submit">Generate</Button>
        </form>
      </Card>
      <Card padding="0">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "var(--surface-2)" }}>
              {["Code", "School", "Usage", "Expires", "Status", ""].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {codes.map((c, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px" }}><span className="mono" style={{ fontSize: 12.5 }}>{c.code}</span></td>
                <td style={{ padding: "12px 16px" }}>{c.school}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${c.redeemed/c.total*100}%`, background: "var(--primary)" }}/>
                    </div>
                    <span className="muted small">{c.redeemed}/{c.total}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }} className="muted">{c.expires}</td>
                <td style={{ padding: "12px 16px" }}><Badge tone={c.status === "active" ? "success" : c.status === "depleted" ? "warning" : "neutral"} size="sm">{c.status}</Badge></td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>{c.status === "active" && <a style={{ fontSize: 12, cursor: "pointer", color: "var(--danger)" }}>Deactivate</a>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function EligibilityReview() {
  const [items, setItems] = useState(ELIGIBILITY);
  const toast = useToast();
  const decide = (id, ok) => { setItems(s => s.filter(x => x.id !== id)); toast({ text: ok ? "Approved" : "Denied", kind: ok ? "success" : "warn" }); };
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Eligibility review" subtitle={`${items.length} application${items.length === 1 ? "" : "s"} pending`}/>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {items.length === 0 && <EmptyState icon={I.check} title="Inbox zero" subtitle="No pending applications. Nice."/>}
        {items.map(e => (
          <Card key={e.id} padding="20px">
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 16, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{e.name} <span className="muted small">· Grade {e.grade} · {e.school}</span></div>
                <div className="muted small">{e.email} · submitted {fmtRelative(e.date)}</div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Badge tone="purple" size="sm">{e.type}</Badge>
                  <Badge tone={e.counselorStatus === "confirmed" ? "success" : "warning"} size="sm">Counselor {e.counselorStatus}</Badge>
                </div>
                <div className="muted small">{e.counselor}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="sm" variant="ghost" onClick={() => decide(e.id, false)}>Deny</Button>
                <Button size="sm" variant="success" disabled={e.counselorStatus !== "confirmed"} onClick={() => decide(e.id, true)}>Approve</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminMentors() {
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Mentors" subtitle="142 active · 8 in onboarding"/>
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {MENTORS.map(m => (
          <Card key={m.id} padding="16px">
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
              <Avatar src={m.photo} name={m.name} size={42} online={m.online}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                <div className="muted small">{m.university}</div>
              </div>
              <Stars value={Math.round(m.rating)} size={11}/>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }} className="muted">
              <span>{m.activeMentees} active</span>
              <span>{m.sessions} sessions</span>
              <span>{m.rating}★</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminStudents() {
  const students = [
    { name: "Riley Park", grade: 11, school: "West Mesa HS", mentor: "Amara Okafor", sessions: 3 },
    { name: "Jordan Tate", grade: 12, school: "Roosevelt HS", mentor: "—", sessions: 0 },
    { name: "Marcus Bell", grade: 11, school: "Garfield HS", mentor: "Jonas Lindqvist", sessions: 4 },
    { name: "Sofia Reyes", grade: 11, school: "Garfield HS Chicago", mentor: "Diego Hernández", sessions: 2 },
    { name: "Theo Bennett", grade: 10, school: "Lakeside School", mentor: "Sasha Chen", sessions: 1 },
    { name: "Anya Petrov", grade: 10, school: "Central HS", mentor: "Maya Goldberg", sessions: 6 },
    { name: "Tasha Williams", grade: 11, school: "Roosevelt HS", mentor: "—", sessions: 0 },
  ];
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Students" subtitle="1,840 enrolled" right={<Button size="sm" variant="secondary" icon={I.search}>Search</Button>}/>
      <Card padding="0" style={{ marginTop: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "var(--surface-2)" }}>
              {["Student","Grade","School","Mentor","Sessions"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={s.name} size={28}/>
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}>{s.grade}</td>
                <td style={{ padding: "12px 16px" }} className="muted">{s.school}</td>
                <td style={{ padding: "12px 16px" }}>{s.mentor}</td>
                <td style={{ padding: "12px 16px" }}>{s.sessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

Object.assign(window, { AdminHome, MatchingQueue, FlagsQueue, SafetyRules, AccessCodes, EligibilityReview, AdminMentors, AdminStudents });
