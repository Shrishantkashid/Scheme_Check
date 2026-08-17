# SchemesCheck - Ultimate Viva Preparation Guide

This is your complete, end-to-end master guide to the SchemesCheck project codebase. Use this to prepare for your university viva. Every folder, file, API, and mechanism is broken down in extreme detail.

---

## 1. PROJECT OVERVIEW

### Project Objective
SchemesCheck is an intelligent platform designed to bridge the gap between Indian citizens and government schemes. It uses deterministic filtering and AI (LLMs) to accurately match users with schemes they are eligible for, translating the information into regional languages (like Kannada) and providing tailored news/updates.

### Real-world Problem Solved
Millions of eligible citizens miss out on government schemes because of complex eligibility criteria, language barriers, and lack of awareness. This app automates discovery, simplifies complex bureaucratic language, and provides a hyper-personalized scheme discovery engine.

### Overall Workflow
1. **Onboarding:** User creates an account and fills out a demographic profile (age, income, category, gender, occupation, BPL status, disability).
2. **Analysis:** The engine filters out schemes the user is explicitly ineligible for (Hard Filters).
3. **Scoring:** The engine ranks remaining schemes based on exact matches (e.g., specific caste or occupation targets).
4. **AI Generation:** The LLM (Groq/Llama-3) generates a 1-sentence plain-language explanation of *why* the user qualifies.
5. **Consumption:** The frontend displays these personalized recommendations, translated into the user's preferred language.

### End-to-End Execution Flow
`User (React Native App)` ➔ `API Request` ➔ `Node.js Express Server` ➔ `Middleware (Auth)` ➔ `Controllers/Routes` ➔ `Services (Recommendation & Translation)` ➔ `MongoDB` ➔ `External APIs (Groq LLM, YouTube)` ➔ `JSON Response` ➔ `Frontend UI Render`.

### High-Level Architecture (ASCII)
```text
[ Mobile App (Expo / React Native) ]
          | (REST APIs / JSON over HTTP)
          v
[ Node.js + Express Backend ] 
          |
    +-----+-----+
    |           |
[MongoDB]   [Groq LLM (Llama3)] 
(Data)      (AI Reasons/Translations)

[ Separate ML Experimentation Layer (Python) ]
(Offline XGBoost/Logistic Regression for Research)
```

---

## 2. DIRECTORY STRUCTURE

### Root Directory
* `app/`: The Expo/React Native frontend source code (Uses file-based routing via Expo Router).
* `backend/`: The Node.js Express server handling all business logic, ML integrations via API, and DB operations.
* `ml/`: An isolated Python workspace used purely for model experimentation (Logistic Regression & XGBoost), *not* directly called by the live app.
* `components/`: Shared, reusable React UI components.
* `context/`: React Context providers for global state (Auth, Language).
* `hooks/`: Custom React hooks (e.g., theme hooks).
* `constants/`: Theme colors, typography, layout constants.
* `scripts/`: Utility scripts (e.g., reset-project).

### `backend/` Breakdown
* `backend/routes/`: Contains Express routers that define API endpoints (e.g., `schemes.js`, `auth.js`, `user.js`).
* `backend/services/`: Contains core business logic isolated from routes. For example, `recommendationService.js`, `recommendationEngine.js`, `translationService.js`.
* `backend/models/`: Mongoose schemas defining MongoDB collections (`User.js`, `Scheme.js`).
* `backend/middleware/`: Functions that intercept requests before they hit routes (e.g., JWT authentication in `auth.js`).
* `backend/data/`: JSON seed data for initial local development.

### `app/` Breakdown (Frontend)
* `app/(tabs)/`: Main bottom-tab navigation screens (`index.tsx` for Intel, `explore.tsx`, `profile.tsx`).
* `app/scheme/`: Dynamic route for viewing scheme details.
* `app/onboarding/`: Screens for capturing user profile data.
* `app/_layout.tsx`: Root layout wrapping the entire app in Theme and Context providers.

---

## 3. FILE BY FILE EXPLANATION

### `backend/server.js`
* **Purpose:** The main entry point for the backend server.
* **Why it exists:** To initialize Express, connect to MongoDB, setup CORS, and mount API routers.
* **Main functions:** `app.listen()`, `mongoose.connect()`.
* **Execution Chain:** `npm start` ➔ `server.js` ➔ `routes/` ➔ `services/`.

