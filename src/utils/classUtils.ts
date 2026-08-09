/**
 * Utility functions for class management, session & period normalization
 */

/**
 * Infers Grade string (e.g., "Khối 3", "Khối 4", "Khối 5") from class name (e.g., "3A1", "4A2", "5B").
 */
export function inferGradeFromClassName(className: string): string {
  if (!className) return 'Khối 4';
  
  // Look for first digit in class name
  const match = className.match(/\d+/);
  if (match) {
    const digit = match[0].charAt(0);
    if (['1', '2', '3', '4', '5'].includes(digit)) {
      return `Khối ${digit}`;
    }
  }

  // Fallback defaults if no digit found
  return 'Khối 4';
}

/**
 * Normalizes class name (uppercase, trimmed)
 */
export function normalizeClassName(className: string): string {
  return className.trim().toUpperCase();
}

/**
 * Returns normalized session: "Sáng" or "Chiều"
 * Sáng: 4 periods (1, 2, 3, 4)
 * Chiều: 3 periods (1, 2, 3)
 */
export function getNormalizedSession(item: { session?: string; period?: number }): 'Sáng' | 'Chiều' {
  if (item.session === 'Sáng' || item.session === 'sáng') return 'Sáng';
  if (item.session === 'Chiều' || item.session === 'chiều') return 'Chiều';
  // Fallback for legacy items without explicit session
  if (item.period && item.period > 4) return 'Chiều';
  return 'Sáng';
}

/**
 * Returns normalized period number for given session or legacy period index.
 * Sáng: 1, 2, 3, 4
 * Chiều: 1, 2, 3
 */
export function getNormalizedPeriod(item: { session?: string; period?: number }): number {
  const p = item.period || 1;
  const s = getNormalizedSession(item);

  if (s === 'Chiều') {
    if (p > 4) return Math.min(3, Math.max(1, p - 4));
    return Math.min(3, Math.max(1, p));
  }
  // Sáng
  if (p > 4) return Math.min(4, Math.max(1, p - 4));
  return Math.min(4, Math.max(1, p));
}

/**
 * Formats period name for display, e.g. "Tiết 1", "Tiết 2"
 */
export function getPeriodName(period: number, session?: string): string {
  const normP = getNormalizedPeriod({ session, period });
  return `Tiết ${normP}`;
}

/**
 * Returns session label for period.
 */
export function getSessionName(period: number, session?: string): 'BUỔI SÁNG' | 'BUỔI CHIỀU' {
  const normS = getNormalizedSession({ session, period });
  return normS === 'Sáng' ? 'BUỔI SÁNG' : 'BUỔI CHIỀU';
}

/**
 * Full description format, e.g. "Sáng - Tiết 1" or "Chiều - Tiết 2"
 */
export function getFullPeriodLabel(period: number, session?: string): string {
  const normS = getNormalizedSession({ session, period });
  const normP = getNormalizedPeriod({ session, period });
  return `${normS} - Tiết ${normP}`;
}

/**
 * Table format for session and period e.g. "Sáng – Tiết 1" or "Chiều – Tiết 2"
 */
export function formatTableSessionPeriod(period: number, session?: string): string {
  const normS = getNormalizedSession({ session, period });
  const normP = getNormalizedPeriod({ session, period });
  if (normS === 'Sáng') {
    return `Sáng – Tiết ${normP}`;
  }
  return `Chiều – Tiết ${normP}`;
}

/**
 * Formats lesson title with subject prefix for display.
 * e.g. "Tin học – Bài 10: Chèn bảng vào văn bản soạn thảo"
 */
export function formatLessonDisplayTitle(lessonTitle?: string, subject?: string, fallback = 'Chưa chọn bài'): string {
  const rawTitle = lessonTitle?.trim();
  const subj = subject?.trim();

  if (!rawTitle) {
    if (subj) {
      return `${subj} – ${fallback}`;
    }
    return fallback;
  }

  if (subj) {
    // Avoid duplicate prefixing if title already starts with subject name
    const lowerTitle = rawTitle.toLowerCase();
    const lowerSubj = subj.toLowerCase();
    if (lowerTitle.startsWith(lowerSubj)) {
      return rawTitle;
    }
    return `${subj} – ${rawTitle}`;
  }

  return rawTitle;
}



