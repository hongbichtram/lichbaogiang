import { ClassTimetableRule } from '../types';
import { getNormalizedSession, getNormalizedPeriod } from './classUtils';

/**
 * Gets the timetable rule (TKB) for a given teaching slot.
 * Signature: getScheduleForTeachingSlot(uidOrRules, dayOfWeek, period, session?)
 * Supports passing either `uid` (string) or `timetableRules` (ClassTimetableRule[]).
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