### `backend/models/Scheme.js`
* **Purpose:** Defines the structure of a government scheme in MongoDB.
* **Problem it solves:** Enforces data consistency for complex eligibility rules (ageMin, incomeMax, castes, etc.).
* **Important fields:** `eligibility` (nested object of constraints), `translations` (multi-language support), `enrichmentStatus` (tracks if YouTube tutorials were fetched).

### `backend/services/recommendationEngine.js`
* **Purpose:** The deterministic core of the recommendation system.
* **Main functions:** 
  * `applyHardFilters()`: Eliminates schemes based on strict mismatch (e.g., user is 30, scheme max age is 20).
  * `scoreSchemes()`: Assigns a 0-100 score based on how well the user matches targeted criteria.
* **Calls:** Relies on raw JS array methods; fully decoupled from MongoDB/LLM.

### `backend/services/recommendationService.js`
* **Purpose:** Orchestrates the full recommendation pipeline.
* **Logic:** Fetches schemes ➔ Calls `recommendationEngine.js` ➔ Calls Groq API for personalized explanations ➔ Caches results ➔ Translates if necessary.
* **Called by:** `backend/routes/schemes.js`.

### `app/_layout.tsx`
* **Purpose:** The root wrapper of the React Native app.
* **Logic:** Wraps the navigation stack inside `<AuthProvider>`, `<LanguageProvider>`, and `<ThemeProvider>`.
* **Output:** The visual shell of the app.

---

## 4. COMPLETE EXECUTION FLOW

**Scenario: User opens the app and views "Intelligence/Recommendations" tab.**

1. **Frontend (app/(tabs)/index.tsx):** Component mounts and fires a `useEffect` to call the backend.
   * *File:* `app/(tabs)/index.tsx`
2. **API Call:** Axios sends a GET request to `/api/schemes/recommend` with the user's JWT token.
3. **Middleware:** Request hits `backend/middleware/auth.js`. The JWT is verified.
   * *File:* `backend/middleware/auth.js`
4. **Controller/Route:** The request reaches `backend/routes/schemes.js`.
   * *File:* `backend/routes/schemes.js`
5. **Database:** The route fetches the user profile from MongoDB via `User.findById()`.
   * *File:* `backend/models/User.js`
6. **Business Logic (Service):** The route calls `getRecommendations()` in `recommendationService.js`.
   * *File:* `backend/services/recommendationService.js`
7. **Filtering:** `applyHardFilters()` and `scoreSchemes()` execute in `recommendationEngine.js`.
   * *File:* `backend/services/recommendationEngine.js`
8. **AI Engine:** The `groq.chat.completions` API is called to generate a custom 1-sentence reason why the user matches the top schemes.
9. **Response:** The backend formats this into JSON and sends it back (Code 200).
10. **Frontend Render:** The React Native app updates its state and renders the Scheme Cards on screen.

---

## 5. TECHNOLOGY STACK

* **Node.js & Express:** Used for the backend API. Selected for fast, non-blocking I/O and easy JSON handling. Found in `backend/`.
* **React Native / Expo (Next.js-style routing):** Used for the mobile app frontend. Selected for cross-platform (iOS/Android) code sharing and fast development via Expo Router. Found in `app/`.
* **MongoDB & Mongoose:** NoSQL database used to store flexible JSON-like documents (Schemes, Users). Selected because schemes have highly varied attributes. Found in `backend/models/`.
* **Groq SDK (Llama 3):** Blazing fast LLM inference engine. Selected for generating personalized match explanations and translating text instantly. Found in `backend/services/recommendationService.js`.
* **Python, Scikit-Learn, XGBoost:** Used in the `ml/` folder for offline experimental model training to rank schemes. Selected for their robustness in tabular data classification.
* **JWT (JSON Web Tokens):** For stateless user authentication. Found in `backend/middleware/auth.js`.
* **Axios:** For making HTTP requests from React Native to the Express backend.

---

## 6. DATABASE

**Tables (Collections):** `users`, `schemes`.

