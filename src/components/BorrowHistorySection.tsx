import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  RotateCcw, 
  User, 
  Tag,
  Printer,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { BorrowRecord } from '../types';
import { formatThaiDate, calculateOverdueInfo } from '../utils/dateUtils';
import { exportBorrowRecordsToExcel } from '../utils/excelExport';

interface BorrowHistorySectionProps {
  borrowRecords: BorrowRecord[];
  onOpenReturnModal: (record: BorrowRecord) => void;
  onOpenPrintModal: (record: BorrowRecord) => void;
  onOpenNewLoan: () => void;
  initialStatusFilter?: 'all' | 'active' | 'overdue' | 'returned';
}

export const BorrowHistorySection: React.FC<BorrowHistorySectionProps> = ({
  borrowRecords,
  onOpenReturnModal,
  onOpenPrintModal,
  onOpenNewLoan,
  initialStatusFilter = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>(initialStatusFilter);

  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return borrowRecords.filter((record) => {
      // Search matching patient name, phone, idCard, assetCode, or equipmentName
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        record.patientName.toLowerCase().includes(q) ||
        record.patientIdCard.toLowerCase().includes(q) ||
        record.patientPhone.toLowerCase().includes(q) ||
        record.assetCode.toLowerCase().includes(q) ||
        record.equipmentName.toLowerCase().includes(q) ||
        record.patientAddress.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'all') return true;

      const overdueInfo = calculateOverdueInfo(
        record.borrowDate,
        record.dueDate,
        record.returnDate
      );

      if (statusFilter === 'returned') {
        return record.returnDate !== null;
      }
      if (statusFilter === 'overdue') {
        return record.returnDate === null && overdueInfo.isOverdue;
      }
      if (statusFilter === 'active') {
        return record.returnDate === null && !overdueInfo.isOverdue;
      }

      return true;
    });
  }, [borrowRecords, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Top Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ประวัติการยืม-คืนอุปกรณ์
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            บันทึกการให้บริการยืมกายอุปกรณ์ ข้อมูลผู้ป่วย การติดตามกำหนดส่งคืน และคำนวณวันเกิน
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => exportBorrowRecordsToExcel(filteredRecords, statusFilter)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออก Excel ({filteredRecords.length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewLoan}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            + บันทึกการยืมใหม่
          </button>
        </div>
      </div>

      {/* Search & Filter Bar directly featuring "มีปุ่มกดค้นหาชื่อผู้ป่วย" */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อผู้ป่วย, เลขบัตร ปชช., เบอร์โทร, เลขครุภัณฑ์, หมู่บ้าน..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Status Tabs as clean functional buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({borrowRecords.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white text-sky-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กำลังยืม
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'overdue'
                  ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เกินกำหนด
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('returned')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'returned'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              คืนแล้ว
            </button>
          </div>
        </div>
      </div>

      {/* Record List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          {borrowRecords.length === 0 ? (
            <div>
              <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-sky-100">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-slate-800">
                ระบบพร้อมใช้งานจริง (ยังไม่มีประวัติการยืม)
              </p>
              <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                ข้อมูลตัวอย่างถูกล้างเรียบร้อยแล้ว อุปกรณ์ทุกชิ้นในคลังพร้อมให้บริการยืม กดปุ่มด้านล่างเพื่อเริ่มบันทึกการให้บริการผู้ป่วยรายแรกได้ทันที
              </p>
              <button
                type="button"
                onClick={onOpenNewLoan}
                className="mt-4 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                + เริ่มต้นบันทึกการยืมใหม่
              </button>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                ไม่พบประวัติการยืมที่ตรงกับเงื่อนไข
              </p>
              <p className="text-xs text-slate-500 mt-1">
                ลองปรับเปลี่ยนคำค้นหา หรือเปลี่ยนตัวกรองสถานะ
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs text-sky-700 hover:underline cursor-pointer"
                >
                  ล้างคำค้นหา
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const overdueInfo = calculateOverdueInfo(
              record.borrowDate,
              record.dueDate,
              record.returnDate
            );
            const isReturned = record.returnDate !== null;

            return (
              <div
                key={record.id}
                className={`bg-white rounded-xl border p-5 shadow-2xs transition-all ${
                  !isReturned && overdueInfo.isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-100'
                    : isReturned
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-slate-200'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column (5 cols): โชว์รูปผู้ป่วย + ชื่อ + ที่อยู่ + เบอร์โทร */}
                  <div className="lg:col-span-5 flex items-start gap-4">
                    {/* โชว์รูปผู้ป่วย (Patient Photo) */}
                    <div className="relative shrink-0">
                      <img
                        src={record.patientPhoto}
                        alt={record.patientName}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shadow-2xs bg-slate-100"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-slate-800 text-[10px] text-white rounded">
                        รูปผู้ป่วย
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                          {record.patientName}
                        </h3>
                        <span className="text-xs text-slate-500 font-mono">
                          ID: {record.patientIdCard}
                        </span>
                      </div>

                      {/* ที่อยู่ เบอร์โทร */}
                      <div className="text-xs text-slate-600 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          {record.patientAddress}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`tel:${record.patientPhone}`}
                          className="text-teal-700 hover:underline font-mono"
                        >
                          {record.patientPhone}
                        </a>
                      </div>

                      {record.remarks && (
                        <div className="text-[11px] text-slate-500 italic">
                          หมายเหตุ: {record.remarks}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Column (4 cols): รายละเอียดอุปกรณ์ + วันที่ยืม + เลขครุภัณฑ์ */}
                  <div className="lg:col-span-4 space-y-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-5">
                    <div>
                      <div className="text-xs text-slate-500">อุปกรณ์ที่ยืม:</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {record.equipmentName} (ชิ้น/คันที่ {record.unitNumber})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">เลขครุภัณฑ์:</span>
                      <span className="font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {record.assetCode}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>วันที่ยืม: <strong>{formatThaiDate(record.borrowDate)}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>กำหนดส่งคืน: <strong>{formatThaiDate(record.dueDate)}</strong> ({record.quotaDays} วัน)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (3 cols): วันที่คืน / คำนวณวันเกินที่ยืมมา + ปุ่มกดคืนของ */}
                  <div className="lg:col-span-3 flex flex-col justify-between h-full border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-5 space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        {isReturned ? 'วันที่คืน & ผลคำนวณ:' : 'สถานะ & การคำนวณวันเกิน:'}
                      </div>

                      {isReturned ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>คืนแล้วเมื่อ {formatThaiDate(record.returnDate)}</span>
                          </div>

                          <div className="text-xs text-slate-600">
                            สภาพ: {record.returnedCondition || 'ปกติ'}
                          </div>

                          <div
                            className={`text-xs font-medium ${
                              overdueInfo.isOverdue ? 'text-amber-700' : 'text-slate-500'
                            }`}
                          >
                            {overdueInfo.statusText}
                          </div>

                          {record.returnNote && (
                            <div className="text-[11px] text-slate-500 italic mt-0.5">
                              "{record.returnNote}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div
                            className={`flex items-center gap-1.5 text-xs font-bold ${
                              overdueInfo.isOverdue
                                ? 'text-rose-600'
                                : 'text-teal-700'
                            }`}
                          >
                            {overdueInfo.isOverdue ? (
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                            )}
                            <span>{overdueInfo.statusText}</span>
                          </div>

                          <div className="text-xs text-slate-500">
                            ยืมมาแล้ว {overdueInfo.totalDaysUsed} วัน
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: มีปุ่มกดคืนของ ให้ใส่วันที่คืน และกดยืนยัน + พิมพ์ใบยืม */}
                    <div className="flex items-center gap-2 pt-2">
                      {!isReturned && (
                        <button
                          type="button"
                          onClick={() => onOpenReturnModal(record)}
                          className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>คืนของ</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenPrintModal(record)}
                        title="พิมพ์แบบฟอร์มการยืม หรือส่งออกเป็นไฟล์ PDF"
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5 text-rose-600" />
                        <span>พิมพ์ / PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
