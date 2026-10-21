import * as XLSX from 'xlsx';
import { BorrowRecord } from '../types';
import { formatThaiDate, calculateOverdueInfo, getTodayString } from './dateUtils';

/**
 * Export borrowing records to a styled Excel (.xlsx) file
 */
export function exportBorrowRecordsToExcel(records: BorrowRecord[], filenameSuffix: string = '') {
  const data = records.map((record, index) => {
    const overdueInfo = calculateOverdueInfo(
      record.borrowDate,
      record.dueDate,
      record.returnDate
    );

    let statusThai = 'กำลังยืม';
    if (record.returnDate) {
      statusThai = overdueInfo.isOverdue ? 'คืนแล้ว (เกินกำหนด)' : 'คืนแล้ว (ปกติ)';
    } else if (overdueInfo.isOverdue) {
      statusThai = `เกินกำหนด (${overdueInfo.overdueDays} วัน)`;
    }

    return {
      'ลำดับ': index + 1,
      'รหัสการยืม': record.id,
      'วันที่ยืม': formatThaiDate(record.borrowDate),
      'กำหนดส่งคืน': formatThaiDate(record.dueDate),
      'วันที่คืนจริง': record.returnDate ? formatThaiDate(record.returnDate) : 'ยังไม่ส่งคืน',
      'สถานะการยืม': statusThai,
      'จำนวนวันเกินกำหนด (วัน)': overdueInfo.isOverdue ? overdueInfo.overdueDays : 0,
      'ระยะเวลาใช้งานจริง (วัน)': overdueInfo.totalDaysUsed,
      'ชื่อ-นามสกุล ผู้ป่วย': record.patientName,
      'เลขประจำตัวประชาชน': record.patientIdCard || '-',
      'เบอร์โทรศัพท์': record.patientPhone,
      'ที่อยู่ / หมู่บ้าน': record.patientAddress,
      'รายการอุปกรณ์': record.equipmentName,
      'คัน/ชิ้นที่': record.unitNumber,
      'เลขครุภัณฑ์': record.assetCode,
      'โควต้าระยะเวลา (วัน)': record.quotaDays,
      'สภาพตอนคืน': record.returnedCondition || '-',
      'หมายเหตุการคืน': record.returnNote || '-',
      'เจ้าหน้าที่ผู้ให้ยืม': record.lenderStaff || '-',
      'เจ้าหน้าที่ผู้รับคืน': record.receiverStaff || '-',
      'หมายเหตุ / วินิจฉัย': record.remarks || '-',
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for comfortable reading
  worksheet['!cols'] = [
    { wch: 6 },  // ลำดับ
    { wch: 14 }, // รหัสการยืม
    { wch: 15 }, // วันที่ยืม
    { wch: 15 }, // กำหนดส่งคืน
    { wch: 15 }, // วันที่คืนจริง
    { wch: 22 }, // สถานะ
    { wch: 18 }, // เกินกำหนด
    { wch: 18 }, // ระยะเวลาใช้
    { wch: 24 }, // ชื่อผู้ป่วย
    { wch: 20 }, // เลขบัตร ปชช.
    { wch: 15 }, // เบอร์โทร
    { wch: 35 }, // ที่อยู่
    { wch: 28 }, // อุปกรณ์
    { wch: 10 }, // คันที่
    { wch: 20 }, // เลขครุภัณฑ์
    { wch: 14 }, // โควต้า
    { wch: 25 }, // สภาพตอนคืน
    { wch: 25 }, // หมายเหตุคืน
    { wch: 22 }, // จนท.ให้ยืม
    { wch: 22 }, // จนท.รับคืน
    { wch: 30 }, // หมายเหตุ
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ประวัติการยืม-คืน');

  // Generate file name
  const today = getTodayString();
  const filename = `รายงานประวัติการยืมของ_รพสต_ธาตุทอง_${today}${filenameSuffix ? `_${filenameSuffix}` : ''}.xlsx`;

  // Trigger download
  XLSX.writeFile(workbook, filename);
}
