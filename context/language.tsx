import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Speech from 'expo-speech';
import { translations, Language, TranslationKey } from '@/constants/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isAudioEnabled: boolean;
  setIsAudioEnabled: (enabled: boolean) => void;
  t: (key: TranslationKey, fallback?: string) => string;
  speak: (text: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'user_language';
const AUDIO_ENABLED_KEY = 'audio_assistance_enabled';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isAudioEnabled, setIsAudioEnabledState] = useState(false);

  useEffect(() => {
    // Load persisted settings
    const loadSettings = async () => {
      try {
        const savedLang = await SecureStore.getItemAsync(LANGUAGE_KEY);
        if (savedLang === 'en' || savedLang === 'kn') {
          setLanguageState(savedLang);
        }
        
        const savedAudio = await SecureStore.getItemAsync(AUDIO_ENABLED_KEY);
        if (savedAudio !== null) {
          setIsAudioEnabledState(savedAudio === 'true');
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    loadSettings();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
  };

  const setIsAudioEnabled = async (enabled: boolean) => {
    setIsAudioEnabledState(enabled);
    await SecureStore.setItemAsync(AUDIO_ENABLED_KEY, enabled.toString());
    if (!enabled) {
      Speech.stop();
    }
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    return translations[language][key] || fallback || key;
  };

  const speak = (text: string) => {
    if (!isAudioEnabled) return;
    
    Speech.stop();
    Speech.speak(text, {
      language: language === 'kn' ? 'kn-IN' : 'en-IN',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      isAudioEnabled, 
      setIsAudioEnabled, 
      t, 
      speak 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
