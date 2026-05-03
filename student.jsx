// student.jsx — student dashboard, mentor profile, booking, pre-call, video, breakdown, messages, history, rating modal.

function StudentDashboard({ navigate, matched, onUnmatch }) {
  const upcoming = SESSIONS.find(s => s.status === "upcoming");
  const lastDone = SESSIONS.find(s => s.status === "completed");
  const mentor = MENTORS.find(m => m.id === STUDENT.matchedMentor);

  if (!matched) {
    return (
      <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
        <h1 style={{ fontSize: 30 }}>Hey Riley.</h1>
        <p className="muted" style={{ marginTop: 6, marginBottom: 28 }}>We're working on the perfect match.</p>
        <Card padding="40px" style={{ textAlign: "center", maxWidth: 640, background: "linear-gradient(180deg, var(--primary-soft) 0%, var(--surface) 100%)", borderColor: "var(--primary-light)" }}>
          <div style={{ width: 88, height: 88, borderRadius: 44, background: "var(--primary-light)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }} className="pulse-ring">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5" strokeLinecap="round"/></svg>
          </div>
          <h2 className="display" style={{ fontSize: 28, letterSpacing: "-0.02em" }}>We're finding you a mentor</h2>
          <p className="muted" style={{ marginTop: 8, marginBottom: 20 }}>Expected match within <strong style={{ color: "var(--text)" }}>24–48 hours</strong>.</p>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 20 }}>
            {[0,1,2].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: "var(--primary)", opacity: 0.3, animation: `pg-in 1s ${i * 0.2}s infinite alternate` }}/>)}
          </div>
          <Button variant="secondary">Browse mentors while you wait</Button>
        </Card>

        <h2 style={{ fontSize: 18, marginTop: 36, marginBottom: 16 }}>Mentors who might be a good fit</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {MENTORS.slice(0, 4).map(m => (
            <Card key={m.id} padding="0" hover style={{ overflow: "hidden" }}>
              <img src={m.photo} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}/>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                <div className="muted small">{m.university}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 className="display" style={{ fontSize: 36, letterSpacing: "-0.025em" }}>Hey, <em>Riley</em>.</h1>
          <p className="muted" style={{ marginTop: 4 }}>Here's where you are with Amara this month.</p>
        </div>
        <Badge tone="purple">{STUDENT.sessionsRemaining} of {STUDENT.sessionsTotal} sessions left</Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        {/* Mentor card */}
        <Card padding="0" style={{ overflow: "hidden", display: "flex" }}>
          <img src={mentor.photo} alt="" style={{ width: 200, height: "100%", objectFit: "cover", flex: "0 0 200px" }}/>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            <div>
              <span className="tiny">Your mentor</span>
              <h2 style={{ marginTop: 4, fontSize: 22 }}>{mentor.name}</h2>
              <div className="muted small">{mentor.university} · {mentor.major} · {mentor.gradYear}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Stars value={5} size={14}/>
              <span className="small muted">{mentor.rating} · {mentor.sessions} sessions</span>
            </div>
            <p className="small muted" style={{ flex: 1 }}>{mentor.bio.slice(0, 160)}…</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={() => navigate("student/book")} icon={I.cal}>Book a session</Button>
              <Button variant="secondary" onClick={() => navigate("student/messages")} icon={I.chat}>Message</Button>
            </div>
          </div>
        </Card>

        {/* Upcoming session */}
        {upcoming && (
          <Card padding="24px" accent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <span className="tiny">Upcoming session</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtDate(upcoming.startsAt)}</div>
              <div className="muted">{fmtTime(upcoming.startsAt)} · 30 min · with {mentor.name}</div>
            </div>
            <Badge tone="purple">{countdown(upcoming.startsAt)}</Badge>
            <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
              <Button onClick={() => navigate(`student/session/${upcoming.id}`)} variant="soft">View icebreakers</Button>
              <Button icon={I.video} onClick={() => navigate(`student/room/${upcoming.id}`)}>Join</Button>
            </div>
          </Card>
        )}
      </div>

      {/* Recent breakdown */}
      {lastDone && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h2 style={{ fontSize: 18 }}>Last session breakdown</h2>
            <a onClick={() => navigate(`student/breakdown/${lastDone.id}`)} style={{ fontSize: 13, cursor: "pointer" }}>View full breakdown →</a>
          </div>
          <Card padding="24px">
            <div className="muted small" style={{ marginBottom: 12 }}>{fmtDate(lastDone.startsAt)} · {mentor.name}</div>
            <div style={{ marginBottom: 12 }}><span className="tiny">Action items</span></div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
              {lastDone.breakdown.actionItems.map(a => (
                <li key={a.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{
                    width: 18, height: 18, flex: "0 0 18px", borderRadius: 5,
                    border: `1.5px solid ${a.done ? "var(--success)" : "var(--border-strong)"}`,
                    background: a.done ? "var(--success)" : "transparent",
                    color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 2,
                  }}>{a.done && I.check}</span>
                  <span style={{ fontSize: 14, textDecoration: a.done ? "line-through" : "none", color: a.done ? "var(--text-2)" : "var(--text)" }}>{a.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <Card hover onClick={() => navigate("student/history")} padding="20px"><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontWeight: 600 }}>Session history</div><div className="muted small">3 completed sessions</div></div><span style={{ color: "var(--text-3)" }}>{I.arrowR}</span></div></Card>
        <Card hover onClick={() => navigate("student/messages")} padding="20px"><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontWeight: 600 }}>Messages</div><div className="muted small">1 unread from Amara</div></div><span style={{ color: "var(--text-3)" }}>{I.arrowR}</span></div></Card>
        <Card hover onClick={() => navigate("student/book")} padding="20px"><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontWeight: 600 }}>Book a session</div><div className="muted small">2 left this month</div></div><span style={{ color: "var(--text-3)" }}>{I.arrowR}</span></div></Card>
      </div>
    </div>
  );
}

