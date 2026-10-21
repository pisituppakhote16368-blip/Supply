import React, { useState, useMemo } from 'react';
import { 
  Home, 
  MapPin, 
  Users, 
  Package, 
  AlertCircle, 
  ChevronRight, 
  Search, 
  Filter, 
  Printer, 
  PlusCircle, 
  CheckCircle2, 
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Building
} from 'lucide-react';
import { BorrowRecord, Equipment } from '../types';
import { 
  aggregateVillageSummaries, 
  VillageSummaryData,
  THAT_THONG_VILLAGES
} from '../utils/villageUtils';
import { VillagePatientsModal } from './VillagePatientsModal';

interface VillageSummarySectionProps {
  borrowRecords: BorrowRecord[];
  equipments: Equipment[];
  onOpenReturnModal: (record: BorrowRecord) => void;
  onOpenPrintModal: (record: BorrowRecord) => void;
  onOpenNewLoan: (villageName?: string) => void;
}

export const VillageSummarySection: React.FC<VillageSummarySectionProps> = ({
  borrowRecords,
  equipments,
  onOpenReturnModal,
  onOpenPrintModal,
  onOpenNewLoan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active_only' | 'overdue_only'>('all');
  const [selectedVillageData, setSelectedVillageData] = useState<VillageSummaryData | null>(null);

  // Compute village summaries
  const villageSummaries = useMemo(() => {
    return aggregateVillageSummaries(borrowRecords);
  }, [borrowRecords]);

  // Overall KPIs
  const totalActiveInCommunity = useMemo(() => {
    return villageSummaries.reduce((sum, v) => sum + v.activeCount, 0);
  }, [villageSummaries]);

  const totalOverdueInCommunity = useMemo(() => {
    return villageSummaries.reduce((sum, v) => sum + v.overdueCount, 0);
  }, [villageSummaries]);

  const activeVillagesCount = useMemo(() => {
    return villageSummaries.filter((v) => v.activeCount > 0 && v.village.mooNumber <= 8).length;
  }, [villageSummaries]);

  const totalPatientsInCommunity = useMemo(() => {
    const patientSet = new Set<string>();
    borrowRecords.forEach((r) => {
      if ((r.status === 'active' || r.status === 'overdue') && r.patientName) {
        patientSet.add(r.patientName.trim());
      }
    });
    return patientSet.size;
  }, [borrowRecords]);

  // Filtered village cards
  const filteredVillages = useMemo(() => {
    return villageSummaries.filter((item) => {
      // Filter Mode
      if (filterMode === 'active_only' && item.activeCount === 0) return false;
      if (filterMode === 'overdue_only' && item.overdueCount === 0) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchVillageName = item.village.name.toLowerCase().includes(q);
        const matchAliases = item.village.aliases.some((a) => a.toLowerCase().includes(q));
        const matchEquipment = item.equipmentStats.some((e) => e.equipmentName.toLowerCase().includes(q));
        const matchPatients = item.activeRecords.some((r) => r.patientName.toLowerCase().includes(q));

        if (!matchVillageName && !matchAliases && !matchEquipment && !matchPatients) {
          return false;
        }
      }

      // Hide "other/outside" if it has 0 records and no search query
      if (item.village.id === 'moo-other' && item.allRecords.length === 0 && !searchQuery.trim()) {
        return false;
      }

      return true;
    });
  }, [villageSummaries, filterMode, searchQuery]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl border border-sky-100 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  สรุปการยืมกายอุปกรณ์รายหมู่บ้าน
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                  ตำบลธาตุทอง 8 หมู่บ้าน
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                ดูภาพรวมว่าหมู่ไหน ยืมอุปกรณ์อะไรไปบ้าง ติดตามการกระจายตัวของอุปกรณ์ในชุมชน พร้อมกดดูรายชื่อคนไข้และรายละเอียดการยืมได้ทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenNewLoan()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>บันทึกการยืมใหม่</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* Card 1: Active Villages */}
          <div className="bg-sky-50/60 rounded-xl p-3.5 sm:p-4 border border-sky-100">
            <div className="flex items-center justify-between text-sky-700 mb-1">
              <span className="text-xs font-semibold">หมู่บ้านที่มีการยืม</span>
              <Building className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-sky-950 tabular-nums">
                {activeVillagesCount}
              </span>
              <span className="text-xs text-sky-700 font-medium">/ 8 หมู่บ้าน</span>
            </div>
            <p className="text-[11px] text-sky-600/80 mt-1">ชุมชนที่กำลังใช้อุปกรณ์ฟื้นฟู</p>
          </div>

          {/* Card 2: Active Units */}
          <div className="bg-emerald-50/60 rounded-xl p-3.5 sm:p-4 border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-semibold">อุปกรณ์ในชุมชนขณะนี้</span>
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tabular-nums">
                {totalActiveInCommunity}
              </span>
              <span className="text-xs text-emerald-700 font-medium">ชิ้น/คัน</span>
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-1">กระจายอยู่ในหมู่บ้านต่างๆ</p>
          </div>

          {/* Card 3: Active Patients */}
          <div className="bg-amber-50/60 rounded-xl p-3.5 sm:p-4 border border-amber-100">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-xs font-semibold">คนไข้ที่กำลังยืมใช้งาน</span>
              <Users className="w-4 h-4 text-amber-700" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-950 tabular-nums">
                {totalPatientsInCommunity}
              </span>
              <span className="text-xs text-amber-800 font-medium">คน</span>
            </div>
            <p className="text-[11px] text-amber-700/80 mt-1">ผู้ป่วย/ผู้สูงอายุในพื้นที่</p>
          </div>

          {/* Card 4: Overdue Alert */}
          <div className={`rounded-xl p-3.5 sm:p-4 border ${
            totalOverdueInCommunity > 0 
              ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">รายการเกินกำหนดคืน</span>
              <AlertCircle className={`w-4 h-4 ${totalOverdueInCommunity > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold tabular-nums">
                {totalOverdueInCommunity}
              </span>
              <span className="text-xs font-medium">รายการ</span>
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              {totalOverdueInCommunity > 0 ? 'ต้องติดตามประสานงาน อสม.' : 'ไม่มีรายการเกินกำหนดในชุมชน'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Filter Pills */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-sky-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทุกหมู่บ้าน ({THAT_THONG_VILLAGES.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active_only')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterMode === 'active_only'
                ? 'bg-white text-sky-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เฉพาะที่มีการยืม ({activeVillagesCount})
          </button>
          {totalOverdueInCommunity > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode('overdue_only')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filterMode === 'overdue_only'
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              มีรายการเกินกำหนด ({totalOverdueInCommunity})
            </button>
          )}
        </div>

        {/* Search Box */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อหมู่บ้าน, ชนิดอุปกรณ์, หรือชื่อคนไข้..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Village Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredVillages.map((item) => {
          const { village, activeCount, overdueCount, returnedCount, uniqueActivePatientsCount, equipmentStats } = item;
          const hasActiveLoans = activeCount > 0;

          return (
            <div
              key={village.id}
              className={`bg-white rounded-2xl border transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                overdueCount > 0
                  ? 'border-rose-200 ring-1 ring-rose-200 hover:border-rose-300'
                  : hasActiveLoans
                  ? 'border-sky-200/90 hover:border-sky-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Moo Badge */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 shadow-2xs ${
                      village.mooNumber <= 8
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}>
                      {village.mooNumber <= 8 ? `ม.${village.mooNumber}` : 'นอก'}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {village.name}
                      </h3>
                      <p className="text-xs text-sky-800 font-medium mt-0.5">
                        {village.villageName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {village.description}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {hasActiveLoans ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        กำลังยืม {activeCount} ชิ้น
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                        ไม่มีค้างยืม
                      </span>
                    )}

                    {overdueCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                        เกินกำหนด {overdueCount} ชิ้น
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body: Equipment Borrowed Breakdown (สรุปว่ายืมอะไรไปบ้าง) */}
              <div className="p-5 flex-1 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-sky-600" />
                      <span>อุปกรณ์ที่ยืมไปในชุมชนนี้</span>
                    </span>
                    {hasActiveLoans && (
                      <span className="text-[11px] text-slate-500">
                        คนไข้ {uniqueActivePatientsCount} คน
                      </span>
                    )}
                  </div>

                  {hasActiveLoans ? (
                    <div className="space-y-1.5">
                      {equipmentStats.map((stat) => (
                        <div
                          key={stat.equipmentName}
                          className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-xs"
                        >
                          <span className="font-medium text-slate-800 truncate mr-2">
                            {stat.equipmentName}
                          </span>
                          <span className="font-bold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded tabular-nums shrink-0">
                            {stat.count} {stat.count > 1 ? 'ชิ้น' : 'ชิ้น'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 px-3 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1 opacity-80" />
                      <span>ไม่มีอุปกรณ์ค้างยืมในหมู่บ้านนี้</span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        ประวัติยืมสะสม {returnedCount} ครั้ง (ส่งคืนครบแล้ว)
                      </div>
                    </div>
                  )}
                </div>

                {/* Patient previews if any */}
                {hasActiveLoans && item.activeRecords.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium mb-1.5">
                      ตัวอย่างคนไข้ที่กำลังยืม:
                    </div>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="flex -space-x-2 shrink-0">
                        {item.activeRecords.slice(0, 4).map((r) => (
                          <img
                            key={r.id}
                            src={r.patientPhoto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=100&q=80'}
                            alt={r.patientName}
                            className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-2xs"
                            title={r.patientName}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-slate-700 font-medium truncate">
                        {item.activeRecords.map((r) => r.patientName).slice(0, 2).join(', ')}
                        {item.activeRecords.length > 2 && ` และอีก ${item.activeRecords.length - 2} ท่าน`}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Action to view patients */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVillageData(item)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    hasActiveLoans
                      ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs hover:shadow'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>
                    {hasActiveLoans
                      ? `กดดูคนไข้ที่ยืม (${uniqueActivePatientsCount} คน · ${activeCount} ชิ้น)`
                      : 'กดดูประวัติการยืมในหมู่บ้านนี้'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredVillages.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            ไม่พบข้อมูลหมู่บ้านที่ค้นหา
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ลองล้างคำค้นหา หรือเลือกตัวกรองเป็น "ทุกหมู่บ้าน"
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterMode('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
          >
            ล้างตัวกรอง
          </button>
        </div>
      )}

      {/* Modal: View patients who borrowed in this village */}
      <VillagePatientsModal
        isOpen={Boolean(selectedVillageData)}
        onClose={() => setSelectedVillageData(null)}
        villageData={selectedVillageData}
        onOpenReturnModal={onOpenReturnModal}
        onOpenPrintModal={onOpenPrintModal}
        onOpenNewLoanWithVillage={(vName) => {
          setSelectedVillageData(null);
          onOpenNewLoan(vName);
        }}
      />
    </div>
  );
};
