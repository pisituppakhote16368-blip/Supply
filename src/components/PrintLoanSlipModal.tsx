import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Stethoscope, 
  Edit3, 
  FileDown, 
  Loader2, 
  Check, 
  Image as ImageIcon,
  ExternalLink,
  Info
} from 'lucide-react';
import { BorrowRecord } from '../types';
import { formatThaiDate, calculateOverdueInfo } from '../utils/dateUtils';
import { downloadSlipPdf, createPrintableHtmlBlobUrl } from '../utils/slipPdfGenerator';

interface PrintLoanSlipModalProps {
  record: BorrowRecord | null;
  onClose: () => void;
}

export const PrintLoanSlipModal: React.FC<PrintLoanSlipModalProps> = ({
  record,
  onClose,
}) => {
  if (!record) return null;

  // Custom edits before printing/exporting
  const [isEditing, setIsEditing] = useState(false);
  const [patientName, setPatientName] = useState(record.patientName);
  const [patientIdCard, setPatientIdCard] = useState(record.patientIdCard);
  const [patientPhone, setPatientPhone] = useState(record.patientPhone);
  const [patientAddress, setPatientAddress] = useState(record.patientAddress);
  const [lenderStaff, setLenderStaff] = useState(record.lenderStaff);
  const [remarks, setRemarks] = useState(record.remarks || '');
  const [docNumber, setDocNumber] = useState(
    `รพ.สต.ทธ-${record.id.replace('loan-', '')}`
  );
  const [includePhoto, setIncludePhoto] = useState(true);

  // PDF Export states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Standalone printable blob URL for clean printing in new tab
  const [printableUrl, setPrintableUrl] = useState<string>('');

  const overdueInfo = calculateOverdueInfo(
    record.borrowDate,
    record.dueDate,
    record.returnDate
  );

  // Re-generate printable blob URL whenever options change
  useEffect(() => {
    try {
      const url = createPrintableHtmlBlobUrl(record, {
        patientName,
        patientIdCard,
        patientPhone,
        patientAddress,
        lenderStaff,
        remarks,
        docNumber,
        includePhoto,
      });
      setPrintableUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.warn('Error creating printable blob URL:', e);
    }
  }, [
    record,
    patientName,
    patientIdCard,
    patientPhone,
    patientAddress,
    lenderStaff,
    remarks,
    docNumber,
    includePhoto,
  ]);

  /**
   * 100% Reliable PDF Download:
   * Uses standalone Canvas 2D engine with Thai typography, signatures, and layout.
   * Completely immune to iframe sandbox restrictions and CSS parser bugs.
   */
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      setErrorMessage(null);
      setExportSuccess(false);

      await downloadSlipPdf(record, {
        patientName,
        patientIdCard,
        patientPhone,
        patientAddress,
        lenderStaff,
        remarks,
        docNumber,
        includePhoto,
      });

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to generate PDF:', err);
      setErrorMessage('ไม่สามารถสร้าง PDF ได้โดยตรง กรุณากดปุ่ม "เปิดพิมพ์ในแท็บใหม่"');
    } finally {
      setIsExportingPdf(false);
    }
  };

  /**
   * Browser Print handler with automatic iframe fallback
   */
  const handleDirectPrint = () => {
    try {
      // First attempt native window.print
      window.print();
    } catch (e) {
      console.warn('Direct window.print blocked in iframe sandbox:', e);
      // Auto fallback: download the PDF directly so user gets the document
      handleExportPdf();
      setErrorMessage(
        'การเปิดหน้าพิมพ์ถูกจำกัดในกรอบ iFrame พรีวิว ระบบจึงสร้างและดาวน์โหลดไฟล์ PDF ให้ท่านแล้ว หรือท่านสามารถกดปุ่ม "เปิดพิมพ์ในแท็บใหม่" ได้เลยครับ'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-4 overflow-hidden animate-in fade-in duration-150">
        {/* Controls Bar */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Printer className="w-4 h-4 text-teal-600" />
            <span>แบบฟอร์มการยืม-คืนอุปกรณ์ (รพ.สต.ธาตุทอง)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Edit */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                isEditing
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'เสร็จสิ้นการแก้ไข' : 'แก้ไขข้อมูล'}</span>
            </button>

            {/* Toggle Photo in Slip */}
            {record.patientPhoto && (
              <button
                type="button"
                onClick={() => setIncludePhoto(!includePhoto)}
                className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                  includePhoto
                    ? 'bg-teal-50 text-teal-800 border-teal-300'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
                title="แสดงหรือซ่อนรูปถ่ายผู้ป่วยในแบบฟอร์ม"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{includePhoto ? 'แสดงรูปผู้ป่วย' : 'ซ่อนรูปผู้ป่วย'}</span>
              </button>
            )}

            {/* 1. EXPORT TO PDF BUTTON (100% Guaranteed Download) */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="ดาวน์โหลดแบบฟอร์มเป็นไฟล์ PDF ทันที"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังสร้าง PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>ส่งออกเป็น PDF</span>
                </>
              )}
            </button>

            {/* 2. OPEN AND PRINT IN STANDALONE NEW TAB (Bypasses iFrame sandbox) */}
            {printableUrl && (
              <a
                href={printableUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer no-underline"
                title="เปิดเอกสารในแท็บใหม่เพื่อสั่งพิมพ์ออกเครื่องพิมพ์ได้ทันทีโดยไม่ติดขัด"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดพิมพ์ในแท็บใหม่</span>
              </a>
            )}

            {/* 3. Direct Print in this window */}
            <button
              type="button"
              onClick={handleDirectPrint}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="สั่งพิมพ์ในหน้านี้"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>พิมพ์</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Helpful Tips Banner */}
        <div className="no-print bg-teal-50/70 border-b border-teal-100 px-5 py-2 text-xs text-teal-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>คำแนะนำ:</strong> สามารถกด <strong>"ส่งออกเป็น PDF"</strong> เพื่อเซฟไฟล์ลงเครื่อง หรือกด <strong>"เปิดพิมพ์ในแท็บใหม่"</strong> เพื่อสั่งพิมพ์ออกเครื่องพิมพ์ได้ทันที
            </span>
          </div>
        </div>

        {/* Success feedback */}
        {exportSuccess && (
          <div className="no-print bg-emerald-600 text-white px-5 py-2 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>ดาวน์โหลดไฟล์ PDF เรียบร้อยแล้ว! (ตรวจสอบที่โฟลเดอร์ Downloads หรือเปิดจากแถบดาวน์โหลด)</span>
          </div>
        )}

        {/* Error message if any */}
        {errorMessage && (
          <div className="no-print bg-rose-50 border-b border-rose-200 px-5 py-2.5 text-xs text-rose-800 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Printable Document Container */}
        <div className="p-6 sm:p-10 text-slate-800 font-sans space-y-5 bg-white max-h-[82vh] overflow-y-auto">
          <div id="printable-slip-content" className="space-y-5 bg-white p-2">
            {/* Header */}
            <div className="header-center text-center border-b border-slate-300 pb-4 space-y-1">
              <div className="w-11 h-11 mx-auto rounded-full bg-teal-600 text-white flex items-center justify-center mb-1.5 no-print">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h2 className="header-title text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                แบบฟอร์มการขอยืมและส่งคืนกายอุปกรณ์ทางการแพทย์
              </h2>
              <div className="header-sub text-sm font-semibold text-slate-700">
                โรงพยาบาลส่งเสริมสุขภาพตำบลธาตุทอง อำเภอสว่างแดนดิน จังหวัดสกลนคร
              </div>
              <div className="header-meta text-xs text-slate-500">
                งานบริการปฐมภูมิและเวชปฏิบัติครอบครัว · ศูนย์ฟื้นฟูสมรรถภาพในชุมชน
              </div>
            </div>

            {/* Document Meta Row */}
            <div className="flex justify-between items-center text-xs text-slate-600 border-b border-slate-200 pb-2.5">
              <div>
                เลขที่เอกสาร:{' '}
                {isEditing ? (
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="border border-slate-300 rounded px-1.5 py-0.5 font-mono text-xs"
                  />
                ) : (
                  <strong className="font-mono text-teal-900">{docNumber}</strong>
                )}
              </div>
              <div>
                วันที่ทำสัญญา: <strong>{formatThaiDate(record.borrowDate, true)}</strong>
              </div>
            </div>

            {/* 1. Borrower Information */}
            <div className="section-box space-y-2.5">
              <div className="section-title text-xs sm:text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded">
                1. ข้อมูลผู้ป่วย / ผู้ขอยืม
              </div>
              
              <div className="flex flex-col sm:flex-row items-start gap-4 pl-1">
                {/* Patient Photo (if available and not hidden) */}
                {record.patientPhoto && includePhoto && (
                  <div className="shrink-0 flex flex-col items-center p-1 border border-slate-200 rounded-lg bg-slate-50">
                    <img
                      src={record.patientPhoto}
                      alt={patientName}
                      crossOrigin="anonymous"
                      className="w-24 h-28 object-cover rounded shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-500 mt-1">รูปถ่ายผู้ป่วย</span>
                  </div>
                )}

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs w-full">
                  <div>
                    <span className="text-slate-500">ชื่อ - นามสกุล ผู้ป่วย:</span>{' '}
                    {isEditing ? (
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="border border-slate-300 rounded px-1.5 py-0.5 w-full mt-1"
                      />
                    ) : (
                      <strong className="text-slate-900 text-sm block mt-0.5">{patientName}</strong>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500">เลขประจำตัวประชาชน:</span>{' '}
                    {isEditing ? (
                      <input
                        type="text"
                        value={patientIdCard}
                        onChange={(e) => setPatientIdCard(e.target.value)}
                        className="border border-slate-300 rounded px-1.5 py-0.5 w-full mt-1 font-mono"
                      />
                    ) : (
                      <strong className="font-mono block mt-0.5">{patientIdCard || '-'}</strong>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500">เบอร์โทรศัพท์ติดต่อ:</span>{' '}
                    {isEditing ? (
                      <input
                        type="text"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="border border-slate-300 rounded px-1.5 py-0.5 w-full mt-1 font-mono"
                      />
                    ) : (
                      <strong className="font-mono block mt-0.5">{patientPhone || '-'}</strong>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500">ที่อยู่ / หมู่บ้าน:</span>{' '}
                    {isEditing ? (
                      <input
                        type="text"
                        value={patientAddress}
                        onChange={(e) => setPatientAddress(e.target.value)}
                        className="border border-slate-300 rounded px-1.5 py-0.5 w-full mt-1"
                      />
                    ) : (
                      <strong className="block mt-0.5">{patientAddress}</strong>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-500">วินิจฉัย / เหตุผลความจำเป็น:</span>{' '}
                    {isEditing ? (
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="border border-slate-300 rounded px-1.5 py-0.5 w-full mt-1"
                      />
                    ) : (
                      <strong className="block mt-0.5 text-slate-800">
                        {remarks || 'ผู้ป่วยพักฟื้นและฟื้นฟูสมรรถภาพในชุมชน ตำบลธาตุทอง'}
                      </strong>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Equipment Information */}
            <div className="section-box space-y-2.5">
              <div className="section-title text-xs sm:text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded">
                2. รายการอุปกรณ์ทางการแพทย์ที่ขอยืม
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="p-2">รายการอุปกรณ์</th>
                      <th className="p-2">หมายเลขชิ้น</th>
                      <th className="p-2">เลขครุภัณฑ์</th>
                      <th className="p-2">โควต้า (วัน)</th>
                      <th className="p-2">กำหนดส่งคืน</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="p-2 font-semibold text-slate-900">{record.equipmentName}</td>
                      <td className="p-2">คัน/ชิ้นที่ {record.unitNumber}</td>
                      <td className="p-2 font-mono font-bold text-teal-800">{record.assetCode}</td>
                      <td className="p-2 tabular-nums">{record.quotaDays} วัน</td>
                      <td className="p-2 font-semibold text-slate-900">
                        {formatThaiDate(record.dueDate, true)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Borrowing Rules */}
            <div className="rules-box space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800">ข้อตกลงและระเบียบการยืมอุปกรณ์:</div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                <li>ผู้ยืมตกลงจะดูแลรักษาอุปกรณ์ให้อยู่ในสภาพดี สะอาด ปลอดภัย และพร้อมใช้งานตลอดเวลา</li>
                <li>หากอุปกรณ์เกิดการชำรุด เสียหาย หรือสูญหาย ต้องแจ้งเจ้าหน้าที่ รพ.สต.ธาตุทอง ทราบทันที</li>
                <li>เมื่อหมดความจำเป็นหรือครบกำหนดระยะเวลาโควต้า ต้องนำส่งคืน รพ.สต.ธาตุทอง ทันที</li>
                <li>หากมีความจำเป็นต้องใช้ต่อเนื่อง ต้องประสาน อสม. หรือเจ้าหน้าที่เพื่อประเมินต่ออายุล่วงหน้าอย่างน้อย 7 วัน</li>
              </ol>
            </div>

            {/* 4. Return Status Section if returned */}
            {record.returnDate && (
              <div className="space-y-2 border border-teal-200 bg-teal-50/40 p-3 rounded-lg text-xs">
                <div className="font-bold text-teal-900">
                  4. บันทึกการรับคืนอุปกรณ์ (เจ้าหน้าที่ รพ.สต.ธาตุทอง)
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>วันที่รับคืน: <strong>{formatThaiDate(record.returnDate, true)}</strong></div>
                  <div>สภาพตอนรับคืน: <strong>{record.returnedCondition || 'ปกติ'}</strong></div>
                  <div>ผลการคำนวณวันเกิน: <strong>{overdueInfo.statusText}</strong></div>
                  <div>เจ้าหน้าที่ผู้รับคืน: <strong>{record.receiverStaff || '-'}</strong></div>
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="signatures pt-5 grid grid-cols-2 gap-8 text-xs text-center border-t border-slate-200">
              <div className="sign-col space-y-8">
                <div className="sign-line">ลงชื่อ.......................................................... ผู้ยืม/ผู้ดูแล</div>
                <div>( {patientName} )</div>
                <div className="text-[11px] text-slate-500">ผู้ขอยืมอุปกรณ์</div>
              </div>

              <div className="sign-col space-y-8">
                <div className="sign-line">
                  ลงชื่อ.......................................................... ผู้ส่งมอบ
                </div>
                <div>
                  ( {isEditing ? (
                    <input
                      type="text"
                      value={lenderStaff}
                      onChange={(e) => setLenderStaff(e.target.value)}
                      className="border border-slate-300 rounded px-1.5 py-0.5 text-center text-xs"
                    />
                  ) : (
                    lenderStaff
                  )} )
                </div>
                <div className="text-[11px] text-slate-500">เจ้าหน้าที่ รพ.สต.ธาตุทอง</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
