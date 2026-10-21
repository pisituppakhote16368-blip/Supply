/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_EQUIPMENT, 
  INITIAL_BORROW_RECORDS, 
  INITIAL_QUOTA_POLICIES 
} from './data/initialData';
import { Equipment, EquipmentUnit, BorrowRecord, QuotaPolicy } from './types';
import { calculateOverdueInfo } from './utils/dateUtils';
import { Header } from './components/Header';
import { OverviewSection } from './components/OverviewSection';
import { BorrowHistorySection } from './components/BorrowHistorySection';
import { InventorySection } from './components/InventorySection';
import { LoanModal } from './components/LoanModal';
import { ReturnModal } from './components/ReturnModal';
import { AddEquipmentModal } from './components/AddEquipmentModal';
import { AddUnitModal } from './components/AddUnitModal';
import { EditEquipmentModal } from './components/EditEquipmentModal';
import { EditUnitModal } from './components/EditUnitModal';
import { PrintLoanSlipModal } from './components/PrintLoanSlipModal';
import { testConnection } from './firebase';
import { 
  seedInitialDataIfEmpty,
  subscribeToEquipments,
  subscribeToBorrowRecords,
  subscribeToQuotaPolicies,
  createLoanTransaction,
  returnItemTransaction,
  addEquipmentToFirestore,
  addUnitToFirestore,
  updateEquipmentInFirestore,
  updateUnitInFirestore,
  toggleUnitRepairInFirestore,
  deleteEquipmentFromFirestore,
  deleteUnitFromFirestore,
  resetFirestoreToSample,
  clearAllBorrowingsToZero
} from './services/equipmentService';
import { Stethoscope, CheckCircle2, Globe, Cloud, RefreshCw } from 'lucide-react';

