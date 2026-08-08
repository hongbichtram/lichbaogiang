import * as XLSX from 'xlsx';
import { PPCTItem, PPCTCurriculum } from '../types';

export interface ParsedPPCTRow {
  rowIndex: number; // 1-based row index in file
  week: number;
  periodNumber: number;
  title: string;
  periodsCount: number;
  topic?: string;
  requirements?: string;
  notes?: string;
  errors: string[];
}

export interface ParsedPPCTResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  rows: ParsedPPCTRow[];
  warnings: string[];
}

/**
 * Downloads a standard PPCT template as Excel file (.xlsx)
 */
export function downloadPPCTTemplate(): void {
  const sampleData = [
    {
      'Tuần': 1,
      'Tiết PPCT': 1,
      'Tên bài dạy': 'Bài 1. Máy tính và em (Tiết 1)',
      'Số tiết': 1,
      'Chủ đề': 'Chủ đề A. Máy tính và em',
      'Yêu cầu cần đạt': 'Nhận biết các thành phần cơ bản của máy tính',
      'Ghi chú': 'Sử dụng phòng máy',
    },
    {
      'Tuần': 1,
      'Tiết PPCT': 2,
      'Tên bài dạy': 'Bài 1. Máy tính và em (Tiết 2)',
      'Số tiết': 1,
      'Chủ đề': 'Chủ đề A. Máy tính và em',
      'Yêu cầu cần đạt': 'Thực hành thao tác bật tắt máy tính an toàn',
      'Ghi chú': '',
    },
    {
      'Tuần': 2,
      'Tiết PPCT': 3,
      'Tên bài dạy': 'Bài 2. Thông tin và dữ liệu',
      'Số tiết': 1,
      'Chủ đề': 'Chủ đề A. Máy tính và em',
      'Yêu cầu cần đạt': 'Phân biệt được thông tin và dữ liệu trong thực tế',
      'Ghi chú': '',
    },
    {
      'Tuần': 2,
      'Tiết PPCT': 4,
      'Tên bài dạy': 'Bài 3. Xử lý thông tin',
      'Số tiết': 1,
      'Chủ đề': 'Chủ đề A. Máy tính và em',
      'Yêu cầu cần đạt': 'Nêu được các bước xử lý thông tin cơ bản',
      'Ghi chú': '',
    },
    {
      'Tuần': 3,
      'Tiết PPCT': 5,
      'Tên bài dạy': 'Bài 4. Sử dụng bàn phím máy tính',
      'Số tiết': 1,
      'Chủ đề': 'Chủ đề B. Mạng máy tính và Internet',
      'Yêu cầu cần đạt': 'Biết vị trí và thao tác gõ phím đúng cách',
      'Ghi chú': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Tuần
    { wch: 12 }, // Tiết PPCT
    { wch: 38 }, // Tên bài dạy
    { wch: 10 }, // Số tiết
    { wch: 28 }, // Chủ đề
    { wch: 45 }, // Yêu cầu cần đạt
    { wch: 18 }, // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PPCT_Mau');
  XLSX.writeFile(wb, 'Mau_Phan_Phoi_Chuong_Trinh_Tieu_Hoc.xlsx');
}

/**
 * Exports an existing PPCT Curriculum to Excel file
 */
export function exportPPCTToExcel(curriculum: PPCTCurriculum): void {
  const exportRows = curriculum.items.map(item => ({
    'Tuần': item.week,
    'Tiết PPCT': item.periodNumber,
    'Tên bài dạy': item.title,
    'Số tiết': 1,
    'Chủ đề': item.topic || '',
    'Yêu cầu cần đạt': item.requirements || '',
    'Ghi chú': item.note || '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 40 },
    { wch: 10 },
    { wch: 28 },
    { wch: 45 },
    { wch: 18 },
  ];

  const fileName = `PPCT_${curriculum.subject}_${curriculum.grade}_${curriculum.textbook}.xlsx`.replace(/\s+/g, '_');
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PPCT');
  XLSX.writeFile(wb, fileName);
}

/**
 * Reads and validates PPCT Excel File
 */
export async function parseAndValidatePPCTExcel(file: File): Promise<ParsedPPCTResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (workbook.SheetNames.length === 0) {
          throw new Error('File Excel không có sheet dữ liệu nào.');
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert worksheet to 2D array matrix
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('File Excel rỗng hoặc không có dữ liệu.');
        }

        // Find header row index
        let headerRowIdx = -1;
        let colMap = {
          week: -1,
          period: -1,
          title: -1,
          periodsCount: -1,
          topic: -1,
          requirements: -1,
          notes: -1,
        };

        for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
          const row = rawRows[r] || [];
          const rowStr = row.map(cell => String(cell || '').toLowerCase().trim());

          let foundTitle = rowStr.findIndex(s => s.includes('tên bài') || s.includes('ten bai') || s.includes('bài dạy') || s.includes('nội dung'));
          let foundPeriod = rowStr.findIndex(s => s.includes('tiết ppct') || s.includes('tiet ppct') || s.includes('tiết') || s.includes('tiet'));
          let foundWeek = rowStr.findIndex(s => s.includes('tuần') || s.includes('tuan') || s.includes('week'));

          if (foundTitle !== -1 || (foundPeriod !== -1 && foundWeek !== -1)) {
            headerRowIdx = r;
            colMap.week = foundWeek;
            colMap.period = foundPeriod;
            colMap.title = foundTitle;
            colMap.periodsCount = rowStr.findIndex(s => s.includes('số tiết') || s.includes('so tiet') || s.includes('thời lượng'));
            colMap.topic = rowStr.findIndex(s => s.includes('chủ đề') || s.includes('chu de') || s.includes('mạch'));
            colMap.requirements = rowStr.findIndex(s => s.includes('yêu cầu') || s.includes('yccd') || s.includes('chuẩn'));
            colMap.notes = rowStr.findIndex(s => s.includes('ghi chú') || s.includes('ghi chu'));
            break;
          }
        }

        // Fallbacks if headers weren't found by string match
        if (headerRowIdx === -1) {
          headerRowIdx = 0; // assume first row is header
          colMap = { week: 0, period: 1, title: 2, periodsCount: 3, topic: 4, requirements: 5, notes: 6 };
        } else {
          // Fill fallback column indices if some are missing
          if (colMap.week === -1) colMap.week = 0;
          if (colMap.period === -1) colMap.period = colMap.week === 0 ? 1 : 0;
          if (colMap.title === -1) colMap.title = 2;
        }

        const parsedRows: ParsedPPCTRow[] = [];
        const seenPeriods = new Set<number>();
        const seenWeeks = new Set<number>();
        const warnings: string[] = [];

        let validCount = 0;
        let invalidCount = 0;

        for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
            continue; // Skip empty row
          }

          const rawWeek = row[colMap.week];
          const rawPeriod = row[colMap.period];
          const rawTitle = row[colMap.title];
          const rawCount = colMap.periodsCount !== -1 ? row[colMap.periodsCount] : 1;
          const rawTopic = colMap.topic !== -1 ? row[colMap.topic] : '';
          const rawReqs = colMap.requirements !== -1 ? row[colMap.requirements] : '';
          const rawNotes = colMap.notes !== -1 ? row[colMap.notes] : '';

          const errors: string[] = [];

          // Parse numbers
          const weekNum = parseInt(String(rawWeek || '').replace(/\D+/g, ''), 10);
          const periodNum = parseInt(String(rawPeriod || '').replace(/\D+/g, ''), 10);
          const titleStr = String(rawTitle || '').trim();
          const periodsCountNum = parseInt(String(rawCount || '1').replace(/\D+/g, ''), 10) || 1;

          if (isNaN(weekNum) || weekNum <= 0) {
            errors.push('Thiếu hoặc sai số Tuần');
          } else {
            seenWeeks.add(weekNum);
          }

          if (isNaN(periodNum) || periodNum <= 0) {
            errors.push('Thiếu hoặc sai số Tiết PPCT');
          } else if (seenPeriods.has(periodNum)) {
            errors.push(`Tiết PPCT ${periodNum} bị trùng lặp`);
          } else {
            seenPeriods.add(periodNum);
          }

          if (!titleStr) {
            errors.push('Chưa nhập Tên bài dạy');
          }

          if (errors.length === 0) {
            validCount++;
          } else {
            invalidCount++;
          }

          parsedRows.push({
            rowIndex: r + 1,
            week: isNaN(weekNum) ? 1 : weekNum,
            periodNumber: isNaN(periodNum) ? (parsedRows.length + 1) : periodNum,
            title: titleStr || 'Bài dạy chưa nhập tên',
            periodsCount: periodsCountNum,
            topic: String(rawTopic || '').trim(),
            requirements: String(rawReqs || '').trim(),
            notes: String(rawNotes || '').trim(),
            errors,
          });
        }

        // Check overall week continuity warnings
        if (parsedRows.length > 0) {
          const maxWeek = Math.max(...Array.from(seenWeeks));
          for (let w = 1; w <= maxWeek; w++) {
            if (!seenWeeks.has(w)) {
              warnings.push(`Cảnh báo: Tuần ${w} không có dữ liệu bài dạy nào.`);
            }
          }
        }

        resolve({
          totalRows: parsedRows.length,
          validCount,
          invalidCount,
          rows: parsedRows,
          warnings,
        });
      } catch (err: any) {
        reject(err?.message || 'Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng file.');
      }
    };

    reader.onerror = () => {
      reject('Đã xảy ra lỗi khi đọc file từ máy tính.');
    };

    reader.readAsArrayBuffer(file);
  });
}
