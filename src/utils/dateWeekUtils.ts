// Utility functions for calculating School Weeks, Custom Week Dates, and Calendar Date Picker

export interface CustomWeekDate {
  startDate: string; // DD/MM/YYYY
  endDate: string;   // DD/MM/YYYY
  dayDates: {
    'Thứ 2': string;
    'Thứ 3': string;
    'Thứ 4': string;
    'Thứ 5': string;
    'Thứ 6': string;
  };
}

export type CustomWeekDatesMap = Record<number, CustomWeekDate>;

const CUSTOM_WEEK_DATES_KEY = 'lich_bao_giang_custom_week_dates_v1';

export const loadCustomWeekDatesMap = (): CustomWeekDatesMap => {
  try {
    const raw = localStorage.getItem(CUSTOM_WEEK_DATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to load custom week dates', err);
    return {};
  }
};

export const saveCustomWeekDatesMap = (map: CustomWeekDatesMap): void => {
  try {
    localStorage.setItem(CUSTOM_WEEK_DATES_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save custom week dates', err);
  }
};

// Safe UTC ISO Date parsing to avoid timezone offsets
export const parseISODateUTC = (isoStr: string): Date => {
  if (!isoStr) return new Date(Date.UTC(2026, 8, 1));
  const parts = isoStr.split('-').map(Number);
  if (parts.length === 3) {
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }
  return new Date(Date.UTC(2026, 8, 1));
};

export const formatUTCToISO = (d: Date): string => {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const formatUTCToDDMMYYYY = (d: Date): string => {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const formatUTCToDDMM = (d: Date): string => {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
};

export const addDaysUTC = (isoStr: string, days: number): string => {
  const d = parseISODateUTC(isoStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatUTCToISO(d);
};

export const diffDaysUTC = (isoStr1: string, isoStr2: string): number => {
  const d1 = parseISODateUTC(isoStr1);
  const d2 = parseISODateUTC(isoStr2);
  const diffMs = d1.getTime() - d2.getTime();
  return Math.floor(diffMs / (24 * 3600 * 1000));
};

export interface WeekRangeResult {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startDateFormatted: string; // DD/MM/YYYY
  endDateFormatted: string;   // DD/MM/YYYY
}

export const getWeekRange = (
  weekNumber: number, 
  week1StartDate: string = '2026-09-01',
  customWeekMap?: Record<number, { startDate: string; endDate: string }>
): WeekRangeResult => {
  if (customWeekMap && customWeekMap[weekNumber]) {
    const startISO = customWeekMap[weekNumber].startDate;
    const endISO = customWeekMap[weekNumber].endDate || addDaysUTC(startISO, 6);
    const dStart = parseISODateUTC(startISO);
    const dEnd = parseISODateUTC(endISO);
    return {
      startDate: startISO,
      endDate: endISO,
      startDateFormatted: formatUTCToDDMMYYYY(dStart),
      endDateFormatted: formatUTCToDDMMYYYY(dEnd),
    };
  }

  const startISO = addDaysUTC(week1StartDate, (weekNumber - 1) * 7);
  const endISO = addDaysUTC(startISO, 6);
  const dStart = parseISODateUTC(startISO);
  const dEnd = parseISODateUTC(endISO);
  return {
    startDate: startISO,
    endDate: endISO,
    startDateFormatted: formatUTCToDDMMYYYY(dStart),
    endDateFormatted: formatUTCToDDMMYYYY(dEnd),
  };
};

export const getWeekNumberFromDate = (
  dateInput: string | Date, 
  week1StartDate: string = '2026-09-01',
  customWeekMap?: Record<number, { startDate: string; endDate: string }>
): number | null => {
  let targetISO = '';
  if (typeof dateInput === 'string') {
    if (dateInput.includes('/')) {
      targetISO = convertDDMMYYYYToISO(dateInput);
    } else {
      targetISO = dateInput;
    }
  } else if (dateInput instanceof Date) {
    const yyyy = dateInput.getFullYear();
    const mm = String(dateInput.getMonth() + 1).padStart(2, '0');
    const dd = String(dateInput.getDate()).padStart(2, '0');
    targetISO = `${yyyy}-${mm}-${dd}`;
  }

  if (!targetISO) return null;

  if (customWeekMap) {
    for (const wKey in customWeekMap) {
      const wNum = Number(wKey);
      const { startDate, endDate } = customWeekMap[wNum];
      if (startDate && endDate) {
        if (targetISO >= startDate && targetISO <= endDate) {
          return wNum;
        }
      }
    }
  }

  const diffDays = diffDaysUTC(targetISO, week1StartDate);
  if (diffDays < 0) {
    return null; // Date is before start of academic year
  }

  return Math.floor(diffDays / 7) + 1;
};

export const normalizeAcademicYear = (academicYear?: string): string => {
  if (!academicYear) return '2026-2027';
  const cleaned = academicYear.replace(/\s+/g, '').replace(/[\u2010-\u2015\u2212–—]/g, '-');
  const match = cleaned.match(/\d{4}-\d{4}/);
  if (match) return match[0];
  return cleaned || '2026-2027';
};

export const getAcademicYearStartYear = (academicYear: string = '2026-2027'): number => {
  const norm = normalizeAcademicYear(academicYear);
  const match = norm.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : 2026;
};

// Legacy fallback
export const getWeek1Monday = (academicYear: string = '2026-2027'): Date => {
  const startYear = getAcademicYearStartYear(academicYear);
  const sept1 = new Date(startYear, 8, 1);
  const day = sept1.getDay();
  const diffToMonday = day === 0 ? 1 : (day === 1 ? 0 : 8 - day);
  const monday = new Date(sept1);
  monday.setDate(sept1.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const getWeekStartEndDates = (weekNumber: number, academicYear: string = '2026-2027') => {
  const week1Monday = getWeek1Monday(academicYear);
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);
  
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { monday, friday, sunday };
};

export const formatDateDDMMYYYY = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const formatDateDDMM = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
};

export const convertISOToDDMMYYYY = (iso: string): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
};

export const convertDDMMYYYYToISO = (ddmmyyyy: string): string => {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return ddmmyyyy;
};

export const getDefaultWeekDates = (weekNumber: number, academicYear: string = '2026-2027'): CustomWeekDate => {
  const { monday, friday } = getWeekStartEndDates(weekNumber, academicYear);
  
  const d2 = new Date(monday);
  const d3 = new Date(monday); d3.setDate(monday.getDate() + 1);
  const d4 = new Date(monday); d4.setDate(monday.getDate() + 2);
  const d5 = new Date(monday); d5.setDate(monday.getDate() + 3);
  const d6 = new Date(monday); d6.setDate(monday.getDate() + 4);

  return {
    startDate: formatDateDDMMYYYY(monday),
    endDate: formatDateDDMMYYYY(friday),
    dayDates: {
      'Thứ 2': formatDateDDMMYYYY(d2),
      'Thứ 3': formatDateDDMMYYYY(d3),
      'Thứ 4': formatDateDDMMYYYY(d4),
      'Thứ 5': formatDateDDMMYYYY(d5),
      'Thứ 6': formatDateDDMMYYYY(d6),
    },
  };
};

export const calculateWeek5DaysFromMonday = (startMonday: Date): CustomWeekDate => {
  const d2 = new Date(startMonday);
  const d3 = new Date(startMonday); d3.setDate(startMonday.getDate() + 1);
  const d4 = new Date(startMonday); d4.setDate(startMonday.getDate() + 2);
  const d5 = new Date(startMonday); d5.setDate(startMonday.getDate() + 3);
  const d6 = new Date(startMonday); d6.setDate(startMonday.getDate() + 4);

  return {
    startDate: formatDateDDMMYYYY(d2),
    endDate: formatDateDDMMYYYY(d6),
    dayDates: {
      'Thứ 2': formatDateDDMMYYYY(d2),
      'Thứ 3': formatDateDDMMYYYY(d3),
      'Thứ 4': formatDateDDMMYYYY(d4),
      'Thứ 5': formatDateDDMMYYYY(d5),
      'Thứ 6': formatDateDDMMYYYY(d6),
    },
  };
};

export const propagateWeekDatesFrom = (
  fromWeek: number,
  startISO: string,
  academicYear: string = '2026-2027',
  totalWeeks: number = 35
): CustomWeekDatesMap => {
  const map = loadCustomWeekDatesMap();
  const [y, m, d] = startISO.split('-').map(Number);
  let currentMonday = new Date(y, m - 1, d);

  for (let w = fromWeek; w <= totalWeeks; w++) {
    map[w] = calculateWeek5DaysFromMonday(currentMonday);
    currentMonday = new Date(currentMonday);
    currentMonday.setDate(currentMonday.getDate() + 7);
  }

  saveCustomWeekDatesMap(map);
  return map;
};

export const resetWeekDatesFrom = (
  fromWeek: number,
  totalWeeks: number = 35
): CustomWeekDatesMap => {
  const map = loadCustomWeekDatesMap();
  for (let w = fromWeek; w <= totalWeeks; w++) {
    delete map[w];
  }
  saveCustomWeekDatesMap(map);
  return map;
};

export const getWeekRangeFormatted = (
  weekNumber: number, 
  academicYear: string = '2026-2027',
  customMap?: CustomWeekDatesMap,
  week1StartDate?: string,
  customWeekMap?: Record<number, { startDate: string; endDate: string }>
): string => {
  if (customWeekMap && customWeekMap[weekNumber]) {
    const range = getWeekRange(weekNumber, week1StartDate || '2026-09-01', customWeekMap);
    return `${range.startDateFormatted.slice(0, 5)} – ${range.endDateFormatted}`;
  }

  if (week1StartDate) {
    const range = getWeekRange(weekNumber, week1StartDate);
    return `${range.startDateFormatted.slice(0, 5)} – ${range.endDateFormatted}`;
  }

  const map = customMap || loadCustomWeekDatesMap();
  if (map[weekNumber]) {
    const custom = map[weekNumber];
    const startStr = custom.startDate.length >= 5 ? custom.startDate.slice(0, 5) : custom.startDate;
    return `${startStr} – ${custom.endDate}`;
  }

  const { monday, friday } = getWeekStartEndDates(weekNumber, academicYear);
  return `${formatDateDDMM(monday)} – ${formatDateDDMMYYYY(friday)}`;
};

export const getDayOfWeekStrFromUTC = (utcDayIndex: number): string => {
  switch (utcDayIndex) {
    case 1: return 'Thứ 2';
    case 2: return 'Thứ 3';
    case 3: return 'Thứ 4';
    case 4: return 'Thứ 5';
    case 5: return 'Thứ 6';
    case 6: return 'Thứ 7';
    case 0: return 'Chủ Nhật';
    default: return '';
  }
};

export const getActualDayDate = (
  weekNumber: number, 
  dayOfWeek: string, 
  academicYear: string = '2026-2027',
  customMap?: CustomWeekDatesMap,
  week1StartDate?: string,
  customWeekMap?: Record<number, { startDate: string; endDate: string }>
): string => {
  if (customWeekMap && customWeekMap[weekNumber]) {
    const range = getWeekRange(weekNumber, week1StartDate || '2026-09-01', customWeekMap);
    const startISO = range.startDate;
    const targetNorm = dayOfWeek.replace('Thứ Hai', 'Thứ 2').replace('Thứ Ba', 'Thứ 3').replace('Thứ Tư', 'Thứ 4').replace('Thứ Năm', 'Thứ 5').replace('Thứ Sáu', 'Thứ 6').replace('Thứ Bảy', 'Thứ 7');

    for (let i = 0; i < 7; i++) {
      const currISO = addDaysUTC(startISO, i);
      const d = parseISODateUTC(currISO);
      const dayStr = getDayOfWeekStrFromUTC(d.getUTCDay());
      if (dayStr === targetNorm) {
        return formatUTCToDDMMYYYY(d);
      }
    }
    return range.startDateFormatted;
  }

  if (week1StartDate) {
    const range = getWeekRange(weekNumber, week1StartDate);
    const startISO = range.startDate;
    const targetNorm = dayOfWeek.replace('Thứ Hai', 'Thứ 2').replace('Thứ Ba', 'Thứ 3').replace('Thứ Tư', 'Thứ 4').replace('Thứ Năm', 'Thứ 5').replace('Thứ Sáu', 'Thứ 6').replace('Thứ Bảy', 'Thứ 7');

    for (let i = 0; i < 7; i++) {
      const currISO = addDaysUTC(startISO, i);
      const d = parseISODateUTC(currISO);
      const dayStr = getDayOfWeekStrFromUTC(d.getUTCDay());
      if (dayStr === targetNorm) {
        return formatUTCToDDMMYYYY(d);
      }
    }
    return range.startDateFormatted;
  }

  const map = customMap || loadCustomWeekDatesMap();
  const custom = map[weekNumber];
  if (custom && custom.dayDates && (custom.dayDates as any)[dayOfWeek]) {
    return (custom.dayDates as any)[dayOfWeek];
  }

  const dayMap: Record<string, number> = {
    'Thứ 2': 0, 'Thứ Hai': 0,
    'Thứ 3': 1, 'Thứ Ba': 1,
    'Thứ 4': 2, 'Thứ Tư': 2,
    'Thứ 5': 3, 'Thứ Năm': 3,
    'Thứ 6': 4, 'Thứ Sáu': 4,
    'Thứ 7': 5, 'Thứ Bảy': 5,
  };

  const dayIndex = dayMap[dayOfWeek] ?? 0;
  const { monday } = getWeekStartEndDates(weekNumber, academicYear);
  const targetDate = new Date(monday);
  targetDate.setDate(monday.getDate() + dayIndex);

  return formatDateDDMMYYYY(targetDate);
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};