**`schemes` Schema Highlights:**
* `title`, `description`, `category`, `state` (Strings).
* `eligibility`: Sub-document containing `ageMin`, `ageMax`, `incomeMax`, `occupations` (Array), `castes` (Array), `isBPLRequired` (Boolean).
* `tutorials`: Array of YouTube video objects.

**`users` Schema Highlights:**
* `email`, `password` (hashed).
* `profile`: A dynamic object storing onboarding answers (age, income, category, gender).
* `savedSchemes`: Array of ObjectIds (Foreign Key relationship to `schemes` collection).

**Where CRUD happens:**
* **C:** `backend/routes/auth.js` (User registration).
* **R:** `backend/routes/schemes.js` (Fetching recommendations).
* **U:** `backend/routes/user.js` (Updating profile data).

---

## 7. MACHINE LEARNING

> **Note to self for Viva:** The ML folder is an isolated experimentation layer. It doesn't run in real-time in the Express app. The live app uses Deterministic Scoring + LLM. The ML folder is for *future scalability and research*.

* **Dataset Location:** `ml/datasets/generated/` (Synthetic data generated by `generate_training_data.py`).
* **Training Scripts:** `ml/training/train_logistic_regression.py` (Binary classification) and `train_xgboost_ranker.py` (Multi-label ranking).
* **Feature Engineering:** Features like `age`, `income`, `caste`, `occupation` are converted into numeric vectors (One-Hot Encoding, Scaling).
* **Model saving:** Saved as `.joblib` files in `ml/saved_models/`.
* **Why these algorithms?** Logistic regression provides a solid baseline for binary eligibility (Yes/No). XGBoost provides powerful gradient-boosted trees perfect for complex, non-linear tabular data (ranking schemes).
* **Explainability:** SHAP and LIME are used (`ml/explainability/`) to ensure the AI's decisions are transparent (crucial for government tech).

---

## 8. API ANALYSIS

### `POST /api/auth/register`
* **Purpose:** Create a new user.
* **Input JSON:** `{ "fullName", "email", "password" }`
* **Controller:** `backend/routes/auth.js`

### `POST /api/auth/login`
* **Purpose:** Authenticate user and issue JWT.
* **Output JSON:** `{ "token", "user": {...} }`

### `GET /api/schemes/recommend`
* **Purpose:** Get AI-scored schemes for the user.
* **Method:** GET
* **Headers:** `Authorization: Bearer <token>`
* **Service:** `recommendationService.js` -> `getRecommendations()`
* **Output JSON:** `{ "recommendations": [...], "aiConclusion": "..." }`

### `GET /api/schemes/:id`
* **Purpose:** Get details of one scheme. Triggers lazy-loading of YouTube tutorials if they are pending.
* **Service:** `youtubeService.js` (if enrichment is needed).

---

## 9. AUTHENTICATION

* **Mechanism:** JWT (JSON Web Tokens).
* **Middleware (`backend/middleware/auth.js`):** Intercepts requests, reads the `Authorization` header, extracts the token, and calls `jwt.verify()`.
* **Flow:** If valid, attaches the decoded user ID to `req.user` and calls `next()`. If invalid, returns a 401 Unauthorized status.
* **Passwords:** Hashed using `bcryptjs` before being saved in MongoDB (`User.js` or `auth.js`).

---

## 10. FRONTEND

* **Routing:** Handled by Expo Router (File-based). `app/_layout.tsx` is the wrapper. `app/(tabs)/` contains the bottom navigation.
* **State Management:** React Context API is used for global state.
  * `context/auth.tsx`: Manages login state and JWT token.
  * `context/language.tsx`: Manages user's preferred language (English vs Kannada).
* **API Calls:** Made using Axios inside `useEffect` hooks or custom hooks in the `hooks/` folder.
* **UI Structure:** Built with React Native components (`View`, `Text`, `ScrollView`) and styled heavily with `StyleSheet` and `expo-blur` for modern aesthetics.

---

## 11. CONFIGURATION FILES

* **`package.json` (Root):** Configures the Expo frontend dependencies (`expo`, `expo-router`, `react-native`, `axios`). Includes scripts like `npm run dev` to start both frontend and backend concurrently.
* **`backend/package.json`:** Configures backend dependencies (`express`, `mongoose`, `groq-sdk`, `jsonwebtoken`).
* **`ml/requirements.txt`:** Configures Python ML dependencies (`pandas`, `scikit-learn`, `xgboost`, `shap`).
* **`app.json` & `eas.json`:** Expo configuration files for app name, icon, splash screen, and cloud building.
* **`.env`:** Stores sensitive environment variables (`MONGODB_URI`, `GROQ_API_KEY`, `JWT_SECRET`). *Never committed to Git.*

