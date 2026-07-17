// utils/kannadaKeywordMapper.ts
// Maps transcribed Kannada/English speech to onboarding option values
import { Question, Option } from '@/constants/questions';

export interface OnboardingOption {
  value: string;
  labelKn: string;
  labelEn: string;
  keywords: string[]; // Kannada + transliterated + English keywords
}

export interface OnboardingQuestionKeywords {
  id: string;
  options: OnboardingOption[];
}

// ─────────────────────────────────────────────
// KEYWORD MAPPINGS FOR ALL OPTIONS
// ─────────────────────────────────────────────
export const QUESTION_KEYWORD_MAP: Record<string, OnboardingQuestionKeywords> = {
  gender: {
    id: "gender",
    options: [
      {
        value: "male",
        labelKn: "ಗಂಡು",
        labelEn: "Male",
        keywords: ["ಗಂಡು", "ಪುರುಷ", "male", "man", "gandu", "purusha", "boy"],
      },
      {
        value: "female",
        labelKn: "ಹೆಣ್ಣು",
        labelEn: "Female",
        keywords: ["ಹೆಣ್ಣು", "ಮಹಿಳೆ", "female", "woman", "hennu", "mahile", "girl"],
      },
      {
        value: "other",
        labelKn: "ಇತರರು",
        labelEn: "Other",
        keywords: ["ಇತರ", "ಇತರರು", "other", "itara", "ಬೇರೆ"],
      },
    ],
  },
  category: {
    id: "category",
    options: [
      {
        value: "general",
        labelKn: "ಸಾಮಾನ್ಯ",
        labelEn: "General",
        keywords: ["ಸಾಮಾನ್ಯ", "general", "samanya"],
      },
      {
        value: "obc",
        labelKn: "ಒಬಿಸಿ (ಇತರ ಹಿಂದುಳಿದ ವರ್ಗ)",
        labelEn: "OBC",
        keywords: ["ಒಬಿಸಿ", "ಹಿಂದುಳಿದ", "obc", "other backward", "hindulida", "ವರ್ಗ"],
      },
      {
        value: "sc",
        labelKn: "ಪರಿಶಿಷ್ಟ ಜಾತಿ (SC)",
        labelEn: "SC",
        keywords: ["ಪರಿಶಿಷ್ಟ ಜಾತಿ", "ಎಸ್ ಸಿ", "sc", "scheduled caste", "parishishta jaati"],
      },
      {
        value: "st",
        labelKn: "ಪರಿಶಿಷ್ಟ ಪಂಗಡ (ST)",
        labelEn: "ST",
        keywords: ["ಪರಿಶಿಷ್ಟ ಪಂಗಡ", "ಎಸ್ ಟಿ", "st", "scheduled tribe", "parishishta pangada"],
      },
    ],
  },
  occupation: {
    id: "occupation",
    options: [
      {
        value: "farmer",
        labelKn: "ರೈತ",
        labelEn: "Farmer",
        keywords: ["ರೈತ", "ಕೃಷಿ", "farmer", "farming", "agriculture", "raita", "krushi", "ಒಕ್ಕಲಿಗ"],
      },
      {
        value: "student",
        labelKn: "ವಿದ್ಯಾರ್ಥಿ",
        labelEn: "Student",
        keywords: ["ವಿದ್ಯಾರ್ಥಿ", "student", "vidyarthi", "school", "college", "ಓದುತ್ತಿದ್ದೇನೆ"],
      },
      {
        value: "daily_wage",
        labelKn: "ದಿನ ಕೂಲಿ ಕಾರ್ಮಿಕ",
        labelEn: "Daily Wage Worker",
        keywords: ["ದಿನ", "ಕೂಲಿ", "ಕಾರ್ಮಿಕ", "daily wage", "worker", "labour", "kooli", "ಕೆಲಸಗಾರ"],
      },
      {
        value: "self_employed",
        labelKn: "ಸ್ವಯಂ ಉದ್ಯೋಗ",
        labelEn: "Self Employed",
        keywords: ["ಸ್ವಯಂ", "ಉದ್ಯೋಗ", "ವ್ಯಾಪಾರ", "self employed", "business", "swayam", "udyoga", "vyapara"],
      },
      {
        value: "unemployed",
        labelKn: "ನಿರುದ್ಯೋಗಿ",
        labelEn: "Unemployed",
        keywords: ["ನಿರುದ್ಯೋಗಿ", "unemployed", "no job", "nirudyogi", "ಕೆಲಸ ಇಲ್ಲ"],
      },
    ],
  },
  education_level: {
    id: "education_level",
    options: [
      {
        value: "school",
        labelKn: "ಶಾಲಾ ಶಿಕ್ಷಣ",
        labelEn: "Schooling",
        keywords: ["ಶಾಲೆ", "school", "shale", "schooling", "ಪ್ರಾಥಮಿಕ", "ಪ್ರೌಢ"],
      },
      {
        value: "ug",
        labelKn: "ಪದವಿ (Undergraduate)",
        labelEn: "Undergraduate",
        keywords: ["ಪದವಿ", "ಡಿಗ್ರಿ", "undergraduate", "degree", "ug", "padavi", "college"],
      },
      {
        value: "pg",
        labelKn: "ಸ್ನಾತಕೋತ್ತರ (Postgraduate)",
        labelEn: "Postgraduate",
        keywords: ["ಸ್ನಾತಕೋತ್ತರ", "ಮಾಸ್ಟರ್ಸ್", "postgraduate", "masters", "pg", "snatakottara"],
      },
    ],
  },
  location: {
    id: "location",
    options: [
      {
        value: "rural",
        labelKn: "ಗ್ರಾಮೀಣ (ಹಳ್ಳಿ)",
        labelEn: "Rural (Village)",
        keywords: ["ಗ್ರಾಮೀಣ", "ಹಳ್ಳಿ", "ಗ್ರಾಮ", "rural", "village", "halli", "grama"],
      },
      {
        value: "urban",
        labelKn: "ನಗರ (ಪೇಟೆ)",
        labelEn: "Urban (City)",
        keywords: ["ನಗರ", "ಪೇಟೆ", "ಪಟ್ಟಣ", "urban", "city", "town", "nagara", "pete", "pattana"],
      },
    ],
  },
  disability: {
    id: "disability",
    options: [
      {
        value: "yes",
        labelKn: "ಹೌದು",
        labelEn: "Yes",
        keywords: ["ಹೌದು", "yes", "hauda", "ಇದೆ", "ide", "ಹಾಂ", "haan"],
      },
      {
        value: "no",
        labelKn: "ಇಲ್ಲ",
        labelEn: "No",
        keywords: ["ಇಲ್ಲ", "no", "illa", "ಇಲ್ಲ", "ಅಲ್ಲ", "ಬೇಡ"],
      },
    ],
  },
  bpl_card: {
    id: "bpl_card",
    options: [
      {
        value: "yes",
        labelKn: "ಹೌದು",
        labelEn: "Yes",
        keywords: ["ಹೌದು", "yes", "hauda", "ಇದೆ", "ide", "ಬಿಪಿಎಲ್ ಇದೆ", "bpl ide"],
      },
      {
        value: "no",
        labelKn: "ಇಲ್ಲ",
        labelEn: "No",
        keywords: ["ಇಲ್ಲ", "no", "illa", "ಅಲ್ಲ"],
      },
    ],
  },
};

