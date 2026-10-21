import React, { useState } from 'react';
import { 
  Plus, 
  Package, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Calendar, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  Check, 
  Info,
  ExternalLink,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Edit3
} from 'lucide-react';
import { Equipment, EquipmentUnit } from '../types';
import { formatThaiDate } from '../utils/dateUtils';

interface InventorySectionProps {
  equipments: Equipment[];
  onOpenAddEquipment: () => void;
  onOpenAddUnit: (equipment: Equipment) => void;
  onOpenLendUnit: (equipment: Equipment, unit: EquipmentUnit) => void;
  onToggleUnitRepair: (equipmentId: string, unitId: string, currentStatus: string) => void;
  onDeleteEquipment?: (equipmentId: string) => void;
  onDeleteUnit?: (equipmentId: string, unitId: string) => void;
  onOpenEditEquipment?: (equipment: Equipment) => void;
  onOpenEditUnit?: (equipment: Equipment, unit: EquipmentUnit) => void;
  initialStatusFilter?: 'all' | 'available' | 'borrowed' | 'repair';
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  equipments,
  onOpenAddEquipment,
  onOpenAddUnit,
  onOpenLendUnit,
  onToggleUnitRepair,
  onDeleteEquipment,
  onDeleteUnit,
  onOpenEditEquipment,
  onOpenEditUnit,
  initialStatusFilter = 'all',
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'borrowed' | 'repair'>(
    initialStatusFilter
  );

  // Keep track of which equipment items are expanded to show unit tracking details
  const [expandedEquipmentIds, setExpandedEquipmentIds] = useState<Record<string, boolean>>({
    'eq-wheelchair': true,
    'eq-bed': true,
  });

