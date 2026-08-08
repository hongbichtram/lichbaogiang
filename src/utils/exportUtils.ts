import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, VerticalMergeType, VerticalAlign } from 'docx';
import * as XLSX from 'xlsx';
import { ScheduleItem, TeacherProfile } from '../types';
import { formatTableSessionPeriod, getNormalizedSession, getNormalizedPeriod } from './classUtils';

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

import { getActualDayDate } from './dateWeekUtils';

export const getWeekDayDate = (weekNumber: number, dayOfWeek: string, academicYear: string = '2025-2026'): string => {
  return getActualDayDate(weekNumber, dayOfWeek, academicYear);
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
    if (item.dayOfWeek === ('Thứ 7' as any)) return; // Exclude Saturday from exports
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

  groupsMap.forEach((items, dayKey) => {
    if (!DAYS_ORDER.includes(dayKey) && items.length > 0) {
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

export const exportWeeklyWordDoc = async (
  schedules: ScheduleItem[],
  teacher: TeacherProfile,
  weekNumber: number
) => {
  const dayGroups = groupSchedulesByDay(schedules, weekNumber, teacher.academicYear);

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 17, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Thứ, ngày tháng năm', alignment: AlignmentType.CENTER, style: 'Header' })],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Tiết', alignment: AlignmentType.CENTER, style: 'Header' })],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Lớp', alignment: AlignmentType.CENTER, style: 'Header' })],
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Tiết PPCT', alignment: AlignmentType.CENTER, style: 'Header' })],
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Tên bài dạy / Nội dung', alignment: AlignmentType.CENTER, style: 'Header' })],
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ text: 'Ghi chú', alignment: AlignmentType.CENTER, style: 'Header' })],
      }),
    ],
  });

  const tableDataRows: TableRow[] = [];

  dayGroups.forEach((group) => {
    group.items.forEach((item, itemIdx) => {
      const isFirstInGroup = itemIdx === 0;

      tableDataRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 17, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              verticalMerge: isFirstInGroup ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE,
              children: isFirstInGroup
                ? [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: group.dayDisplayName, bold: true, size: 24 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: group.dateStr, size: 20 })] }),
                  ]
                : [],
            }),
            new TableCell({
              width: { size: 8, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ text: formatTableSessionPeriod(item.period, item.session), alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 8, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ text: item.className, alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ text: item.ppctPeriod ? `${item.ppctPeriod}` : '-', alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 45, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ text: item.lessonTitle || 'Chưa cập nhật' })],
            }),
            new TableCell({
              width: { size: 12, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ text: item.notes || '', alignment: AlignmentType.LEFT })],
            }),
          ],
        })
      );
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header Teacher and School Info (No National Emblem)
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({ text: `Trường: ${teacher.schoolName || 'Tiểu học'}\n`, bold: true, size: 24 }),
              new TextRun({ text: `Giáo viên: ${teacher.fullName || 'Chưa cập nhật'} - Mã GV: ${teacher.teacherCode || 'GV01'}\n`, size: 24 }),
              new TextRun({ text: `Năm học: ${teacher.academicYear} - ${teacher.semester}\n\n`, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `LỊCH BÁO GIẢNG TUẦN ${weekNumber}`, bold: true, size: 32, color: '1E3A8A' }),
            ],
          }),
          new Paragraph({ text: '\n' }),
          // Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [tableHeaderRow, ...tableDataRows],
          }),
          new Paragraph({ text: '\n\n' }),
          // Signatures
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `..., Ngày ..... tháng ..... năm 2026\n`, italics: true, size: 22 }),
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

export const exportWeeklyExcel = (
  schedules: ScheduleItem[],
  teacher: TeacherProfile,
  weekNumber: number
) => {
  const data = [
    [`Trường: ${teacher.schoolName || 'Tiểu học'}`, `Giáo viên: ${teacher.fullName || ''}`, `Năm học: ${teacher.academicYear}`],
    [`Học kỳ: ${teacher.semester}`],
    [`LỊCH BÁO GIẢNG TUẦN ${weekNumber}`],
    [],
    ['Thứ, ngày tháng năm', 'Tiết', 'Lớp', 'Tiết PPCT', 'Tên bài dạy / Nội dung', 'Ghi chú'],
  ];

  const dayGroups = groupSchedulesByDay(schedules, weekNumber, teacher.academicYear);
  const merges: XLSX.Range[] = [];
  let currentRowIndex = 5; // Row index 5 is first data row

  dayGroups.forEach((group) => {
    const startRow = currentRowIndex;
    const numItems = group.items.length;

    group.items.forEach((item, itemIdx) => {
      data.push([
        itemIdx === 0 ? `${group.dayDisplayName}\n${group.dateStr}` : '',
        formatTableSessionPeriod(item.period, item.session),
        item.className,
        item.ppctPeriod ? item.ppctPeriod.toString() : '-',
        item.lessonTitle || '',
        item.notes || '',
      ]);
      currentRowIndex++;
    });

    if (numItems > 1) {
      merges.push({
        s: { r: startRow, c: 0 },
        e: { r: startRow + numItems - 1, c: 0 },
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!merges'] = merges;

  // Set column widths
  ws['!cols'] = [
    { wch: 18 }, // Thứ, ngày tháng năm
    { wch: 10 }, // Tiết
    { wch: 10 }, // Lớp
    { wch: 12 }, // Tiết PPCT
    { wch: 48 }, // Tên bài dạy / Nội dung
    { wch: 20 }, // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Tuần ${weekNumber}`);

  XLSX.writeFile(wb, `Lich_Bao_Giang_Tuan_${weekNumber}_${teacher.fullName.replace(/\s+/g, '_')}.xlsx`);
};

