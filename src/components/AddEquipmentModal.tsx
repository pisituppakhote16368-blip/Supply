import React, { useState } from 'react';
import { X, Plus, Package, Check, Trash2, Tag, Calendar, Hash } from 'lucide-react';
import { Equipment, EquipmentUnit } from '../types';
import { getTodayString } from '../utils/dateUtils';
import { ImagePicker } from './ImagePicker';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEquipment: (equipment: Equipment) => void;
}

const PRESET_EQUIPMENT_IMAGES = [
  {
    label: 'รถเข็นนั่ง (Wheelchair)',
    url: '/src/assets/images/wheelchair_medical_1792486050157.jpg',
  },
  {
    label: 'เตียงผู้ป่วยปรับระดับ',
    url: '/src/assets/images/hospital_bed_care_1792486050541.jpg',
  },
  {
    label: 'เครื่องผลิตออกซิเจน',
    url: '/src/assets/images/oxygen_concentrator_1792486051328.jpg',
  },
  {
    label: 'ที่นอนลมกันแผลกดทับ',
    url: '/src/assets/images/air_mattress_medical_1792486051638.jpg',
  },
  {
    label: 'โครงช่วยเดิน (Walker)',
    url: '/src/assets/images/walker_mobility_frame_1792486051599.jpg',
  },
];

