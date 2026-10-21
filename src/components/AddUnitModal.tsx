import React, { useState } from 'react';
import { X, Plus, Calendar, Tag, Check } from 'lucide-react';
import { Equipment, EquipmentUnit } from '../types';
import { getTodayString } from '../utils/dateUtils';
import { ImagePicker } from './ImagePicker';

interface AddUnitModalProps {
  equipment: Equipment | null;
  onClose: () => void;
  onAddUnit: (equipmentId: string, newUnit: EquipmentUnit) => void;
}

export const AddUnitModal: React.FC<AddUnitModalProps> = ({
  equipment,
  onClose,
  onAddUnit,
}) => {
  if (!equipment) return null;

  const nextUnitNumber = equipment.units.length + 1;
  const [unitNumber, setUnitNumber] = useState<number>(nextUnitNumber);
  const [assetCode, setAssetCode] = useState<string>(
    `รพ.สต.ทธ-68-${String(nextUnitNumber).padStart(3, '0')}`
  );
  const [serialNumber, setSerialNumber] = useState<string>(
    `SN-${Date.now().toString().slice(-4)}`
  );
  const [intakeDate, setIntakeDate] = useState<string>(getTodayString());
  const [condition, setCondition] = useState<EquipmentUnit['condition']>('สภาพดี');
  const [notes, setNotes] = useState<string>('รับบริจาค / จัดสรรงบประมาณใหม่');
  const [imageUrl, setImageUrl] = useState<string>(equipment.imageUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetCode.trim()) return;

    const newUnit: EquipmentUnit = {
      id: `unit-${Date.now()}`,
      unitNumber,
      assetCode: assetCode.trim(),
      serialNumber: serialNumber.trim(),
      intakeDate,
      condition,
      status: 'available',
      imageUrl: imageUrl || equipment.imageUrl,
      notes: notes.trim(),
    };

    onAddUnit(equipment.id, newUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full my-8 overflow-hidden animate-in fade-in duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
            <Plus className="w-5 h-5 text-teal-600" />
            <span>เพิ่มชิ้น/คันใหม่: {equipment.name}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Image Picker for this unit */}
          <ImagePicker
            label="รูปภาพชิ้นนี้ (ถ่ายภาพจากกล้อง หรือเลือกจากแกลเลอรี่)"
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
            helperText="ถ่ายภาพอุปกรณ์ชิ้นนี้โดยเฉพาะจากกล้อง หรือเลือกภาพถ่ายจากแกลเลอรี่"
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
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สภาพเริ่มต้น
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
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
                หมายเลขเครื่อง / Serial Number (S/N) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="เช่น SN-2026-005 หรือ No. 5"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขครุภัณฑ์ (รพ.สต.ธาตุทอง) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                placeholder="เช่น รพ.สต.ทธ-68-วช-005"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono text-teal-800 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              วันที่นำเข้าย้อนหลัง / วันที่ลงทะเบียนรับ <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={intakeDate}
              onChange={(e) => setIntakeDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุ / แหล่งที่มา
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น กองทุนหลักประกันสุขภาพตำบลธาตุทอง สนับสนุน"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            />
          </div>

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
              <Check className="w-4 h-4" />
              <span>บันทึกชิ้นใหม่พร้อมรูปภาพ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
