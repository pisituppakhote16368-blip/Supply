import { BorrowRecord } from '../types';

export interface VillageDefinition {
  id: string;
  mooNumber: number;
  name: string;
  villageName: string;
  description: string;
  aliases: string[];
}

export const THAT_THONG_VILLAGES: VillageDefinition[] = [
  {
    id: 'moo-1',
    mooNumber: 1,
    name: 'หมู่ 1 บ้านธาตุ (บ้านธาตุทอง)',
    villageName: 'บ้านธาตุ / บ้านธาตุทอง',
    description: 'ที่ตั้ง รพ.สต.บ้านธาตุทอง ศูนย์กลางชุมชนตำบล',
    aliases: ['หมู่ 1', 'หมู่ที่ 1', 'ม.1', 'บ้านธาตุทอง', 'บ้านธาตุ', 'ธาตุทอง', 'ม 1'],
  },
  {
    id: 'moo-2',
    mooNumber: 2,
    name: 'หมู่ 2 บ้านหินโงม',
    villageName: 'บ้านหินโงม',
    description: 'ชุมชนบ้านหินโงม ต.ธาตุทอง',
    aliases: ['หมู่ 2', 'หมู่ที่ 2', 'ม.2', 'หินโงม', 'บ้านหินโงม', 'ม 2'],
  },
  {
    id: 'moo-3',
    mooNumber: 3,
    name: 'หมู่ 3 บ้านโนนสร้างไพ',
    villageName: 'บ้านโนนสร้างไพ',
    description: 'ชุมชนบ้านโนนสร้างไพ ต.ธาตุทอง',
    aliases: ['หมู่ 3', 'หมู่ที่ 3', 'ม.3', 'โนนสร้างไพ', 'บ้านโนนสร้างไพ', 'ม 3'],
  },
  {
    id: 'moo-4',
    mooNumber: 4,
    name: 'หมู่ 4 บ้านหนองหอย',
    villageName: 'บ้านหนองหอย',
    description: 'ชุมชนบ้านหนองหอย ต.ธาตุทอง',
    aliases: ['หมู่ 4', 'หมู่ที่ 4', 'ม.4', 'หนองหอย', 'บ้านหนองหอย', 'ม 4'],
  },
  {
    id: 'moo-5',
    mooNumber: 5,
    name: 'หมู่ 5 บ้านคันชา',
    villageName: 'บ้านคันชา',
    description: 'ชุมชนบ้านคันชา ต.ธาตุทอง',
    aliases: ['หมู่ 5', 'หมู่ที่ 5', 'ม.5', 'คันชา', 'บ้านคันชา', 'ม 5'],
  },
  {
    id: 'moo-6',
    mooNumber: 6,
    name: 'หมู่ 6 บ้านโคกหลวง',
    villageName: 'บ้านโคกหลวง',
    description: 'ชุมชนบ้านโคกหลวง ต.ธาตุทอง',
    aliases: ['หมู่ 6', 'หมู่ที่ 6', 'ม.6', 'โคกหลวง', 'บ้านโคกหลวง', 'ม 6'],
  },
  {
    id: 'moo-7',
    mooNumber: 7,
    name: 'หมู่ 7 บ้านเดิด',
    villageName: 'บ้านเดิด',
    description: 'ชุมชนบ้านเดิด ต.ธาตุทอง',
    aliases: ['หมู่ 7', 'หมู่ที่ 7', 'ม.7', 'เดิด', 'บ้านเดิด', 'ม 7'],
  },
  {
    id: 'moo-8',
    mooNumber: 8,
    name: 'หมู่ 8 บ้านเดื่อ',
    villageName: 'บ้านเดื่อ',
    description: 'ชุมชนบ้านเดื่อ ต.ธาตุทอง',
    aliases: ['หมู่ 8', 'หมู่ที่ 8', 'ม.8', 'เดื่อ', 'บ้านเดื่อ', 'ม 8'],
  },
];

export const OTHER_VILLAGE: VillageDefinition = {
  id: 'moo-other',
  mooNumber: 99,
  name: 'นอกเขต / อื่นๆ',
  villageName: 'นอกเขต ต.ธาตุทอง',
  description: 'ผู้ป่วยนอกเขตตำบลธาตุทอง หรือไม่ระบุหมู่บ้านชัดเจน',
  aliases: ['นอกเขต', 'อื่นๆ', 'ต่างตำบล', 'ต่างอำเภอ'],
};

