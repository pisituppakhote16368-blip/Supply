import React, { useState, useEffect } from 'react';
import { X, Edit3, Package, Check, Tag, Clock } from 'lucide-react';
import { Equipment } from '../types';
import { ImagePicker } from './ImagePicker';

interface EditEquipmentModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEquipment: Equipment) => void;
}

export const EditEquipmentModal: React.FC<EditEquipmentModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !equipment) return null;

  const [name, setName] = useState(equipment.name);
  const [category, setCategory] = useState(equipment.category);
  const [quotaDays, setQuotaDays] = useState(equipment.quotaDays);
  const [description, setDescription] = useState(equipment.description);
  const [imageUrl, setImageUrl] = useState(equipment.imageUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (equipment) {
      setName(equipment.name);
      setCategory(equipment.category);
      setQuotaDays(equipment.quotaDays);
      setDescription(equipment.description);
      setImageUrl(equipment.imageUrl);
    }
  }, [equipment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const updated: Equipment = {
      ...equipment,
      name: name.trim(),
      category: category.trim(),
      quotaDays: Number(quotaDays) || 90,
      description: description.trim(),
      imageUrl: imageUrl || equipment.imageUrl,
    };

    onSave(updated);
    setIsSubmitting(false);
    onClose();
  };

  const unitsCount = Array.isArray(equipment.units) ? equipment.units.length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-sky-50/70">
          <div className="flex items-center gap-2.5 text-sky-900 font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-2xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <div className="leading-tight">แก้ไขข้อมูลครุภัณฑ์</div>
              <div className="text-[11px] font-normal text-sky-700">
                รพ.สต.บ้านธาตุทอง (มีในระบบทั้งหมด {unitsCount} ชิ้น)
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
          {/* Item details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ชื่ออุปกรณ์ / ครุภัณฑ์ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น รถเข็นนั่งมาตรฐาน (Wheelchair), ที่นอนลมป้องกันแผลกดทับ"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-medium text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                หมวดหมู่อุปกรณ์
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all text-slate-800"
              >
                <option value="อุปกรณ์ช่วยเคลื่อนไหว">อุปกรณ์ช่วยเคลื่อนไหว</option>
                <option value="อุปกรณ์ดูแลบนเตียง">อุปกรณ์ดูแลบนเตียง</option>
                <option value="อุปกรณ์ช่วยหายใจ">อุปกรณ์ช่วยหายใจ</option>
                <option value="อุปกรณ์กายภาพบำบัด">อุปกรณ์กายภาพบำบัด</option>
                <option value="อุปกรณ์สุขอนามัย">อุปกรณ์สุขอนามัย</option>
                <option value="ครุภัณฑ์การแพทย์ทั่วไป">ครุภัณฑ์การแพทย์ทั่วไป</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                โควต้าเวลายืมตามระเบียบ (วัน)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="730"
                  required
                  value={quotaDays}
                  onChange={(e) => setQuotaDays(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-mono tabular-nums text-slate-800"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-normal">วัน</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รายละเอียด / ข้อมูลจำเพาะ / เงื่อนไขการดูแล
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุรายละเอียดจำเพาะ เช่น พับเก็บได้, เบาะกันน้ำ, สำหรับผู้ป่วยติดเตียง..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all text-slate-800"
            />
          </div>

          {/* Image Picker */}
          <div className="pt-1">
            <ImagePicker
              label="รูปภาพครุภัณฑ์หลัก (ถ่ายภาพจากกล้อง หรือเลือกจากไฟล์ภาพ)"
              value={imageUrl}
              onChange={(url) => setImageUrl(url)}
              helperText="สามารถถ่ายภาพใหม่ด้วยมือถือ อัปโหลดรูป หรือเลือกรูปสำเร็จรูปด้านล่าง"
            />
          </div>

          {/* Information box about registered units */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
            <Package className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>หมายเหตุ:</strong> การแก้ไขข้อมูลนี้จะอัปเดตชื่อ หมวดหมู่ โควต้า และรูปภาพตัวอย่างหลักของครุภัณฑ์ โดยหมายเลขทะเบียนรายชิ้น ({unitsCount} ชิ้น) และประวัติการยืมเดิมจะยังคงถูกรักษาไว้อย่างสมบูรณ์
            </div>
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
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
