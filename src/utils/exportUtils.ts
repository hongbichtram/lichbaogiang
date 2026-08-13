import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, VerticalMergeType, VerticalAlign } from 'docx';
import * as XLSX from 'xlsx';
import { ScheduleItem, TeacherProfile } from '../types';
import { getNormalizedSession, getNormalizedPeriod, formatLessonDisplayTitle } from './classUtils';
import { getActualDayDate } from './dateWeekUtils';

export const getDayDisplayName = (day: string): string => {
  switch (day) {
    case 'Thứ 2': return 'Thứ Hai';
    case 'Thứ 3': return 'Thứ Ba';
    case 'Thứ 4': return 'Thứ Tư';
    case 'Thứ 5': return 'Thứ Năm';
    case 'Thứ 6': return 'Thứ Sáu';
    case 'Thứ 7': return 'Thứ Bảy';
    default: return day;
  }
};

export const getWeekDayDate = (
  weekNumber: number, 
  dayOfWeek: string, 
  academicYear: string = '2025-2026',
  customMap?: any,
  week1StartDate?: string,
  customWeekMap?: Record<number, { startDate: string; endDate: string }>
): string => {
  return getActualDayDate(weekNumber, dayOfWeek, academicYear, customMap, week1StartDate, customWeekMap);
};

export interface DayGroup {
  dayOfWeek: string;
  dayDisplayName: string;
  dateStr: string;
  items: ScheduleItem[];
}

export const groupSchedulesByDay = (
  schedules: ScheduleItem[],
  weekNumber: number,
  academicYear: string = '2024-2025'
): DayGroup[] => {
  const DAYS_ORDER = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
  const groupsMap = new Map<string, ScheduleItem[]>();

  schedules.forEach(item => {
    if (item.dayOfWeek === ('Thứ 7' as any)) return;
    const key = item.dayOfWeek || 'Thứ 2';
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(item);
  });

  const result: DayGroup[] = [];

  DAYS_ORDER.forEach(dayKey => {
    const items = groupsMap.get(dayKey);
    if (items && items.length > 0) {
      items.sort((a, b) => {
        const sessA = getNormalizedSession(a);
        const sessB = getNormalizedSession(b);
        if (sessA !== sessB) return sessA === 'Sáng' ? -1 : 1;
        return getNormalizedPeriod(a) - getNormalizedPeriod(b);
      });
      result.push({
        dayOfWeek: dayKey,
        dayDisplayName: getDayDisplayName(dayKey),
        dateStr: items[0]?.date || getWeekDayDate(weekNumber, dayKey, academicYear),
        items,
      });
    }
  });

  return result;
};

// ==========================================
// SINGLE SOURCE OF TRUTH TABLE DATA BUILDER
// ==========================================

export interface LessonReportRow {
  dayKey: string;
  dayDisplayName: string;
  dateStr: string;
  isFirstInDay: boolean;
  dayRowSpan: number; // 7

  session: 'Sáng' | 'Chiều';
  isFirstInSession: boolean;
  sessionRowSpan: number; // 4 for Sáng, 3 for Chiều

  period: number;
  periodLabel: string; // 'Tiết 1', 'Tiết 2', ...

  className: string;
  lessonTitle: string;
  subject: string;
  displayLessonTitle: string;
  notes: string;
  item: ScheduleItem | null;
}

export interface LessonReportDayGroup {
  dayKey: string;
  dayDisplayName: string;
  dateStr: string;
  rows: LessonReportRow[];
}

export interface LessonReportTableData {
  days: LessonReportDayGroup[];
  allRows: LessonReportRow[];
}

export const FIXED_LESSON_REPORT_DAYS = [
  { key: 'Thứ 2' as const, displayName: 'Thứ Hai' },
  { key: 'Thứ 3' as const, displayName: 'Thứ Ba' },
  { key: 'Thứ 4' as const, displayName: 'Thứ Tư' },
  { key: 'Thứ 5' as const, displayName: 'Thứ Năm' },
  { key: 'Thứ 6' as const, displayName: 'Thứ Sáu' },
] as const;