export default function App() {
  // Primary Tabs: 'overview' (ภาพรวม / สถานะ), 'history' (ประวัติการยืม), 'inventory' (คลัง)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'inventory'>('overview');

  // Filter states navigated from status cards
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'available' | 'borrowed' | 'repair'>('all');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');

  // Core Data States
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>(INITIAL_BORROW_RECORDS);
  const [quotaPolicies, setQuotaPolicies] = useState<QuotaPolicy[]>(INITIAL_QUOTA_POLICIES);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal States
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [preSelectedEqId, setPreSelectedEqId] = useState<string | undefined>(undefined);
  const [preSelectedUnitId, setPreSelectedUnitId] = useState<string | undefined>(undefined);

  const [selectedRecordForReturn, setSelectedRecordForReturn] = useState<BorrowRecord | null>(null);
  const [selectedRecordForPrint, setSelectedRecordForPrint] = useState<BorrowRecord | null>(null);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [equipmentForAddUnit, setEquipmentForAddUnit] = useState<Equipment | null>(null);
  const [equipmentForEdit, setEquipmentForEdit] = useState<Equipment | null>(null);
  const [unitForEdit, setUnitForEdit] = useState<{ equipment: Equipment; unit: EquipmentUnit } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Firebase Real-time Initialization & Subscriptions
  useEffect(() => {
    let unsubEquipments: (() => void) | undefined;
    let unsubRecords: (() => void) | undefined;
    let unsubPolicies: (() => void) | undefined;

    const initFirebase = async () => {
      try {
        await testConnection();
        await seedInitialDataIfEmpty();

        unsubEquipments = subscribeToEquipments(
          (data) => {
            if (data && data.length > 0) {
              setEquipments(data);
            }
            setIsLoading(false);
          },
          (err) => {
            console.warn('Equipments sync error:', err);
            setIsCloudConnected(false);
            setIsLoading(false);
          }
        );

        unsubRecords = subscribeToBorrowRecords(
          (data) => {
            if (data) {
              setBorrowRecords(data);
            }
          },
          (err) => {
            console.warn('Records sync error:', err);
          }
        );

        unsubPolicies = subscribeToQuotaPolicies(
          (data) => {
            if (data && data.length > 0) {
              setQuotaPolicies(data);
            }
          },
          (err) => {
            console.warn('Policies sync error:', err);
          }
        );

        setIsCloudConnected(true);
      } catch (e) {
        console.error('Failed initializing Firebase sync:', e);
        setIsCloudConnected(false);
        setIsLoading(false);
      }
    };

    initFirebase();

    return () => {
      if (unsubEquipments) unsubEquipments();
      if (unsubRecords) unsubRecords();
      if (unsubPolicies) unsubPolicies();
    };
  }, []);

  // Calculate Overdue and Active Counts for Badge
  const activeLoans = borrowRecords.filter((r) => r.status === 'active' || r.status === 'overdue');
  const overdueCount = activeLoans.filter((r) => {
    const info = calculateOverdueInfo(r.borrowDate, r.dueDate, r.returnDate);
    return info.isOverdue;
  }).length;

  // Handler: Confirm New Loan (Saved to Cloud Database)
  const handleConfirmLoan = async (newRecordData: Omit<BorrowRecord, 'id'>) => {
    const newRecordId = `loan-${Date.now()}`;
    const newRecord: BorrowRecord = {
      ...newRecordData,
      id: newRecordId,
    };

    try {
      await createLoanTransaction(newRecord, equipments);
      setIsLoanModalOpen(false);
      setPreSelectedEqId(undefined);
      setPreSelectedUnitId(undefined);
      showToast(`บันทึกการยืม ${newRecord.equipmentName} เรียบร้อยแล้ว (อัปเดตออนไลน์)`);
      setActiveTab('history');
    } catch (e) {
      console.error('Error recording loan:', e);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Handler: Confirm Return (Saved to Cloud Database)
  const handleConfirmReturn = async (
    recordId: string,
    returnDate: string,
    condition: string,
    receiverStaff: string,
    returnNote: string,
    markForRepair: boolean
  ) => {
    const record = borrowRecords.find((r) => r.id === recordId);
    if (!record) return;

    try {
      await returnItemTransaction(
        recordId,
        returnDate,
        condition,
        receiverStaff,
        returnNote,
        markForRepair,
        record,
        equipments
      );
      setSelectedRecordForReturn(null);
      showToast(`บันทึกส่งคืน ${record.equipmentName} เรียบร้อยแล้ว (อัปเดตออนไลน์)`);
    } catch (e) {
      console.error('Error confirming return:', e);
      showToast('เกิดข้อผิดพลาดในการบันทึกการส่งคืน');
    }
  };

  // Handler: Add New Equipment (Saved to Cloud Database)
  const handleAddEquipment = async (newEquipment: Equipment) => {
    try {
      await addEquipmentToFirestore(newEquipment);
      showToast(`เพิ่มอุปกรณ์ ${newEquipment.name} เข้าคลังออนไลน์แล้ว`);
    } catch (e) {
      console.error('Error adding equipment:', e);
      showToast('เกิดข้อผิดพลาดในการเพิ่มอุปกรณ์');
    }
  };

  // Handler: Add Unit to Equipment (Saved to Cloud Database)
  const handleAddUnit = async (equipmentId: string, newUnit: EquipmentUnit) => {
    const targetEq = equipments.find((e) => e.id === equipmentId);
    if (!targetEq) return;

    try {
      await addUnitToFirestore(equipmentId, targetEq, newUnit);
      showToast(`เพิ่มชิ้นที่ ${newUnit.unitNumber} (${newUnit.assetCode}) สำเร็จ`);
    } catch (e) {
      console.error('Error adding unit:', e);
      showToast('เกิดข้อผิดพลาดในการเพิ่มชิ้นอุปกรณ์');
    }
  };

  // Handler: Toggle Repair Status (Saved to Cloud Database)
  const handleToggleUnitRepair = async (equipmentId: string, unitId: string, currentStatus: string) => {
    const targetEq = equipments.find((e) => e.id === equipmentId);
    if (!targetEq) return;

    try {
      await toggleUnitRepairInFirestore(equipmentId, targetEq, unitId, currentStatus);
      showToast(`อัปเดตสถานะการซ่อมบำรุงเรียบร้อย (อัปเดตออนไลน์)`);
    } catch (e) {
      console.error('Error updating status:', e);
      showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // Handler: Delete Equipment (Main Category & all its units)
  const handleDeleteEquipment = async (equipmentId: string) => {
    try {
      await deleteEquipmentFromFirestore(equipmentId);
      setEquipments((prev) => prev.filter((e) => e.id !== equipmentId));
      showToast('ลบอุปกรณ์หลักและรายการย่อยออกจากระบบเรียบร้อยแล้ว');
    } catch (e) {
      console.error('Error deleting equipment:', e);
      showToast('เกิดข้อผิดพลาดในการลบอุปกรณ์');
    }
  };

  // Handler: Delete Unit (Single Physical Unit)
  const handleDeleteUnit = async (equipmentId: string, unitId: string) => {
    const targetEq = equipments.find((e) => e.id === equipmentId);
    if (!targetEq) return;

    try {
      await deleteUnitFromFirestore(equipmentId, targetEq, unitId);
      setEquipments((prev) =>
        prev.map((e) => {
          if (e.id === equipmentId) {
            const nextUnits = e.units.filter((u) => u.id !== unitId);
            return {
              ...e,
              totalUnits: nextUnits.length,
              units: nextUnits,
            };
          }
          return e;
        })
      );
      showToast('ลบชิ้นอุปกรณ์ออกจากระบบเรียบร้อยแล้ว');
    } catch (e) {
      console.error('Error deleting unit:', e);
      showToast('เกิดข้อผิดพลาดในการลบชิ้นอุปกรณ์');
    }
  };

  // Handler: Save Edit Equipment (Main Item Info)
  const handleSaveEditEquipment = async (updatedEquipment: Equipment) => {
    try {
      await updateEquipmentInFirestore(updatedEquipment.id, {
        name: updatedEquipment.name,
        category: updatedEquipment.category,
        quotaDays: updatedEquipment.quotaDays,
        description: updatedEquipment.description,
        imageUrl: updatedEquipment.imageUrl,
      });
      setEquipments((prev) =>
        prev.map((e) => (e.id === updatedEquipment.id ? updatedEquipment : e))
      );
      showToast(`บันทึกการแก้ไขครุภัณฑ์ "${updatedEquipment.name}" เรียบร้อยแล้ว`);
    } catch (e) {
      console.error('Error saving equipment edit:', e);
      showToast('เกิดข้อผิดพลาดในการบันทึกการแก้ไขครุภัณฑ์');
    }
  };

  // Handler: Save Edit Unit (Physical Unit Details)
  const handleSaveEditUnit = async (equipmentId: string, updatedUnit: EquipmentUnit) => {
    const targetEq = equipments.find((e) => e.id === equipmentId);
    if (!targetEq) return;

    try {
      await updateUnitInFirestore(equipmentId, targetEq, updatedUnit);
      setEquipments((prev) =>
        prev.map((e) => {
          if (e.id === equipmentId) {
            return {
              ...e,
              units: e.units.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)),
            };
          }
          return e;
        })
      );
      showToast(`บันทึกการแก้ไขชิ้น/คันที่ ${updatedUnit.unitNumber} (${updatedUnit.assetCode}) เรียบร้อย`);
    } catch (e) {
      console.error('Error saving unit edit:', e);
      showToast('เกิดข้อผิดพลาดในการบันทึกการแก้ไขชิ้นอุปกรณ์');
    }
  };

  // Handler: Quick lend from inventory
  const handleOpenLendFromInventory = (equipment: Equipment, unit: EquipmentUnit) => {
    setPreSelectedEqId(equipment.id);
    setPreSelectedUnitId(unit.id);
    setIsLoanModalOpen(true);
  };

  // Handler: Reset to Initial Data (Reset in Cloud)
  // Handler: Click status card on Overview to jump directly to filtered data
  const handleSelectStatusCard = (status: 'all' | 'available' | 'borrowed' | 'repair') => {
    if (status === 'borrowed') {
      // Direct jump to active loans (patients, address, phone, due dates, return action)
      setHistoryFilter('active');
      setActiveTab('history');
      showToast('กำลังแสดงรายการที่ถูกยืมอยู่ในขณะนี้');
    } else {
      // Direct jump to inventory filtered by that status
      setInventoryFilter(status);
      setActiveTab('inventory');
      if (status === 'available') {
        showToast('กำลังแสดงเฉพาะอุปกรณ์ที่พร้อมยืม');
      } else if (status === 'repair') {
        showToast('กำลังแสดงเฉพาะอุปกรณ์ที่ชำรุดรอซ่อมบำรุง');
      } else {
        showToast('กำลังแสดงคลังอุปกรณ์ทั้งหมด');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-sky-100 selection:text-sky-900 font-sans">
      {/* Real-time Cloud Status Bar */}
      <div className="no-print bg-sky-900 text-sky-100 px-4 py-1.5 text-xs border-b border-sky-800 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
            </span>
            <span className="font-medium text-white">ระบบเชื่อมต่อฐานข้อมูลคลาวด์ออนไลน์ (Cloud Real-time)</span>
            <span className="hidden md:inline text-sky-200">
              · ทุกคนสามารถเปิดใช้งานและลงข้อมูลพร้อมกันผ่านเว็บได้ทันที
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-sky-200">
            <Cloud className="w-3.5 h-3.5 text-sky-300" />
            <span>รพ.สต.บ้านธาตุทอง</span>
          </div>
        </div>
      </div>

      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewLoan={() => {
          setPreSelectedEqId(undefined);
          setPreSelectedUnitId(undefined);
          setIsLoanModalOpen(true);
        }}
        activeLoanCount={activeLoans.length}
        overdueCount={overdueCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'overview' && (
          <OverviewSection
            equipments={equipments}
            borrowRecords={borrowRecords}
            quotaPolicies={quotaPolicies}
            onOpenReturnModal={(record) => setSelectedRecordForReturn(record)}
            onOpenNewLoan={() => {
              setPreSelectedEqId(undefined);
              setPreSelectedUnitId(undefined);
              setIsLoanModalOpen(true);
            }}
            onViewAllLoans={() => setActiveTab('history')}
            onViewInventory={() => setActiveTab('inventory')}
            onSelectStatusCard={handleSelectStatusCard}
          />
        )}

        {activeTab === 'history' && (
          <BorrowHistorySection
            borrowRecords={borrowRecords}
            onOpenReturnModal={(record) => setSelectedRecordForReturn(record)}
            onOpenPrintModal={(record) => setSelectedRecordForPrint(record)}
            onOpenNewLoan={() => {
              setPreSelectedEqId(undefined);
              setPreSelectedUnitId(undefined);
              setIsLoanModalOpen(true);
            }}
            initialStatusFilter={historyFilter}
          />
        )}

        {activeTab === 'inventory' && (
          <InventorySection
            equipments={equipments}
            onOpenAddEquipment={() => setIsAddEquipmentOpen(true)}
            onOpenAddUnit={(eq) => setEquipmentForAddUnit(eq)}
            onOpenLendUnit={handleOpenLendFromInventory}
            onToggleUnitRepair={handleToggleUnitRepair}
            onDeleteEquipment={handleDeleteEquipment}
            onDeleteUnit={handleDeleteUnit}
            onOpenEditEquipment={(eq) => setEquipmentForEdit(eq)}
            onOpenEditUnit={(eq, u) => setUnitForEdit({ equipment: eq, unit: u })}
            initialStatusFilter={inventoryFilter}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-sky-100 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo-thatthong.jpg" 
              alt="ตรา รพ.สต.บ้านธาตุทอง" 
              className="w-6 h-6 object-cover rounded-full border border-sky-200"
            />
            <span className="font-medium text-slate-700">ระบบยืม-คืนกายอุปกรณ์ โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านธาตุทอง</span>
            <span className="text-slate-400 hidden md:inline">· องค์การบริหารส่วนจังหวัดสกลนคร</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>ฐานข้อมูลคลาวด์ออนไลน์ · ซิงค์ข้อมูลอัตโนมัติ</span>
          </div>
        </div>
      </footer>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal: New Loan */}
      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        equipments={equipments}
        preSelectedEquipmentId={preSelectedEqId}
        preSelectedUnitId={preSelectedUnitId}
        onConfirmLoan={handleConfirmLoan}
      />

      {/* Modal: Return Item (มีปุ่มกดคืนของ ให้ใส่วันที่คืน และกดยืนยัน) */}
      <ReturnModal
        record={selectedRecordForReturn}
        onClose={() => setSelectedRecordForReturn(null)}
        onConfirmReturn={handleConfirmReturn}
      />

      {/* Modal: Add Equipment to Inventory */}
      <AddEquipmentModal
        isOpen={isAddEquipmentOpen}
        onClose={() => setIsAddEquipmentOpen(false)}
        onAddEquipment={handleAddEquipment}
      />

      {/* Modal: Add Physical Unit to Equipment */}
      <AddUnitModal
        equipment={equipmentForAddUnit}
        onClose={() => setEquipmentForAddUnit(null)}
        onAddUnit={handleAddUnit}
      />

      {/* Modal: Edit Equipment (ข้อมูลครุภัณฑ์หลัก) */}
      <EditEquipmentModal
        isOpen={!!equipmentForEdit}
        equipment={equipmentForEdit}
        onClose={() => setEquipmentForEdit(null)}
        onSave={handleSaveEditEquipment}
      />

      {/* Modal: Edit Physical Unit (ข้อมูลชิ้น/คันประจำทะเบียน) */}
      <EditUnitModal
        isOpen={!!unitForEdit}
        equipment={unitForEdit?.equipment || null}
        unit={unitForEdit?.unit || null}
        onClose={() => setUnitForEdit(null)}
        onSave={handleSaveEditUnit}
      />

      {/* Modal: Print Loan Slip / Official Form */}
      <PrintLoanSlipModal
        record={selectedRecordForPrint}
        onClose={() => setSelectedRecordForPrint(null)}
      />
    </div>
  );
}
