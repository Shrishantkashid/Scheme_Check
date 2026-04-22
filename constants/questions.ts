export type QuestionType = 'choice' | 'text' | 'number' | 'multi-choice';

export interface Option {
  label: string;
  value: string;
  next?: string; // ID of the next question
  preFill?: Record<string, any>; // Data to pre-fill if this option is chosen
}

export interface Question {
  id: string;
  text: string;
  kannadaText: string;
  type: QuestionType;
  options?: Option[];
  next?: string; // Default next question if no branch
  isFinal?: boolean;
}

export const ONBOARDING_QUESTIONS: Record<string, Question> = {
  gender: {
    id: 'gender',
    text: 'What is your gender?',
    kannadaText: 'ನಿಮ್ಮ ಲಿಂಗ ಯಾವುದು?',
    type: 'choice',
    options: [
      { label: 'Male', value: 'male', next: 'age' },
      { label: 'Female', value: 'female', next: 'age' },
      { label: 'Other', value: 'other', next: 'age' },
    ],
  },
  age: {
    id: 'age',
    text: 'How old are you?',
    kannadaText: 'ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?',
    type: 'number',
    next: 'category',
  },
  category: {
    id: 'category',
    text: 'Which category do you belong to?',
    kannadaText: 'ನೀವು ಯಾವ ವರ್ಗಕ್ಕೆ ಸೇರಿದವರು?',
    type: 'choice',
    options: [
      { label: 'General', value: 'general', next: 'occupation' },
      { label: 'OBC', value: 'obc', next: 'occupation' },
      { label: 'SC', value: 'sc', next: 'occupation' },
      { label: 'ST', value: 'st', next: 'occupation' },
    ],
  },
  occupation: {
    id: 'occupation',
    text: 'What is your primary occupation?',
    kannadaText: 'ನಿಮ್ಮ ಮುಖ್ಯ ಉದ್ಯೋಗ ಯಾವುದು?',
    type: 'choice',
    options: [
      { label: 'Farmer', value: 'farmer', next: 'land_size' },
      { label: 'Student', value: 'student', next: 'education_level' },
      { label: 'Daily Wage Worker', value: 'daily_wage', next: 'income' },
      { label: 'Self Employed', value: 'self_employed', next: 'income' },
      { label: 'Unemployed', value: 'unemployed', next: 'income' },
    ],
  },
  land_size: {
    id: 'land_size',
    text: 'How much agricultural land do you own (in acres)?',
    kannadaText: 'ನಿಮ್ಮ ಬಳಿ ಎಷ್ಟು ಎಕರೆ ಕೃಷಿ ಭೂಮಿ ಇದೆ?',
    type: 'number',
    next: 'income',
  },
  education_level: {
    id: 'education_level',
    text: 'What is your current level of education?',
    kannadaText: 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಶಿಕ್ಷಣದ ಹಂತ ಯಾವುದು?',
    type: 'choice',
    options: [
      { label: 'Schooling', value: 'school', next: 'income' },
      { label: 'Undergraduate', value: 'ug', next: 'income' },
      { label: 'Postgraduate', value: 'pg', next: 'income' },
    ],
  },
  income: {
    id: 'income',
    text: 'What is your annual family income?',
    kannadaText: 'ನಿಮ್ಮ ವಾರ್ಷಿಕ ಕುಟುಂಬದ ಆದಾಯ ಎಷ್ಟು?',
    type: 'number',
    next: 'location',
  },
  location: {
    id: 'location',
    text: 'Where do you live?',
    kannadaText: 'ನೀವು ಎಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?',
    type: 'choice',
    options: [
      { label: 'Rural (Village)', value: 'rural', next: 'disability' },
      { label: 'Urban (City)', value: 'urban', next: 'disability' },
    ],
  },
  disability: {
    id: 'disability',
    text: 'Do you have any physical disability?',
    kannadaText: 'ನಿಮಗೆ ಯಾವುದೇ ದೈಹಿಕ ಅಂಗವೈಕಲ್ಯ ಇದೆಯೇ?',
    type: 'choice',
    options: [
      { label: 'Yes', value: 'yes', next: 'bpl_card' },
      { label: 'No', value: 'no', next: 'bpl_card' },
    ],
  },
  bpl_card: {
    id: 'bpl_card',
    text: 'Do you possess a BPL (Below Poverty Line) card?',
    kannadaText: 'ನೀವು ಬಿಪಿಎಲ್ ಕಾರ್ಡ್ ಹೊಂದಿದ್ದೀರಾ?',
    type: 'choice',
    options: [
      { label: 'Yes', value: 'yes', isFinal: true },
      { label: 'No', value: 'no', isFinal: true },
    ],
  },
};

export const INITIAL_QUESTION_ID = 'gender';