export const FIXED_LESSON_REPORT_ROWS = [
  { session: 'Sáng' as const, period: 1, label: 'Tiết 1', isFirstInSession: true, sessionRowSpan: 4 },
  { session: 'Sáng' as const, period: 2, label: 'Tiết 2', isFirstInSession: false, sessionRowSpan: 0 },
  { session: 'Sáng' as const, period: 3, label: 'Tiết 3', isFirstInSession: false, sessionRowSpan: 0 },
  { session: 'Sáng' as const, period: 4, label: 'Tiết 4', isFirstInSession: false, sessionRowSpan: 0 },
  { session: 'Chiều' as const, period: 1, label: 'Tiết 1', isFirstInSession: true, sessionRowSpan: 3 },
  { session: 'Chiều' as const, period: 2, label: 'Tiết 2', isFirstInSession: false, sessionRowSpan: 0 },
  { session: 'Chiều' as const, period: 3, label: 'Tiết 3', isFirstInSession: false, sessionRowSpan: 0 },
] as const;

export const buildLessonReportTableData = (
  schedules: ScheduleItem[],
  weekNumber: number,
  academicYear: string = '2025-2026',
  customMap?: any,
  week1StartDate?: string,
  customWeekMap?: Record<number, { startDate: string; endDate: string }>
): LessonReportTableData => {
  const allRows: LessonReportRow[] = [];
  const days: LessonReportDayGroup[] = [];

  FIXED_LESSON_REPORT_DAYS.forEach((day) => {
    const dayScheduleItems = schedules.filter((s) => s.dayOfWeek === day.key);
    const dateStr =
      dayScheduleItems.find((s) => !!s.date)?.date ||
      getWeekDayDate(weekNumber, day.key, academicYear, customMap, week1StartDate, customWeekMap);

    const dayRows: LessonReportRow[] = [];

    FIXED_LESSON_REPORT_ROWS.forEach((rowCfg, rowIdx) => {
      const isFirstInDay = rowIdx === 0;

      const matchingItem = dayScheduleItems.find((s) => {
        const sess = getNormalizedSession(s);
        const per = getNormalizedPeriod(s);
        return sess === rowCfg.session && per === rowCfg.period;
      }) || null;

      const className = matchingItem?.className || '';
      const lessonTitle = matchingItem?.lessonTitle || '';
      const subject = matchingItem?.subject || '';
      const displayLessonTitle = matchingItem
        ? formatLessonDisplayTitle(matchingItem.lessonTitle, matchingItem.subject, '')
        : '';
      const notes = matchingItem?.notes || '';

      const row: LessonReportRow = {
        dayKey: day.key,
        dayDisplayName: day.displayName,
        dateStr,
        isFirstInDay,
        dayRowSpan: 7,
        session: rowCfg.session,
        isFirstInSession: rowCfg.isFirstInSession,
        sessionRowSpan: rowCfg.sessionRowSpan,
        period: rowCfg.period,
        periodLabel: rowCfg.label,
        className,
        lessonTitle,
        subject,
        displayLessonTitle,
        notes,
        item: matchingItem,
      };

      dayRows.push(row);
      allRows.push(row);
    });

    days.push({
      dayKey: day.key,
      dayDisplayName: day.displayName,
      dateStr,
      rows: dayRows,
    });
  });

  return { days, allRows };
};

// ==========================================
// WORD EXPORT (DOCX)
// ==========================================

