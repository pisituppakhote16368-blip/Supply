import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  Building2, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Filter,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { BorrowRecord } from '../types';
import { formatThaiDate, getTodayString, calculateOverdueInfo } from '../utils/dateUtils';
import { THAT_THONG_VILLAGES, identifyVillage } from '../utils/villageUtils';

interface PrintBorrowerRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  borrowRecords: BorrowRecord[];
}

export const PrintBorrowerRosterModal: React.FC<PrintBorrowerRosterModalProps> = ({
  isOpen,
  onClose,
  borrowRecords,
}) => {
  if (!isOpen) return null;

  const [filterType, setFilterType] = useState<'active' | 'all' | 'overdue'>('active');
  const [groupByVillage, setGroupByVillage] = useState<boolean>(true);
  const printContentRef = useRef<HTMLDivElement>(null);

  // Filter records
  const filteredRecords = useMemo(() => {
    return borrowRecords.filter((record) => {
      if (filterType === 'active') return record.status === 'active' || record.status === 'overdue';
      if (filterType === 'overdue') return record.status === 'overdue';
      return true;
    });
  }, [borrowRecords, filterType]);

  // Group by village if enabled
  const groupedData = useMemo(() => {
    if (!groupByVillage) {
      return [{ villageName: 'รายชื่อทั้งหมด', records: filteredRecords }];
    }

    const map = new Map<string, BorrowRecord[]>();

    filteredRecords.forEach((record) => {
      const v = identifyVillage(record.patientAddress, record.village);
      const key = v.name;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(record);
    });

    // Sort by mooNumber
    const list: { villageName: string; records: BorrowRecord[] }[] = [];
    THAT_THONG_VILLAGES.forEach((v) => {
      if (map.has(v.name)) {
        list.push({ villageName: v.name, records: map.get(v.name)! });
        map.delete(v.name);
      }
    });

    // Any remaining (other / outside)
    map.forEach((records, villageName) => {
      list.push({ villageName, records });
    });

    return list;
  }, [filteredRecords, groupByVillage]);

  // Overall counts
  const totalActive = useMemo(() => {
    return borrowRecords.filter((r) => r.status === 'active' || r.status === 'overdue').length;
  }, [borrowRecords]);

  const totalOverdue = useMemo(() => {
    return borrowRecords.filter((r) => r.status === 'overdue').length;
  }, [borrowRecords]);

  // Generate standalone HTML for printing in a new window or iframe
  const generatePrintableHtml = () => {
    const todayThai = formatThaiDate(getTodayString(), true);
    
    let tableRows = '';
    let seq = 1;

    groupedData.forEach((group) => {
      if (groupByVillage && groupedData.length > 1) {
        tableRows += `
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="8" style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left; color: #0369a1;">
              📌 ${group.villageName} (${group.records.length} รายการ)
            </td>
          </tr>
        `;
      }

      group.records.forEach((record) => {
        const overdueInfo = calculateOverdueInfo(record.borrowDate, record.dueDate, record.returnDate);
        const statusBadge = record.status === 'returned'
          ? '<span style="color: #15803d; font-weight: bold;">คืนแล้ว</span>'
          : overdueInfo.isOverdue
          ? `<span style="color: #b91c1c; font-weight: bold;">เกิน ${overdueInfo.overdueDays} วัน</span>`
          : '<span style="color: #0284c7; font-weight: bold;">กำลังยืม</span>';

        tableRows += `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
            <td style="padding: 8px 6px; border: 1px solid #cbd5e1; text-align: center;">${seq++}</td>
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">
              ${record.patientName}
              <div style="font-size: 11px; color: #64748b; font-weight: normal;">บัตร ปชช: ${record.patientIdCard || '-'}</div>
            </td>
            <td style="padding: 8px 6px; border: 1px solid #cbd5e1; text-align: center;">${record.patientPhone}</td>
            <td style="padding: 8px 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 12px;">${record.patientAddress}</td>
            <td style="padding: 8px 8px; border: 1px solid #cbd5e1; text-align: left;">
              <strong>${record.equipmentName}</strong>
              <div style="font-size: 11px; color: #475569;">คัน/ชิ้นที่ ${record.unitNumber} (${record.assetCode})</div>
            </td>
            <td style="padding: 8px 6px; border: 1px solid #cbd5e1; text-align: center; white-space: nowrap;">${formatThaiDate(record.borrowDate)}</td>
            <td style="padding: 8px 6px; border: 1px solid #cbd5e1; text-align: center; white-space: nowrap;">${formatThaiDate(record.dueDate)}</td>
            <td style="padding: 8px 6px; border: 1px solid #cbd5e1; text-align: center;">${statusBadge}</td>
          </tr>
        `;
      });
    });

    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>ใบรายชื่อผู้ยืมกายอุปกรณ์ - รพ.สต.บ้านธาตุทอง</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
          body {
            font-family: 'Sarabun', 'Prompt', sans-serif, -apple-system;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
          }
          .header img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid #0284c7;
          }
          .header-text h1 {
            font-size: 18px;
            margin: 0;
            font-weight: bold;
            color: #0369a1;
          }
          .header-text h2 {
            font-size: 14px;
            margin: 4px 0 0 0;
            color: #334155;
          }
          .header-text p {
            font-size: 12px;
            margin: 2px 0 0 0;
            color: #64748b;
          }
          .meta-bar {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 10px;
            color: #334155;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background-color: #e0f2fe;
            color: #0369a1;
            font-weight: bold;
            padding: 8px 6px;
            border: 1px solid #94a3b8;
            font-size: 12px;
            text-align: center;
          }
          .signatures {
            margin-top: 36px;
            display: flex;
            justify-content: space-around;
            page-break-inside: avoid;
          }
          .sign-box {
            text-align: center;
            font-size: 13px;
            line-height: 1.8;
          }
          .sign-line {
            width: 220px;
            border-bottom: 1px dotted #475569;
            margin: 32px auto 6px auto;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo-thatthong.jpg" alt="Logo" onerror="this.style.display='none'" />
          <div class="header-text">
            <h1>ทะเบียนรายชื่อผู้ยืมกายอุปกรณ์ทางการแพทย์</h1>
            <h2>โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านธาตุทอง อำเภอสว่างแดนดิน จังหวัดสกลนคร</h2>
            <p>องค์การบริหารส่วนจังหวัดสกลนคร</p>
          </div>
        </div>

        <div class="meta-bar">
          <div><strong>สถานะข้อมูล:</strong> ${filterType === 'active' ? 'เฉพาะผู้ที่กำลังยืมอยู่ขณะนี้' : filterType === 'overdue' ? 'เฉพาะรายการเกินกำหนด' : 'ประวัติทั้งหมด'}</div>
          <div><strong>จำนวนรวม:</strong> ${filteredRecords.length} รายการ</div>
          <div><strong>พิมพ์ ณ วันที่:</strong> ${todayThai}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px;">ที่</th>
              <th style="width: 170px;">ชื่อ-สกุล ผู้ป่วย/ผู้ยืม</th>
              <th style="width: 95px;">เบอร์โทร</th>
              <th>ที่อยู่ / หมู่บ้าน</th>
              <th style="width: 190px;">กายอุปกรณ์ที่ยืม</th>
              <th style="width: 85px;">วันที่ยืม</th>
              <th style="width: 85px;">กำหนดคืน</th>
              <th style="width: 75px;">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="8" style="text-align:center; padding: 20px;">ไม่มีข้อมูล</td></tr>'}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sign-box">
            <div>ลงชื่อ ........................................................... ผู้จัดทำรายงาน</div>
            <div>(...........................................................)</div>
            <div>ตำแหน่ง พยาบาลวิชาชีพ / เจ้าหน้าที่ผู้รับผิดชอบ</div>
            <div>วันที่ ......../......../............</div>
          </div>
          <div class="sign-box">
            <div>ลงชื่อ ........................................................... ผู้รับรอง</div>
            <div>(...........................................................)</div>
            <div>ตำแหน่ง ผู้อำนวยการ รพ.สต.บ้านธาตุทอง</div>
            <div>วันที่ ......../......../............</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  /**
   * Print Handler: Opens clean printable frame / print window so user can print directly
   */
  const handlePrint = () => {
    try {
      const htmlContent = generatePrintableHtml();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 350);
      } else {
        // Fallback to window.print if popup blocked
        window.print();
      }
    } catch (e) {
      console.warn('Fallback print:', e);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-100 max-w-5xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-150">
        {/* Top Control Bar (No Print) */}
        <div className="no-print px-6 py-4 bg-gradient-to-r from-sky-700 via-sky-600 to-sky-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                พิมพ์ใบรายชื่อผู้ยืมกายอุปกรณ์
              </h3>
              <p className="text-xs text-sky-100">
                รพ.สต.บ้านธาตุทอง · รายงานสำหรับเจ้าหน้าที่ และ อสม. ลงพื้นที่ติดตาม
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-sky-900 bg-white hover:bg-sky-50 active:bg-sky-100 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-700" />
              <span>สั่งพิมพ์ใบรายชื่อ (Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Grouping Bar (No Print) */}
        <div className="no-print px-6 py-3 bg-sky-50/70 border-b border-sky-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Filter Pills */}
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-lg font-medium shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterType('active')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filterType === 'active'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กำลังยืมอยู่ ({totalActive} รายการ)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({borrowRecords.length} รายการ)
            </button>
            {totalOverdue > 0 && (
              <button
                type="button"
                onClick={() => setFilterType('overdue')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  filterType === 'overdue'
                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                เกินกำหนด ({totalOverdue})
              </button>
            )}
          </div>

          {/* Grouping Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium select-none">
            <input
              type="checkbox"
              checked={groupByVillage}
              onChange={(e) => setGroupByVillage(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
            />
            <span>จัดกลุ่มแยกตามหมู่บ้าน (หมู่ 1 - หมู่ 8)</span>
          </label>
        </div>

        {/* Paper Document Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/70">
          <div 
            ref={printContentRef}
            id="printable-roster-document"
            className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-10 text-slate-900"
          >
            {/* Document Header */}
            <div className="text-center border-b-2 border-sky-600 pb-4 mb-5 flex items-center justify-center gap-4">
              <img 
                src="/logo-thatthong.jpg" 
                alt="ตรา รพ.สต.บ้านธาตุทอง" 
                className="w-14 h-14 object-cover rounded-full border-2 border-sky-600 shadow-xs shrink-0" 
              />
              <div className="text-center">
                <h1 className="text-lg sm:text-xl font-bold text-sky-900 tracking-tight">
                  ทะเบียนรายชื่อผู้ยืมกายอุปกรณ์ทางการแพทย์
                </h1>
                <h2 className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                  โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านธาตุทอง อำเภอสว่างแดนดิน จังหวัดสกลนคร
                </h2>
                <p className="text-xs text-slate-500">
                  องค์การบริหารส่วนจังหวัดสกลนคร
                </p>
              </div>
            </div>

            {/* Document Meta */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600 mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">สถานะข้อมูล:</span>
                <span className="bg-sky-50 text-sky-800 px-2 py-0.5 rounded font-medium border border-sky-200">
                  {filterType === 'active' ? 'เฉพาะผู้ที่กำลังยืมอยู่ขณะนี้' : filterType === 'overdue' ? 'เฉพาะรายการเกินกำหนด' : 'ประวัติทั้งหมด'}
                </span>
                <span className="text-slate-400">·</span>
                <span>จำนวนทั้งสิ้น <strong>{filteredRecords.length}</strong> รายการ</span>
              </div>
              <div>
                พิมพ์ ณ วันที่: <strong className="text-slate-800">{formatThaiDate(getTodayString(), true)}</strong>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-sky-100/70 text-sky-950 font-bold border border-sky-200">
                    <th className="py-2.5 px-2 text-center border border-slate-300 w-10">ที่</th>
                    <th className="py-2.5 px-3 text-left border border-slate-300 min-w-[150px]">ชื่อ-สกุล ผู้ป่วย/ผู้ยืม</th>
                    <th className="py-2.5 px-2 text-center border border-slate-300 min-w-[90px]">เบอร์โทรศัพท์</th>
                    <th className="py-2.5 px-3 text-left border border-slate-300 min-w-[160px]">ที่อยู่ / หมู่บ้าน</th>
                    <th className="py-2.5 px-3 text-left border border-slate-300 min-w-[170px]">กายอุปกรณ์ที่ยืม</th>
                    <th className="py-2.5 px-2 text-center border border-slate-300 whitespace-nowrap">วันที่ยืม</th>
                    <th className="py-2.5 px-2 text-center border border-slate-300 whitespace-nowrap">กำหนดคืน</th>
                    <th className="py-2.5 px-2 text-center border border-slate-300 min-w-[80px]">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 border border-slate-200">
                        ไม่มีข้อมูลตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      let counter = 1;
                      return groupedData.map((group) => (
                        <React.Fragment key={group.villageName}>
                          {groupByVillage && groupedData.length > 1 && (
                            <tr className="bg-slate-100/90 font-bold text-sky-900">
                              <td colSpan={8} className="py-2 px-3 border border-slate-300 text-left">
                                📌 {group.villageName} ({group.records.length} รายการ)
                              </td>
                            </tr>
                          )}

                          {group.records.map((record) => {
                            const overdueInfo = calculateOverdueInfo(record.borrowDate, record.dueDate, record.returnDate);

                            return (
                              <tr key={record.id} className="hover:bg-slate-50 border-b border-slate-200">
                                <td className="py-2 px-2 text-center border border-slate-300 tabular-nums">
                                  {counter++}
                                </td>
                                <td className="py-2 px-3 border border-slate-300">
                                  <div className="font-semibold text-slate-900">{record.patientName}</div>
                                  {record.patientIdCard && record.patientIdCard !== '-' && (
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      บัตร ปชช: {record.patientIdCard}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-center border border-slate-300 font-mono">
                                  {record.patientPhone}
                                </td>
                                <td className="py-2 px-3 border border-slate-300 text-[11px] text-slate-700">
                                  {record.patientAddress}
                                </td>
                                <td className="py-2 px-3 border border-slate-300">
                                  <div className="font-medium text-slate-900">{record.equipmentName}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    คัน/ชิ้นที่ {record.unitNumber} ({record.assetCode})
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-center border border-slate-300 whitespace-nowrap text-[11px]">
                                  {formatThaiDate(record.borrowDate)}
                                </td>
                                <td className="py-2 px-2 text-center border border-slate-300 whitespace-nowrap text-[11px]">
                                  {formatThaiDate(record.dueDate)}
                                </td>
                                <td className="py-2 px-2 text-center border border-slate-300">
                                  {record.status === 'returned' ? (
                                    <span className="text-emerald-700 font-semibold text-[11px]">คืนแล้ว</span>
                                  ) : overdueInfo.isOverdue ? (
                                    <span className="text-rose-700 font-bold text-[11px]">เกิน {overdueInfo.overdueDays} วัน</span>
                                  ) : (
                                    <span className="text-sky-700 font-semibold text-[11px]">กำลังยืม</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ));
                    })()
                  )}
                </tbody>
              </table>
            </div>

            {/* Signature Section */}
            <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-1">
                <div>ลงชื่อ ........................................................... ผู้จัดทำรายงาน</div>
                <div className="text-slate-500">(...........................................................)</div>
                <div className="text-slate-600 font-medium">ตำแหน่ง พยาบาลวิชาชีพ / เจ้าหน้าที่ผู้รับผิดชอบ</div>
                <div className="text-slate-400 text-[11px]">วันที่ ......../......../............</div>
              </div>

              <div className="space-y-1">
                <div>ลงชื่อ ........................................................... ผู้รับรอง</div>
                <div className="text-slate-500">(...........................................................)</div>
                <div className="text-slate-600 font-medium">ตำแหน่ง ผู้อำนวยการ รพ.สต.บ้านธาตุทอง</div>
                <div className="text-slate-400 text-[11px]">วันที่ ......../......../............</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (No Print) */}
        <div className="no-print px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            แบบฟอร์มรายงานมาตรฐาน รพ.สต.บ้านธาตุทอง (พร้อมสั่งพิมพ์ A4)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์หน้านี้ (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