  // Delete Confirmation / Blocked Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'equipment' | 'unit';
    equipment: Equipment;
    unit?: EquipmentUnit;
    blockedReason?: string;
  } | null>(null);

  // When initialStatusFilter or statusFilter changes, auto-expand items that have matching units
  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  React.useEffect(() => {
    if (statusFilter !== 'all') {
      const expanded: Record<string, boolean> = {};
      equipments.forEach((eq) => {
        const units = Array.isArray(eq.units) ? eq.units : [];
        const hasMatchingUnit = units.some((u) => u.status === statusFilter);
        if (hasMatchingUnit) {
          expanded[eq.id] = true;
        }
      });
      setExpandedEquipmentIds((prev) => ({ ...prev, ...expanded }));
    }
  }, [statusFilter, equipments]);

  const toggleExpand = (equipmentId: string) => {
    setExpandedEquipmentIds((prev) => ({
      ...prev,
      [equipmentId]: !prev[equipmentId],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    equipments.forEach((eq) => {
      allExpanded[eq.id] = true;
    });
    setExpandedEquipmentIds(allExpanded);
  };

  const collapseAll = () => {
    setExpandedEquipmentIds({});
  };

  // Grand totals safely
  const totalUnits = equipments.reduce(
    (sum, eq) => sum + (Array.isArray(eq.units) ? eq.units.length : (Number(eq.totalUnits) || 0)),
    0
  );
  const totalAvailable = equipments.reduce(
    (sum, eq) => sum + (Array.isArray(eq.units) ? eq.units.filter((u) => u.status === 'available').length : 0),
    0
  );
  const totalBorrowed = equipments.reduce(
    (sum, eq) => sum + (Array.isArray(eq.units) ? eq.units.filter((u) => u.status === 'borrowed').length : 0),
    0
  );
  const totalRepair = equipments.reduce(
    (sum, eq) => sum + (Array.isArray(eq.units) ? eq.units.filter((u) => u.status === 'repair').length : 0),
    0
  );

  // Handlers for initiating deletion
  const handleDeleteEquipmentRequest = (equipment: Equipment) => {
    const units = Array.isArray(equipment.units) ? equipment.units : [];
    const borrowedUnits = units.filter((u) => u.status === 'borrowed');
    if (borrowedUnits.length > 0) {
      setDeleteTarget({
        type: 'equipment',
        equipment,
        blockedReason: `ไม่สามารถลบอุปกรณ์ "${equipment.name}" ได้ เนื่องจากยังมี ${borrowedUnits.length} ชิ้นที่กำลังถูกยืมใช้งานอยู่ โปรดบันทึกการรับคืนอุปกรณ์ให้ครบก่อนลบออกจากระบบ`,
      });
    } else {
      setDeleteTarget({
        type: 'equipment',
        equipment,
      });
    }
  };

  const handleDeleteUnitRequest = (equipment: Equipment, unit: EquipmentUnit) => {
    if (unit.status === 'borrowed') {
      setDeleteTarget({
        type: 'unit',
        equipment,
        unit,
        blockedReason: `ไม่สามารถลบชิ้นที่ ${unit.unitNumber} (${unit.assetCode}) ได้ เนื่องจากกำลังถูกยืมใช้งานอยู่ โปรดบันทึกการรับคืนก่อนลบ`,
      });
    } else {
      setDeleteTarget({
        type: 'unit',
        equipment,
        unit,
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Primary Action: มีปุ่มกดเพิ่มอุปกรณ์ ที่นำมาปล่อยให้ยืมได้ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            คลังอุปกรณ์ทางการแพทย์
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ทะเบียนพัสดุครุภัณฑ์ ประวัติการนำเข้าย้อนหลังแยกรายชิ้น และสถานะความพร้อมใช้งาน
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            ขยายทั้งหมด
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            ย่อทั้งหมด
          </button>

          {/* มีปุ่มกดเพิ่มอุปกรณ์ ที่นำมาปล่อยให้ยืมได้ */}
          <button
            type="button"
            onClick={onOpenAddEquipment}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มอุปกรณ์ใหม่</span>
          </button>
        </div>
      </div>

      {/* บอกจำนวนทั้งหมด & ตัวกรองสถานะ (Interactive Filter Buttons) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: All */}
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className={`text-xs font-semibold ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            จำนวนทั้งหมดในคลัง
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums mt-1">
            {totalUnits} <span className="text-xs font-normal opacity-70">ชิ้น</span>
          </div>
          <div className={`text-[11px] mt-1 ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
            {statusFilter === 'all' ? '✓ กำลังแสดงทั้งหมด' : `จาก ${equipments.length} หมวดรายการ`}
          </div>
        </button>

        {/* Card 2: พร้อมให้ยืม */}
        <button
          type="button"
          onClick={() => setStatusFilter('available')}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'available'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 shadow-2xs'
          }`}
        >
          <div className={`text-xs font-semibold ${statusFilter === 'available' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            พร้อมให้ยืม
          </div>
          <div className={`text-2xl sm:text-3xl font-bold tabular-nums mt-1 ${statusFilter === 'available' ? 'text-white' : 'text-emerald-700'}`}>
            {totalAvailable} <span className="text-xs font-normal opacity-80">ชิ้น</span>
          </div>
          <div className={`text-[11px] mt-1 ${statusFilter === 'available' ? 'text-emerald-100' : 'text-emerald-600/80'}`}>
            {statusFilter === 'available' ? '✓ กำลังกรองเฉพาะพร้อมใช้' : 'คลิกเพื่อดูเฉพาะที่ว่าง'}
          </div>
        </button>

        {/* Card 3: กำลังปล่อยให้ยืม */}
        <button
          type="button"
          onClick={() => setStatusFilter('borrowed')}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'borrowed'
              ? 'bg-sky-700 text-white border-sky-700 shadow-sm ring-2 ring-sky-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300 shadow-2xs'
          }`}
        >
          <div className={`text-xs font-semibold ${statusFilter === 'borrowed' ? 'text-sky-100' : 'text-sky-700'}`}>
            กำลังปล่อยให้ยืม
          </div>
          <div className={`text-2xl sm:text-3xl font-bold tabular-nums mt-1 ${statusFilter === 'borrowed' ? 'text-white' : 'text-sky-700'}`}>
            {totalBorrowed} <span className="text-xs font-normal opacity-80">ชิ้น</span>
          </div>
          <div className={`text-[11px] mt-1 ${statusFilter === 'borrowed' ? 'text-sky-100' : 'text-sky-500'}`}>
            {statusFilter === 'borrowed' ? '✓ กำลังกรองเฉพาะที่ถูกยืม' : 'คลิกเพื่อดูรายการที่ยืม'}
          </div>
        </button>

        {/* Card 4: ซ่อมบำรุง / รออะไหล่ */}
        <button
          type="button"
          onClick={() => setStatusFilter('repair')}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'repair'
              ? 'bg-amber-700 text-white border-amber-700 shadow-sm ring-2 ring-amber-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className={`text-xs font-semibold ${statusFilter === 'repair' ? 'text-amber-100' : 'text-amber-700'}`}>
            ซ่อมบำรุง / รออะไหล่
          </div>
          <div className={`text-2xl sm:text-3xl font-bold tabular-nums mt-1 ${statusFilter === 'repair' ? 'text-white' : 'text-amber-700'}`}>
            {totalRepair} <span className="text-xs font-normal opacity-80">ชิ้น</span>
          </div>
          <div className={`text-[11px] mt-1 ${statusFilter === 'repair' ? 'text-amber-100' : 'text-amber-600/80'}`}>
            {statusFilter === 'repair' ? '✓ กำลังกรองเฉพาะที่ส่งซ่อม' : 'คลิกเพื่อดูรายการซ่อม'}
          </div>
        </button>
      </div>

      {/* Filter Feedback Banner */}
      {statusFilter !== 'all' && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-center justify-between text-xs text-sky-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold">กำลังแสดงเฉพาะสถานะ:</span>
            <span className="px-2 py-0.5 bg-white font-bold rounded border border-sky-200">
              {statusFilter === 'available' ? 'พร้อมยืม' : statusFilter === 'borrowed' ? 'กำลังปล่อยให้ยืม' : 'ซ่อมบำรุง'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className="text-xs text-sky-700 hover:text-sky-900 font-semibold underline cursor-pointer"
          >
            แสดงทั้งหมด
          </button>
        </div>
      )}

      {/* Equipment List & Unit Tracking (การนำเข้าย้อนหลัง เช่น คันที่ 1, รูปภาพ, เลขครุภัณฑ์, มีปุ่มกดให้ยืม) */}
      <div className="space-y-6">
        {equipments.map((equipment) => {
          const isExpanded = !!expandedEquipmentIds[equipment.id];
          const unitsList = Array.isArray(equipment.units) ? equipment.units : [];
          const availableCount = unitsList.filter((u) => u.status === 'available').length;
          const borrowedCount = unitsList.filter((u) => u.status === 'borrowed').length;
          const repairCount = unitsList.filter((u) => u.status === 'repair').length;

          return (
            <div
              key={equipment.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
            >
              {/* Equipment Main Header Card */}
              <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 bg-white">
                <div className="flex items-start sm:items-center gap-4">
                  {/* รูปภาพ (Photo from sketch) */}
                  <img
                    src={equipment.imageUrl}
                    alt={equipment.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=300&q=80';
                    }}
                  />

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-sky-700">
                      {equipment.category} · โควต้า {equipment.quotaDays} วัน
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {equipment.name}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                      {equipment.description}
                    </p>

                    {/* Quick unit status tags */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 pt-1 flex-wrap">
                      <span>ทั้งหมด: <strong className="tabular-nums">{unitsList.length}</strong></span>
                      <span>·</span>
                      <span className="text-emerald-700">พร้อมยืม: <strong className="tabular-nums">{availableCount}</strong></span>
                      <span>·</span>
                      <span className="text-sky-700">ถูกยืม: <strong className="tabular-nums">{borrowedCount}</strong></span>
                      {repairCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-amber-700">ซ่อม: <strong className="tabular-nums">{repairCount}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls: Add unit + toggle collapse + DELETE MAIN EQUIPMENT BUTTON */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 flex-wrap">
                  {/* เพิ่มชิ้นใหม่ */}
                  <button
                    type="button"
                    onClick={() => onOpenAddUnit(equipment)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มชิ้นใหม่</span>
                  </button>

                  {/* ดู/ซ่อนการนำเข้ารายชิ้น */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(equipment.id)}
                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'ซ่อนรายชิ้น' : 'ดูรายชิ้น'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* แก้ไขข้อมูลครุภัณฑ์ */}
                  {onOpenEditEquipment && (
                    <button
                      type="button"
                      onClick={() => onOpenEditEquipment(equipment)}
                      className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-medium rounded-lg border border-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="แก้ไขข้อมูลครุภัณฑ์นี้ (ชื่อ, หมวดหมู่, โควต้า, รายละเอียด, รูปภาพ)"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                      <span>แก้ไขข้อมูล</span>
                    </button>
                  )}

                  {/* ที่กดลบตัวหลัก (Delete Main Equipment Button) */}
                  <button
                    type="button"
                    onClick={() => handleDeleteEquipmentRequest(equipment)}
                    className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 text-xs font-medium rounded-lg border border-slate-200 hover:border-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="ลบอุปกรณ์หลักนี้ออกจากระบบ"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>ลบตัวหลัก</span>
                  </button>
                </div>
              </div>

              {/* Expansion Section: การนำเข้าย้อนหลัง เช่น คันที่ 1, รูปภาพ, เลขครุภัณฑ์, มีปุ่มกดให้ยืม */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-700">
                      รายการหน่วยพัสดุและการนำเข้าย้อนหลัง (
                      {statusFilter === 'all'
                        ? `${unitsList.length} หน่วย`
                        : `แสดง ${unitsList.filter((u) => u.status === statusFilter).length} จาก ${unitsList.length} หน่วย`}
                      )
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ระบบติดตามรายชิ้นตามทะเบียนครุภัณฑ์ รพ.สต.บ้านธาตุทอง
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(() => {
                      const unitsToShow =
                        statusFilter === 'all'
                          ? unitsList
                          : unitsList.filter((u) => u.status === statusFilter);

                      if (unitsToShow.length === 0) {
                        return (
                          <div className="col-span-full py-6 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
                            ไม่มีชิ้นอุปกรณ์ที่อยู่ในสถานะนี้ (
                            {statusFilter === 'available'
                              ? 'ไม่มีชิ้นว่าง'
                              : statusFilter === 'borrowed'
                              ? 'ไม่มีชิ้นที่ถูกยืม'
                              : 'ไม่มีชิ้นที่ส่งซ่อม'}
                            )
                          </div>
                        );
                      }

                      return unitsToShow.map((unit) => {
                        const isAvailable = unit.status === 'available';
                        const isBorrowed = unit.status === 'borrowed';
                        const isRepair = unit.status === 'repair';

                        return (
                          <div
                            key={unit.id}
                            className={`bg-white rounded-lg border p-4 shadow-2xs transition-all ${
                              isAvailable
                                ? 'border-emerald-200 ring-1 ring-emerald-50'
                                : isBorrowed
                                ? 'border-sky-200'
                                : 'border-amber-200 bg-amber-50/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                {/* รูปภาพประจำชิ้น (Unit photo) */}
                                <img
                                  src={unit.imageUrl || equipment.imageUrl}
                                  alt={`คันที่ ${unit.unitNumber}`}
                                  referrerPolicy="no-referrer"
                                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100 shadow-2xs"
                                  onError={(e) => {
                                    e.currentTarget.src = equipment.imageUrl;
                                  }}
                                />

                                <div>
                                  {/* เช่น คันที่ 1, คันที่ 2 */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900">
                                      คัน/ชิ้นที่ {unit.unitNumber}
                                    </span>
                                    <span
                                      className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                                        isAvailable
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : isBorrowed
                                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}
                                    >
                                      {isAvailable
                                        ? 'พร้อมยืม'
                                        : isBorrowed
                                        ? 'ถูกยืมอยู่'
                                        : 'ชำรุดรอซ่อม'}
                                    </span>
                                  </div>

                                  {/* เลขครุภัณฑ์ (Asset Code) & หมายเลขเครื่อง (Serial Number/นัมเบอร์) */}
                                  <div className="text-xs font-mono font-medium text-slate-700 mt-1">
                                    เลขครุภัณฑ์: <strong className="text-sky-800">{unit.assetCode}</strong>
                                  </div>
                                  {unit.serialNumber && (
                                    <div className="text-xs font-mono text-slate-600 mt-0.5">
                                      หมายเลขเครื่อง (S/N): <strong className="text-slate-800">{unit.serialNumber}</strong>
                                    </div>
                                  )}

                                  {/* วันที่นำเข้าย้อนหลัง (Intake Date) */}
                                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span>วันที่นำเข้า: {formatThaiDate(unit.intakeDate)}</span>
                                  </div>

                                  <div className="text-xs text-slate-500 mt-0.5">
                                    สภาพ: {unit.condition}
                                    {unit.notes && ` (${unit.notes})`}
                                  </div>
                                </div>
                              </div>

                              {/* Action controls for Unit: ให้ยืม, แจ้งซ่อม, และ ที่กดลบรายชิ้น */}
                              <div className="flex flex-col gap-1.5 items-end shrink-0">
                                {isAvailable ? (
                                  <button
                                    type="button"
                                    onClick={() => onOpenLendUnit(equipment, unit)}
                                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    <span>ให้ยืม</span>
                                  </button>
                                ) : isBorrowed ? (
                                  <span className="text-xs text-sky-700 bg-sky-50 px-2 py-1 rounded font-medium border border-sky-100">
                                    กำลังใช้งาน
                                  </span>
                                ) : (
                                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded font-medium border border-amber-100">
                                    รอการซ่อม
                                  </span>
                                )}

                                {/* Toggle repair/ready status */}
                                {!isBorrowed && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onToggleUnitRepair(
                                        equipment.id,
                                        unit.id,
                                        unit.status
                                      )
                                    }
                                    className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer mt-0.5"
                                  >
                                    {isRepair ? 'ซ่อมเสร็จแล้ว (เปลี่ยนเป็นพร้อมยืม)' : 'แจ้งส่งซ่อม'}
                                  </button>
                                )}

                                {/* แก้ไขข้อมูลชิ้นนี้ (Edit Unit Button) */}
                                {onOpenEditUnit && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenEditUnit(equipment, unit)}
                                    className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer mt-0.5 text-sky-700 hover:text-sky-900 hover:bg-sky-50 border border-slate-200 hover:border-sky-300"
                                    title="แก้ไขข้อมูลชิ้นนี้ (เลขครุภัณฑ์, S/N, สภาพ, วันที่นำเข้า, รูปภาพ)"
                                  >
                                    <Edit3 className="w-3 h-3 text-sky-600" />
                                    <span>แก้ไขชิ้นนี้</span>
                                  </button>
                                )}

                                {/* ที่กดลบรายชิ้น (Delete Individual Unit Button) */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUnitRequest(equipment, unit)}
                                  className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer mt-1 ${
                                    isBorrowed
                                      ? 'text-slate-300 hover:text-slate-400'
                                      : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200'
                                  }`}
                                  title={isBorrowed ? 'ไม่สามารถลบชิ้นนี้ได้เนื่องจากกำลังถูกยืม' : 'ลบชิ้นนี้ออกจากทะเบียน'}
                                >
                                  <Trash2 className="w-3 h-3 text-rose-500" />
                                  <span>ลบชิ้นนี้</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation / Blocked Warning Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className={`p-5 flex items-center gap-3.5 border-b ${
              deleteTarget.blockedReason ? 'bg-amber-50/80 border-amber-100 text-amber-900' : 'bg-rose-50/80 border-rose-100 text-rose-900'
            }`}>
              <div className={`p-2.5 rounded-xl ${
                deleteTarget.blockedReason ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600'
              }`}>
                {deleteTarget.blockedReason ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">
                  {deleteTarget.blockedReason
                    ? 'ไม่สามารถดำเนินการลบได้'
                    : deleteTarget.type === 'equipment'
                    ? 'ยืนยันการลบอุปกรณ์หลัก'
                    : 'ยืนยันการลบชิ้นอุปกรณ์'}
                </h3>
                <p className="text-xs opacity-80 mt-0.5">
                  {deleteTarget.type === 'equipment' ? 'การลบหมวดหมู่อุปกรณ์หลักและรายการย่อยทั้งหมด' : 'การลบหน่วยพัสดุรายชิ้นออกจากทะเบียน'}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-sm">
              {deleteTarget.blockedReason ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs sm:text-sm leading-relaxed">
                  {deleteTarget.blockedReason}
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
                    <img
                      src={
                        deleteTarget.type === 'unit' && deleteTarget.unit?.imageUrl
                          ? deleteTarget.unit.imageUrl
                          : deleteTarget.equipment.imageUrl
                      }
                      alt={deleteTarget.equipment.name}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {deleteTarget.equipment.name}
                      </div>
                      {deleteTarget.type === 'unit' && deleteTarget.unit ? (
                        <div className="text-xs text-slate-600 mt-0.5 space-y-0.5">
                          <div>คัน/ชิ้นที่ {deleteTarget.unit.unitNumber}</div>
                          <div className="font-mono text-sky-700">เลขครุภัณฑ์: {deleteTarget.unit.assetCode}</div>
                          {deleteTarget.unit.serialNumber && (
                            <div className="font-mono text-slate-500">S/N: {deleteTarget.unit.serialNumber}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 mt-0.5">
                          จำนวนทั้งหมด: <strong>{deleteTarget.equipment.units.length} ชิ้น</strong>
                          <span className="block text-slate-500 mt-0.5">{deleteTarget.equipment.category}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-rose-600 font-medium leading-relaxed">
                    {deleteTarget.type === 'equipment'
                      ? '⚠️ การลบอุปกรณ์นี้จะนำข้อมูลและรายการย่อยทั้งหมดในทะเบียนออกจากระบบคลาวด์อย่างถาวร'
                      : '⚠️ การลบชิ้นนี้จะนำหน่วยพัสดุนี้ออกจากทะเบียนครุภัณฑ์ของ รพ.สต. อย่างถาวร'}
                  </p>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                {deleteTarget.blockedReason ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
              </button>

              {!deleteTarget.blockedReason && (
                <button
                  type="button"
                  onClick={() => {
                    if (deleteTarget.type === 'equipment') {
                      onDeleteEquipment?.(deleteTarget.equipment.id);
                    } else if (deleteTarget.type === 'unit' && deleteTarget.unit) {
                      onDeleteUnit?.(deleteTarget.equipment.id, deleteTarget.unit.id);
                    }
                    setDeleteTarget(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ยืนยันการลบ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
