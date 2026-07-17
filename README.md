# SchemesCheck

SchemesCheck is an AI-powered platform designed to provide personalized government scheme recommendations to citizens. 

The project is structured into three main layers:
1. **Frontend:** A React Native mobile application built with Expo and Expo Router.
2. **Backend:** A Node.js and Express API with a MongoDB database.
3. **Machine Learning:** An isolated Python layer for experimenting with models for scheme eligibility classification and ranking.

---

## 🏗️ Project Architecture

### 1. Frontend (Mobile App)
- **Framework:** Expo (React Native)
- **Routing:** Expo Router (File-based routing under `app/`)
- **UI & Navigation:** Bottom tabs, modals, and dynamic screens.
- **Features:** 
  - User Authentication (Login / Signup)
  - Profile Onboarding
  - Scheme Recommendations and News Updates
  - Multilingual support for viewing scheme details
  - Speech-to-text input (supported via backend)

### 2. Backend (Node.js/Express API)
Located in the `backend/` directory.
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs
- **Key Services:**
  - `recommendationService.js`: Generates AI-powered personalized scheme recommendations and dynamic news updates based on a user's profile.
  - `translationService.js`: Translates scheme information into different languages (e.g., Kannada, English).
  - Google Cloud Speech-to-Text Integration (`routes/speech.js`) for audio transcription.
- **Routes:**
  - `/api/auth`: User registration and login.
  - `/api/user`: User profile management.
  - `/api/schemes`: Fetch, filter, and recommend schemes.
  - `/api/speech`: Audio transcription endpoint.

### 3. Machine Learning (Isolated Experimentation)
Located in the `ml/` directory.
This module is intended for local training, evaluation, and future scalability. It does not directly affect the running Node.js API.
- **Models:**
  - **Logistic Regression:** Eligibility Classifier (Binary prediction for scheme eligibility).
  - **XGBoost:** Multi-Scheme Ranker (Multi-label model to rank top schemes for a profile).
- **Explainability:** LIME and SHAP are used to provide demo-ready explanations for predictions.
- **Data:** Uses MongoDB or falls back to local JSON seed data.

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js
- MongoDB instance (local or Atlas)
- Python 3 (for ML scripts)
- Expo Go app on your phone (or a simulator)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in the values:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   GROQ_API_KEY=your_groq_api_key
   # GOOGLE_APPLICATION_CREDENTIALS=path/to/google-credentials.json (For Speech-to-Text)
   ```
4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the project root:
   ```bash
   cd ..
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Configuration:
   Configure the app to point to your backend by creating a `.env` in the root:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
   ```
   *(Note: For physical devices, use your computer's local network IP address or an EC2 public IP, not `localhost` or `127.0.0.1`.)*
4. Start the Expo development server:
   ```bash
   npm start
   ```

### Machine Learning Setup (Optional)
1. Navigate to the `ml/` directory:
   ```bash
   cd ml
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install ML dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run ML scripts (from the project root), for example:
   ```bash
   python -m ml.datasets.generate_training_data --n-citizens 600
   python -m ml.training.train_logistic_regression
   ```

---

## 📱 Running the Application
You can run the entire stack using the root `package.json` scripts:
- Start only the frontend: `npm run start`
- Start only the backend: `npm run server`
- Start both concurrently: `npm run dev`

Once the Expo server starts, scan the QR code with the Expo Go app on your mobile device to test the application.
