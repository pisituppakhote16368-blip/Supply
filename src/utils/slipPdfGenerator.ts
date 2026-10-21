import { jsPDF } from 'jspdf';
import { BorrowRecord } from '../types';
import { formatThaiDate, calculateOverdueInfo } from './dateUtils';

interface GenerateSlipOptions {
  patientName?: string;
  patientIdCard?: string;
  patientPhone?: string;
  patientAddress?: string;
  lenderStaff?: string;
  remarks?: string;
  docNumber?: string;
  includePhoto?: boolean;
}

/**
 * Loads an image (base64 or URL) and returns an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Helper to wrap text within a maximum width on Canvas 2D
 */
function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Generates an official loan agreement slip on an HTML5 Canvas (1200 x 1697, A4 ratio).
 * Pure Canvas 2D rendering: 100% immune to CSS issues, iframe restrictions, or Tailwind oklch bugs.
 */
export async function renderSlipToCanvas(
  record: BorrowRecord,
  opts: GenerateSlipOptions = {}
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  // High-resolution A4 (1200 x 1697 px)
  const W = 1200;
  const H = 1697;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Cannot get canvas 2D context');

  const pName = opts.patientName || record.patientName;
  const pIdCard = opts.patientIdCard || record.patientIdCard;
  const pPhone = opts.patientPhone || record.patientPhone;
  const pAddress = opts.patientAddress || record.patientAddress;
  const pStaff = opts.lenderStaff || record.lenderStaff;
  const pRemarks = opts.remarks || record.remarks || 'ผู้ป่วยพักฟื้นและฟื้นฟูสมรรถภาพในชุมชน ตำบลธาตุทอง';
  const docNum = opts.docNumber || `รพ.สต.ทธ-${record.id.replace('loan-', '')}`;
  const includePhoto = opts.includePhoto !== false;

  const overdueInfo = calculateOverdueInfo(
    record.borrowDate,
    record.dueDate,
    record.returnDate
  );

  // 1. Fill Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // 2. Draw Outer Border Frame
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(44, 44, W - 88, H - 88);

  const leftX = 70;
  const rightX = W - 70;
  const contentWidth = rightX - leftX;

  // 3. Hospital Emblem / Cross Icon
  ctx.fillStyle = '#0d9488';
  ctx.beginPath();
  ctx.arc(W / 2, 85, 24, 0, Math.PI * 2);
  ctx.fill();

  // White medical cross
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(W / 2 - 4, 85 - 12, 8, 24);
  ctx.fillRect(W / 2 - 12, 85 - 4, 24, 8);

  // 4. Header Titles
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px Sarabun, Prompt, sans-serif';
  ctx.fillText('แบบฟอร์มการขอยืมและส่งคืนกายอุปกรณ์ทางการแพทย์', W / 2, 140);

  ctx.font = 'bold 18px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(
    'โรงพยาบาลส่งเสริมสุขภาพตำบลธาตุทอง อำเภอสว่างแดนดิน จังหวัดสกลนคร',
    W / 2,
    172
  );

  ctx.font = '14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(
    'งานบริการปฐมภูมิและเวชปฏิบัติครอบครัว · ศูนย์ฟื้นฟูสมรรถภาพในชุมชน',
    W / 2,
    198
  );

  // Header Divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftX, 218);
  ctx.lineTo(rightX, 218);
  ctx.stroke();

  // 5. Document Meta
  let curY = 246;
  ctx.textAlign = 'left';
  ctx.font = '14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('เลขที่เอกสาร: ', leftX, curY);
  ctx.font = 'bold 15px monospace, Sarabun, sans-serif';
  ctx.fillStyle = '#0f766e';
  ctx.fillText(docNum, leftX + 85, curY);

  ctx.textAlign = 'right';
  ctx.font = '14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(
    `วันที่ทำสัญญา: ${formatThaiDate(record.borrowDate, true)}`,
    rightX,
    curY
  );

  curY += 26;

  // 6. Section 1: ข้อมูลผู้ป่วย / ผู้ขอยืม
  // Header bar
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(leftX, curY, contentWidth, 32);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftX, curY, contentWidth, 32);

  ctx.textAlign = 'left';
  ctx.font = 'bold 15px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('1. ข้อมูลผู้ป่วย / ผู้ขอยืม', leftX + 12, curY + 22);

  curY += 46;

  // Check if patient photo should be drawn
  let textWidth = contentWidth;
  let photoEndX = rightX;
  if (includePhoto && record.patientPhoto) {
    try {
      const pImg = await loadImage(record.patientPhoto);
      const photoW = 120;
      const photoH = 145;
      const photoX = rightX - photoW - 10;
      const photoY = curY;

      // Draw photo container
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(photoX, photoY, photoW, photoH);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(photoX, photoY, photoW, photoH);

      // Draw photo
      ctx.drawImage(pImg, photoX + 4, photoY + 4, photoW - 8, photoH - 26);

      // Photo caption
      ctx.textAlign = 'center';
      ctx.font = '11px Sarabun, Prompt, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('รูปถ่ายผู้ป่วย', photoX + photoW / 2, photoY + photoH - 8);

      textWidth = contentWidth - photoW - 30;
      photoEndX = photoX;
    } catch (e) {
      console.warn('Could not load patient photo for canvas:', e);
    }
  }

  // Draw Patient Details Text
  const patientLineY = curY + 15;
  const col1X = leftX + 10;
  const col2X = leftX + textWidth * 0.52;

  // Row 1
  ctx.textAlign = 'left';
  ctx.font = '14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('ชื่อ - นามสกุล ผู้ป่วย:', col1X, patientLineY);
  ctx.font = 'bold 15px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(pName, col1X + 140, patientLineY);

  ctx.font = '14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('เลขประจำตัวประชาชน:', col2X, patientLineY);
  ctx.font = 'bold 14px monospace, Sarabun, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(pIdCard || '-', col2X + 145, patientLineY);

  // Row 2
  const patientLine2Y = patientLineY + 28;
  ctx.font = '14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('เบอร์โทรศัพท์ติดต่อ:', col1X, patientLine2Y);
  ctx.font = 'bold 14px monospace, Sarabun, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(pPhone || '-', col1X + 140, patientLine2Y);

  ctx.font = '14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('ที่อยู่ / หมู่บ้าน:', col2X, patientLine2Y);
  ctx.font = 'bold 14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(pAddress, col2X + 105, patientLine2Y);

  // Row 3
  const patientLine3Y = patientLine2Y + 28;
  ctx.font = '14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('วินิจฉัย / ความจำเป็น:', col1X, patientLine3Y);
  ctx.font = '14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(pRemarks, col1X + 140, patientLine3Y);

  curY += 120;

  // 7. Section 2: รายการอุปกรณ์ทางการแพทย์ที่ขอยืม
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(leftX, curY, contentWidth, 32);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(leftX, curY, contentWidth, 32);

  ctx.textAlign = 'left';
  ctx.font = 'bold 15px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('2. รายการอุปกรณ์ทางการแพทย์ที่ขอยืม', leftX + 12, curY + 22);

  curY += 40;

  // Table dimensions
  const colW1 = 360; // Equipment Name
  const colW2 = 180; // Unit / Serial
  const colW3 = 210; // Asset Code
  const colW4 = 140; // Quota
  const colW5 = contentWidth - (colW1 + colW2 + colW3 + colW4); // Due date

  const colX1 = leftX;
  const colX2 = colX1 + colW1;
  const colX3 = colX2 + colW2;
  const colX4 = colX3 + colW3;
  const colX5 = colX4 + colW4;

  // Table Header Row
  const tableHeadH = 34;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(leftX, curY, contentWidth, tableHeadH);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(leftX, curY, contentWidth, tableHeadH);

  // Vertical dividers
  ctx.beginPath();
  ctx.moveTo(colX2, curY); ctx.lineTo(colX2, curY + tableHeadH);
  ctx.moveTo(colX3, curY); ctx.lineTo(colX3, curY + tableHeadH);
  ctx.moveTo(colX4, curY); ctx.lineTo(colX4, curY + tableHeadH);
  ctx.moveTo(colX5, curY); ctx.lineTo(colX5, curY + tableHeadH);
  ctx.stroke();

  ctx.font = 'bold 13px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('รายการอุปกรณ์', colX1 + 10, curY + 22);
  ctx.fillText('หมายเลขชิ้น', colX2 + 10, curY + 22);
  ctx.fillText('เลขครุภัณฑ์ (รพ.สต.)', colX3 + 10, curY + 22);
  ctx.fillText('โควต้า (วัน)', colX4 + 10, curY + 22);
  ctx.fillText('กำหนดส่งคืน', colX5 + 10, curY + 22);

  curY += tableHeadH;

  // Table Data Row
  const tableRowH = 44;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(leftX, curY, contentWidth, tableRowH);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(leftX, curY, contentWidth, tableRowH);

  ctx.beginPath();
  ctx.moveTo(colX2, curY); ctx.lineTo(colX2, curY + tableRowH);
  ctx.moveTo(colX3, curY); ctx.lineTo(colX3, curY + tableRowH);
  ctx.moveTo(colX4, curY); ctx.lineTo(colX4, curY + tableRowH);
  ctx.moveTo(colX5, curY); ctx.lineTo(colX5, curY + tableRowH);
  ctx.stroke();

  ctx.font = 'bold 14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(record.equipmentName, colX1 + 10, curY + 27);

  ctx.font = '13px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(`ชิ้น/คันที่ ${record.unitNumber}`, colX2 + 10, curY + 27);

  ctx.font = 'bold 14px monospace, Sarabun, sans-serif';
  ctx.fillStyle = '#0f766e';
  ctx.fillText(record.assetCode, colX3 + 10, curY + 27);

  ctx.font = 'bold 14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`${record.quotaDays} วัน`, colX4 + 10, curY + 27);

  ctx.font = 'bold 14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(formatThaiDate(record.dueDate, true), colX5 + 10, curY + 27);

  curY += tableRowH + 24;

  // 8. Section 3: ข้อตกลงและระเบียบการยืมอุปกรณ์
  const rulesBoxH = 150;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(leftX, curY, contentWidth, rulesBoxH);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(leftX, curY, contentWidth, rulesBoxH);

  ctx.textAlign = 'left';
  ctx.font = 'bold 14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('ข้อตกลงและระเบียบการยืมอุปกรณ์ รพ.สต.ธาตุทอง:', leftX + 16, curY + 26);

  const rules = [
    '1. ผู้ยืมตกลงจะดูแลรักษาอุปกรณ์ให้อยู่ในสภาพดี สะอาด ปลอดภัย และพร้อมใช้งานตลอดเวลา',
    '2. หากอุปกรณ์เกิดการชำรุด เสียหาย หรือสูญหาย ต้องแจ้งเจ้าหน้าที่ รพ.สต.ธาตุทอง ทราบทันที',
    '3. เมื่อหมดความจำเป็นหรือครบกำหนดระยะเวลาโควต้า ต้องนำส่งคืน รพ.สต.ธาตุทอง ทันที',
    '4. หากมีความจำเป็นต้องใช้ต่อเนื่อง ต้องประสาน อสม. หรือเจ้าหน้าที่เพื่อประเมินต่ออายุล่วงหน้าอย่างน้อย 7 วัน',
  ];

  ctx.font = '13px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#475569';
  let ruleY = curY + 54;
  for (const r of rules) {
    ctx.fillText(r, leftX + 16, ruleY);
    ruleY += 24;
  }

  curY += rulesBoxH + 20;

  // 9. Section 4: บันทึกการส่งคืน (ถ้ามี)
  if (record.returnDate) {
    const returnBoxH = 65;
    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(leftX, curY, contentWidth, returnBoxH);
    ctx.strokeStyle = '#bbf7d0';
    ctx.strokeRect(leftX, curY, contentWidth, returnBoxH);

    ctx.font = 'bold 14px Sarabun, Prompt, sans-serif';
    ctx.fillStyle = '#166534';
    ctx.fillText(
      '4. บันทึกการรับคืนอุปกรณ์ (เจ้าหน้าที่ รพ.สต.ธาตุทอง)',
      leftX + 16,
      curY + 24
    );

    ctx.font = '13px Sarabun, Prompt, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(
      `วันที่รับคืน: ${formatThaiDate(record.returnDate, true)}   ·   สภาพ: ${record.returnedCondition || 'ปกติ'}`,
      leftX + 16,
      curY + 48
    );
    ctx.fillText(
      `ผลคำนวณ: ${overdueInfo.statusText}   ·   ผู้รับคืน: ${record.receiverStaff || '-'}`,
      leftX + 450,
      curY + 48
    );

    curY += returnBoxH + 20;
  }

  // 10. Signatures Section
  const signY = H - 240;
  const colSign1X = leftX + contentWidth * 0.25;
  const colSign2X = leftX + contentWidth * 0.75;

  ctx.textAlign = 'center';
  ctx.font = '14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#334155';

  // Left Signature
  ctx.fillText('ลงชื่อ.......................................................... ผู้ยืม/ผู้ดูแล', colSign1X, signY);
  ctx.font = 'bold 15px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`( ${pName} )`, colSign1X, signY + 36);
  ctx.font = '13px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('ผู้ขอยืมอุปกรณ์', colSign1X, signY + 60);

  // Right Signature
  ctx.font = '14px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('ลงชื่อ.......................................................... ผู้ส่งมอบ', colSign2X, signY);
  ctx.font = 'bold 15px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`( ${pStaff} )`, colSign2X, signY + 36);
  ctx.font = '13px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('เจ้าหน้าที่ รพ.สต.ธาตุทอง', colSign2X, signY + 60);

  // Bottom Footer
  ctx.font = '11px Sarabun, Prompt, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(
    'ระบบยืมของ รพ.สต.ธาตุทอง · ตำบลธาตุทอง อำเภอสว่างแดนดิน จังหวัดสกลนคร',
    W / 2,
    H - 55
  );

  return canvas;
}

