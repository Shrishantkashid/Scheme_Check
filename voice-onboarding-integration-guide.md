# Scheme Check — Voice Onboarding: Integration Guide for Antigravity

## Context for the agent (put this in `AGENTS.md` at repo root, or reference it)

```
PROJECT: Scheme Check — React Native (Expo) + Node.js/Express + MongoDB
GOAL: The voice onboarding subsystem is CODE-COMPLETE but NOT INTEGRATED end-to-end.
      All pieces exist individually:
        - frontend: VoiceOnboardingWizard component (app/onboarding/)
        - frontend: Kannada keyword mapper utility (fuzzy match)
        - backend: speech.js route (Google Cloud Speech-to-Text, Kannada context boosting)
      They have NOT been verified to work together as one flow on a real/emulated device.

DO NOT rewrite the wizard, the mapper, or the speech.js route from scratch.
Your job is AUDIT -> WIRE -> TEST, not redesign.

HARD RULES:
1. Manual onboarding must keep working unmodified. Voice onboarding is an
   alternate entry path into the SAME profile data structure — never a
   parallel/divergent one.
2. Voice and Aadhaar onboarding modes must remain visually and functionally
   distinct from Manual mode in the UI. Never blur mock/real/voice status
   for the user.
3. If speech-to-text or keyword matching fails or is low-confidence, the
   flow must gracefully fall back to letting the user type/select the
   answer manually for that question — never silently guess or force a
   retry loop with no escape.
4. Every network call (speech.js, EXPO_PUBLIC_API_URL) must have a visible
   loading state and a visible error state. No blank screens on failure
   (this is a known bug class in this app — see UX audit).
5. Do not touch unrelated screens (signup, explore, profile) unless a
   mission explicitly says to.
6. After each mission, run/build and report pass/fail before moving to
   the next mission. Do not chain missions on an unverified prior step.
```

---

## Mission Prompts (run sequentially, one per Antigravity task)

### Mission 1 — Audit current wiring
```
Read app/onboarding/VoiceOnboardingWizard.tsx (or equivalent path),
the Kannada keyword mapper utility, and backend/routes/speech.js.

Produce a short report (do not write code yet) answering:
1. Does the wizard actually call expo-av to record audio, or is recording
   stubbed/mocked?
2. Does the wizard send the recorded audio to the speech.js backend route,
   and does it point at EXPO_PUBLIC_API_URL (Render) rather than localhost?
3. Does the wizard call expo-speech to read each question aloud in Kannada,
   or is TTS wired but never triggered?
4. Does the transcription result actually get passed into the keyword
   mapper, and does the matched value get written into onboarding state?
5. Is there a "confirm" step where the user sees the matched value and can
   accept/reject/retype before it's saved?
6. Is voice onboarding reachable from the UI at all (is there a mode
   switcher on the onboarding entry screen), or does the app only ever
   launch Manual mode?

List each of these as WORKING / STUBBED / MISSING with the file and line
reference. This report is the input to the next missions — do not guess,
read the actual files.
```

### Mission 2 — Wire the entry point
```
Based on the Mission 1 report: ensure the onboarding entry screen offers
a clear, visually distinct choice between Manual, Voice, and Aadhaar modes.
If this selector doesn't exist, build a minimal one (three buttons/cards,
each clearly labeled — do not add marketing copy, this is a functional
screen). Voice mode should be labeled as still-in-progress if any part of
Mission 1's audit came back STUBBED or MISSING, so we never present a
broken flow as finished to a test user.

Wire the "Voice" choice to actually navigate to VoiceOnboardingWizard.
```

### Mission 3 — Wire recording -> backend -> transcription
```
Using the Mission 1 audit as ground truth, fix only the STUBBED/MISSING
links in this chain:
  expo-av records audio -> audio is sent as multipart/form-data (or
  base64, whichever speech.js already expects) to
  {EXPO_PUBLIC_API_URL}/speech/transcribe -> response is parsed for the
  transcribed text.

Add a visible recording indicator (not just console logs) and a visible
"transcribing..." loading state. Add a visible error state (toast or
inline message) if the network call fails, with a "type it instead"
fallback button that lets the user answer that question manually and
continue the wizard.

Test against the deployed Render backend, not a local server.
```

### Mission 4 — Wire transcription -> keyword mapper -> confirm step
```
Ensure the transcribed text is passed into the fuzzy Kannada keyword
mapper, and that the matched value is displayed to the user in a confirm
step (e.g., "We heard: FARMER — is this correct?") with three options:
Confirm / Try again / Type manually.

If the mapper returns no confident match (below its fuzzy-match
threshold), skip straight to "Type manually" for that question rather
than showing a low-confidence guess as if it were certain.
```

### Mission 5 — Wire confirmed answers into the shared profile object
```
Ensure that once all questions are answered via voice (with manual
fallbacks as needed), the resulting profile object is IDENTICAL in shape
to the one produced by Manual onboarding, and is submitted through the
same backend profile-creation endpoint. Do not create a separate
voice-profile schema or endpoint.

Confirm this by walking through both flows and diffing the payload sent
to the backend.
```

### Mission 6 — End-to-end pass and report
```
Run the full Voice onboarding flow on an emulator or Expo Go from a
clean install: launch app -> choose Voice mode -> answer every question
by speaking -> confirm each -> reach the same post-onboarding screen
Manual mode reaches.

Report:
1. Any question where recognition consistently fails and what fallback
   behavior triggered.
2. Any point where a loading or error state was missing.
3. Whether the final saved profile matches what Manual mode would have
   produced for the same answers.

Do not mark this mission complete unless the full flow was actually run,
not just reasoned about from code.
```

---

## Notes for you (Shrishant)

- Missions 3 and 6 are where real device/emulator testing matters most —
  Antigravity can wire the code, but Kannada speech recognition accuracy
  is something you'll want to sanity-check yourself with a few real voice
  samples before calling this "done."
- If Mission 1's audit comes back mostly STUBBED, that's useful information,
  not a setback — it tells you the paper's "code complete, integration
  pending" line in Table III is still accurate today, and you should keep
  describing it that way until Mission 6 actually passes.
- Once this is fully wired, this is also your cleanest opportunity to fix
  the "add trust signals" and "dark theme contrast on occupation wizard"
  items from the earlier UX audit, since you'll already be inside those
  screens.
