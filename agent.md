# Scheme Check — Agent Instructions

## Project Summary
Expo React Native + Node.js/Express app for Karnataka government scheme eligibility.
Target users: Farmers, students, daily wage workers. Many have low digital literacy.
Backend deployed on AWS EC2. Frontend via Expo EAS.

## Tech Stack
- Frontend: React Native (Expo), TypeScript, expo-speech, expo-av
- Backend: Node.js, Express, MongoDB, Groq API, Google Cloud Speech-to-Text
- Auth: Email/password + Google + Apple sign-in

## Project Structure
- /components      → React Native UI components
- /utils           → Helper functions and mappers
- /backend/routes  → Express API routes
- /constants       → Config values (API URLs etc.)
- /app             → Expo Router screens

## Coding Rules
- All new components must be TypeScript (.tsx)
- Kannada strings must always be paired with English fallback
- Never hardcode API keys — always use process.env / Constants.expoConfig.extra
- Backend routes must handle both AADHAAR_USE_MOCK=true and false cases
- Remove any dev-only buttons (TEST BACKEND) before agent commits changes

## Current Task Context
Integrating three new files from an external source:
1. utils/kannadaKeywordMapper.ts
2. components/VoiceOnboardingWizard.tsx  
3. backend/routes/speech.js
4. backend/routes/aadhaar.js