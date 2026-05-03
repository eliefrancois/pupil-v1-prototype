// mentor.jsx — mentor dashboard, schedule, mentees.

function MentorDashboard({ navigate }) {
  const upcoming = SESSIONS.filter(s => s.status === "upcoming");
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="display" style={{ fontSize: 36, letterSpacing: "-0.025em" }}>Welcome back, <em>Amara</em>.</h1>
        <p className="muted" style={{ marginTop: 4 }}>Two sessions on the schedule this week.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Active mentees" value="6" trend="+1 this month"/>
        <StatCard label="Total sessions" value="142"/>
        <StatCard label="Avg rating" value="4.9" icon={<Stars value={5} size={11}/>}/>
        <StatCard label="Pending ratings" value="2" tone="warning"/>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Upcoming sessions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {[
          { name: "Riley Park", school: "West Mesa HS", grade: 11, when: SESSIONS[0].startsAt, focus: "Stanford supplements" },
          { name: "Jordan Tate", school: "Roosevelt HS", grade: 12, when: daysFromNow(3, 17, 0), focus: "First call — intro" },
          { name: "Marcus Bell", school: "Garfield HS", grade: 11, when: daysFromNow(5, 16, 30), focus: "Robotics activity essay" },
        ].map((s, i) => (
          <Card key={i} padding="20px" hover>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar name={s.name} size={44}/>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name} <span className="muted small">· Grade {s.grade}</span></div>
                  <div className="muted small">{s.school} · {fmtDate(s.when)} · {fmtTime(s.when)}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Badge tone="purple">{s.focus}</Badge>
                <a style={{ fontSize: 13, cursor: "pointer" }}>Icebreakers</a>
                <Button size="sm" icon={I.video} onClick={() => navigate(`mentor/room/${SESSIONS[0].id}`)}>Join</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Pending breakdowns to rate</h2>
      <Card padding="24px" accent>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600 }}>2 sessions waiting on your rating</div>
            <div className="muted small">Riley Park (Tuesday) · Marcus Bell (Friday)</div>
          </div>
          <Button>Review pending</Button>
        </div>
      </Card>
    </div>
  );
}

function MentorSchedule() {
  const [connected, setConnected] = useState(true);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const blocks = [["Morning","9–12"], ["Afternoon","12–5"], ["Evening","5–9"]];
  const [grid, setGrid] = useState({
    "Mon-Evening": true, "Tue-Afternoon": true, "Tue-Evening": true,
    "Wed-Evening": true, "Thu-Afternoon": true, "Thu-Evening": true,
    "Sat-Morning": true, "Sun-Afternoon": true,
  });

  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Schedule & availability" subtitle="Sessions are auto-blocked from your connected calendar."/>
      <Card padding="20px" style={{ marginTop: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 8-21l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13a12 12 0 0 1 8 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/><path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.2 5.3A20 20 0 0 0 44 24c0-1.2-.1-2.4-.4-3.5z"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{connected ? "Google Calendar connected" : "No calendar connected"}</div>
              <div className="muted small">{connected ? "amara.okafor@gmail.com" : "Sync your calendar so we don't double-book you."}</div>
            </div>
          </div>
          {connected
            ? <Button variant="ghost" size="sm" onClick={() => setConnected(false)}>Disconnect</Button>
            : <Button onClick={() => setConnected(true)}>Connect calendar</Button>}
        </div>
      </Card>

      <Card padding="24px">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>Recurring availability</h3>
            <p className="muted small">Toggle the windows you're typically free.</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div>
              <label className="label" style={{ marginBottom: 4 }}>Buffer between sessions</label>
              <select className="select" style={{ height: 36, fontSize: 13 }}><option>10 min</option><option>15 min</option><option>30 min</option></select>
            </div>
            <div>
              <label className="label" style={{ marginBottom: 4 }}>Timezone</label>
              <select className="select" style={{ height: 36, fontSize: 13 }}><option>Pacific (PT)</option><option>Mountain (MT)</option><option>Central (CT)</option><option>Eastern (ET)</option></select>
            </div>
          </div>
        </div>
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
                return <button key={k} onClick={() => setGrid(g => ({ ...g, [k]: !g[k] }))}
                  style={{ height: 56, borderRadius: 8, border: `1px solid ${on ? "var(--primary)" : "var(--border)"}`, background: on ? "var(--primary-light)" : "var(--surface)", cursor: "pointer", transition: "all .15s" }}/>;
              })}
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <Button>Save changes</Button>
        </div>
      </Card>
    </div>
  );
}

function MentorMentees({ navigate }) {
  const mentees = [
    { name: "Riley Park", grade: 11, school: "West Mesa HS", interests: ["CS", "Cogsci"], sessions: 3, last: daysFromNow(-7) },
    { name: "Jordan Tate", grade: 12, school: "Roosevelt HS", interests: ["Pre-med", "Bio"], sessions: 1, last: daysFromNow(-12) },
    { name: "Marcus Bell", grade: 11, school: "Garfield HS", interests: ["Engineering", "Robotics"], sessions: 4, last: daysFromNow(-3) },
    { name: "Sofia Reyes", grade: 11, school: "Garfield HS Chicago", interests: ["Public policy", "Econ"], sessions: 2, last: daysFromNow(-5) },
    { name: "Theo Bennett", grade: 10, school: "Lakeside School", interests: ["Writing"], sessions: 1, last: daysFromNow(-21) },
    { name: "Anya Petrov", grade: 10, school: "Central HS", interests: ["Math", "Physics"], sessions: 6, last: daysFromNow(-2) },
  ];
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="My mentees" subtitle="6 active students this term" right={<Button variant="secondary" size="sm" icon={I.search}>Search</Button>}/>
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {mentees.map((s, i) => (
          <Card key={i} padding="20px" hover>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <Avatar name={s.name} size={44}/>
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div className="muted small">Grade {s.grade} · {s.school}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {s.interests.map(t => <Badge key={t} tone="purple" size="sm">{t}</Badge>)}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <span className="muted">{s.sessions} sessions · last {fmtRelative(s.last)}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <Button size="sm" variant="secondary" icon={I.chat} onClick={() => navigate("mentor/messages")}/>
                <Button size="sm" variant="ghost">History</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { MentorDashboard, MentorSchedule, MentorMentees });
