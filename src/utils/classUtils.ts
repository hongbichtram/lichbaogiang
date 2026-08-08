/**
 * Utility functions for class management and grade inference
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
 * Formats period number for display.
 * Morning: periods 1..4 -> "Tiết 1", "Tiết 2", "Tiết 3", "Tiết 4"
 * Afternoon: periods 5..7 -> "Tiết 1", "Tiết 2", "Tiết 3"
 */
export function getPeriodName(period: number): string {
  if (period <= 4) {
    return `Tiết ${period}`;
  }
  const afternoonPeriod = period > 4 ? period - 4 : period;
  return `Tiết ${afternoonPeriod}`;
}

/**
 * Returns session label for period.
 */
export function getSessionName(period: number): '☀️ BUỔI SÁNG' | '🌤️ BUỔI CHIỀU' {
  return period <= 4 ? '☀️ BUỔI SÁNG' : '🌤️ BUỔI CHIỀU';
}

/**
 * Full description format, e.g. "Sáng - Tiết 1" or "Chiều - Tiết 2"
 */
export function getFullPeriodLabel(period: number): string {
  if (period <= 4) {
    return `Sáng - Tiết ${period}`;
  }
  return `Chiều - Tiết ${period - 4}`;
}

export function formatTableSessionPeriod(period: number): string {
  if (period <= 4) {
    return `☀️ Sáng – Tiết ${period}`;
  }
  return `🌤️ Chiều – Tiết ${period - 4}`;
}

