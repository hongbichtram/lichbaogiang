import { ClassTimetableRule, TimetableVersion } from '../types';
import { getNormalizedSession, getNormalizedPeriod } from './classUtils';
import { getWeekNumberFromDate, normalizeAcademicYear } from './dateWeekUtils';

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

  const normYear = normalizeAcademicYear(academicYear);

  const filtered = versions.filter(v => {
    const vYear = normalizeAcademicYear(v.academicYear);
    return vYear === normYear;
  });

  const match = filtered.find(v => weekNumber >= v.fromWeek && weekNumber <= v.toWeek);
  return match || null;
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
    rules = [];
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
