# Scheme Check — Implementation Plan
*Derived from "Scheme Check: Multimodal Welfare Discovery With Explainable AI"*

This plan sequences work against the paper's own **Table III (Implementation Status)**, so that as each phase closes, you update the paper's status column truthfully instead of the paper drifting ahead of the code.

Paper's own status snapshot (starting point):

| Module | Paper's stated status |
|---|---|
| Manual onboarding | Built |
| Mobile UI & navigation | Built |
| Basic scheme browsing | Built |
| Voice onboarding | Code complete, integration pending |
| Aadhaar onboarding | Mock implementation |
| Autonomous discovery engine | Designed, pilot in progress |
| Explainable recommendation scoring | Designed, formalization in progress |
| Tutorial discovery | Designed |
| Offline-first sync | Designed |
| SMS/IVR access | Designed only |

The plan below closes these gaps roughly in order of (a) dependency and (b) how central the module is to the paper's actual claimed contribution — the discovery engine and the explainable recommendation engine are the two things the paper says *are* the research contribution, so those get priority over polish.

---

## Phase 0 — Stabilize what's "Built" (1–3 days)
Before adding new modules, the paper's "Built" claims need to hold up under demo conditions, since a reviewer or evaluator will poke at these first.

- Remove the "TEST BACKEND" debug button from signup
- Fix the blank loading screen bug
- Fix the unresolved `scheme/[id]` route string in the header
- Replace the tagline copy to match the actual audience
- Fix dark-theme contrast on occupation wizard / BPL screens

*Output: a demo-safe build of everything currently marked "Built."*

---

## Phase 1 — Close out Voice Onboarding integration (3–7 days)
Paper says: *"Code complete, integration pending."* This is your fastest path to moving a whole row from partial → Built.

1. Wire the Kannada keyword mapper + `VoiceOnboardingWizard` into the actual onboarding navigation flow (this is the Antigravity integration work already scoped).
2. Connect the backend Google Cloud Speech-to-Text route end-to-end; confirm Kannada speech-context boosting is actually biasing toward occupation/scheme vocabulary as claimed.
3. Add a visible mode indicator in the UI (Manual / Voice / Aadhaar) so users are never misled about which mode they're in — the paper explicitly claims this separation exists.
4. Manual test pass: run all onboarding attribute fields (occupation, age, gender, income bracket, state/district, category, disability, BPL) through voice at least once each.

*Output: Table III row → "Built."*

---

## Phase 2 — Autonomous AI Scheme Discovery Engine (2–4 weeks)
**This is the paper's core research contribution** (Section IV-B, Algorithms 1 & 2) — it needs to exist and produce numbers before you can write real results in Section VII/VIII.

Build as an independent Python service, decoupled from the serving plane, writing only into MongoDB:

1. **Source registry** — a config list of official portals (start with 1–2, matching the pilot scope in Table II: "1–2 source portals, ~50 schemes"). Each entry: URL, content-type hint (HTML listing / HTML detail / PDF), crawl frequency, last-crawled timestamp.
2. **Crawler** — `Scrapy` (already referenced in your bibliography) or `requests`+`BeautifulSoup` for a first pass; respect robots.txt and rate limits on government sites.
3. **Parser** — HTML: strip nav/boilerplate, isolate main content. PDF: text extraction with a layout-aware fallback (e.g. `pdfplumber`) for tabular eligibility criteria.
4. **LLM extraction** — Groq API call with a fixed prompt constraining output to your strict JSON schema (name, department, eligibility criteria as discrete attribute-tagged conditions, benefits, documents, deadline, source URL). Pin down the schema in code (e.g. a JSON Schema or Pydantic model) so "validation" in step 6 is enforceable, not vibes.
5. **Duplicate detection** — implement Algorithm 2 exactly: `score = 0.7·nameSim + 0.3·deptSim`, token-set similarity for names, threshold τ (start τ≈0.85, tune empirically). Log every merge decision so you can later compute precision/recall against known duplicates (Table II).
6. **Validation** — required fields present, deadline parseable, ≥1 eligibility condition. Log every validation failure (you need a "schema-validation failure rate" metric).
7. **Write + versioning** — insert or merge into MongoDB with a version/last-verified timestamp.
8. **Scheduler** — start with `node-cron` or Python `schedule` running locally/on Render; you don't need a managed cron job yet.

*Output: Table III row → "Pilot complete" with real precision/recall numbers on ~50 schemes, plus weekly update success rate over a 4-week window (Table II).*

---

## Phase 3 — Explainable Recommendation Engine (1–3 weeks)
Depends on Phase 2 producing real, schema-conformant scheme records to score against.

