import React from 'react';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  MapPin, 
  Phone, 
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Equipment, BorrowRecord, QuotaPolicy } from '../types';
import { calculateOverdueInfo, formatThaiDate } from '../utils/dateUtils';

interface OverviewSectionProps {
  equipments: Equipment[];
  borrowRecords: BorrowRecord[];
  quotaPolicies: QuotaPolicy[];
  onOpenReturnModal: (record: BorrowRecord) => void;
  onOpenNewLoan: () => void;
  onViewAllLoans: () => void;
  onViewInventory: () => void;
  onSelectStatusCard: (status: 'all' | 'available' | 'borrowed' | 'repair') => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  equipments,
  borrowRecords,
  quotaPolicies,
  onOpenReturnModal,
  onOpenNewLoan,
  onViewAllLoans,
  onViewInventory,
  onSelectStatusCard,
}) => {
  // Aggregate KPIs safely
  const totalUnits = equipments.reduce(
    (sum, eq) => sum + (Array.isArray(eq.units) ? eq.units.length : (Number(eq.totalUnits) || 0)),
    0
  );
  const availableUnits = equipments.reduce(
    (sum, eq) => sum + (Array.isArray(eq.units) ? eq.units.filter((u) => u.status === 'available').length : 0),
    0
  );
  const borrowedUnits = equipments.reduce(
    (sum, eq) => sum + (Array.isArray(eq.units) ? eq.units.filter((u) => u.status === 'borrowed').length : 0),
    0
  );
  const repairUnits = equipments.reduce(
    (sum, eq) => sum + (Array.isArray(eq.units) ? eq.units.filter((u) => u.status === 'repair').length : 0),
    0
  );

  // Active loans
  const activeLoans = borrowRecords.filter((r) => r.status === 'active' || r.status === 'overdue');
  
  // Overdue count
  const overdueLoans = activeLoans.filter((r) => {
    const info = calculateOverdueInfo(r.borrowDate, r.dueDate, r.returnDate);
    return info.isOverdue;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome with Official Hospital Emblem & Blue Theme */}
      <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white p-1 shadow-lg shrink-0 border-2 border-sky-300">
              <img 
                src="/logo-thatthong.jpg" 
                alt="ตรา รพ.สต.บ้านธาตุทอง" 
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/315691428_1780891938943660_2416256076651751482_n_65d60f61.jpg';
                }}
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 text-sky-200 text-xs font-semibold mb-1 tracking-wide uppercase">
                <ShieldCheck className="w-4 h-4 text-sky-300" />
                <span>รพ.สต.บ้านธาตุทอง · อบจ.สกลนคร</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white mb-1.5">
                ภาพรวมและสถานะการยืมอุปกรณ์ทางการแพทย์
              </h1>
              <p className="text-sky-100 text-xs sm:text-sm leading-relaxed max-w-2xl">
                สนับสนุนกายอุปกรณ์และเครื่องมือแพทย์แก่ผู้ป่วยติดเตียง ผู้สูงอายุ และผู้พิการในพื้นที่ตำบลธาตุทอง
                เพื่อการฟื้นฟูสมรรถภาพอย่างต่อเนื่องในชุมชน
              </p>
            </div>
          </div>
        </div>

        {overdueLoans.length > 0 && (
          <div className="mt-5 p-4 bg-rose-500/20 border border-rose-300/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/30 rounded-lg text-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  มีรายการยืมเกินกำหนดโควต้า {overdueLoans.length} รายการ
                </div>
                <div className="text-xs text-rose-200">
                  โปรดติดตามหรือประสานงาน อสม. ในพื้นที่เพื่อประเมินการต่ออายุหรือรับคืน
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onViewAllLoans}
              className="text-xs font-medium bg-white text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              ดูรายการเกินกำหนด
            </button>
          </div>
        )}
      </div>

      {/* 4 Status KPI Counters: ทั้งหมด / พร้อมยืม / ถูกยืม / ซ่อม */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            สถานะอุปกรณ์ในสต็อกทั้งหมด
          </h2>
          <button
            type="button"
            onClick={onViewInventory}
            className="text-xs font-medium text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
          >
            <span>จัดการคลังอุปกรณ์</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: All items in stock - Clickable */}
          <button
            type="button"
            onClick={() => onSelectStatusCard('all')}
            className="group text-left bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-sky-500 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 group-hover:text-sky-700 transition-colors">
                อุปกรณ์ทั้งหมด
              </span>
              <Package className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                {totalUnits}
              </span>
              <span className="text-xs text-slate-500">ชิ้น / คัน</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>รวม {equipments.length} ประเภท</span>
              <span className="text-sky-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                ดูคลัง →
              </span>
            </div>
          </button>

          {/* Card 2: พร้อมยืม (Available) - Clickable */}
          <button
            type="button"
            onClick={() => onSelectStatusCard('available')}
            className="group text-left bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-700">พร้อมยืม</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
                {availableUnits}
              </span>
              <span className="text-xs text-emerald-600">ชิ้นพร้อมใช้</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{totalUnits > 0 ? Math.round((availableUnits / totalUnits) * 100) : 0}% ของคลัง</span>
              <span className="text-emerald-700 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                ดูรายการว่าง →
              </span>
            </div>
          </button>

          {/* Card 3: ถูกยืม (Borrowed) - Clickable */}
          <button
            type="button"
            onClick={() => onSelectStatusCard('borrowed')}
            className="group text-left bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-sky-500 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-sky-700">กำลังถูกยืม</span>
              <Clock className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-sky-700 tabular-nums">
                {borrowedUnits}
              </span>
              <span className="text-xs text-sky-600">ชิ้นถูกยืม</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>ผู้ป่วย {activeLoans.length} ราย</span>
              <span className="text-sky-700 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                ดูผู้ยืม →
              </span>
            </div>
          </button>

          {/* Card 4: ชำรุด/ซ่อม (Repair) - Clickable */}
          <button
            type="button"
            onClick={() => onSelectStatusCard('repair')}
            className="group text-left bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-500 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-700">ชำรุด / ซ่อมบำรุง</span>
              <Wrench className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-amber-700 tabular-nums">
                {repairUnits}
              </span>
              <span className="text-xs text-amber-600">ชิ้นรอซ่อม</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>รอตรวจสภาพ/อะไหล่</span>
              <span className="text-amber-700 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                ดูงานซ่อม →
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Grid: Left = กำลังถูกยืม / ผู้ใช้งาน, Right = โควต้าระยะการยืม */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): กำลังถูกยืม / ผู้ใช้งาน */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                กำลังถูกยืม / ผู้ใช้งานปัจจุบัน
              </h2>
              <p className="text-xs text-slate-500">
                รายชื่อผู้ป่วยที่กำลังใช้งานอุปกรณ์และกำหนดส่งคืน
              </p>
            </div>
            <button
              type="button"
              onClick={onViewAllLoans}
              className="text-xs font-medium text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
            >
              <span>ดูประวัติทั้งหมด</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeLoans.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mx-auto text-sky-600 mb-3 border border-sky-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                ไม่มีอุปกรณ์ที่ถูกยืมอยู่ในขณะนี้
              </p>
              <p className="text-xs text-slate-500 mt-1">
                อุปกรณ์ทุกชิ้นพร้อมสำหรับการให้บริการยืม
              </p>
              <button
                type="button"
                onClick={onOpenNewLoan}
                className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                บันทึกการยืมชิ้นใหม่
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeLoans.map((loan) => {
                const overdueInfo = calculateOverdueInfo(
                  loan.borrowDate,
                  loan.dueDate,
                  loan.returnDate
                );

                return (
                  <div
                    key={loan.id}
                    className={`bg-white rounded-xl border p-4 sm:p-5 shadow-2xs transition-all ${
                      overdueInfo.isOverdue
                        ? 'border-rose-300 ring-1 ring-rose-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Left: Patient info & photo */}
                      <div className="flex items-start gap-3.5">
                        <img
                          src={loan.patientPhoto}
                          alt={loan.patientName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
                          }}
                        />

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">
                              {loan.patientName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {loan.patientIdCard}
                            </span>
                          </div>

                          <div className="text-xs font-medium text-sky-800 mt-0.5">
                            {loan.equipmentName} ({loan.assetCode})
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {loan.patientAddress}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {loan.patientPhone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Date duration & Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <div className="text-xs text-slate-500">
                            ยืมเมื่อ {formatThaiDate(loan.borrowDate)}
                          </div>
                          <div
                            className={`text-xs font-semibold mt-0.5 ${
                              overdueInfo.isOverdue
                                ? 'text-rose-600'
                                : 'text-slate-700'
                            }`}
                          >
                            {overdueInfo.statusText}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenReturnModal(loan)}
                          className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer border border-sky-200"
                        >
                          บันทึกส่งคืน
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: โควต้าระยะการยืม */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              โควต้าระยะการยืม
            </h2>
            <p className="text-xs text-slate-500">
              เกณฑ์ระยะเวลาการยืมตามระเบียบ รพ.สต.บ้านธาตุทอง
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="space-y-3">
              {quotaPolicies.map((policy, idx) => (
                <div
                  key={idx}
                  className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {policy.name}
                    </span>
                    <span className="font-bold text-sky-700 tabular-nums bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      สูงสุด {policy.defaultDays} วัน
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {policy.description}
                  </p>
                  <div className="text-[11px] text-slate-400 mt-1">
                    เอกสาร: {policy.requirements}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-sky-50/50 border border-sky-100 p-3 rounded-lg text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-sky-900 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
                <span>การต่ออายุโควต้า:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                กรณีจำเป็นต้องใช้อุปกรณ์ต่อเนื่องหลังครบกำหนด ให้ญาติหรือ อสม. แจ้งเจ้าหน้าที่ รพ.สต.บ้านธาตุทอง ก่อนครบกำหนด 7 วัน เพื่อให้พยาบาลหรือนักกายภาพลงตรวจประเมิน
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
