/**
 * Utility functions and color schemes for multi-subject management
 */

export interface SubjectColorStyle {
  subject: string;
  icon: string;
  bgLight: string;
  badgeClass: string;
  badgeSolid: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

const PREDEFINED_SUBJECT_STYLES: Record<string, SubjectColorStyle> = {
  'TIN HỌC': {
    subject: 'Tin học',
    icon: '📘',
    bgLight: 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-800/80',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
    badgeSolid: 'bg-blue-600 text-white',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-300 dark:border-blue-700',
    dotClass: 'bg-blue-500',
  },
  'CÔNG NGHỆ': {
    subject: 'Công nghệ',
    icon: '📗',
    bgLight: 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/80',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
    badgeSolid: 'bg-emerald-600 text-white',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-300 dark:border-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  'TOÁN': {
    subject: 'Toán',
    icon: '📙',
    bgLight: 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/80',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
    badgeSolid: 'bg-amber-600 text-white',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-300 dark:border-amber-700',
    dotClass: 'bg-amber-500',
  },
  'TIẾNG VIỆT': {
    subject: 'Tiếng Việt',
    icon: '📕',
    bgLight: 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800/80',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800',
    badgeSolid: 'bg-rose-600 text-white',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-300 dark:border-rose-700',
    dotClass: 'bg-rose-500',
  },
  'TIẾNG ANH': {
    subject: 'Tiếng Anh',
    icon: '🟣',
    bgLight: 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-200/80 dark:border-purple-800/80',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800',
    badgeSolid: 'bg-purple-600 text-white',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-300 dark:border-purple-700',
    dotClass: 'bg-purple-500',
  },
  'KHOA HỌC': {
    subject: 'Khoa học',
    icon: '🩵',
    bgLight: 'bg-cyan-50/90 dark:bg-cyan-950/50 border-cyan-200/80 dark:border-cyan-800/80',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800',
    badgeSolid: 'bg-cyan-600 text-white',
    textClass: 'text-cyan-700 dark:text-cyan-300',
    borderClass: 'border-cyan-300 dark:border-cyan-700',
    dotClass: 'bg-cyan-500',
  },
  'ĐẠO ĐỨC': {
    subject: 'Đạo đức',
    icon: '🌱',
    bgLight: 'bg-lime-50/90 dark:bg-lime-950/50 border-lime-200/80 dark:border-lime-800/80',
    badgeClass: 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-950/80 dark:text-lime-300 dark:border-lime-800',
    badgeSolid: 'bg-lime-600 text-white',
    textClass: 'text-lime-700 dark:text-lime-300',
    borderClass: 'border-lime-300 dark:border-lime-700',
    dotClass: 'bg-lime-500',
  },
  'ÂM NHẠC': {
    subject: 'Âm nhạc',
    icon: '🎵',
    bgLight: 'bg-fuchsia-50/90 dark:bg-fuchsia-950/50 border-fuchsia-200/80 dark:border-fuchsia-800/80',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-950/80 dark:text-fuchsia-300 dark:border-fuchsia-800',
    badgeSolid: 'bg-fuchsia-600 text-white',
    textClass: 'text-fuchsia-700 dark:text-fuchsia-300',
    borderClass: 'border-fuchsia-300 dark:border-fuchsia-700',
    dotClass: 'bg-fuchsia-500',
  },
  'MĨ THUẬT': {
    subject: 'Mĩ thuật',
    icon: '🎨',
    bgLight: 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-200/80 dark:border-indigo-800/80',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800',
    badgeSolid: 'bg-indigo-600 text-white',
    textClass: 'text-indigo-700 dark:text-indigo-300',
    borderClass: 'border-indigo-300 dark:border-indigo-700',
    dotClass: 'bg-indigo-500',
  },
};

const FALLBACK_STYLES: SubjectColorStyle[] = [
  {
    subject: '',
    icon: '📘',
    bgLight: 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-800/80',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
    badgeSolid: 'bg-blue-600 text-white',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-300 dark:border-blue-700',
    dotClass: 'bg-blue-500',
  },
  {
    subject: '',
    icon: '📗',
    bgLight: 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/80',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
    badgeSolid: 'bg-emerald-600 text-white',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-300 dark:border-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  {
    subject: '',
    icon: '📙',
    bgLight: 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/80',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
    badgeSolid: 'bg-amber-600 text-white',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-300 dark:border-amber-700',
    dotClass: 'bg-amber-500',
  },
  {
    subject: '',
    icon: '🟣',
    bgLight: 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-200/80 dark:border-purple-800/80',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800',
    badgeSolid: 'bg-purple-600 text-white',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-300 dark:border-purple-700',
    dotClass: 'bg-purple-500',
  },
  {
    subject: '',
    icon: '📕',
    bgLight: 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800/80',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800',
    badgeSolid: 'bg-rose-600 text-white',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-300 dark:border-rose-700',
    dotClass: 'bg-rose-500',
  },
];

/**
 * Gets a stable color style for a given subject name
 */
export function getSubjectColorStyle(subjectName?: string): SubjectColorStyle {
  if (!subjectName || !subjectName.trim()) {
    return { ...FALLBACK_STYLES[0], subject: 'Tin học' };
  }

  const normalized = subjectName.trim().toUpperCase();
  
  if (PREDEFINED_SUBJECT_STYLES[normalized]) {
    return PREDEFINED_SUBJECT_STYLES[normalized];
  }

  // Hash subject name for fallback palette selection
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_STYLES.length;
  return {
    ...FALLBACK_STYLES[index],
    subject: subjectName.trim(),
  };
}

/**
 * Extracts list of all unique subjects taught by the teacher
 */
export function getTeacherUniqueSubjects(
  teacherSubjects: string[] = [],
  rules: { subject?: string }[] = [],
  schedules: { subject?: string }[] = []
): string[] {
  const set = new Set<string>();

  // Add teacher subjects
  teacherSubjects.forEach(s => {
    if (s && s.trim()) set.add(s.trim());
  });

  // If teacher has explicitly configured subjects, return ONLY those subjects
  if (set.size > 0) {
    return Array.from(set).sort();
  }

  // Fallback ONLY if teacher.subjects is completely empty
  rules.forEach(r => {
    if (r.subject && r.subject.trim()) set.add(r.subject.trim());
  });

  schedules.forEach(s => {
    if (s.subject && s.subject.trim()) set.add(s.subject.trim());
  });

  if (set.size === 0) {
    set.add('Tin học');
  }

  return Array.from(set).sort();
}

/**
 * Calculates lesson count per subject in a list of rules/items
 */
export function calculateSubjectCounts(
  items: { subject?: string }[],
  allSubjects: string[]
): { subject: string; count: number; style: SubjectColorStyle }[] {
  const countMap: Record<string, number> = {};

  allSubjects.forEach(s => {
    countMap[s] = 0;
  });

  items.forEach(item => {
    const s = item.subject || 'Tin học';
    countMap[s] = (countMap[s] || 0) + 1;
  });

  return Object.keys(countMap).map(s => ({
    subject: s,
    count: countMap[s],
    style: getSubjectColorStyle(s),
  }));
}
