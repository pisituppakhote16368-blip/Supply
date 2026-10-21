import { Equipment, BorrowRecord, QuotaPolicy } from '../types';

export const INITIAL_QUOTA_POLICIES: QuotaPolicy[] = [
  {
    category: 'อุปกรณ์ช่วยเคลื่อนไหว',
    name: 'รถเข็นผู้ป่วย (Wheelchair)',
    defaultDays: 90,
    maxRenewals: 2,
    requirements: 'สำเนาบัตรประชาชนผู้ป่วย + ผู้ค้ำประกัน / ใบรับรองแพทย์หรือการประเมินโดย จนท.',
    description: 'สำหรับผู้ป่วยพักฟื้นผ่าตัด ผู้สูงอายุ หรือผู้มีภาวะกล้ามเนื้ออ่อนแรงชั่วคราว'
  },
  {
    category: 'อุปกรณ์ดูแลบนเตียง',
    name: 'เตียงผู้ป่วยปรับระดับ',
    defaultDays: 180,
    maxRenewals: 3,
    requirements: 'ผลประเมิน ADL ผู้ป่วยติดบ้าน/ติดเตียง + บัตรประชาชนผู้ดูแล',
    description: 'สนับสนุนผู้ป่วยติดเตียงในตำบลธาตุทอง เพื่อลดภาระผู้ดูแลและป้องกันภาวะแทรกซ้อน'
  },
  {
    category: 'อุปกรณ์ช่วยหายใจ',
    name: 'เครื่องผลิตออกซิเจน / ถังออกซิเจน',
    defaultDays: 30,
    maxRenewals: 5,
    requirements: 'ใบสั่งแพทย์ระบุความต้องการออกซิเจน + ลงทะเบียนร่วมกับทีมหมอครอบครัว',
    description: 'ติดตามอาการโดย พยาบาลวิชาชีพ รพ.สต.ธาตุทอง ทุก 2 สัปดาห์'
  },
  {
    category: 'อุปกรณ์ดูแลบนเตียง',
    name: 'ที่นอนลมป้องกันแผลกดทับ',
    defaultDays: 120,
    maxRenewals: 2,
    requirements: 'แบบประเมินความเสี่ยงแผลกดทับ (Braden Scale < 14)',
    description: 'ลดแรงกดทับ ป้องกันการเกิดแผลกดทับระดับ 1-4'
  },
  {
    category: 'อุปกรณ์ช่วยเคลื่อนไหว',
    name: 'โครงช่วยเดิน (Walker) / ไม้ค้ำยัน',
    defaultDays: 60,
    maxRenewals: 2,
    requirements: 'ประเมินการทรงตัวและฝึกเดินโดยนักกายภาพ/พยาบาล',
    description: 'สำหรับฝึกเดินและกายภาพบำบัดฟื้นฟูสมรรถภาพ'
  }
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-wheelchair',
    name: 'รถเข็นนั่งมาตรฐาน (Wheelchair)',
    category: 'อุปกรณ์ช่วยเคลื่อนไหว',
    quotaDays: 90,
    imageUrl: '/src/assets/images/wheelchair_medical_1792486050157.jpg',
    description: 'รถเข็นพับเก็บได้ โครงเหล็กชุบโครเมียม เบาะหนังเทียมทำความสะอาดง่าย มีเบรกมือและเบรกล้อ',
    totalUnits: 4,
    units: [
      {
        id: 'unit-wc-01',
        unitNumber: 1,
        assetCode: 'รพ.สต.ทธ-66-วช-001',
        serialNumber: 'WC-2023-0881',
        intakeDate: '2023-05-10',
        condition: 'สภาพดี',
        status: 'available'
      },
      {
        id: 'unit-wc-02',
        unitNumber: 2,
        assetCode: 'รพ.สต.ทธ-66-วช-002',
        serialNumber: 'WC-2023-0882',
        intakeDate: '2023-05-10',
        condition: 'สภาพดี',
        status: 'available'
      },
      {
        id: 'unit-wc-03',
        unitNumber: 3,
        assetCode: 'รพ.สต.ทธ-67-วช-003',
        serialNumber: 'WC-2024-1104',
        intakeDate: '2024-02-18',
        condition: 'สภาพดี',
        status: 'available'
      },
      {
        id: 'unit-wc-04',
        unitNumber: 4,
        assetCode: 'รพ.สต.ทธ-67-วช-004',
        serialNumber: 'WC-2024-1105',
        intakeDate: '2024-08-01',
        condition: 'สภาพดี',
        status: 'available'
      }
    ]
  },
  {
    id: 'eq-bed',
    name: 'เตียงผู้ป่วยปรับระดับ 2 ไกร์',
    category: 'อุปกรณ์ดูแลบนเตียง',
    quotaDays: 180,
    imageUrl: '/src/assets/images/hospital_bed_care_1792486050541.jpg',
    description: 'เตียงผู้ป่วยพร้อมราวกั้นสแตนเลสแบบสไลด์ เบาะหนังกันน้ำ ปรับพนักพิงหลังและชันเข่าได้',
    totalUnits: 3,
    units: [
      {
        id: 'unit-bed-01',
        unitNumber: 1,
        assetCode: 'รพ.สต.ทธ-65-ตย-001',
        serialNumber: 'BED-65-021',
        intakeDate: '2022-09-14',
        condition: 'สภาพดี',
        status: 'available'
      },
      {
        id: 'unit-bed-02',
        unitNumber: 2,
        assetCode: 'รพ.สต.ทธ-66-ตย-002',
        serialNumber: 'BED-66-045',
        intakeDate: '2023-11-20',
        condition: 'สภาพดี',
        status: 'available'
      },
      {
        id: 'unit-bed-03',
        unitNumber: 3,
        assetCode: 'รพ.สต.ทธ-67-ตย-003',
        serialNumber: 'BED-67-009',
        intakeDate: '2024-04-05',
        condition: 'สภาพดี',
        status: 'available'
      }
    ]
  },
  {
    id: 'eq-oxygen',
    name: 'เครื่องผลิตออกซิเจน 5 ลิตร',
    category: 'อุปกรณ์ช่วยหายใจ',
    quotaDays: 30,
    imageUrl: '/src/assets/images/oxygen_concentrator_1792486051328.jpg',
    description: 'เครื่องผลิตออกซิเจนความเข้มข้นสูง พร้อมระบบแจ้งเตือนความดันและสายให้ออกซิเจน',
    totalUnits: 2,
    units: [
      {
        id: 'unit-ox-01',
        unitNumber: 1,
        assetCode: 'รพ.สต.ทธ-67-อก-001',
        serialNumber: 'OX-5L-7740',
        intakeDate: '2024-01-12',
        condition: 'สภาพดี',
        status: 'available'
      },
      {
        id: 'unit-ox-02',
        unitNumber: 2,
        assetCode: 'รพ.สต.ทธ-68-อก-002',
        serialNumber: 'OX-5L-8911',
        intakeDate: '2025-01-15',
        condition: 'สภาพดี',
        status: 'available'
      }
    ]
  },
  {
    id: 'eq-airmattress',
    name: 'ที่นอนลมป้องกันแผลกดทับ (แบบลอน)',
    category: 'อุปกรณ์ดูแลบนเตียง',
    quotaDays: 120,
    imageUrl: '/src/assets/images/air_mattress_medical_1792486051638.jpg',
    description: 'ที่นอนลมสลับความดันพร้อมเครื่องปั๊มลมอัตโนมัติเสียงเงียบ วัสดุไนลอนเคลือบพีวีซี',
    totalUnits: 3,
    units: [
      {
        id: 'unit-am-01',
        unitNumber: 1,
        assetCode: 'รพ.สต.ทธ-66-นน-001',
        serialNumber: 'AM-66-302',
        intakeDate: '2023-07-22',
        condition: 'สภาพดี',
        status: 'available'
      },
      {
        id: 'unit-am-02',
        unitNumber: 2,
        assetCode: 'รพ.สต.ทธ-67-นน-002',
        serialNumber: 'AM-67-410',
        intakeDate: '2024-06-11',
        condition: 'สภาพดี',
        status: 'available'
      },
      {
        id: 'unit-am-03',
        unitNumber: 3,
        assetCode: 'รพ.สต.ทธ-67-นน-003',
        serialNumber: 'AM-67-512',
        intakeDate: '2024-10-05',
        condition: 'สภาพดี',
        status: 'available'
      }
    ]
  },
  {
    id: 'eq-walker',
    name: 'โครงช่วยเดิน 4 ขา พับได้ (Walker)',
    category: 'อุปกรณ์ช่วยเคลื่อนไหว',
    quotaDays: 60,
    imageUrl: '/src/assets/images/walker_mobility_frame_1792486051599.jpg',
    description: 'โครงช่วยเดินอลูมิเนียมน้ำหนักเบา ปรับความสูงได้ 8 ระดับ มียางกันลื่นทั้ง 4 ขา',
    totalUnits: 4,
    units: [
      {
        id: 'unit-wk-01',
        unitNumber: 1,
        assetCode: 'รพ.สต.ทธ-66-วก-001',
        serialNumber: 'WK-66-101',
        intakeDate: '2023-03-01',
        condition: 'สภาพดี',
        status: 'available'
      },
      {
        id: 'unit-wk-02',
        unitNumber: 2,
        assetCode: 'รพ.สต.ทธ-66-วก-002',
        serialNumber: 'WK-66-102',
        intakeDate: '2023-03-01',
        condition: 'สภาพดี',
        status: 'available'
      },
      {
        id: 'unit-wk-03',
        unitNumber: 3,
        assetCode: 'รพ.สต.ทธ-67-วก-003',
        serialNumber: 'WK-67-201',
        intakeDate: '2024-05-19',
        condition: 'สภาพดี',
        status: 'available'
      },
      {
        id: 'unit-wk-04',
        unitNumber: 4,
        assetCode: 'รพ.สต.ทธ-68-วก-004',
        serialNumber: 'WK-68-301',
        intakeDate: '2025-02-10',
        condition: 'สภาพดี',
        status: 'available'
      }
    ]
  }
];

// Clean state for production readiness: 0 sample borrowings
export const INITIAL_BORROW_RECORDS: BorrowRecord[] = [];