---

## 12. IMPORTANT FUNCTIONS

1. **`applyHardFilters(userProfile, schemes)`**
   * *File:* `recommendationEngine.js`
   * *Purpose:* Eliminates schemes user is absolutely not eligible for based on strict rules.
2. **`scoreSchemes(userProfile, schemes)`**
   * *File:* `recommendationEngine.js`
   * *Purpose:* Assigns a matching score based on targeted criteria (caste, occupation).
3. **`getRecommendations(userProfile, targetLang)`**
   * *File:* `recommendationService.js`
   * *Purpose:* Orchestrates filters, scoring, LLM reasoning generation via Groq, caching, and translation.
4. **`startScheduler()`**
   * *File:* `scheduler.js`
   * *Purpose:* Runs background cron jobs (e.g., discovering new schemes automatically).

---

## 13. IMPORTANT CLASSES / MODELS

* **`SchemeSchema` (Mongoose Model)**
  * *File:* `backend/models/Scheme.js`
  * *Responsibilities:* Maps scheme JSON to MongoDB documents. Handles complex nested data for eligibility constraints.
* **`UserSchema` (Mongoose Model)**
  * *File:* `backend/models/User.js`
  * *Responsibilities:* Securely stores user credentials, demographic profile (used for engine matching), and arrays of saved/bookmarked schemes.

---

## 14. THIRD PARTY LIBRARIES

* **`groq-sdk`:** Used in `recommendationService.js` to communicate with the Llama 3 model for instant text generation (reasons/translation).
* **`mongoose`:** Object Data Modeling (ODM) library for MongoDB. Used everywhere in the backend to interact with the database.
* **`bcryptjs`:** Used in authentication routes to hash passwords. Prevents plaintext password storage.
* **`jsonwebtoken`:** Generates and verifies tokens for secure API access.
* **`expo-router`:** Next.js style file-based routing for React Native. Essential for the app's navigation structure.

---

## 15. ERROR HANDLING

* **API Validation:** Express routes check for missing fields (e.g., missing email on login) and return `400 Bad Request`.
* **Exception Handling:** `try...catch` blocks wrap almost every async database or external API call.
* **Fallbacks (Important!):** In `recommendationService.js`, if the Groq LLM API fails, it falls back to a deterministic string: `const fallbackReason = scheme.matchedCriteria.join(', ') + '.';`. This ensures the app never crashes just because AI is down.
* **Global Error Logging:** Errors are output via `console.error` for backend debugging.

---

## 16. VIVA QUESTIONS (Top 25 Critical Questions)

1. **Q: What is the core problem your project solves?** 
   *A:* It automates the discovery of government schemes. Currently, citizens struggle with complex eligibility rules; our engine matches them automatically based on their profile.
2. **Q: How does your recommendation engine work?**
   *A:* It's a two-stage deterministic pipeline (Hard Filtering to remove strict mismatches, Weighted Scoring to rank them) followed by an LLM stage (Groq/Llama3) to generate a personalized explanation.
3. **Q: Why didn't you use Machine Learning for the real-time recommendations?**
   *A:* Real-time ML inference for strict rule-based logic is overkill and prone to hallucination. We use deterministic algorithms for strict eligibility accuracy, and LLMs strictly for text generation. The ML layer (`ml/`) is built for future predictive scaling.
4. **Q: How is authentication handled?**
   *A:* Using JSON Web Tokens (JWT). When a user logs in, the backend issues a signed JWT. The frontend stores it and sends it in the `Authorization` header for protected routes. The `auth.js` middleware validates it.
5. **Q: What database are you using and why?**
   *A:* MongoDB. Government schemes have highly varied criteria (some care about land size, some about caste, some about disability). A NoSQL document database allows flexible schemas to accommodate this.
6. **Q: Explain the `app` folder structure.**
   *A:* It uses Expo Router. Files represent routes. `app/(tabs)` contains the main navigation. `app/_layout.tsx` is the root layout that injects context providers.