// ---------- Mentor profile (student view) ----------
function StudentMentorProfile({ navigate }) {
  const m = MENTORS.find(x => x.id === STUDENT.matchedMentor);
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <a onClick={() => navigate("student/dashboard")} style={{ fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>{I.arrowL} Back to dashboard</a>
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "320px 1fr", gap: 32 }}>
        <div>
          <Card padding="0" style={{ overflow: "hidden" }}>
            <img src={m.photo} style={{ width: "100%", height: 320, objectFit: "cover", display: "block" }}/>
          </Card>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Button full icon={I.cal} onClick={() => navigate("student/book")}>Book</Button>
            <Button full variant="secondary" icon={I.chat} onClick={() => navigate("student/messages")}>Message</Button>
          </div>
        </div>
        <div>
          <h1 className="display" style={{ fontSize: 44, letterSpacing: "-0.025em" }}>{m.name}</h1>
          <div className="muted" style={{ fontSize: 16, marginTop: 4 }}>{m.university} · {m.major} · {m.gradYear}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
            {m.tags.map(t => <Badge key={t} tone="purple">{t}</Badge>)}
          </div>
          <p style={{ marginTop: 24, fontSize: 16, lineHeight: 1.6, color: "var(--text)" }}>{m.bio}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 24 }}>
            <StatCard label="Avg rating" value={m.rating} icon={<Stars value={5} size={12}/>}/>
            <StatCard label="Total sessions" value={m.sessions}/>
            <StatCard label="Active mentees" value={m.activeMentees}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Booking ----------
