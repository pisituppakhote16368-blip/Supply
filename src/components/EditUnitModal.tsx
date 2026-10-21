import React, { useState, useEffect } from 'react';
import { X, Edit3, Calendar, Tag, Check, Info } from 'lucide-react';
import { Equipment, EquipmentUnit } from '../types';
import { ImagePicker } from './ImagePicker';

interface EditUnitModalProps {
  equipment: Equipment | null;
  unit: EquipmentUnit | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipmentId: string, updatedUnit: EquipmentUnit) => void;
}

export const EditUnitModal: React.FC<EditUnitModalProps> = ({
  equipment,
  unit,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !equipment || !unit) return null;

  const [unitNumber, setUnitNumber] = useState<number>(unit.unitNumber || 1);
  const [assetCode, setAssetCode] = useState<string>(unit.assetCode || '');
  const [serialNumber, setSerialNumber] = useState<string>(unit.serialNumber || '');
  const [intakeDate, setIntakeDate] = useState<string>(unit.intakeDate || '');
  const [condition, setCondition] = useState<EquipmentUnit['condition']>(unit.condition || 'สภาพดี');
  const [status, setStatus] = useState<EquipmentUnit['status']>(unit.status || 'available');
  const [notes, setNotes] = useState<string>(unit.notes || '');
  const [imageUrl, setImageUrl] = useState<string>(unit.imageUrl || equipment.imageUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (unit) {
      setUnitNumber(unit.unitNumber || 1);
      setAssetCode(unit.assetCode || '');
      setSerialNumber(unit.serialNumber || '');
      setIntakeDate(unit.intakeDate || '');
      setCondition(unit.condition || 'สภาพดี');
      setStatus(unit.status || 'available');
      setNotes(unit.notes || '');
      setImageUrl(unit.imageUrl || equipment.imageUrl || '');
    }
  }, [unit, equipment]);

  const isCurrentlyBorrowed = unit.status === 'borrowed';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetCode.trim()) return;

    setIsSubmitting(true);

    const updatedUnit: EquipmentUnit = {
      ...unit,
      unitNumber: Number(unitNumber) || 1,
      assetCode: assetCode.trim(),
      serialNumber: serialNumber.trim(),
      intakeDate: intakeDate,
      condition,
      // If currently borrowed, keep borrowed status to maintain loan integrity
      status: isCurrentlyBorrowed ? 'borrowed' : status,
      imageUrl: imageUrl || equipment.imageUrl,
      notes: notes.trim(),
    };

    onSave(equipment.id, updatedUnit);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-sky-50/70">
          <div className="flex items-center gap-2.5 text-sky-900 font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-2xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <div className="leading-tight">แก้ไขข้อมูลชิ้น/คันที่ {unit.unitNumber}</div>
              <div className="text-[11px] font-normal text-sky-700">
                {equipment.name} (รพ.สต.บ้านธาตุทอง)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Image Picker for this unit */}
          <ImagePicker
            label="รูปถ่ายชิ้นนี้ (จากกล้อง หรือเลือกจากไฟล์ภาพ)"
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
            helperText="ถ่ายภาพอุปกรณ์ชิ้นนี้โดยเฉพาะเพื่อใช้ตรวจสภาพและยืนยันตัวอุปกรณ์"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ลำดับชิ้น / คันที่
              </label>
              <input
                type="number"
                required
                min="1"
                value={unitNumber}
                onChange={(e) => setUnitNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สภาพปัจจุบัน
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="สภาพดี">สภาพดี</option>
                <option value="ปกติ">ปกติ</option>
                <option value="พอใช้">พอใช้</option>
                <option value="ชำรุดรอซ่อม">ชำรุดรอซ่อม</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขครุภัณฑ์ประจำชิ้น <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                placeholder="เช่น รพ.สต.ทธ-68-001"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono text-sky-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเลขเครื่อง (Serial No.)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="เช่น SN-2026-001"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่นำเข้าย้อนหลัง / รับมอบ
              </label>
              <input
                type="date"
                required
                value={intakeDate}
                onChange={(e) => setIntakeDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานะความพร้อม
              </label>
              {isCurrentlyBorrowed ? (
                <div className="px-3 py-2 bg-sky-50 border border-sky-200 rounded-lg text-xs font-semibold text-sky-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-600" />
                  <span>ถูกยืมอยู่ (มีผู้ใช้งาน)</span>
                </div>
              ) : (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="available">พร้อมยืม</option>
                  <option value="repair">ชำรุดรอซ่อม</option>
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุ / แหล่งที่มา / ข้อมูลเพิ่มเติม
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น รับบริจาคจากผู้มีจิตศรัทธา, จัดสรรงบกองทุน กปท."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !assetCode.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขชิ้นนี้'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