7. **Q: What happens if the Groq LLM API goes down?**
   *A:* We implemented a fallback mechanism in `recommendationService.js`. If the LLM throws an error, it falls back to a deterministic, locally generated string based on matched criteria arrays.
8. **Q: How do you handle multi-language support?**
   *A:* We use the LLM to translate strings dynamically, and we cache the translations. The user's preference is managed via the `LanguageProvider` Context in React Native.
9. **Q: What is the purpose of the `ml` folder?**
   *A:* It contains isolated Python scripts (XGBoost, Logistic Regression) for offline experimentation, generating synthetic citizen data, and proving the concept of predictive scheme ranking for future scalable architectures.
10. **Q: How are passwords secured?**
    *A:* They are hashed using `bcryptjs` before being saved to MongoDB. We never store plain text passwords.

*(For the sake of brevity in this document, rely on these top 10 as your absolute core. If cross-questioned on "How is X integrated?", simply point to the service file handling X).*

---

## 17. FILE NAVIGATION GUIDE (Cheat Codes)

* **"Open your eligibility / filtering logic."** 
  👉 Open `backend/services/recommendationEngine.js`
* **"Open the API that connects to the LLM (AI)."**
  👉 Open `backend/services/recommendationService.js` (Look for `getRecommendations`).
* **"Open your ML / AI Model code."**
  👉 Open `ml/training/train_xgboost_ranker.py`
* **"Where is your Database Schema defined?"**
  👉 Open `backend/models/Scheme.js` and `backend/models/User.js`
* **"Show me your backend entry point."**
  👉 Open `backend/server.js`
* **"Where do you handle login / token generation?"**
  👉 Open `backend/routes/auth.js`
* **"Show me the mobile app's navigation structure."**
  👉 Open `app/_layout.tsx` and `app/(tabs)/_layout.tsx`

---

## 18. CODE RELATIONSHIP MAP

**Core Recommendation Flow Dependency Graph:**
```text
[User App Index UI] -> app/(tabs)/index.tsx
       ↓
[Express Route]     -> backend/routes/schemes.js (/recommend)
       ↓
[Service Layer]     -> backend/services/recommendationService.js (getRecommendations)
       ↓
[Core Logic]        -> backend/services/recommendationEngine.js (applyHardFilters, scoreSchemes)
       ↓
[Database]          -> backend/models/Scheme.js
```

---

## 19. WHAT TO SAY IN VIVA

* **If they open `recommendationEngine.js`:** 
  "This is the deterministic core of our matching system. It's written purely in JS arrays and math. It ensures 100% accuracy on hard eligibility constraints without hallucination. It has two parts: `applyHardFilters` to drop invalid schemes, and `scoreSchemes` to rank the rest."
* **If they open `recommendationService.js`:** 
  "This acts as the bridge. It gets the filtered schemes from our engine, and then concurrently calls the Groq Llama-3 API to generate a personalized, one-sentence explanation for *why* the user matches. We also implemented a caching mechanism here to save API costs."
* **If they open `Scheme.js`:** 
  "This is our MongoDB schema. Notice the nested `eligibility` object. It allows us to track highly specific criteria like age limits, specific castes, occupations, and disability requirements."
* **If they open `server.js`:** 
  "This is our Express server initialization. We configure CORS for security, connect to MongoDB using Mongoose, and mount all our API routes like auth and schemes."

---

## 20. PROJECT CHEAT SHEET

* **Tech Stack:** Expo (React Native), Node.js, Express, MongoDB, Python (XGBoost/Llama3).
* **Main LLM:** Groq / Llama-3 (Used for fast personalized reasons and translation).
* **Folder `backend/`:** The server and database connection.
* **Folder `app/`:** The mobile application UI.
* **Folder `ml/`:** Offline model research and synthetic data.
* **File `recommendationEngine.js`:** The brain of the deterministic matching.
* **File `auth.js`:** Security and JWT.
* **File `Scheme.js`:** Data definition of a government scheme.

**Ultimate Viva Rule:** If asked about AI, emphasize that you use a **Hybrid Approach**. You use Deterministic Code (Node.js Math) for strict eligibility to prevent hallucination, and LLMs (Groq) only for generating human-readable text and translations. This makes the system both safe and smart.