interface ConfiguredUnit {
  unitNumber: number;
  assetCode: string; // เลขครุภัณฑ์
  serialNumber: string; // หมายเลขเครื่อง / Serial Number (S/N)
  intakeDate: string;
  condition: 'สภาพดี' | 'ปกติ' | 'พอใช้';
}

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({
  isOpen,
  onClose,
  onAddEquipment,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('อุปกรณ์ช่วยเคลื่อนไหว');
  const [quotaDays, setQuotaDays] = useState(90);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_EQUIPMENT_IMAGES[0].url);

  // List of physical units being created with individual Serial Numbers & Asset Codes
  const [unitsList, setUnitsList] = useState<ConfiguredUnit[]>([
    {
      unitNumber: 1,
      assetCode: `รพ.สต.ทธ-68-001`,
      serialNumber: `SN-2026-${Date.now().toString().slice(-4)}-01`,
      intakeDate: getTodayString(),
      condition: 'สภาพดี',
    },
    {
      unitNumber: 2,
      assetCode: `รพ.สต.ทธ-68-002`,
      serialNumber: `SN-2026-${Date.now().toString().slice(-4)}-02`,
      intakeDate: getTodayString(),
      condition: 'สภาพดี',
    },
  ]);

  const handleAddUnitRow = () => {
    const nextNum = unitsList.length + 1;
    setUnitsList((prev) => [
      ...prev,
      {
        unitNumber: nextNum,
        assetCode: `รพ.สต.ทธ-68-${String(nextNum).padStart(3, '0')}`,
        serialNumber: `SN-2026-${Date.now().toString().slice(-4)}-${String(nextNum).padStart(2, '0')}`,
        intakeDate: getTodayString(),
        condition: 'สภาพดี',
      },
    ]);
  };

  const handleRemoveUnitRow = (index: number) => {
    if (unitsList.length <= 1) return;
    setUnitsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateUnit = (index: number, field: keyof ConfiguredUnit, val: any) => {
    setUnitsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = `eq-${Date.now()}`;
    const units: EquipmentUnit[] = unitsList.map((u, idx) => ({
      id: `unit-${Date.now()}-${idx + 1}`,
      unitNumber: u.unitNumber || idx + 1,
      assetCode: u.assetCode.trim() || `รพ.สต.ทธ-68-${String(idx + 1).padStart(3, '0')}`,
      serialNumber: u.serialNumber.trim() || `SN-${idx + 1}`,
      intakeDate: u.intakeDate || getTodayString(),
      condition: u.condition,
      status: 'available' as const,
    }));

    const newEquipment: Equipment = {
      id: newId,
      name: name.trim(),
      category,
      quotaDays,
      imageUrl: imageUrl || PRESET_EQUIPMENT_IMAGES[0].url,
      description: description.trim() || 'อุปกรณ์สำหรับให้บริการยืมแก่ประชาชนตำบลธาตุทอง',
      totalUnits: units.length,
      units,
    };

    onAddEquipment(newEquipment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
            <Package className="w-5 h-5 text-teal-600" />
            <span>เพิ่มอุปกรณ์ใหม่เข้าคลัง (รพ.สต.ธาตุทอง)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Item details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่ออุปกรณ์ / รายการ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น รถเข็นนั่งมาตรฐาน, ที่นอนลมป้องกันแผลกดทับ, เครื่องผลิตออกซิเจน"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมวดหมู่
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="อุปกรณ์ช่วยเคลื่อนไหว">อุปกรณ์ช่วยเคลื่อนไหว</option>
                <option value="อุปกรณ์ดูแลบนเตียง">อุปกรณ์ดูแลบนเตียง</option>
                <option value="อุปกรณ์ช่วยหายใจ">อุปกรณ์ช่วยหายใจ</option>
                <option value="อุปกรณ์กายภาพบำบัด">อุปกรณ์กายภาพบำบัด</option>
                <option value="อุปกรณ์สุขอนามัย">อุปกรณ์สุขอนามัย</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                โควต้าระยะการยืมมาตรฐาน (วัน)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={quotaDays}
                onChange={(e) => setQuotaDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำอธิบาย / คุณลักษณะครุภัณฑ์
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุสเปก หรือรายละเอียดการใช้งาน..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Image Selection via ImagePicker (Camera, Gallery, URL) */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
            <ImagePicker
              label="📷 รูปภาพอุปกรณ์ชิ้นใหม่ (ถ่ายจากกล้อง, เลือกจากแกลเลอรี่ หรือใส่ URL)"
              value={imageUrl}
              onChange={(url) => setImageUrl(url)}
              presetImages={PRESET_EQUIPMENT_IMAGES}
              helperText="สามารถกดปุ่มกล้องถ่ายรูปอุปกรณ์จริง หรือเลือกไฟล์จากแกลเลอรี่ในเครื่องได้ทันที"
            />
          </div>

          {/* การสร้างทะเบียนรายชิ้น (ทุกชิ้นเพิ่มหมายเลข นัมเบอร์ด้วย) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-teal-600" />
                  <span>การสร้างทะเบียนรายชิ้น (พร้อมหมายเลข Serial Number และเลขครุภัณฑ์)</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ระบุหมายเลขเครื่อง (Serial Number/นัมเบอร์) และเลขครุภัณฑ์แยกเฉพาะสำหรับแต่ละชิ้น
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddUnitRow}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-teal-700 text-xs font-semibold rounded-lg border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มชิ้น</span>
              </button>
            </div>

            {/* List of units */}
            <div className="space-y-2.5">
              {unitsList.map((unit, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      ชิ้น / คันที่ {idx + 1}
                    </span>

                    {unitsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveUnitRow(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="ลบแถวนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        หมายเลขเครื่อง / Serial Number (S/N) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={unit.serialNumber}
                        onChange={(e) => handleUpdateUnit(idx, 'serialNumber', e.target.value)}
                        placeholder="เช่น SN-2026-001 หรือ No. 1"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        เลขครุภัณฑ์ (รพ.สต.) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={unit.assetCode}
                        onChange={(e) => handleUpdateUnit(idx, 'assetCode', e.target.value)}
                        placeholder="รพ.สต.ทธ-68-001"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs text-teal-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        วันที่นำเข้า
                      </label>
                      <input
                        type="date"
                        value={unit.intakeDate}
                        onChange={(e) => handleUpdateUnit(idx, 'intakeDate', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
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
              <span>บันทึกอุปกรณ์และทะเบียนรายชิ้น ({unitsList.length} ชิ้น)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
