export interface TeacherSeed {
  slug: string;
  name: string;
  email: string;
  title: string;
  photoUrl: string;
  qualifications: string;
  experienceYears: number;
  languages: string[];
  specialty: string;
  bio: string;
  availability: string;
}

export interface CourseSeed {
  slug: string;
  number: string;
  title: string;
  description: string;
  isAvailable: boolean;
}

export interface CoursePlan {
  id: string;
  name: string;
  priceUsd: number;
  billingCycle: string;
  sessionsPerWeek: number;
  durationMinutes: number;
  features: string[];
  isAvailable: boolean;
}

export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export const COURSES_SEED: CourseSeed[] = [
  {
    slug: 'noorani-qaida',
    number: '01.',
    title: 'Noorani Qaida',
    description:
      'Step-by-step Arabic letter recognition, harakat articulation, and smooth word joining designed for children and adult beginners.',
    isAvailable: true,
  },
  {
    slug: 'tajweed',
    number: '02.',
    title: 'Tajweed',
    description:
      'Precision pronunciation from the exact points of articulation with live correction on Ghunnah, Madd, Qalqalah, and stopping rules.',
    isAvailable: true,
  },
  {
    slug: 'hifz',
    number: '03.',
    title: 'Hifz',
    description:
      'Balanced daily Sabaq, Sabqi, and Manzil retention plans led by experienced Huffaz so memorization stays permanent.',
    isAvailable: true,
  },
  {
    slug: 'qirat',
    number: '04.',
    title: 'Qirat',
    description:
      'Authentic recitation styles, classical Maqamat discipline, and vocal control taught by Ijazah-certified Qaris.',
    isAvailable: true,
  },
];

export const TEACHERS_SEED: TeacherSeed[] = [
  {
    slug: 'ustad-tariq-al-azhari',
    name: 'Ustad Tariq Al-Azhari',
    email: 'tariq.alazhari@yaqootwalmarjan.com',
    title: 'Senior Qari & Ijazah Instructor',
    photoUrl: '/src/assets/images/teacher_tariq_1795605516935.jpg',
    qualifications: 'B.A. Usool al-Din (Al-Azhar) · Sanad Ijazah in Hafs an Asim',
    experienceYears: 12,
    languages: ['English', 'Arabic', 'Urdu'],
    specialty: 'Tajweed Mastery & Quran Recitation',
    bio: 'Certified Qari with an unbroken chain of narration (Ijazah). Specializes in Makharij refinement, rhythmic Tarteel, and building recitation confidence for adults and youth.',
    availability: 'Mon – Sat · Flexible UTC Slots',
  },
  {
    slug: 'ustadha-aisha-siddiqui',
    name: 'Ustadha Aisha Siddiqui',
    email: 'aisha.siddiqui@yaqootwalmarjan.com',
    title: 'Lead Female Hifz & Nazra Scholar',
    photoUrl: '/src/assets/images/teacher_aisha_1795605518077.jpg',
    qualifications: 'Alimah Degree · Certified Hafiza & Tajweed Examiner',
    experienceYears: 9,
    languages: ['English', 'Urdu', 'Arabic'],
    specialty: 'Sisters & Children Hifz-ul-Quran',
    bio: 'Dedicated female mentor guiding sisters and young learners through structured memorization milestones, daily Sabaq revision, and gentle Noorani Qaida foundations.',
    availability: 'Sun – Fri · UK, US & PK Friendly',
  },
  {
    slug: 'qari-zayd-al-mansoor',
    name: 'Qari Zayd Al-Mansoor',
    email: 'zayd.almansoor@yaqootwalmarjan.com',
    title: 'Ten Qiraat & Tafseer Specialist',
    photoUrl: '/src/assets/images/teacher_zayd_1795605518060.jpg',
    qualifications: 'M.A. Quranic Sciences · Ijazah in Qiraat Asharah',
    experienceYears: 15,
    languages: ['English', 'Arabic'],
    specialty: 'Advanced Tajweed & Qirat Studies',
    bio: 'Fifteen years teaching advanced phonetic precision, Ahkam al-Tajweed, and classical Qiraat styles for intermediate and advanced students worldwide.',
    availability: 'Tue – Sun · Evening & Weekend Slots',
  },
  {
    slug: 'ustadha-fatima-zahra',
    name: 'Ustadha Fatima Zahra',
    email: 'fatima.zahra@yaqootwalmarjan.com',
    title: 'Noorani Qaida & Arabic Instructor',
    photoUrl: '/src/assets/images/teacher_fatima_1795605519424.jpg',
    qualifications: 'B.A. Arabic Literature · Certified Noorani Qaida Specialist',
    experienceYears: 7,
    languages: ['English', 'Arabic', 'Somali'],
    specialty: 'Beginners Qaida & Quranic Arabic',
    bio: 'Warm, structured instruction designed for beginners starting from the Arabic alphabet, connecting letter recognition directly to fluent Quran reading and vocabulary.',
    availability: 'Mon – Fri · Morning & After-School',
  },
];

export const COURSE_PLANS: CoursePlan[] = [
  {
    id: 'noorani-qaida',
    name: 'Noorani Qaida',
    priceUsd: 39,
    billingCycle: 'per month',
    sessionsPerWeek: 2,
    durationMinutes: 30,
    features: [
      '2 live 1-on-1 classes weekly (30 min each)',
      'Arabic alphabet, harakat & fluent joining',
      'Foundation reading readiness assessment',
      'Academy-assigned certified scholar',
    ],
    isAvailable: true,
  },
  {
    id: 'tajweed',
    name: 'Tajweed',
    priceUsd: 55,
    billingCycle: 'per month',
    sessionsPerWeek: 3,
    durationMinutes: 45,
    features: [
      '3 live 1-on-1 classes weekly (45 min each)',
      'Makharij & Ahkam al-Tajweed precision',
      'Recitation correction & audio practice',
      'Academy-assigned Ijazah scholar',
    ],
    isAvailable: true,
  },
  {
    id: 'hifz',
    name: 'Hifz',
    priceUsd: 79,
    billingCycle: 'per month',
    sessionsPerWeek: 5,
    durationMinutes: 45,
    features: [
      '5 live 1-on-1 classes weekly (45 min each)',
      'Structured daily Sabaq, Sabqi & Manzil',
      'Weekly Juz retention & revision check',
      'Academy-assigned senior Hafiz/Hafiza',
    ],
    isAvailable: true,
  },
  {
    id: 'qirat',
    name: 'Qirat',
    priceUsd: 69,
    billingCycle: 'per month',
    sessionsPerWeek: 3,
    durationMinutes: 45,
    features: [
      '3 live 1-on-1 classes weekly (45 min each)',
      'Authentic recitation styles & vocal control',
      'Maqamat & classical Qiraat discipline',
      'Academy-assigned specialist Qari',
    ],
    isAvailable: true,
  },
];