1. **Hard eligibility filter** — implement first, independent of scoring. Any criterion the user's profile explicitly fails → excluded. This is the safety-critical part: the paper's whole trust claim ("never lets a generated explanation claim a match the rules didn't verify") depends on this being airtight.
2. **Weighted scoring** — implement Eq. (1): `S(u,s) = Σ wᵢ·mᵢ(u,s)`. Define `mᵢ` per attribute (occupation match, income proximity to threshold, state match, category match, gender, disability, age-band centrality). Start with equal or hand-picked weights; these are what Section VII's "20–30 synthetic user profiles" evaluation will let you tune.
3. **Deterministic match summary** — generate a criterion-by-criterion match/fail summary *before* calling the LLM.
4. **LLM explanation** — feed the deterministic summary as grounding context to Groq, generate the plain-language explanation in the user's selected language. Never let the LLM see raw criteria without the summary — that's what prevents hallucinated matches.
5. **Sort** — descending by score, filter already applied.

*Output: Table III row → "Formalized," plus the agreement-rate metric (engine output vs. manually adjudicated eligibility on synthetic profiles).*

---

## Phase 4 — Tutorial Discovery Module (3–5 days)
Lower complexity, can run in parallel with Phase 3.

1. YouTube Data API v3 query per scheme: scheme name + "how to apply" / "eligibility", in English and Kannada.
2. Channel-trust allowlist (official government + established news channels) as a hard filter *before* ranking by view-count/recency — the paper explicitly says trust filtering matters more than relevance here.
3. Attach top 1–2 videos to the scheme record.
4. Manual audit of a 30-scheme sample for the "trust-filter precision" metric.

*Output: Table III row → "Built," metric ready for Section VII.*

---

## Phase 5 — Offline-First Sync (1–2 weeks)
Can start once the scheme schema is stable (after Phase 2).

1. Local cache: `expo-sqlite` for scheme records/profile, `AsyncStorage` for small key-value state.
2. Incremental diff sync on launch/reconnect — request only records updated since last successful sync, not a full re-download.
3. Offline action queue (e.g. bookmarking) with replay-on-reconnect, last-write-wins conflict policy.
4. Simulated intermittent-connectivity test harness (airplane-mode toggling in a test script or manual QA pass) to produce the "sync success rate / staleness after reconnect" metric.

*Output: Table III row → "Built."*

---

## Phase 6 — SMS/IVR (design artifact only — do not build to production)
The paper is explicit that this is scoped honestly as designed-not-deployed due to per-message/per-minute telephony costs. Keep it that way unless you get funding.

- Produce: a short architecture doc (SMS gateway → keyword/category parser → same recommendation engine → templated SMS response) and a DTMF menu sketch for IVR.
- Optional: a small non-production demo using Twilio's free trial credits, enough for a screenshot/video in your defense, not a live deployment.

*Output: Table III row stays "Designed only" — this is fine and matches the paper's stated scope.*

---

## Phase 7 — Government ID Guidance Module (1–2 days)
Low effort, not yet mentioned in Table III — add it in.

- Static, versioned content screens for Aadhaar, PAN, Voter ID, Ration Card, ABHA, Ayushman Card: purpose, eligibility, how to apply.

---

## Phase 8 — Evaluation Pass (Section VII, run last)
Once Phases 2–5 are live, run the actual measurement plan and drop real numbers into the paper:

| Module | Metric | How to get it |
|---|---|---|
| Discovery engine | Extraction precision/recall | Manually verify ~50 schemes from 1–2 sources against extracted records |
| Discovery engine | Update success rate, validation failure rate | Read your own logs over a 4-week crawl window |
| Duplicate detection | Precision/recall at threshold τ | Hand-label a cross-source subset with known duplicates |
| Recommendation engine | Agreement with manual adjudication | 20–30 synthetic profiles, compare engine output to your own manual eligibility call |
| Tutorial discovery | Trust-filter precision | Manually rate 30 schemes' attached videos |
| Offline sync | Sync success rate, staleness | Simulated intermittent-connectivity test |

*Output: Section VII/VIII of the paper get filled in with real numbers instead of a plan.*

---

## Suggested sequencing (if working solo/small team)

```
Week 1        Phase 0 (stabilize) + start Phase 1 (voice integration)
Week 2        Finish Phase 1, start Phase 2 (discovery engine)
Weeks 3–5     Phase 2 (discovery engine) — this is the long pole
Week 5–6      Phase 3 (recommendation engine), overlapping tail of Phase 2
Week 6        Phase 4 (tutorial discovery) + Phase 7 (ID guidance) in parallel
Weeks 7–8     Phase 5 (offline sync)
Week 8        Phase 6 (SMS/IVR design doc only)
Week 9        Phase 8 (evaluation pass, fill in paper numbers)
```

Adjust freely — Phase 2 (discovery engine) is the one phase that shouldn't be compressed, since it's the module the paper stakes its research contribution on, and its output quality (extraction precision/recall) is the number most likely to get scrutinized.

## Notes on keeping the paper honest as you go
- Update Table III's status column after each phase closes, not all at once at the end.
- Don't backfill Table II's numbers with estimates — if a metric isn't measured yet, leave the cell blank rather than invented.
- References [9] and [10] are still placeholders — worth resolving before submission with an actual e-governance / LLM-extraction citation search.
