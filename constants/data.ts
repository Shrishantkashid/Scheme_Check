export interface Scheme {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  category: string;
  state?: string;
  tags: string[];
  beneficiary?: string;
  benefits?: string;
  matchScore?: number;
  personalReason?: string;
}

export const SCHEMES: Scheme[] = [
  {
    id: 's1',
    title: 'Pradhan Mantri Matru Vandana Yojana',
    description: 'Financial support for pregnant and lactating mothers for the first living child.',
    category: 'Healthcare',
    tags: ['female', 'maternity'],
    beneficiary: 'Women',
  },
  {
    id: 's2',
    title: 'PM-Kisan Samman Nidhi',
    description: 'Income support of ₹6,000 per year in three installments to all landholding farmer families.',
    category: 'Agriculture',
    tags: ['farmer', 'rural'],
    beneficiary: 'Farmers',
  },
  {
    id: 's3',
    title: 'Post Matric Scholarship for SC Students',
    description: 'Financial assistance to SC students studying at post-matriculation level.',
    category: 'Education',
    tags: ['student', 'sc'],
    beneficiary: 'Students',
  },
  {
    id: 's4',
    title: 'Ayushman Bharat (PM-JAY)',
    description: 'Health insurance cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalisation.',
    category: 'Healthcare',
    tags: ['general', 'low_income'],
    beneficiary: 'All Families',
  },
  {
    id: 's5',
    title: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana',
    description: 'Placement linked skill training program for rural poor youth.',
    category: 'Employment',
    tags: ['youth', 'rural'],
    beneficiary: 'Rural Youth',
  },
];