/**
 * Direct PDF Export:
 * Renders the canvas and downloads a crisp vector-wrapper A4 PDF.
 * Uses both pdf.save() and direct Blob fallback for 100% guarantee across all browsers and iframes.
 */
export async function downloadSlipPdf(
  record: BorrowRecord,
  opts: GenerateSlipOptions = {}
): Promise<void> {
  const canvas = await renderSlipToCanvas(record, opts);
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

  const cleanName = (opts.patientName || record.patientName).replace(/[\s\/\\]+/g, '_');
  const cleanAsset = (record.assetCode || 'eq').replace(/[\s\/\\]+/g, '-');
  const fileName = `แบบฟอร์มการยืม_${cleanName}_${cleanAsset}.pdf`;

  // 1. Try standard pdf.save
  try {
    pdf.save(fileName);
  } catch (err) {
    console.warn('pdf.save failed, trying blob download:', err);
    // 2. Fallback to direct Blob download
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1500);
  }
}

/**
 * Creates a standalone printable HTML Blob URL that can be opened in a new tab.
 * This completely bypasses iframe sandbox restrictions for native window.print()!
 */
export function createPrintableHtmlBlobUrl(
  record: BorrowRecord,
  opts: GenerateSlipOptions = {}
): string {
  const pName = opts.patientName || record.patientName;
  const pIdCard = opts.patientIdCard || record.patientIdCard;
  const pPhone = opts.patientPhone || record.patientPhone;
  const pAddress = opts.patientAddress || record.patientAddress;
  const pStaff = opts.lenderStaff || record.lenderStaff;
  const pRemarks = opts.remarks || record.remarks || 'ผู้ป่วยพักฟื้นและฟื้นฟูสมรรถภาพในชุมชน ตำบลธาตุทอง';
  const docNum = opts.docNumber || `รพ.สต.ทธ-${record.id.replace('loan-', '')}`;
  const includePhoto = opts.includePhoto !== false;

  const overdueInfo = calculateOverdueInfo(
    record.borrowDate,
    record.dueDate,
    record.returnDate
  );

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>แบบฟอร์มการยืม-คืน_${pName}_${record.assetCode}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Sarabun', -apple-system, sans-serif;
      color: #111827;
      background: #f8fafc;
      line-height: 1.45;
      font-size: 13px;
      margin: 0;
      padding: 24px;
    }
    .sheet {
      background: #fff;
      max-width: 820px;
      margin: 0 auto;
      padding: 40px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: 600; }
    .header-center { text-align: center; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 16px; margin-bottom: 16px; }
    .header-title { font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 4px; }
    .header-sub { font-size: 14px; font-weight: 600; color: #334155; }
    .header-meta { font-size: 12px; color: #64748b; margin-top: 2px; }
    .meta-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 16px; }
    .section-box { margin-bottom: 18px; }
    .section-title { font-size: 14px; font-weight: bold; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; border: 1px solid #cbd5e1; margin-bottom: 10px; }
    .patient-flex { display: flex; gap: 20px; }
    .patient-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 13px; }
    .photo-box { width: 105px; height: 130px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px; text-align: center; background: #f8fafc; }
    .photo-box img { width: 100%; height: 95px; object-fit: cover; border-radius: 2px; }
    .rules-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #334155; }
    .rules-box ol { margin: 6px 0 0 0; padding-left: 20px; }
    .rules-box li { margin-bottom: 4px; }
    .return-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 6px; margin-bottom: 18px; }
    .signatures { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 13px; }
    .sign-col { width: 45%; }
    .sign-line { margin-top: 45px; margin-bottom: 6px; }
    .top-controls {
      max-width: 820px;
      margin: 0 auto 20px auto;
      background: #0d9488;
      color: white;
      padding: 14px 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .btn-print {
      background: white;
      color: #0f766e;
      font-weight: bold;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-print:hover { background: #f0fdfa; }
    @media print {
      body { background: white; padding: 0; }
      .sheet { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      .top-controls { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="top-controls">
    <div>
      <div style="font-weight: bold; font-size: 15px;">แบบฟอร์มการยืม-คืนกายอุปกรณ์ (รพ.สต.ธาตุทอง)</div>
      <div style="font-size: 12px; opacity: 0.9;">พร้อมสำหรับสั่งพิมพ์: กดปุ่มด้านขวา หรือกด Ctrl + P ได้ทันที</div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ สั่งพิมพ์เอกสารนี้ (Print)</button>
  </div>

  <div class="sheet">
    <div class="header-center">
      <div class="header-title">แบบฟอร์มการขอยืมและส่งคืนกายอุปกรณ์ทางการแพทย์</div>
      <div class="header-sub">โรงพยาบาลส่งเสริมสุขภาพตำบลธาตุทอง อำเภอสว่างแดนดิน จังหวัดสกลนคร</div>
      <div class="header-meta">งานบริการปฐมภูมิและเวชปฏิบัติครอบครัว · ศูนย์ฟื้นฟูสมรรถภาพในชุมชน</div>
    </div>

    <div class="meta-row">
      <div>เลขที่เอกสาร: <strong style="font-family: monospace; color: #0f766e;">${docNum}</strong></div>
      <div>วันที่ทำสัญญา: <strong>${formatThaiDate(record.borrowDate, true)}</strong></div>
    </div>

    <!-- Section 1 -->
    <div class="section-box">
      <div class="section-title">1. ข้อมูลผู้ป่วย / ผู้ขอยืม</div>
      <div class="patient-flex">
        ${
          includePhoto && record.patientPhoto
            ? `<div class="photo-box">
                <img src="${record.patientPhoto}" alt="รูปถ่าย">
                <div style="font-size: 10px; color: #64748b; margin-top: 4px;">รูปถ่ายผู้ป่วย</div>
              </div>`
            : ''
        }
        <div class="patient-grid">
          <div><span style="color: #64748b;">ชื่อ - นามสกุล ผู้ป่วย:</span> <strong>${pName}</strong></div>
          <div><span style="color: #64748b;">เลขประจำตัวประชาชน:</span> <strong style="font-family: monospace;">${pIdCard || '-'}</strong></div>
          <div><span style="color: #64748b;">เบอร์โทรศัพท์:</span> <strong style="font-family: monospace;">${pPhone || '-'}</strong></div>
          <div><span style="color: #64748b;">ที่อยู่ / หมู่บ้าน:</span> <strong>${pAddress}</strong></div>
          <div style="grid-column: span 2;"><span style="color: #64748b;">วินิจฉัย / ความจำเป็น:</span> <strong>${pRemarks}</strong></div>
        </div>
      </div>
    </div>

    <!-- Section 2 -->
    <div class="section-box">
      <div class="section-title">2. รายการอุปกรณ์ทางการแพทย์ที่ขอยืม</div>
      <table>
        <thead>
          <tr>
            <th>รายการอุปกรณ์</th>
            <th>หมายเลขชิ้น</th>
            <th>เลขครุภัณฑ์ (รพ.สต.)</th>
            <th>โควต้า (วัน)</th>
            <th>กำหนดส่งคืน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${record.equipmentName}</strong></td>
            <td>คัน/ชิ้นที่ ${record.unitNumber}</td>
            <td style="font-family: monospace; font-weight: bold; color: #0f766e;">${record.assetCode}</td>
            <td><strong>${record.quotaDays} วัน</strong></td>
            <td><strong>${formatThaiDate(record.dueDate, true)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Section 3 -->
    <div class="section-box">
      <div class="rules-box">
        <strong>ข้อตกลงและระเบียบการยืมอุปกรณ์ รพ.สต.ธาตุทอง:</strong>
        <ol>
          <li>ผู้ยืมตกลงจะดูแลรักษาอุปกรณ์ให้อยู่ในสภาพดี สะอาด ปลอดภัย และพร้อมใช้งานตลอดเวลา</li>
          <li>หากอุปกรณ์เกิดการชำรุด เสียหาย หรือสูญหาย ต้องแจ้งเจ้าหน้าที่ รพ.สต.ธาตุทอง ทราบทันที</li>
          <li>เมื่อหมดความจำเป็นหรือครบกำหนดระยะเวลาโควต้า ต้องนำส่งคืน รพ.สต.ธาตุทอง ทันที</li>
          <li>หากมีความจำเป็นต้องใช้ต่อเนื่อง ต้องประสาน อสม. หรือเจ้าหน้าที่เพื่อประเมินต่ออายุล่วงหน้าอย่างน้อย 7 วัน</li>
        </ol>
      </div>
    </div>

    ${
      record.returnDate
        ? `<div class="return-box">
            <strong style="color: #166534;">4. บันทึกการรับคืนอุปกรณ์ (เจ้าหน้าที่ รพ.สต.ธาตุทอง)</strong>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 6px; font-size: 12px;">
              <div>วันที่รับคืน: <strong>${formatThaiDate(record.returnDate, true)}</strong></div>
              <div>สภาพตอนรับคืน: <strong>${record.returnedCondition || 'ปกติ'}</strong></div>
              <div>ผลคำนวณวันเกิน: <strong>${overdueInfo.statusText}</strong></div>
              <div>เจ้าหน้าที่ผู้รับคืน: <strong>${record.receiverStaff || '-'}</strong></div>
            </div>
          </div>`
        : ''
    }

    <!-- Signatures -->
    <div class="signatures">
      <div class="sign-col">
        <div class="sign-line">ลงชื่อ.......................................................... ผู้ยืม/ผู้ดูแล</div>
        <div>( <strong>${pName}</strong> )</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">ผู้ขอยืมอุปกรณ์</div>
      </div>

      <div class="sign-col">
        <div class="sign-line">ลงชื่อ.......................................................... ผู้ส่งมอบ</div>
        <div>( <strong>${pStaff}</strong> )</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">เจ้าหน้าที่ รพ.สต.ธาตุทอง</div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        try { window.print(); } catch (e) {}
      }, 500);
    });
  <\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return URL.createObjectURL(blob);
}
