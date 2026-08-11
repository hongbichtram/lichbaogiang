import { ClassTimetableRule, TimetableVersion } from '../types';
import { getNormalizedSession, getNormalizedPeriod } from './classUtils';
import { getWeekNumberFromDate } from './dateWeekUtils';

/**
 * Finds the TimetableVersion matching a specific academic year and week number.
 * Returns null if no version covers the week.
 */
export function getTimetableVersionForWeek(
  versions: TimetableVersion[],
  academicYear: string,
  weekNumber: number
): TimetableVersion | null {
  if (!versions || versions.length === 0) return null;

  const normYear = academicYear ? academicYear.replace(/\s+/g, '') : '';

  let filtered = versions.filter(v => {
    const vYear = v.academicYear ? v.academicYear.replace(/\s+/g, '') : '';
    return vYear === normYear;
  });

  if (filtered.length === 0) {
    filtered = versions;
  }

  const match = filtered.find(v => weekNumber >= v.fromWeek && weekNumber <= v.toWeek);
  if (match) return match;

  // Fallback: If no version explicitly covers weekNumber, pick closest version
  const sorted = [...filtered].sort((a, b) => a.fromWeek - b.fromWeek);
  if (sorted.length > 0) {
    if (weekNumber < sorted[0].fromWeek) return sorted[0];
    if (weekNumber > sorted[sorted.length - 1].toWeek) return sorted[sorted.length - 1];
  }

  return null;
}

/**
 * Finds the TimetableVersion matching a specific date.
 */
export function getTimetableVersionForDate(
  versions: TimetableVersion[],
  academicYear: string,
  dateInput: string | Date,
  week1StartDate: string
): TimetableVersion | null {
  const weekNumber = getWeekNumberFromDate(dateInput, week1StartDate);
  if (weekNumber === null) return null;
  return getTimetableVersionForWeek(versions, academicYear, weekNumber);
}

/**
 * Gets the timetable rule (TKB) for a given teaching slot from a set of rules.
 */
export function getScheduleForTeachingSlot(
  uidOrRules: string | ClassTimetableRule[],
  dayOfWeek: string,
  period: number,
  session?: string,
  rulesFallback?: ClassTimetableRule[]
): ClassTimetableRule | null {
  let rules: ClassTimetableRule[] = [];

  if (Array.isArray(uidOrRules)) {
    rules = uidOrRules;
  } else if (rulesFallback && Array.isArray(rulesFallback)) {
    rules = rulesFallback;
  } else {
    try {
      const saved = localStorage.getItem('smart_schedule_rules');
      if (saved) {
        rules = JSON.parse(saved);
      }
    } catch (e) {
      rules = [];
    }
  }

  if (!rules || rules.length === 0) return null;

  const targetSession = session ? getNormalizedSession({ session, period }) : null;
  const targetPeriod = getNormalizedPeriod({ session, period });

  const match = rules.find(r => {
    if (r.dayOfWeek !== dayOfWeek) return false;

    const rSession = getNormalizedSession(r);
    const rPeriod = getNormalizedPeriod(r);

    if (targetSession) {
      return rSession === targetSession && rPeriod === targetPeriod;
    }

    return r.period === period || (rSession === getNormalizedSession({ period }) && rPeriod === targetPeriod);
  });

  return match || null;
}
