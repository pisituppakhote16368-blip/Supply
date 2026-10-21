import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Calendar, User, Phone, MapPin, Tag, Camera, Check } from 'lucide-react';
import { Equipment, EquipmentUnit, BorrowRecord } from '../types';
import { getTodayString, addDays, formatThaiDate } from '../utils/dateUtils';
import { ImagePicker } from './ImagePicker';
import { THAT_THONG_VILLAGES, OTHER_VILLAGE, identifyVillage } from '../utils/villageUtils';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: Equipment[];
  preSelectedEquipmentId?: string;
  preSelectedUnitId?: string;
  preSelectedVillage?: string;
  onConfirmLoan: (record: Omit<BorrowRecord, 'id'>) => void;
}

const PRESET_PATIENT_AVATARS = [
  {
    label: 'คุณตา (ชายสูงอายุ)',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'คุณยาย (หญิงสูงอายุ)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'คุณลุง (วัยกลางคน)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'คุณป้า (หญิงวัยกลางคน)',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  },
];

export const LoanModal: React.FC<LoanModalProps> = ({
  isOpen,
  onClose,
  equipments,
  preSelectedEquipmentId,
  preSelectedUnitId,
  preSelectedVillage,
  onConfirmLoan,
}) => {
  if (!isOpen) return null;

  // Selected Village
  const [selectedVillage, setSelectedVillage] = useState<string>(
    preSelectedVillage || THAT_THONG_VILLAGES[0].name
  );

  useEffect(() => {
    if (preSelectedVillage) {
      setSelectedVillage(preSelectedVillage);
      if (!patientAddress || patientAddress.includes('ต.ธาตุทอง')) {
        setPatientAddress(`${preSelectedVillage} ต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร`);
      }
    }
  }, [preSelectedVillage]);

  // Selected Equipment
  const [selectedEqId, setSelectedEqId] = useState<string>(
    preSelectedEquipmentId || equipments[0]?.id || ''
  );

  const currentEquipment = equipments.find((e) => e.id === selectedEqId);
  const availableUnits = currentEquipment
    ? currentEquipment.units.filter((u) => u.status === 'available')
    : [];

  // Selected Unit
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    preSelectedUnitId || availableUnits[0]?.id || ''
  );

  useEffect(() => {
    if (preSelectedEquipmentId) {
      setSelectedEqId(preSelectedEquipmentId);
    }
  }, [preSelectedEquipmentId]);

  useEffect(() => {
    if (preSelectedUnitId) {
      setSelectedUnitId(preSelectedUnitId);
    } else if (availableUnits.length > 0 && !availableUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(availableUnits[0].id);
    }
  }, [selectedEqId, preSelectedUnitId, availableUnits, selectedUnitId]);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [patientIdCard, setPatientIdCard] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAddress, setPatientAddress] = useState('หมู่ 1 บ้านธาตุทอง ต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร');
  const [patientPhoto, setPatientPhoto] = useState(PRESET_PATIENT_AVATARS[0].url);
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [borrowDate, setBorrowDate] = useState(getTodayString());
  const [quotaDays, setQuotaDays] = useState(currentEquipment?.quotaDays || 90);
  const [lenderStaff, setLenderStaff] = useState('พว.สุดารัตน์ พรหมวิชัย');
  const [remarks, setRemarks] = useState('');

  // Update quota days when equipment changes
  useEffect(() => {
    if (currentEquipment) {
      setQuotaDays(currentEquipment.quotaDays);
    }
  }, [selectedEqId, currentEquipment]);

  // Calculate Due Date automatically
  const dueDate = addDays(borrowDate, quotaDays);

  const currentUnit = currentEquipment?.units.find((u) => u.id === selectedUnitId);

  // File upload handler for patient photo
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPatientPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEquipment || !currentUnit) return;

    onConfirmLoan({
      patientName: patientName.trim(),
      patientIdCard: patientIdCard.trim() || '-',
      patientPhone: patientPhone.trim(),
      patientAddress: patientAddress.trim(),
      village: selectedVillage,
      patientPhoto: patientPhoto || PRESET_PATIENT_AVATARS[0].url,
      equipmentId: currentEquipment.id,
      equipmentName: currentEquipment.name,
      unitId: currentUnit.id,
      unitNumber: currentUnit.unitNumber,
      assetCode: currentUnit.assetCode,
      borrowDate,
      quotaDays,
      dueDate,
      returnDate: null,
      lenderStaff,
      status: 'active',
      remarks: remarks.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
            <PlusCircle className="w-5 h-5 text-teal-600" />
            <span>บันทึกการยืมอุปกรณ์ (รพ.สต.ธาตุทอง)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Equipment & Unit Selection */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-teal-600" />
              <span>1. เลือกอุปกรณ์และหมายเลขครุภัณฑ์ที่จะให้ยืม</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเภทอุปกรณ์
                </label>
                <select
                  value={selectedEqId}
                  onChange={(e) => setSelectedEqId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {equipments.map((eq) => {
                    const avail = eq.units.filter((u) => u.status === 'available').length;
                    return (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} (ว่าง {avail} ชิ้น)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลือกคัน/ชิ้น (เลขครุภัณฑ์) <span className="text-rose-500">*</span>
                </label>
                {availableUnits.length > 0 ? (
                  <select
                    required
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  >
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        คัน/ชิ้นที่ {u.unitNumber} - {u.assetCode} ({u.condition})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200 font-medium">
                    ไม่มีอุปกรณ์ว่างในประเภทนี้ (ถูกยืมหรือซ่อมอยู่ทั้งหมด)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Patient Information (โชว์รูปผู้ป่วย, ที่อยู่, เบอร์โทร) */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-600" />
              <span>2. ข้อมูลผู้ป่วย / ผู้ยืม</span>
            </div>

            {/* Photo Selection / Upload via ImagePicker (Camera & Gallery) */}
            <ImagePicker
              label="รูปถ่ายผู้ป่วย / ผู้ยืม (ถ่ายจากกล้อง หรือเลือกจากแกลเลอรี่)"
              value={patientPhoto}
              onChange={(newUrl) => setPatientPhoto(newUrl)}
              presetImages={PRESET_PATIENT_AVATARS}
              helperText="สามารถถ่ายรูปผู้ป่วยได้ทันทีจากกล้อง หรือเลือกภาพถ่ายจากแกลเลอรี่ในเครื่อง"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ - นามสกุล ผู้ป่วย / ผู้ยืม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="เช่น นายประสิทธิ์ พลสว่าง"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลขบัตรประจำตัวประชาชน 13 หลัก
                </label>
                <input
                  type="text"
                  value={patientIdCard}
                  onChange={(e) => setPatientIdCard(e.target.value)}
                  placeholder="3-4705-xxxxx-xx-x"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมู่บ้านในตำบลธาตุทอง <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedVillage}
                  onChange={(e) => {
                    const vName = e.target.value;
                    setSelectedVillage(vName);
                    // If address was template or previous village, auto update
                    if (patientAddress.includes('ต.ธาตุทอง')) {
                      setPatientAddress(`${vName} ต.ธาตุทอง อ.สว่างแดนดิน จ.สกลนคร`);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
                >
                  {THAT_THONG_VILLAGES.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                  <option value={OTHER_VILLAGE.name}>{OTHER_VILLAGE.name}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียดที่อยู่ (บ้านเลขที่ / ซอย) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  placeholder="เช่น บ้านเลขที่ 12/3 หมู่ 1 บ้านธาตุทอง ต.ธาตุทอง"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Loan Dates & Duration (วันที่ยืม, โควต้าระยะการยืม, คำนวณวันส่งคืน) */}
          <div className="space-y-3 bg-teal-50/40 p-4 rounded-xl border border-teal-100">
            <div className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span>3. กำหนดระยะเวลาการยืม & วันส่งคืน</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่ยืม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={borrowDate}
                  onChange={(e) => setBorrowDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  โควต้าระยะการยืม (วัน)
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  กำหนดส่งคืน (คำนวณอัตโนมัติ)
                </label>
                <div className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-teal-800 font-semibold">
                  {formatThaiDate(dueDate)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เจ้าหน้าที่ผู้ให้บริการยืม (รพ.สต.ธาตุทอง)
                </label>
                <input
                  type="text"
                  required
                  value={lenderStaff}
                  onChange={(e) => setLenderStaff(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุ / อาการผู้ป่วย
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="เช่น ผู้ป่วยผ่าตัดเข่า ฟื้นฟูสมรรถภาพ"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
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
              disabled={!currentUnit || availableUnits.length === 0}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>ยืนยันบันทึกการยืม</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