function StudentBooking({ navigate }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [booked, setBooked] = useState(false);
  const toast = useToast();

  // build a week of slots
  const today = new Date(); today.setHours(0,0,0,0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 + weekOffset * 7); // monday
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  });
  const slotHours = [9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20];

  // deterministic availability mask
  const isAvail = (di, h) => {
    const seed = (weekOffset * 7 + di) * 31 + h;
    return (seed * 7919) % 11 < 5 && new Date(days[di].getTime() + h * 3600000) > Date.now();
  };

  const slotKey = (di, h) => `${di}-${h}`;
  const fmtRange = (h) => {
    const next = (h + 1) % 24;
    const f = (n) => `${((n+11)%12)+1}${n<12?'a':'p'}`;
    return `${f(h)}–${f(next)}`;
  };

  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Book a session" subtitle={`with Amara · ${STUDENT.sessionsRemaining} sessions remaining`}/>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <Button variant="ghost" size="sm" icon={I.arrowL} onClick={() => setWeekOffset(o => o - 1)}>Prev</Button>
          <Button variant="ghost" size="sm" iconRight={I.arrowR} onClick={() => setWeekOffset(o => o + 1)}>Next</Button>
        </div>
        <div style={{ fontWeight: 600 }}>
          {days[0].toLocaleDateString(undefined,{ month: "long", day: "numeric" })} – {days[6].toLocaleDateString(undefined,{ month: "short", day: "numeric", year: "numeric" })}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>This week</Button>
      </div>
      <Card padding="20px">
        <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7,1fr)", gap: 4, fontSize: 12 }}>
          <div/>
          {days.map((d, i) => (
            <div key={i} style={{ textAlign: "center", padding: 8 }}>
              <div className="muted tiny" style={{ marginBottom: 2 }}>{d.toLocaleDateString(undefined,{ weekday: "short" })}</div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{d.getDate()}</div>
            </div>
          ))}
          {slotHours.map(h => (
            <React.Fragment key={h}>
              <div style={{ padding: "10px 6px", textAlign: "right", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{fmtRange(h).split('–')[0]}</div>
              {days.map((d, di) => {
                const k = slotKey(di, h);
                const avail = isAvail(di, h);
                const isSel = selected === k;
                return (
                  <button key={k}
                    disabled={!avail}
                    onClick={() => { setSelected(k); setConfirming(true); }}
                    style={{
                      height: 36, borderRadius: 6, fontFamily: "inherit", fontSize: 12,
                      border: "1px solid",
                      borderColor: isSel ? "var(--primary-hover)" : avail ? "var(--primary-light)" : "transparent",
                      background: isSel ? "var(--primary)" : avail ? "var(--primary-light)" : "var(--surface-2)",
                      color: isSel ? "white" : avail ? "var(--primary)" : "var(--text-3)",
                      cursor: avail ? "pointer" : "not-allowed",
                      transition: "all .15s",
                    }}>
                    {avail ? fmtRange(h) : ""}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <Modal open={confirming && !booked} onClose={() => setConfirming(false)}>
        <h3 style={{ marginBottom: 8 }}>Confirm your session</h3>
        <p className="muted small" style={{ marginBottom: 20 }}>You can cancel up to 4 hours before.</p>
        <div style={{ display: "grid", gap: 10, padding: 16, background: "var(--surface-2)", borderRadius: 10, marginBottom: 20 }}>
          {selected && <>
            <Row label="Date" value={days[+selected.split('-')[0]].toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}/>
            <Row label="Time" value={fmtRange(+selected.split('-')[1])}/>
            <Row label="Duration" value="30 minutes"/>
            <Row label="Mentor" value="Amara Okafor"/>
          </>}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
          <Button onClick={() => {
            setBooked(true); setConfirming(false);
            toast({ text: "Session booked! Check your dashboard.", kind: "success" });
            setTimeout(() => navigate("student/dashboard"), 800);
          }}>Confirm booking</Button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
      <span className="muted">{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ---------- Pre-call ----------
function StudentPreCall({ navigate, sessionId }) {
  const session = SESSIONS.find(s => s.id === sessionId) || SESSIONS[0];
  const mentor = MENTORS.find(m => m.id === session.mentorId);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [, force] = useState(0);
  useEffect(() => { const t = setInterval(() => force(x => x+1), 30000); return () => clearInterval(t); }, []);
  const startsIn = new Date(session.startsAt) - Date.now();
  const canJoin = startsIn < 5 * 60 * 1000;

  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <a onClick={() => navigate("student/dashboard")} style={{ fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>{I.arrowL} Back</a>
      <div style={{ marginTop: 20, marginBottom: 28 }}>
        <span className="tiny">Upcoming session</span>
        <h1 className="display" style={{ fontSize: 40, letterSpacing: "-0.025em", marginTop: 6 }}>{fmtDate(session.startsAt)}</h1>
        <div style={{ display: "flex", gap: 16, marginTop: 8, color: "var(--text-2)", flexWrap: "wrap" }}>
          <span>{fmtTime(session.startsAt)}</span>
          <span>·</span>
          <span>30 minutes</span>
          <span>·</span>
          <span>with {mentor.name}</span>
        </div>
      </div>

      <Card padding="32px" accent style={{ maxWidth: 720 }}>
        <span className="tiny">Conversation starters</span>
        <h2 className="display" style={{ fontSize: 26, marginTop: 4, letterSpacing: "-0.02em", marginBottom: 20 }}>Tailored for this session.</h2>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 16, counterReset: "ice" }}>
          {session.icebreakers && session.icebreakers.map((q, i) => (
            <li key={i} style={{ display: "flex", gap: 16 }}>
              <span style={{
                flex: "0 0 32px", height: 32, borderRadius: "50%", background: "var(--primary)", color: "white",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600,
              }}>{i + 1}</span>
              <p style={{ fontSize: 16, lineHeight: 1.55, paddingTop: 4 }}>{q}</p>
            </li>
          ))}
        </ol>
      </Card>

      <div style={{ marginTop: 24, maxWidth: 720, textAlign: "center" }}>
        {canJoin ? (
          <Button size="lg" icon={I.video} onClick={() => navigate(`student/room/${session.id}`)} full>Join session</Button>
        ) : (
          <Button size="lg" disabled full>Session starts {countdown(session.startsAt)}</Button>
        )}
      </div>

      <Card padding="20px" style={{ maxWidth: 720, marginTop: 24, cursor: "pointer" }} onClick={() => setTipsOpen(o => !o)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>Tips before you join</span>
          <span style={{ color: "var(--text-2)", transform: tipsOpen ? "rotate(45deg)" : "none", transition: "transform .2s" }}>{I.plus}</span>
        </div>
        {tipsOpen && (
          <ul style={{ paddingLeft: 18, marginTop: 14, marginBottom: 0, color: "var(--text-2)", fontSize: 14, lineHeight: 1.7 }}>
            <li>Find a quiet, well-lit place</li>
            <li>Check your camera and mic before joining</li>
            <li>Have your icebreaker answers in mind</li>
            <li>Take a screenshot of any drafts you want to share</li>
          </ul>
        )}
      </Card>
    </div>
  );
}

// ---------- Video room ----------
function VideoRoom({ navigate, sessionId }) {
  const session = SESSIONS.find(s => s.id === sessionId) || SESSIONS[0];
  const mentor = MENTORS.find(m => m.id === session.mentorId);
  const [muted, setMuted] = useState(false);
  const [cam, setCam] = useState(true);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { const t = setInterval(() => setSeconds(s => s + 1), 1000); return () => clearInterval(t); }, []);
  const mm = String(Math.floor(seconds/60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="page-enter" style={{ height: "100vh", background: "#0A0817", display: "flex", flexDirection: "column", color: "white" }}>
      <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PupilLogo size={22} mono/>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "4px 10px", background: "rgba(255,255,255,.08)", borderRadius: 99 }}>● REC {mm}:{ss}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>Session with {mentor.name}</div>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 16 }}>
        <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#1A1530" }}>
          <img src={mentor.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          <div style={{ position: "absolute", bottom: 12, left: 16, padding: "6px 12px", background: "rgba(0,0,0,.5)", borderRadius: 8, fontSize: 13, backdropFilter: "blur(6px)" }}>{mentor.name}</div>
        </div>
        <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#1A1530", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {cam ? (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #2A1F4A 0%, #1A1530 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Avatar name="Riley Park" size={120}/>
            </div>
          ) : (
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: 14 }}>Camera off</div>
          )}
          <div style={{ position: "absolute", bottom: 12, left: 16, padding: "6px 12px", background: "rgba(0,0,0,.5)", borderRadius: 8, fontSize: 13 }}>You</div>
        </div>
      </div>
      <div style={{ padding: 24, display: "flex", justifyContent: "center", gap: 12 }}>
        <CallBtn active={!muted} onClick={() => setMuted(m => !m)}>{I.mic}</CallBtn>
        <CallBtn active={cam} onClick={() => setCam(c => !c)}>{I.video}</CallBtn>
        <button onClick={() => navigate(`student/breakdown/${session.id}?fresh=1`)} style={{
          height: 56, padding: "0 28px", borderRadius: 28, border: 0, background: "var(--danger)",
          color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
        }}>End call</button>
      </div>
    </div>
  );
}
function CallBtn({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 56, height: 56, borderRadius: 28, border: 0,
      background: active ? "rgba(255,255,255,.1)" : "rgba(239,68,68,.2)",
      color: active ? "white" : "#FCA5A5",
      cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>{children}</button>
  );
}

// ---------- Breakdown ----------
function Breakdown({ navigate, sessionId, fresh }) {
  const session = SESSIONS.find(s => s.id === sessionId) || SESSIONS[1];
  const mentor = MENTORS.find(m => m.id === session.mentorId);
  const [processing, setProcessing] = useState(!!fresh);
  useEffect(() => { if (fresh) { const t = setTimeout(() => setProcessing(false), 2200); return () => clearTimeout(t); } }, [fresh]);
  const [items, setItems] = useState(session.breakdown ? session.breakdown.actionItems : []);

  if (processing) {
    return (
      <div className="page-enter" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 40, gap: 16 }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, border: "3px solid var(--primary-light)", borderTopColor: "var(--primary)" }} className="spin"/>
        <h3 className="display" style={{ fontSize: 22 }}>Processing your session breakdown…</h3>
        <p className="muted small">Pulling out topics, action items, and what to focus on next.</p>
      </div>
    );
  }
  const b = session.breakdown;
  if (!b) return <div style={{ padding: 40 }}><EmptyState icon={I.list} title="No breakdown" subtitle="This session doesn't have a breakdown yet."/></div>;

  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <a onClick={() => navigate("student/history")} style={{ fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>{I.arrowL} All sessions</a>
      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <span className="tiny">Session breakdown</span>
          <h1 className="display" style={{ fontSize: 36, letterSpacing: "-0.025em", marginTop: 6 }}>{fmtDate(session.startsAt)}</h1>
          <div className="muted" style={{ marginTop: 4 }}>with {mentor.name} · 30 minutes</div>
        </div>
        <Button variant="secondary">View transcript</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding="24px">
            <span className="tiny">Topics covered</span>
            <ul style={{ marginTop: 10, marginBottom: 0, paddingLeft: 22, lineHeight: 1.8 }}>{b.topics.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </Card>
          <Card padding="24px" accent>
            <span className="tiny">Your action items</span>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 12 }}>
              {items.map(a => (
                <li key={a.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}
                  onClick={() => setItems(arr => arr.map(x => x.id === a.id ? { ...x, done: !x.done } : x))}>
                  <span style={{
                    width: 22, height: 22, flex: "0 0 22px", borderRadius: 6,
                    border: `1.5px solid ${a.done ? "var(--success)" : "var(--border-strong)"}`,
                    background: a.done ? "var(--success)" : "transparent",
                    color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 2,
                    transition: "all .15s",
                  }}>{a.done && I.check}</span>
                  <span style={{ fontSize: 15, textDecoration: a.done ? "line-through" : "none", color: a.done ? "var(--text-2)" : "var(--text)" }}>{a.text}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card padding="24px">
            <span className="tiny">Next session focus</span>
            <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.6 }}>{b.nextFocus}</p>
          </Card>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding="24px">
            <span className="tiny">Mentioned</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {b.mentioned.map(t => <Badge key={t} tone="purple">{t}</Badge>)}
            </div>
          </Card>
          <Card padding="24px">
            <span className="tiny">Rate this session</span>
            <p className="muted small" style={{ marginTop: 6, marginBottom: 12 }}>How was your time with {mentor.name}?</p>
            <Stars value={session.rated || 0} size={28} interactive onChange={() => {}}/>
            <Button variant="secondary" size="sm" style={{ marginTop: 12 }}>Open full review</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------- Messages ----------
function Messages({ navigate, role = "student" }) {
  const mentor = MENTORS.find(m => m.id === STUDENT.matchedMentor);
  const [msgs, setMsgs] = useState(MESSAGES);
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const flagged = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|@\w+\.\w+/.test(text);
    setMsgs(m => [...m, { id: "n" + Date.now(), from: role === "mentor" ? "mentor" : "student", at: new Date().toISOString(), text }]);
    if (flagged) {
      setTimeout(() => setMsgs(m => [...m, { id: "s" + Date.now(), from: "system", at: new Date().toISOString(), text: "Your message was modified because it contained contact information.", systemKind: "modified" }]), 400);
    }
    setText("");
  };

  // pretend "mentor" is the OTHER side from the viewer
  const meSide = role === "student" ? "student" : "mentor";
  const otherSide = role === "student" ? "mentor" : "student";

  return (
    <div className="page-enter" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Conversation list */}
      <div style={{ width: 280, borderRight: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 15 }}>Messages</h3>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: 14, background: "var(--primary-soft)", borderLeft: "3px solid var(--primary)", display: "flex", gap: 12 }}>
            <Avatar src={role === "student" ? mentor.photo : null} name={role === "student" ? mentor.name : "Riley Park"} size={36} online/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{role === "student" ? mentor.name : "Riley Park"}</span>
                <span className="muted" style={{ fontSize: 11 }}>{fmtRelative(msgs[msgs.length-1].at)}</span>
              </div>
              <div className="muted" style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{msgs[msgs.length-1].text}</div>
            </div>
            <span style={{ width: 7, height: 7, borderRadius: 4, background: "var(--primary)", marginTop: 6 }}/>
          </div>
        </div>
      </div>

      {/* Active conversation */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar src={role === "student" ? mentor.photo : null} name={role === "student" ? mentor.name : "Riley Park"} size={40} online={role === "student"}/>
          <div>
            <div style={{ fontWeight: 600 }}>{role === "student" ? mentor.name : "Riley Park"}</div>
            <div className="muted" style={{ fontSize: 12 }}>{role === "student" ? "Online · usually responds within 4 hours" : "Grade 11 · Albuquerque"}</div>
          </div>
        </div>
        <div className="scroll" style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          {msgs.map((m, i) => {
            if (m.from === "system") {
              return (
                <div key={m.id} style={{ alignSelf: "center", maxWidth: 480, textAlign: "center", padding: "10px 16px", background: "rgba(245,158,11,.10)", color: "#92400E", borderRadius: 10, fontSize: 12.5, border: "1px solid rgba(245,158,11,.25)" }}>
                  <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 6 }}>{I.shield}</span>{m.text}
                </div>
              );
            }
            const isMe = m.from === meSide;
            const showAvatar = !isMe && (i === 0 || msgs[i-1].from !== m.from);
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-end" }}>
                {!isMe && (showAvatar
                  ? <Avatar src={role === "student" ? mentor.photo : null} name={role === "student" ? mentor.name : "Riley Park"} size={28}/>
                  : <span style={{ width: 28, flex: "0 0 28px" }}/>
                )}
                <div style={{
                  maxWidth: 460,
                  padding: "10px 14px",
                  background: isMe ? "var(--primary)" : "var(--surface)",
                  color: isMe ? "white" : "var(--text)",
                  borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  border: isMe ? "none" : "1px solid var(--border)",
                  fontSize: 14, lineHeight: 1.5,
                }}>
                  {m.text}
                  <div style={{ fontSize: 10.5, opacity: 0.7, marginTop: 4, textAlign: "right" }}>{fmtTime(m.at)}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef}/>
        </div>
        <form onSubmit={send} style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 10, background: "var(--surface)" }}>
          <input className="input" placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)}/>
          <Button icon={I.send} type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}

