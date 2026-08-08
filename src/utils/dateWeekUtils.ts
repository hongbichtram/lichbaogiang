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

export const getAcademicYearStartYear = (academicYear: string = '2025-2026'): number => {
  const match = academicYear.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : 2025;
};

// Returns Monday of Week 1 for the academic year (September start)
export const getWeek1Monday = (academicYear: string = '2025-2026'): Date => {
  const startYear = getAcademicYearStartYear(academicYear);
  const sept1 = new Date(startYear, 8, 1); // 1st Sept
  const day = sept1.getDay(); // 0 = Sun, 1 = Mon...
  const diffToMonday = day === 0 ? 1 : (day === 1 ? 0 : 8 - day);
  const monday = new Date(sept1);
  monday.setDate(sept1.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Given a weekNumber (1..52) and academicYear, returns Monday and Friday dates
export const getWeekStartEndDates = (weekNumber: number, academicYear: string = '2025-2026') => {
  const week1Monday = getWeek1Monday(academicYear);
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);
  
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { monday, friday, sunday };
};

// Formats Date to dd/mm/yyyy
export const formatDateDDMMYYYY = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Formats Date to dd/mm
export const formatDateDDMM = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
};

// Convert YYYY-MM-DD (from <input type="date">) to DD/MM/YYYY
export const convertISOToDDMMYYYY = (iso: string): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
};

// Convert DD/MM/YYYY to YYYY-MM-DD for <input type="date">
export const convertDDMMYYYYToISO = (ddmmyyyy: string): string => {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return ddmmyyyy;
};

// Get default dates object for a given week
export const getDefaultWeekDates = (weekNumber: number, academicYear: string = '2025-2026'): CustomWeekDate => {
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

// Calculate 5 teaching days (Mon -> Fri) from a given start Monday date
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

// Propagate custom week start date continuously to subsequent weeks
export const propagateWeekDatesFrom = (
  fromWeek: number,
  startISO: string, // YYYY-MM-DD
  academicYear: string = '2025-2026',
  totalWeeks: number = 35
): CustomWeekDatesMap => {
  const map = loadCustomWeekDatesMap();
  const [y, m, d] = startISO.split('-').map(Number);
  let currentMonday = new Date(y, m - 1, d);

  for (let w = fromWeek; w <= totalWeeks; w++) {
    map[w] = calculateWeek5DaysFromMonday(currentMonday);

    // Advance to next week's Monday (+7 days from current Monday)
    currentMonday = new Date(currentMonday);
    currentMonday.setDate(currentMonday.getDate() + 7);
  }

  saveCustomWeekDatesMap(map);
  return map;
};

// Reset custom week dates for fromWeek and all subsequent weeks back to default
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

// Given a weekNumber and optional custom map, return range string
export const getWeekRangeFormatted = (
  weekNumber: number, 
  academicYear: string = '2025-2026',
  customMap?: CustomWeekDatesMap
): string => {
  const map = customMap || loadCustomWeekDatesMap();
  if (map[weekNumber]) {
    const custom = map[weekNumber];
    const startStr = custom.startDate.length >= 5 ? custom.startDate.slice(0, 5) : custom.startDate;
    return `${startStr} – ${custom.endDate}`;
  }

  const { monday, friday } = getWeekStartEndDates(weekNumber, academicYear);
  return `${formatDateDDMM(monday)} – ${formatDateDDMMYYYY(friday)}`;
};

// Given a dayOfWeek and weekNumber, get actual date string
export const getActualDayDate = (
  weekNumber: number, 
  dayOfWeek: string, 
  academicYear: string = '2025-2026',
  customMap?: CustomWeekDatesMap
): string => {
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

// Given any arbitrary Date, determine Monday of that week and the school week number
export const getWeekNumberFromDate = (date: Date, academicYear: string = '2025-2026'): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  
  // Find Monday of the selected date's week
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mondayOfDate = new Date(d);
  mondayOfDate.setDate(d.getDate() + diffToMon);

  const week1Monday = getWeek1Monday(academicYear);
  
  const diffTime = mondayOfDate.getTime() - week1Monday.getTime();
  const diffWeeks = Math.round(diffTime / (7 * 24 * 3600 * 1000));
  
  const weekNum = diffWeeks + 1;
  return Math.max(1, Math.min(52, weekNum));
};

// Helper to check if two dates are the same day
export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};
