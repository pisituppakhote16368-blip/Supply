export type EquipmentStatus = 'available' | 'borrowed' | 'repair';

export interface EquipmentUnit {
  id: string;
  unitNumber: number; // เช่น คันที่ 1, คันที่ 2
  assetCode: string; // เลขครุภัณฑ์ เช่น ทธ-67-วช-001
  serialNumber?: string;
  intakeDate: string; // วันที่นำเข้าย้อนหลัง YYYY-MM-DD
  condition: 'ปกติ' | 'สภาพดี' | 'พอใช้' | 'ชำรุดรอซ่อม';
  status: EquipmentStatus;
  currentBorrowRecordId?: string;
  imageUrl?: string; // รูปภาพประจำชิ้น (ถ่ายจากกล้อง หรือเลือกจากแกลเลอรี่)
  notes?: string;
}

export interface Equipment {
  id: string;
  name: string; // e.g. รถเข็นผู้ป่วย (Wheelchair)
  category: string; // หมวดหมู่
  quotaDays: number; // โควต้าระยะการยืม (วัน)
  imageUrl: string;
  description: string;
  totalUnits: number;
  units: EquipmentUnit[];
}

export interface BorrowRecord {
  id: string;
  patientName: string; // ชื่อ-นามสกุล ผู้ป่วย/ผู้ยืม
  patientIdCard: string; // เลขประจำตัวประชาชน
  patientPhone: string; // เบอร์โทรศัพท์
  patientAddress: string; // ที่อยู่
  patientPhoto: string; // รูปถ่ายผู้ป่วย/ผู้ยืม
  equipmentId: string;
  equipmentName: string;
  unitId: string;
  unitNumber: number;
  assetCode: string; // เลขครุภัณฑ์
  borrowDate: string; // วันที่ยืม YYYY-MM-DD
  quotaDays: number; // โควต้าระยะเวลา (วัน)
  dueDate: string; // กำหนดคืน YYYY-MM-DD
  returnDate: string | null; // วันที่คืน YYYY-MM-DD
  returnedCondition?: string; // สภาพเมื่อส่งคืน
  returnNote?: string;
  receiverStaff?: string; // เจ้าหน้าที่ผู้รับคืน
  lenderStaff: string; // เจ้าหน้าที่ผู้ให้ยืม
  status: 'active' | 'returned' | 'overdue';
  overdueDays?: number; // จำนวนวันที่เกินกำหนด
  remarks?: string;
}

export interface QuotaPolicy {
  category: string;
  name: string;
  defaultDays: number;
  maxRenewals: number;
  requirements: string;
  description: string;
}