// ---------- Session history ----------
function SessionHistory({ navigate, role = "student" }) {
  return (
    <div className="page-enter scroll" style={{ flex: 1, padding: "var(--pad) 32px", overflowY: "auto" }}>
      <Topbar title="Session history" subtitle={`${SESSIONS.filter(s => s.status === "completed").length} completed · ${SESSIONS.filter(s => s.status === "cancelled").length} cancelled`}/>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {SESSIONS.filter(s => s.status !== "upcoming").map(s => {
          const m = MENTORS.find(x => x.id === s.mentorId);
          const tone = s.status === "completed" ? "success" : s.status === "cancelled" ? "danger" : "warning";
          return (
            <Card key={s.id} padding="20px" hover>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar src={m.photo} name={m.name} size={40}/>
                  <div>
                    <div style={{ fontWeight: 600 }}>{fmtDate(s.startsAt)} · {fmtTime(s.startsAt)}</div>
                    <div className="muted small">with {m.name} · {s.duration} min</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Badge tone={tone}>{s.status}</Badge>
                  {s.rated && <Stars value={s.rated} size={13}/>}
                  {s.breakdown && <a onClick={() => navigate(`${role}/breakdown/${s.id}`)} style={{ fontSize: 13, cursor: "pointer" }}>Breakdown →</a>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Rating modal ----------
function RatingModal({ open, onClose, mentor }) {
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState([]);
  const [text, setText] = useState("");
  const [safety, setSafety] = useState(false);
  const positiveTags = ["helpful", "knowledgeable", "encouraging", "good listener", "well prepared"];
  const negativeTags = ["unprepared", "late", "distracted", "rushed"];
  const tagSet = stars > 3 ? positiveTags : stars > 0 ? negativeTags : [];
  const toggle = (t) => setTags(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);

  return (
    <Modal open={open} onClose={onClose} width={520}>
      <h3 style={{ fontSize: 20, marginBottom: 4 }}>How was your session with {mentor ? mentor.name : "Amara"}?</h3>
      <p className="muted small" style={{ marginBottom: 20 }}>Your honest feedback helps us keep the community safe.</p>
      <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
        <Stars value={stars} size={40} interactive onChange={setStars}/>
      </div>
      {stars > 0 && (
        <>
          {tagSet.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label className="label">{stars > 3 ? "What stood out? (optional)" : "What went wrong? (optional)"}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tagSet.map(t => (
                  <button key={t} onClick={() => toggle(t)} style={{
                    padding: "5px 12px", fontSize: 12.5, borderRadius: 99, fontFamily: "inherit", cursor: "pointer",
                    border: tags.includes(t) ? "1px solid var(--primary)" : "1px solid var(--border-strong)",
                    background: tags.includes(t) ? "var(--primary-light)" : "var(--surface)",
                    color: tags.includes(t) ? "var(--primary)" : "var(--text)",
                  }}>{t}</button>
                ))}
              </div>
            </div>
          )}
          {stars <= 2 && (
            <div style={{ marginBottom: 16 }}>
              <label className="label">Tell us what happened <span style={{ color: "var(--danger)" }}>*</span></label>
              <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)}/>
            </div>
          )}
          <button onClick={() => setSafety(s => !s)} style={{ background: "none", border: 0, color: "var(--text-2)", fontSize: 13, padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <span style={{ color: "var(--danger)" }}>{I.shield}</span> Report a safety concern {safety ? "▲" : "▼"}
          </button>
          {safety && <textarea className="textarea" placeholder="Describe what happened. A human reviews this within 24 hours." style={{ marginTop: 10 }}/>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
            <Button variant="ghost" onClick={onClose}>Skip</Button>
            <Button onClick={onClose}>Submit rating</Button>
          </div>
        </>
      )}
    </Modal>
  );
}

Object.assign(window, { StudentDashboard, StudentMentorProfile, StudentBooking, StudentPreCall, VideoRoom, Breakdown, Messages, SessionHistory, RatingModal });