// ─────────────────────────────────────────────
// CORE MATCHER
// ─────────────────────────────────────────────

/**
 * Given transcribed text (Kannada or English) and a question ID,
 * returns the best matching option value or null if no match.
 */
export function matchTranscriptToOption(
  transcript: string,
  questionId: string
): string | null {
  if (!transcript || transcript.trim().length === 0) return null;

  const mapping = QUESTION_KEYWORD_MAP[questionId];
  if (!mapping) return null;

  const normalized = transcript.toLowerCase().trim();

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const option of mapping.options) {
    let score = 0;
    for (const keyword of option.keywords) {
      const kw = keyword.toLowerCase();
      if (normalized === kw) {
        score += 10; // exact match
      } else if (normalized.includes(kw) || kw.includes(normalized)) {
        // give score proportional to keyword length to favor specific matches
        score += kw.length; 
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = option.value;
    }
  }

  // Only return a match if we have meaningful confidence
  return bestScore > 0 ? bestMatch : null;
}

/**
 * Extracts a numeric value from a transcript (e.g., for age, land size or income)
 */
export function extractNumberFromTranscript(transcript: string): number | null {
  // Common Kannada number words mapping (can be expanded)
  const kannadaNumbers: Record<string, number> = {
    "ಸೊನ್ನೆ": 0,
    "ಒಂದು": 1, "ಎರಡು": 2, "ಮೂರು": 3, "ನಾಲ್ಕು": 4, "ಐದು": 5,
    "ಆರು": 6, "ಏಳು": 7, "ಎಂಟು": 8, "ಒಂಬತ್ತು": 9, "ಹತ್ತು": 10,
    "ಹನ್ನೊಂದು": 11, "ಹನ್ನೆರಡು": 12, "ಹದಿಮೂರು": 13, "ಹದಿನಾಲ್ಕು": 14, "ಹದಿನೈದು": 15,
    "ಹದಿನಾರು": 16, "ಹದಿನೇಳು": 17, "ಹದಿನೆಂಟು": 18, "ಹತ್ತೊಂಬತ್ತು": 19,
    "ಇಪ್ಪತ್ತು": 20, "ಮೂವತ್ತು": 30, "ನಲವತ್ತು": 40, "ಐವತ್ತು": 50,
    "ಅರವತ್ತು": 60, "ಎಪ್ಪತ್ತು": 70, "ಎಂಬತ್ತು": 80, "ತೊಂಬತ್ತು": 90, "ನೂರು": 100,
    "ಸಾವಿರ": 1000, "ಲಕ್ಷ": 100000,
    // Add common variations
    "ಒಂದ": 1, "ಎರಡ": 2, "ಮೂರ": 3, "ನಾಲ್ಕ": 4, "ಐದ": 5
  };

  const normalized = transcript.toLowerCase();

  for (const [word, num] of Object.entries(kannadaNumbers)) {
    // Basic extraction logic: if word is in transcript, use it (Note: Doesn't handle combinations like "ಇಪ್ಪತ್ತೈದು" (25) perfectly yet, but gets the root word or digits).
    if (normalized.includes(word)) return num;
  }

  const digits = transcript.match(/[\d\.]+/); // Handle decimals for land size e.g., 1.5
  return digits ? parseFloat(digits[0]) : null;
}