export const exportWeeklyWordDoc = async (
  schedules: ScheduleItem[],
  teacher: TeacherProfile,
  weekNumber: number
) => {
  const tableData = buildLessonReportTableData(schedules, weekNumber, teacher.academicYear);
  const mondayDate = getWeekDayDate(weekNumber, 'Thứ 2', teacher.academicYear);
  const fridayDate = getWeekDayDate(weekNumber, 'Thứ 6', teacher.academicYear);

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 17, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Thứ, ngày tháng năm', alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Buổi', alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: 7, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Tiết', alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Lớp', alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: 48, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Tên bài dạy', alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Ghi chú', alignment: AlignmentType.CENTER })],
      }),
    ],
  });

  const tableDataRows: TableRow[] = tableData.allRows.map((row) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 17, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          verticalMerge: row.isFirstInDay ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE,
          children: row.isFirstInDay
            ? [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: row.dayDisplayName, bold: true, size: 22 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: row.dateStr, size: 18 })] }),
              ]
            : [],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          verticalMerge: row.isFirstInSession ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE,
          children: row.isFirstInSession
            ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: row.session, bold: true, size: 20 })] })]
            : [],
        }),
        new TableCell({
          width: { size: 7, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ text: row.periodLabel, alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ text: row.className, alignment: AlignmentType.CENTER, children: [new TextRun({ text: row.className, bold: true })] })],
        }),
        new TableCell({
          width: { size: 48, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ text: row.displayLessonTitle, alignment: AlignmentType.LEFT })],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ text: row.notes, alignment: AlignmentType.LEFT })],
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({ text: `Trường: ${teacher.schoolName || 'Tiểu học'}\n`, bold: true, size: 22 }),
              new TextRun({ text: `Giáo viên: ${teacher.fullName || 'Chưa cập nhật'} ${teacher.teacherCode ? `- Mã GV: ${teacher.teacherCode}` : ''}\n`, size: 22 }),
              new TextRun({ text: `Năm học: ${teacher.academicYear} - ${teacher.semester}\n\n`, size: 22 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `LỊCH BÁO GIẢNG TUẦN ${weekNumber}`, bold: true, size: 28, color: '1E3A8A' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `(Từ ngày ${mondayDate} đến ngày ${fridayDate})`, italics: true, size: 20 }),
            ],
          }),
          new Paragraph({ text: '\n' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [tableHeaderRow, ...tableDataRows],
          }),
          new Paragraph({ text: '\n\n' }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `..., ngày ..... tháng ..... năm 2026\n`, italics: true, size: 20 }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BAN GIÁM HIỆU DUYỆT', bold: true })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', italics: true })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'GIÁO VIÊN BÁO GIẢNG', bold: true })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký và ghi rõ họ tên)', italics: true })] }),
                      new Paragraph({ text: '\n\n\n' }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: teacher.fullName, bold: true })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lich_Bao_Giang_Tuan_${weekNumber}_${teacher.fullName.replace(/\s+/g, '_')}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// ==========================================
// EXCEL EXPORT (XLSX)
// ==========================================

export const exportWeeklyExcel = (
  schedules: ScheduleItem[],
  teacher: TeacherProfile,
  weekNumber: number
) => {
  const tableData = buildLessonReportTableData(schedules, weekNumber, teacher.academicYear);
  const mondayDate = getWeekDayDate(weekNumber, 'Thứ 2', teacher.academicYear);
  const fridayDate = getWeekDayDate(weekNumber, 'Thứ 6', teacher.academicYear);

  const data: any[][] = [
    [`Trường: ${teacher.schoolName || 'Tiểu học'}`, `Giáo viên: ${teacher.fullName || ''}`, `Năm học: ${teacher.academicYear}`],
    [`Học kỳ: ${teacher.semester}`],
    [`LỊCH BÁO GIẢNG TUẦN ${weekNumber} (Từ ngày ${mondayDate} đến ngày ${fridayDate})`],
    [],
    ['Thứ, ngày tháng năm', 'Buổi', 'Tiết', 'Lớp', 'Tên bài dạy', 'Ghi chú'],
  ];

  const merges: XLSX.Range[] = [];
  const startDataRow = 5;

  tableData.allRows.forEach((row, idx) => {
    const rowIdxInExcel = startDataRow + idx;

    data.push([
      row.isFirstInDay ? `${row.dayDisplayName}\n${row.dateStr}` : '',
      row.isFirstInSession ? row.session : '',
      row.periodLabel,
      row.className,
      row.displayLessonTitle,
      row.notes,
    ]);

    if (row.isFirstInDay) {
      merges.push({
        s: { r: rowIdxInExcel, c: 0 },
        e: { r: rowIdxInExcel + 6, c: 0 },
      });
    }

    if (row.isFirstInSession) {
      merges.push({
        s: { r: rowIdxInExcel, c: 1 },
        e: { r: rowIdxInExcel + row.sessionRowSpan - 1, c: 1 },
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!merges'] = merges;

  ws['!cols'] = [
    { wch: 18 }, // Thứ, ngày tháng năm
    { wch: 8 },  // Buổi
    { wch: 8 },  // Tiết
    { wch: 8 },  // Lớp
    { wch: 48 }, // Tên bài dạy
    { wch: 18 }, // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Tuần ${weekNumber}`);

  XLSX.writeFile(wb, `Lich_Bao_Giang_Tuan_${weekNumber}_${teacher.fullName.replace(/\s+/g, '_')}.xlsx`);
};