/**
 * Normalizes Thai numerals into Arabic digits
 */
function normalizeThaiNumerals(str: string): string {
  const thaiNumerals = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  let res = str;
  thaiNumerals.forEach((ch, idx) => {
    res = res.replaceAll(ch, String(idx));
  });
  return res;
}

/**
 * Identifies which village in That Thong a borrow record belongs to
 */
export function identifyVillage(address: string, explicitVillage?: string): VillageDefinition {
  if (explicitVillage) {
    const directMatch = THAT_THONG_VILLAGES.find(
      (v) =>
        v.name.includes(explicitVillage) ||
        explicitVillage.includes(v.villageName) ||
        explicitVillage.includes(`หมู่ ${v.mooNumber}`) ||
        explicitVillage.includes(`หมู่ที่ ${v.mooNumber}`)
    );
    if (directMatch) return directMatch;
  }

  if (!address) return OTHER_VILLAGE;

  const normalized = normalizeThaiNumerals(address);

  // Check for regex like "หมู่ 1" or "หมู่ที่ 1" or "ม.1"
  const mooMatch = normalized.match(/(?:หมู่ที่|หมู่|ม\.)\s*([1-8])\b/);
  if (mooMatch && mooMatch[1]) {
    const mooNum = parseInt(mooMatch[1], 10);
    const found = THAT_THONG_VILLAGES.find((v) => v.mooNumber === mooNum);
    if (found) return found;
  }

  // Check for village names in address
  for (const village of THAT_THONG_VILLAGES) {
    for (const alias of village.aliases) {
      if (normalized.includes(alias)) {
        return village;
      }
    }
  }

  return OTHER_VILLAGE;
}

export interface VillageEquipmentStat {
  equipmentName: string;
  count: number;
  units: {
    unitNumber: number;
    assetCode: string;
    patientName: string;
    borrowDate: string;
    dueDate: string;
    isOverdue: boolean;
  }[];
}

export interface VillageSummaryData {
  village: VillageDefinition;
  activeRecords: BorrowRecord[];
  allRecords: BorrowRecord[];
  activeCount: number;
  overdueCount: number;
  returnedCount: number;
  uniqueActivePatientsCount: number;
  equipmentStats: VillageEquipmentStat[];
}

/**
 * Aggregates all borrow records by village
 */
export function aggregateVillageSummaries(records: BorrowRecord[]): VillageSummaryData[] {
  const allVillages = [...THAT_THONG_VILLAGES, OTHER_VILLAGE];

  return allVillages.map((village) => {
    // Find all records belonging to this village
    const villageRecords = records.filter((r) => {
      const identified = identifyVillage(r.patientAddress, r.village);
      return identified.id === village.id;
    });

    const activeRecords = villageRecords.filter((r) => r.status === 'active' || r.status === 'overdue');
    const overdueRecords = villageRecords.filter((r) => r.status === 'overdue');
    const returnedRecords = villageRecords.filter((r) => r.status === 'returned');

    // Unique active patient names
    const activePatientSet = new Set<string>();
    activeRecords.forEach((r) => {
      if (r.patientName) activePatientSet.add(r.patientName.trim());
    });

    // Group active records by equipment name
    const equipMap = new Map<string, VillageEquipmentStat>();
    activeRecords.forEach((r) => {
      const eqName = r.equipmentName || 'อุปกรณ์ไม่ระบุชื่อ';
      if (!equipMap.has(eqName)) {
        equipMap.set(eqName, {
          equipmentName: eqName,
          count: 0,
          units: [],
        });
      }
      const entry = equipMap.get(eqName)!;
      entry.count += 1;
      entry.units.push({
        unitNumber: r.unitNumber,
        assetCode: r.assetCode,
        patientName: r.patientName,
        borrowDate: r.borrowDate,
        dueDate: r.dueDate,
        isOverdue: r.status === 'overdue',
      });
    });

    const equipmentStats = Array.from(equipMap.values()).sort((a, b) => b.count - a.count);

    return {
      village,
      activeRecords,
      allRecords: villageRecords,
      activeCount: activeRecords.length,
      overdueCount: overdueRecords.length,
      returnedCount: returnedRecords.length,
      uniqueActivePatientsCount: activePatientSet.size,
      equipmentStats,
    };
  });
}
