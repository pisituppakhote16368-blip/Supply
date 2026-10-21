import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle2, Calendar, User, Clock } from 'lucide-react';
import { BorrowRecord } from '../types';
import { getTodayString, formatThaiDate, calculateOverdueInfo } from '../utils/dateUtils';

interface ReturnModalProps {
  record: BorrowRecord | null;
  onClose: () => void;
  onConfirmReturn: (
    recordId: string,
    returnDate: string,
    condition: string,
    receiverStaff: string,
    returnNote: string,
    markForRepair: boolean
  ) => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  record,
  onClose,
  onConfirmReturn,
}) => {
  if (!record) return null;

  const [returnDate, setReturnDate] = useState<string>(getTodayString());
  const [condition, setCondition] = useState<string>('สมบูรณ์ปกติ พร้อมให้บริการต่อ');
  const [receiverStaff, setReceiverStaff] = useState<string>('พว.สุดารัตน์ พรหมวิชัย');
  const [returnNote, setReturnNote] = useState<string>('');
  const [markForRepair, setMarkForRepair] = useState<boolean>(false);

  // Dynamic live calculation of overdue days based on selected return date
  const calculation = calculateOverdueInfo(record.borrowDate, record.dueDate, returnDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnDate) return;
    onConfirmReturn(
      record.id,
      returnDate,
      condition,
      receiverStaff,
      returnNote,
      markForRepair
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
            <RotateCcw className="w-5 h-5 text-teal-600" />
            <span>บันทึกส่งคืนอุปกรณ์</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient & Item Summary */}
          <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 flex items-start gap-3">
            <img
              src={record.patientPhoto}
              alt={record.patientName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-lg object-cover border border-teal-200 shrink-0 bg-white"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
              }}
            />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-900 text-sm">{record.patientName}</div>
              <div className="text-slate-600">
                อุปกรณ์: <strong>{record.equipmentName}</strong> (คัน/ชิ้นที่ {record.unitNumber})
              </div>
              <div className="text-slate-600 font-mono">
                เลขครุภัณฑ์: <strong className="text-teal-900">{record.assetCode}</strong>
              </div>
              <div className="text-slate-500">
                ยืมวันที่: {formatThaiDate(record.borrowDate)} · กำหนดคืน: {formatThaiDate(record.dueDate)} ({record.quotaDays} วัน)
              </div>
            </div>
          </div>

          {/* วันที่คืน (Return date) - As drawn in the sketch: "มีปุ่มกดคืนของ ให้ใส่วันที่คืน และกดยืนยัน" */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              วันที่คืนอุปกรณ์ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* คำนวณวันเกินที่ยืมมา (Dynamic calculation box directly from sketch!) */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
              calculation.isOverdue
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {calculation.isOverdue ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <div>
                <span className="font-semibold">
                  {calculation.isOverdue
                    ? `เกินกำหนดส่งคืน ${calculation.overdueDays} วัน`
                    : 'ส่งคืนตามกำหนดเวลา (ไม่เกินโควต้า)'}
                </span>
                <div className="text-[11px] opacity-80">
                  ระยะเวลาใช้งานจริง: {calculation.totalDaysUsed} วัน (โควต้า {record.quotaDays} วัน)
                </div>
              </div>
            </div>
            <span className="font-bold tabular-nums text-sm">
              {calculation.isOverdue ? `+${calculation.overdueDays} วัน` : 'ปกติ'}
            </span>
          </div>

          {/* สภาพอุปกรณ์ตอนส่งคืน */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              สภาพอุปกรณ์เมื่อรับคืน
            </label>
            <select
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                if (e.target.value.includes('ชำรุด')) {
                  setMarkForRepair(true);
                }
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="สมบูรณ์ปกติ พร้อมให้บริการต่อ">สมบูรณ์ปกติ พร้อมให้บริการต่อ</option>
              <option value="มีรอยขีดข่วนเล็กน้อย แต่ใช้งานได้ดี">มีรอยขีดข่วนเล็กน้อย แต่ใช้งานได้ดี</option>
              <option value="ชำรุดบางส่วน ต้องส่งซ่อมบำรุง">ชำรุดบางส่วน ต้องส่งซ่อมบำรุง</option>
              <option value="ชำรุดหนัก ไม่สามารถใช้งานได้">ชำรุดหนัก ไม่สามารถใช้งานได้</option>
            </select>
          </div>

          {/* Option to automatically mark unit as 'repair' */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="markRepairCheck"
              checked={markForRepair}
              onChange={(e) => setMarkForRepair(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="markRepairCheck" className="text-xs text-slate-700 cursor-pointer">
              ส่งอุปกรณ์นี้เข้าแผนกซ่อมบำรุงทันที (เปลี่ยนสถานะในคลังเป็น 'ซ่อม')
            </label>
          </div>

          {/* เจ้าหน้าที่ผู้ตรวจรับ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เจ้าหน้าที่ผู้รับคืน (รพ.สต.ธาตุทอง) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={receiverStaff}
              onChange={(e) => setReceiverStaff(e.target.value)}
              placeholder="ระบุชื่อเจ้าหน้าที่..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* หมายเหตุ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุ / การฟื้นฟูของผู้ป่วย (ถ้ามี)
            </label>
            <textarea
              rows={2}
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="เช่น ผู้ป่วยเริ่มฝึกเดินได้เอง อาการดีขึ้นมาก..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Buttons: และกดยืนยัน (Confirm return) */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>กดยืนยันการคืน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
