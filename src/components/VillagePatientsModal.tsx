import React, { useState, useMemo } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  Search, 
  FileText,
  Tag,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { BorrowRecord } from '../types';
import { VillageSummaryData } from '../utils/villageUtils';
import { formatThaiDate, calculateOverdueInfo } from '../utils/dateUtils';

interface VillagePatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  villageData: VillageSummaryData | null;
  onOpenReturnModal: (record: BorrowRecord) => void;
  onOpenPrintModal: (record: BorrowRecord) => void;
  onOpenNewLoanWithVillage?: (villageName: string) => void;
}

export const VillagePatientsModal: React.FC<VillagePatientsModalProps> = ({
  isOpen,
  onClose,
  villageData,
  onOpenReturnModal,
  onOpenPrintModal,
  onOpenNewLoanWithVillage,
}) => {
  if (!isOpen || !villageData) return null;

  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'returned'>('active');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all unique equipment types present in this village
  const availableEquipments = useMemo(() => {
    const set = new Set<string>();
    villageData.allRecords.forEach((r) => {
      if (r.equipmentName) set.add(r.equipmentName);
    });
    return Array.from(set);
  }, [villageData]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return villageData.allRecords.filter((record) => {
      // Status filter
      if (statusFilter === 'active' && record.status === 'returned') return false;
      if (statusFilter === 'returned' && record.status !== 'returned') return false;

      // Equipment filter
      if (equipmentFilter !== 'all' && record.equipmentName !== equipmentFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = record.patientName.toLowerCase().includes(q);
        const matchPhone = record.patientPhone.toLowerCase().includes(q);
        const matchAddress = record.patientAddress.toLowerCase().includes(q);
        const matchAsset = record.assetCode.toLowerCase().includes(q);
        const matchEquip = record.equipmentName.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAddress && !matchAsset && !matchEquip) {
          return false;
        }
      }

      return true;
    });
  }, [villageData, statusFilter, equipmentFilter, searchQuery]);

  // Handle Print Village Roster for อสม. / Healthcare Volunteers
  const handlePrintVillageRoster = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-100 max-w-4xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-sky-700 via-sky-600 to-sky-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-lg text-white border border-white/20">
              {villageData.village.mooNumber <= 8 ? `ม.${villageData.village.mooNumber}` : 'นอก'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                  {villageData.village.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                  {villageData.village.villageName}
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                รายชื่อคนไข้และกายอุปกรณ์ที่ยืมอยู่ในหมู่บ้านนี้ · ต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintVillageRoster}
              className="no-print hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-white hover:bg-sky-50 active:bg-sky-100 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="พิมพ์ใบรายชื่อสำหรับ อสม. ลงพื้นที่ติดตาม"
            >
              <Printer className="w-3.5 h-3.5 text-sky-700" />
              <span>พิมพ์ใบรายชื่อ (อสม.)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Village Summary KPI Bar */}
        <div className="px-6 py-3 bg-sky-50/70 border-b border-sky-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">คนไข้ที่กำลังใช้อุปกรณ์:</span>
              <span className="font-bold text-sky-900 text-sm">{villageData.uniqueActivePatientsCount} คน</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">อุปกรณ์ที่อยู่ในชุมชน:</span>
              <span className="font-bold text-emerald-700 text-sm">{villageData.activeCount} ชิ้น</span>
            </div>
            {villageData.overdueCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-100 border border-rose-200 rounded-md text-rose-800 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>เกินกำหนด {villageData.overdueCount} ชิ้น</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>ประวัติคืนแล้ว:</span>
              <span className="font-medium text-slate-700">{villageData.returnedCount} ครั้ง</span>
            </div>
          </div>

          {onOpenNewLoanWithVillage && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewLoanWithVillage(villageData.village.name);
              }}
              className="no-print inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:text-sky-900 bg-sky-100/70 hover:bg-sky-200/70 rounded-md transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>บันทึกการยืมให้คนไข้ในหมู่บ้านนี้</span>
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="no-print px-6 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status tabs */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-white text-sky-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                กำลังยืมอยู่ ({villageData.activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-sky-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด ({villageData.allRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('returned')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  statusFilter === 'returned'
                    ? 'bg-white text-sky-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                คืนแล้ว ({villageData.returnedCount})
              </button>
            </div>

            {/* Equipment Filter Dropdown if multiple types */}
            {availableEquipments.length > 1 && (
              <select
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium text-slate-700"
              >
                <option value="all">ทุกชนิดอุปกรณ์ ({availableEquipments.length} ชนิด)</option>
                {availableEquipments.map((eq) => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            )}
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อคนไข้, เบอร์โทร..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Printable Header for Print Mode */}
        <div className="print-only hidden px-8 pt-6 pb-4 border-b border-slate-300">
          <div className="flex items-center gap-3">
            <img src="/logo-thatthong.jpg" alt="Logo" className="w-12 h-12 object-cover rounded-full" />
            <div>
              <h2 className="text-base font-bold text-black">
                รายงานการยืมกายอุปกรณ์ ชุมชน {villageData.village.name}
              </h2>
              <p className="text-xs text-gray-700">
                โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านธาตุทอง · สำหรับ อสม. ติดตามดูแลคนไข้ในพื้นที่
              </p>
            </div>
          </div>
        </div>

        {/* Patient Records List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200/80 p-8">
              <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mx-auto text-sky-500 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                {statusFilter === 'active'
                  ? `ไม่มีคนไข้ค้างยืมอุปกรณ์ใน ${villageData.village.name} ขณะนี้`
                  : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {statusFilter === 'active'
                  ? 'อุปกรณ์ทั้งหมดในหมู่บ้านนี้ได้รับการส่งคืนครบถ้วน หรือยังไม่มีการบันทึกการยืม'
                  : 'ลองเปลี่ยนคำค้นหา หรือเปลี่ยนตัวกรองสถานะเป็นทั้งหมด'}
              </p>
              {onOpenNewLoanWithVillage && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNewLoanWithVillage(villageData.village.name);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>บันทึกการยืมใหม่ให้คนไข้ใน {villageData.village.villageName}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredRecords.map((record) => {
              const overdueInfo = calculateOverdueInfo(record.borrowDate, record.dueDate, record.returnDate);
              const isOverdue = overdueInfo.isOverdue;

              return (
                <div
                  key={record.id}
                  className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs transition-all hover:shadow-md ${
                    isOverdue 
                      ? 'border-rose-300 ring-1 ring-rose-200' 
                      : record.status === 'returned'
                      ? 'border-slate-200 opacity-80'
                      : 'border-sky-200/90'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Patient & Equipment Info */}
                    <div className="flex items-start gap-3.5">
                      {/* Patient Avatar Photo */}
                      <div className="relative shrink-0">
                        <img
                          src={record.patientPhoto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80'}
                          alt={record.patientName}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-slate-200 shadow-2xs"
                        />
                        <div className="absolute -bottom-1 -right-1">
                          {record.status === 'returned' ? (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px]" title="คืนแล้ว">
                              ✓
                            </span>
                          ) : isOverdue ? (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px]" title="เกินกำหนด">
                              !
                            </span>
                          ) : (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white text-[10px]" title="กำลังยืม">
                              •
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900">
                            {record.patientName}
                          </h4>
                          {record.status === 'returned' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ส่งคืนแล้ว
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              เกินกำหนด {overdueInfo.overdueDays} วัน
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              <Clock className="w-3 h-3 text-sky-600" />
                              กำลังยืม (เหลือ {overdueInfo.remainingDays} วัน)
                            </span>
                          )}
                        </div>

                        {/* Equipment Tag */}
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-800 bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                            {record.equipmentName}
                          </span>
                          <span className="text-xs text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                            คัน/ชิ้นที่ {record.unitNumber} ({record.assetCode})
                          </span>
                        </div>

                        {/* Address & Phone */}
                        <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{record.patientAddress}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <a 
                                href={`tel:${record.patientPhone}`}
                                className="font-mono text-sky-700 hover:text-sky-900 hover:underline font-medium"
                              >
                                {record.patientPhone}
                              </a>
                            </div>
                            {record.patientIdCard && record.patientIdCard !== '-' && (
                              <div className="text-slate-400 text-[11px]">
                                เลขบัตร: {record.patientIdCard}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Action Buttons */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Dates */}
                      <div className="text-xs text-right sm:text-left md:text-right space-y-0.5">
                        <div className="text-slate-500">
                          วันที่ยืม: <span className="font-medium text-slate-800">{formatThaiDate(record.borrowDate)}</span>
                        </div>
                        <div className="text-slate-500">
                          กำหนดคืน: <span className={`font-semibold ${isOverdue ? 'text-rose-700' : 'text-slate-800'}`}>{formatThaiDate(record.dueDate)}</span>
                        </div>
                        {record.returnDate && (
                          <div className="text-emerald-700">
                            คืนเมื่อ: <span className="font-medium">{formatThaiDate(record.returnDate)}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400">
                          จนท.ผู้ให้ยืม: {record.lenderStaff}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="no-print flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => onOpenPrintModal(record)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="พิมพ์ใบยืมกายอุปกรณ์"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>ใบยืม</span>
                        </button>

                        {record.status !== 'returned' && (
                          <button
                            type="button"
                            onClick={() => onOpenReturnModal(record)}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>รับคืน</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            กำลังแสดง {filteredRecords.length} จากทั้งหมด {villageData.allRecords.length} รายการ
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
