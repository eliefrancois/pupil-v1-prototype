// public.jsx — landing, pricing, login, apply, redeem.

function LandingPage({ navigate }) {
  return (
    <div className="page-enter scroll" style={{ height: "100vh", overflow: "auto", background: "var(--bg)" }}>
      <PublicNav navigate={navigate}/>

      {/* Hero */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 40px 60px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 64, alignItems: "center" }}>
        <div>
          <Badge tone="purple" size="md">
            <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--primary)", marginRight: 4 }}/>
            For Parents
          </Badge>
          <h1 className="display" style={{ fontSize: 64, lineHeight: 1.02, marginTop: 20, marginBottom: 20, letterSpacing: "-0.035em" }}>
            College guidance<br/>your family<br/><em>can trust.</em>
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-2)", maxWidth: 460, marginBottom: 32, lineHeight: 1.5 }}>
            Pupil matches your student with relatable near-peer college mentors — so they can find schools that truly fit their goals, identity, and vibe (not just rankings).
          </p>
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <Button size="lg" onClick={() => navigate("public/pricing")} iconRight={I.arrowR}>
              Get Early Access
            </Button>
            <Button size="lg" variant="ghost" onClick={() => navigate("public/apply")}>
              Free or Pilot Access
            </Button>
          </div>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", color: "var(--text-2)", fontSize: 13.5 }}>
            <span><strong style={{ color: "var(--text)" }}>560+</strong> Mentors</span>
            <span><strong style={{ color: "var(--text)" }}>450+</strong> Students supported</span>
            <span><strong style={{ color: "var(--text)" }}>105+</strong> Universities represented</span>
          </div>
        </div>

        {/* Hero collage */}
        <div style={{ position: "relative", height: 540 }}>
          <div style={{ position: "absolute", top: 0, right: 30, width: 260, animation: "pg-in .6s .1s both" }}>
            <Card padding="0" style={{ overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
              <img src={MENTORS[0].photo} alt="" style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}/>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{MENTORS[0].name}</div>
                <div className="muted small">{MENTORS[0].university} · {MENTORS[0].major}</div>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Stars value={5} size={12}/><span className="small muted">{MENTORS[0].rating}</span>
                </div>
              </div>
            </Card>
          </div>
          <div style={{ position: "absolute", top: 220, left: 0, width: 250, animation: "pg-in .6s .25s both" }}>
            <Card padding="0" style={{ overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
              <img src={MENTORS[2].photo} alt="" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}/>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{MENTORS[2].name}</div>
                <div className="muted small">{MENTORS[2].university}</div>
              </div>
            </Card>
          </div>
          <div style={{ position: "absolute", bottom: 30, right: 0, width: 240, animation: "pg-in .6s .4s both" }}>
            <Card padding="14px" style={{ background: "var(--primary-light)", borderColor: "transparent" }}>
              <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, marginBottom: 6 }}>SESSION TOMORROW</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Stanford supplement workshop</div>
              <div className="muted small">Wed, 4:30 PM with Amara</div>
              <Button size="sm" style={{ marginTop: 10 }} icon={I.video}>Join session</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: "var(--surface)", padding: "80px 40px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <span className="tiny">How it works</span>
          <h2 className="display" style={{ fontSize: 40, marginTop: 8, marginBottom: 48, maxWidth: 640, letterSpacing: "-0.025em" }}>
            A simple, human-centered process <em>designed to find the best mentor</em> for your student.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { n: "01", t: "Tell us about your student", d: "Share goals, interests, and preferences so we can find the right fit." },
              { n: "02", t: "Get matched with a mentor", d: "We pair your student with a relatable near-peer college mentor within 24–48 hours." },
              { n: "03", t: "Start building a plan", d: "Your student works 1:1 with their mentor to explore schools, build their list, and prepare." },
            ].map(s => (
              <Card key={s.n} padding="28px" style={{ height: "100%" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--primary)", letterSpacing: ".1em", marginBottom: 16 }}>{s.n}</div>
                <h3 style={{ marginBottom: 10 }}>{s.t}</h3>
                <p className="muted" style={{ fontSize: 14 }}>{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our approach */}
      <section style={{ padding: "80px 40px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <span className="tiny">Our approach</span>
          <h2 className="display" style={{ fontSize: 40, marginTop: 8, marginBottom: 40, maxWidth: 640, letterSpacing: "-0.025em" }}>
            The best guidance comes from people who've <em>recently walked the same path.</em>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {[
              { t: "Near-peer mentors", d: "Current college students and recent grads who understand today's admissions landscape and can relate to your student's experience." },
              { t: "Identity-aware matching", d: "We match based on goals, identity, and vibe \u2014 not just test scores. Your student gets a mentor who truly gets them." },
              { t: "Personalized guidance", d: "Up to 24 one-on-one sessions per year. Real conversations about fit, applications, essays, and the stuff that really matters." },
              { t: "Matched within 24\u201348 hours", d: "No waiting weeks. We move fast to match your student with the right mentor, so they can start building their plan immediately." },
            ].map(item => (
              <Card key={item.t} padding="28px">
                <h3 style={{ marginBottom: 8 }}>{item.t}</h3>
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55 }}>{item.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mentors */}
      <section style={{ background: "var(--surface)", padding: "80px 40px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <span className="tiny">The mentors</span>
              <h2 className="display" style={{ fontSize: 40, marginTop: 8, letterSpacing: "-0.025em" }}>Mentors from <em>105+ universities.</em></h2>
            </div>
            <Button variant="secondary" iconRight={I.arrowR}>Browse all mentors</Button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {MENTORS.slice(0, 4).map(m => (
              <Card key={m.id} padding="0" hover style={{ overflow: "hidden" }}>
                <div style={{ height: 200, background: "var(--surface-2)", overflow: "hidden" }}>
                  <img src={m.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</div>
                  <div className="muted small">{m.university}</div>
                  <div className="muted small" style={{ marginBottom: 10 }}>{m.major}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Stars value={Math.round(m.rating)} size={12}/>
                    <span className="small muted">{m.rating} · {m.sessions} sessions</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: "var(--surface)", padding: "80px 40px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <span className="tiny">What students say</span>
          <h2 className="display" style={{ fontSize: 40, marginTop: 8, marginBottom: 40, letterSpacing: "-0.025em" }}>In their <em>own words.</em></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              "Pupil isn\u2019t just mentorship, it\u2019s the forging of a path that carries benefit beyond just college applications. The best way to survive a minefield is to know where the mines are, and mentors at Pupil have been in the spot of nearly every teen at least once in their lives.",
              "What really stuck with me was how much I could relate to my mentor. We both come from similar backgrounds: first-generation, low-income, Latino students who were unfamiliar with the college application process. Hearing his story made me feel understood and motivated.",
              "My favorite part about using Pupil is how easy it is to connect with mentors. I can talk casually with my mentor and get real, honest feedback from students at universities nationwide. It\u2019s made a huge difference in my high school to college journey.",
            ].map((quote, i) => (
              <Card key={i} padding="28px" style={{ height: "100%" }}>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--text-2)", fontStyle: "italic", marginBottom: 16 }}>&ldquo;{quote}&rdquo;</p>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Pupil Mentee</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section style={{ padding: "80px 40px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Card padding="40px" style={{ textAlign: "center", borderColor: "var(--primary)", boxShadow: "var(--shadow-lg)" }}>
            <Badge tone="purple">Early access</Badge>
            <h2 className="display" style={{ fontSize: 56, marginTop: 16, marginBottom: 4, letterSpacing: "-0.03em" }}>$900<span style={{ fontSize: 22, color: "var(--text-2)", fontFamily: "var(--font-ui)", fontWeight: 400 }}>/year</span></h2>
            <p className="muted">Up to 24 sessions · 90-day refund guarantee</p>
            <Button size="lg" style={{ marginTop: 24 }} onClick={() => navigate("public/pricing")} iconRight={I.arrowR}>See what's included</Button>
            <div style={{ marginTop: 20, fontSize: 13 }}>
              <a onClick={() => navigate("public/apply")} style={{ cursor: "pointer" }}>Need free access?</a>
              <span className="muted" style={{ margin: "0 12px" }}>·</span>
              <a onClick={() => navigate("public/redeem")} style={{ cursor: "pointer" }}>Have a code?</a>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "0 40px 80px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <span className="tiny">Frequently asked questions</span>
          <h2 className="display" style={{ fontSize: 36, marginTop: 8, marginBottom: 24, letterSpacing: "-0.025em" }}>Everything you need to know.</h2>
          {[
            ["What is Pupil?", "Pupil is a platform that helps parents and high school students make confident college and career decisions. We address the gaps created by limited personal networks, overextended school counseling capacity, and overwhelming, one-size-fits-all advice. Through Pupil, students connect with vetted near-peer college mentors who share relevant interests and lived experiences, meeting virtually 2\u20134 times per month for practical, experience-based guidance."],
            ["How does matching work?", "Students set preferences across key dimensions (schools, majors, careers, interests, and identities). Pupil generates a curated set of mentor recommendations. Students can review mentor profiles, request matches, and skip mentors who are less relevant. Either party can end the match at any time."],
            ["How does Pupil protect students and mentors?", "Safety and compliance are embedded into the product. All sessions are recorded and transcribed. Messaging is filtered for contact info. In-platform reporting with structured escalation workflows. A human reviews any flagged interaction within 24 hours. Pupil does not facilitate in-person meetings unless hosted by a verified university partner."],
            ["Who pays for Pupil?", "Pupil is built with equity at its core. Free access is available for students who qualify through Free/Reduced-Price Lunch, SNAP, or Common App fee waivers (with eligibility verification). Families who do not qualify can subscribe annually."],
            ["Can my student's school pay for this?", "Yes. We work with schools and community-based organizations through bulk access codes."],
            ["Does grade level, GPA, or test scores matter?", "No. Pupil supports students from 9th through 12th grade and is not gated by grades or test scores. Our focus is on guidance, exploration, and fit."],
          ].map(([q, a], i) => <FAQItem key={i} q={q} a={a} defaultOpen={i === 0}/>)}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "40px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
          <BrandMark size={22}/>
          <div style={{ display: "flex", gap: 24, fontSize: 13 }} className="muted">
            <span>© 2026 Pupil. All rights reserved.</span>
            <a>Privacy</a><a>Terms</a><a>Parental Consent</a><a>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ q, a, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "none", border: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
        fontSize: 17, fontWeight: 500, color: "var(--text)",
      }}>
        {q}
        <span style={{ transition: "transform .2s", transform: open ? "rotate(45deg)" : "none", color: "var(--text-2)" }}>{I.plus}</span>
      </button>
      <div style={{
        maxHeight: open ? 200 : 0, overflow: "hidden", transition: "max-height .3s, padding .3s",
        paddingBottom: open ? 20 : 0, color: "var(--text-2)", fontSize: 15, lineHeight: 1.55,
      }}>{a}</div>
    </div>
  );
}

// ---------- Pricing ----------
function PricingPage({ navigate }) {
  const features = [
    "Mentor matching",
    "Up to 24 1:1 sessions/year",
    "In-app messaging, monitored for safety",
    "Session recordings + transcripts",
    "Pre-call icebreakers tailored to your student",
    "Post-call breakdowns with action items",
    "AI test prep (partner integration)",
    "90-day refund guarantee",
  ];
  return (
    <div className="page-enter scroll" style={{ height: "100vh", overflow: "auto" }}>
      <PublicNav navigate={navigate} route="public/pricing"/>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span className="tiny">Early Access Pricing</span>
          <h1 className="display" style={{ fontSize: 52, marginTop: 8, marginBottom: 12, letterSpacing: "-0.03em" }}>Invest in your student's <em>future.</em></h1>
          <p className="muted" style={{ fontSize: 17 }}>Personalized college guidance from mentors who've been there.</p>
        </div>
        <Card padding="40px" style={{ boxShadow: "var(--shadow-lg)", borderColor: "var(--primary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <Badge tone="purple">Early Access</Badge>
              <h2 className="display" style={{ fontSize: 56, marginTop: 12, marginBottom: 0, letterSpacing: "-0.03em" }}>$900<span style={{ fontSize: 20, color: "var(--text-2)", fontFamily: "var(--font-ui)", fontWeight: 400 }}>/year</span></h2>
              <p className="muted small">Billed annually · $75/month equivalent</p>
            </div>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
            {features.map(f => (
              <li key={f} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 11, background: "var(--primary-light)",
                  color: "var(--primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto",
                }}>{I.check}</span>
                <span style={{ fontSize: 15 }}>{f}</span>
              </li>
            ))}
          </ul>
          <Button size="lg" full style={{ marginTop: 32 }} onClick={() => navigate("public/login")}>Subscribe now</Button>
          <p className="muted small" style={{ textAlign: "center", marginTop: 12 }}>Secure checkout via Stripe · Cancel anytime</p>
        </Card>
        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card padding="20px" hover onClick={() => navigate("public/apply")} style={{ cursor: "pointer" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Need free access?</div>
            <div className="muted small">If your student qualifies for SNAP, FRPL, or a Common App fee waiver, Pupil is free.</div>
          </Card>
          <Card padding="20px" hover onClick={() => navigate("public/redeem")} style={{ cursor: "pointer" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>School or organization?</div>
            <div className="muted small">Redeem an access code from your school, CBO, or scholarship program.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------- Login ----------
function LoginPage({ navigate }) {
  const [email, setEmail] = useState("riley@example.org");
  const [password, setPassword] = useState("••••••••");
  return (
    <div className="page-enter" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", height: "100vh", overflow: "auto" }}>
      <PublicNav navigate={navigate}/>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <Card padding="36px" style={{ width: "100%", maxWidth: 440 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <BrandMark size={26}/>
            <h2 className="display" style={{ fontSize: 28, marginTop: 14, letterSpacing: "-0.02em" }}>Welcome back</h2>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); navigate("student/dashboard"); }}>
            <label className="label">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 14 }}/>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <a style={{ fontSize: 13, cursor: "pointer" }}>Forgot password?</a>
            </div>
            <Button size="lg" full type="submit" style={{ marginTop: 20 }}>Log in</Button>
          </form>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0", color: "var(--text-3)" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
            <span className="small">or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
          </div>
          <Button variant="secondary" full size="lg" icon={I.google}>Sign in with Google</Button>
          <p className="muted small" style={{ textAlign: "center", marginTop: 20 }}>
            Don't have an account? <a onClick={() => navigate("public/pricing")} style={{ cursor: "pointer" }}>Get started</a>
          </p>
        </Card>
      </div>
    </div>
  );
}

// ---------- Apply (free access) ----------
function ApplyPage({ navigate }) {
  const [submitted, setSubmitted] = useState(false);
  const [eligibility, setEligibility] = useState("FRPL");
  return (
    <div className="page-enter scroll" style={{ height: "100vh", overflow: "auto" }}>
      <PublicNav navigate={navigate}/>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "60px 40px" }}>
        <div style={{ marginBottom: 32 }}>
          <a onClick={() => navigate("public/pricing")} style={{ fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>{I.arrowL} Back to pricing</a>
          <h1 className="display" style={{ fontSize: 44, marginTop: 16, letterSpacing: "-0.025em" }}>Access Pupil for free</h1>
          <p className="muted" style={{ fontSize: 16, marginTop: 8, maxWidth: 600 }}>Pupil is committed to equity. If you qualify, mentoring is completely free.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
          <Card padding="32px">
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: "rgba(16,185,129,.15)", color: "var(--success)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✓</div>
                <h3>Application received</h3>
                <p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>We've emailed your counselor. You'll hear back within 3 business days.</p>
                <Button onClick={() => navigate("public/landing")}>Back to home</Button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><label className="label">Student name</label><input className="input" defaultValue="Riley Park"/></div>
                  <div><label className="label">Parent / guardian name</label><input className="input"/></div>
                  <div><label className="label">Email</label><input className="input" type="email" defaultValue="riley@example.org"/></div>
                  <div>
                    <label className="label">Grade</label>
                    <select className="select" defaultValue="11">
                      <option>9</option><option>10</option><option>11</option><option>12</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}><label className="label">School name</label><input className="input"/></div>
                </div>
                <div style={{ marginTop: 20 }}>
                  <label className="label">Eligibility type</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {["SNAP", "FRPL", "Common App Waiver"].map(opt => (
                      <button key={opt} type="button" onClick={() => setEligibility(opt)} style={{
                        padding: "12px 16px", borderRadius: 8, fontFamily: "inherit", fontSize: 13.5, fontWeight: 500,
                        border: `1px solid ${eligibility === opt ? "var(--primary)" : "var(--border)"}`,
                        background: eligibility === opt ? "var(--primary-light)" : "var(--surface)",
                        color: eligibility === opt ? "var(--primary)" : "var(--text)",
                        cursor: "pointer", textAlign: "left",
                      }}>{opt}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 20 }}>
                  <label className="label">School counselor email <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input className="input" type="email" placeholder="counselor@yourschool.edu"/>
                  <p className="muted small" style={{ marginTop: 6 }}>Your counselor will receive an email asking them to confirm your eligibility.</p>
                </div>
                <Button size="lg" full type="submit" style={{ marginTop: 28 }}>Submit application</Button>
              </form>
            )}
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card padding="24px">
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>What qualifies</h3>
              <ul style={{ paddingLeft: 18, margin: 0, color: "var(--text-2)", fontSize: 14, lineHeight: 1.7 }}>
                <li>Family receives SNAP / EBT benefits</li>
                <li>Student qualifies for free or reduced-price lunch</li>
                <li>Student has a Common App fee waiver</li>
              </ul>
            </Card>
            <Card padding="24px">
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>What happens next</h3>
              <ol style={{ paddingLeft: 18, margin: 0, color: "var(--text-2)", fontSize: 14, lineHeight: 1.7 }}>
                <li>Your counselor verifies your eligibility</li>
                <li>You hear from us within 3 business days</li>
                <li>If approved, you skip checkout and go straight to onboarding</li>
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Redeem ----------
function RedeemPage({ navigate }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState("idle");
  const submit = (e) => {
    e.preventDefault();
    setState("loading");
    setTimeout(() => {
      if (code.toUpperCase() === "EAGLES-2026-A1" || code.length > 4) {
        setState("success");
        setTimeout(() => navigate("onboarding/profile"), 1200);
      } else {
        setState("error");
      }
    }, 700);
  };
  return (
    <div className="page-enter" style={{ height: "100vh", overflow: "auto", display: "flex", flexDirection: "column" }}>
      <PublicNav navigate={navigate}/>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <Card padding="40px" style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--primary-light)", color: "var(--primary)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.key}</div>
            <h2 className="display" style={{ fontSize: 28, letterSpacing: "-0.02em" }}>Enter your access code</h2>
            <p className="muted small" style={{ marginTop: 6 }}>Provided by your school, CBO, or scholarship program.</p>
          </div>
          <form onSubmit={submit}>
            <input
              className="input mono"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setState("idle"); }}
              placeholder="EAGLES-2026-A1"
              style={{
                textAlign: "center", fontSize: 18, height: 56, letterSpacing: "0.06em",
                borderColor: state === "error" ? "var(--danger)" : state === "success" ? "var(--success)" : "var(--border)",
              }}
            />
            {state === "error" && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8, textAlign: "center" }}>Invalid or expired code</p>}
            {state === "success" && <p style={{ color: "var(--success)", fontSize: 13, marginTop: 8, textAlign: "center" }}>Redeemed! Setting up your account…</p>}
            <Button full size="lg" type="submit" style={{ marginTop: 20 }} disabled={state === "loading" || state === "success"}>
              {state === "loading" ? "Checking…" : state === "success" ? "Redirecting…" : "Redeem"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { LandingPage, PricingPage, LoginPage, ApplyPage, RedeemPage });
