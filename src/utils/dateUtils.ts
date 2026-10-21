// Thai date formatting and date math utilities

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * Format YYYY-MM-DD to Thai date string (e.g., 20 ต.ค. 2569)
 */
export function formatThaiDate(dateStr: string | null | undefined, full: boolean = false): string {
  if (!dateStr) return '-';
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

    const thaiYear = year + 543;
    const monthName = full ? THAI_MONTHS_FULL[month] : THAI_MONTHS_SHORT[month];
    return `${day} ${monthName} ${thaiYear}`;
  } catch {
    return dateStr;
  }
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate difference in days between two YYYY-MM-DD dates (d2 - d1)
 */
export function getDaysDiff(dateStr1: string, dateStr2: string): number {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1).getTime();
  const date2 = new Date(y2, m2 - 1, d2).getTime();
  const diffTime = date2 - date1;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates loan duration status:
 * - If returned: calculates how many total days borrowed and if returned after dueDate.
 * - If active: calculates remaining days or overdue days relative to today.
 */
export function calculateOverdueInfo(borrowDate: string, dueDate: string, returnDate: string | null): {
  isOverdue: boolean;
  overdueDays: number;
  remainingDays: number;
  totalDaysUsed: number;
  statusText: string;
} {
  const today = getTodayString();
  const effectiveEndDate = returnDate || today;

  const totalDaysUsed = Math.max(0, getDaysDiff(borrowDate, effectiveEndDate));
  const diffFromDue = getDaysDiff(dueDate, effectiveEndDate);

  if (returnDate) {
    if (diffFromDue > 0) {
      return {
        isOverdue: true,
        overdueDays: diffFromDue,
        remainingDays: 0,
        totalDaysUsed,
        statusText: `คืนแล้ว (เกินกำหนด ${diffFromDue} วัน)`
      };
    } else {
      return {
        isOverdue: false,
        overdueDays: 0,
        remainingDays: 0,
        totalDaysUsed,
        statusText: `คืนตรงเวลา (ใช้ไป ${totalDaysUsed} วัน)`
      };
    }
  } else {
    // Currently active
    if (diffFromDue > 0) {
      return {
        isOverdue: true,
        overdueDays: diffFromDue,
        remainingDays: 0,
        totalDaysUsed,
        statusText: `เกินกำหนด ${diffFromDue} วัน`
      };
    } else {
      const remainingDays = Math.abs(diffFromDue);
      return {
        isOverdue: false,
        overdueDays: 0,
        remainingDays,
        totalDaysUsed,
        statusText: remainingDays === 0 ? 'ครบกำหนดวันนี้' : `เหลืออีก ${remainingDays} วัน`
      };
    }
  }
}
