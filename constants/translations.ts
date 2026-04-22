export const translations = {
  en: {
    // Navigation
    home: "Home",
    explore: "Explore",
    news: "News",
    profile: "Profile",
    
    // Home Screen
    intelligence_center: "Intelligence Center",
    hello: "Hello",
    global_search: "Global Search",
    search_schemes: "Search Schemes...",
    search_news: "Search News...",
    precision_recommendations: "Precision Recommendations",
    tailored_text: "Tailored based on your recent onboarding data",
    new_in: "New in",
    national_updates: "National Updates & Protests",
    no_recent_updates: "No recent news updates available in your region.",
    
    // Explore Screen
    explore_schemes: "Explore Schemes",
    real_schemes_found: "real schemes found",
    search_placeholder: "Search by name, tags, or benefit...",
    all: "All",
    central: "Central",
    karnataka: "Karnataka",
    
    // Profile Screen
    saved_schemes: "Saved Schemes",
    linked_accounts: "Linked Accounts",
    app_settings: "Application Settings",
    retake_onboarding: "Retake Onboarding Steps",
    change_password: "Forgot / Change Password",
    rate_app: "Rate the App",
    sign_out: "Sign Out",
    app_language: "App Language",
    audio_assistance: "Audio Assistance",
    audio_desc: "Tapping text reads it aloud",
    version: "Version 1.2.4 (Premium Tier)",
    
    // Action Buttons
    apply_now: "Apply Now",
    save: "Save",
    saved: "Saved",
    cancel: "Cancel",
    save_changes: "Save Changes",
    edit_profile: "Edit Profile"
  },
  kn: {
    // Navigation
    home: "ಮನೆ",
    explore: "ಅನ್ವೇಷಿಸಿ",
    news: "ಸುದ್ದಿ",
    profile: "ಪ್ರೊಫೈಲ್",
    
    // Home Screen
    intelligence_center: "ಬುದ್ಧಿಮತ್ತೆ ಕೇಂದ್ರ",
    hello: "ನಮಸ್ಕಾರ",
    global_search: "ಜಾಗತಿಕ ಹುಡುಕಾಟ",
    search_schemes: "ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ...",
    search_news: "ಸುದ್ದಿಗಳನ್ನು ಹುಡುಕಿ...",
    precision_recommendations: "ನಿಖರ ಶಿಫಾರಸುಗಳು",
    tailored_text: "ನಿಮ್ಮ ಇತ್ತೀಚಿನ ದಾಖಲೆಗಳ ಆಧಾರದ ಮೇಲೆ",
    new_in: "ಹೊಸ ಯೋಜನೆಗಳು",
    national_updates: "ರಾಷ್ಟ್ರೀಯ ಅಪ್ಡೇಟ್ಗಳು",
    no_recent_updates: "ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಯಾವುದೇ ಇತ್ತೀಚಿನ ಸುದ್ದಿಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    
    // Explore Screen
    explore_schemes: "ಯೋಜನೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
    real_schemes_found: "ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿವೆ",
    search_placeholder: "ಹೆಸರು ಅಥವಾ ಪ್ರಯೋಜನದ ಮೂಲಕ ಹುಡುಕಿ...",
    all: "ಎಲ್ಲಾ",
    central: "ಕೇಂದ್ರ",
    karnataka: "ಕರ್ನಾಟಕ",
    
    // Profile Screen
    saved_schemes: "ಉಳಿಸಿದ ಯೋಜನೆಗಳು",
    linked_accounts: "ಲಿಂಕ್ ಮಾಡಿದ ಖಾತೆಗಳು",
    app_settings: "ಅಪ್ಲಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್ಗಳು",
    retake_onboarding: "ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಹಂತಗಳನ್ನು ಮರುಹೊಂದಿಸಿ",
    change_password: "ಪಾಸ್ವರ್ಡ್ ಮರೆತಿದ್ದೀರಾ / ಬದಲಾಯಿಸಿ",
    rate_app: "ಅಪ್ಲಿಕೇಶನ್ ರೇಟ್ ಮಾಡಿ",
    sign_out: "ಸೈನ್ ಔಟ್",
    app_language: "ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ",
    audio_assistance: "ಆಡಿಯೋ ಸಹಾಯ",
    audio_desc: "ಪಠ್ಯವನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿದರೆ ಅದನ್ನು ಓದುತ್ತದೆ",
    version: "ಆವೃತ್ತಿ 1.2.4 (ಪ್ರೀಮಿಯಂ ಟೈರ್)",
    
    // Action Buttons
    apply_now: "ಈಗಲೇ ಅನ್ವಯಿಸಿ",
    save: "ಉಳಿಸಿ",
    saved: "ಉಳಿಸಲಾಗಿದೆ",
    cancel: "ರದ್ದುಮಾಡಿ",
    save_changes: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
    edit_profile: "ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ"
  }
};

export type Language = 'en' | 'kn';
export type TranslationKey = keyof typeof translations.en;
