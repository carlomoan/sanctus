import jsPDF from 'jspdf';
import { IncomeTransaction, Parish, Member } from '../types';

export type ReceiptFormat = 'a4' | 'thermal-58' | 'thermal-80';

interface ReceiptData {
  transaction: IncomeTransaction;
  parish: Parish;
  member?: Member | null;
  format: ReceiptFormat;
}

function formatCurrency(amount: number): string {
  return Number(amount).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateReceiptPdf(data: ReceiptData): Promise<jsPDF> {
  const { transaction, parish, member, format } = data;

  let pageWidth: number;
  let pageHeight: number;
  let marginX: number;
  let fontSize: { title: number; subtitle: number; body: number; small: number };

  if (format === 'thermal-58') {
    pageWidth = 48; // 58mm - margins
    pageHeight = 200;
    marginX = 3;
    fontSize = { title: 10, subtitle: 8, body: 7, small: 6 };
  } else if (format === 'thermal-80') {
    pageWidth = 72; // 80mm - margins
    pageHeight = 200;
    marginX = 4;
    fontSize = { title: 12, subtitle: 9, body: 8, small: 7 };
  } else {
    pageWidth = 210; // A4
    pageHeight = 297;
    marginX = 20;
    fontSize = { title: 18, subtitle: 12, body: 10, small: 8 };
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: format === 'a4' ? 'a4' : [pageWidth, pageHeight],
  });

  const contentWidth = pageWidth - marginX * 2;
  let y = format === 'a4' ? 20 : 5;

  // --- Header with logo ---
  if (parish.logo_url) {
    const logoData = await loadImageAsDataUrl(parish.logo_url);
    if (logoData) {
      const logoSize = format === 'a4' ? 20 : 12;
      const logoX = (pageWidth - logoSize) / 2;
      try {
        doc.addImage(logoData, 'JPEG', logoX, y, logoSize, logoSize);
        y += logoSize + 2;
      } catch {
        // skip logo if it fails
      }
    }
  }

  // Parish name
  doc.setFontSize(fontSize.title);
  doc.setFont('helvetica', 'bold');
  const parishName = parish.parish_name.toUpperCase();
  const parishNameWidth = doc.getTextWidth(parishName);
  doc.text(parishName, (pageWidth - parishNameWidth) / 2, y);
  y += fontSize.title * 0.5;

  // Parish address / contact
  doc.setFontSize(fontSize.small);
  doc.setFont('helvetica', 'normal');
  if (parish.physical_address) {
    const addrWidth = doc.getTextWidth(parish.physical_address);
    doc.text(parish.physical_address, (pageWidth - addrWidth) / 2, y);
    y += fontSize.small * 0.45;
  }
  if (parish.contact_phone) {
    const phoneText = `Tel: ${parish.contact_phone}`;
    const phoneWidth = doc.getTextWidth(phoneText);
    doc.text(phoneText, (pageWidth - phoneWidth) / 2, y);
    y += fontSize.small * 0.45;
  }
  if (parish.contact_email) {
    const emailWidth = doc.getTextWidth(parish.contact_email);
    doc.text(parish.contact_email, (pageWidth - emailWidth) / 2, y);
    y += fontSize.small * 0.45;
  }

  y += 2;

  // --- RECEIPT title ---
  doc.setFontSize(fontSize.subtitle);
  doc.setFont('helvetica', 'bold');
  const receiptTitle = 'PAYMENT RECEIPT';
  const titleWidth = doc.getTextWidth(receiptTitle);
  doc.text(receiptTitle, (pageWidth - titleWidth) / 2, y);
  y += fontSize.subtitle * 0.5;

  // Divider line
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 3;

  // --- Receipt details ---
  doc.setFontSize(fontSize.body);
  const lineHeight = fontSize.body * 0.5;

  const addRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, marginX, y);
    doc.setFont('helvetica', 'normal');

    if (format === 'a4') {
      doc.text(value, marginX + 45, y);
    } else {
      // For thermal, put value on same line right-aligned or next line if too long
      const labelW = doc.getTextWidth(label + ' ');
      const availW = contentWidth - labelW;
      const valW = doc.getTextWidth(value);
      if (valW <= availW) {
        doc.text(value, pageWidth - marginX - valW, y);
      } else {
        y += lineHeight;
        doc.text(value, marginX + 2, y);
      }
    }
    y += lineHeight;
  };

  addRow('Receipt No:', transaction.transaction_number);
  addRow('Date:', formatDate(transaction.transaction_date));
  addRow('Category:', formatCategory(transaction.category));
  addRow('Payment:', transaction.payment_method.replace(/_/g, ' '));

  if (member) {
    addRow('Received From:', `${member.first_name} ${member.last_name}`);
    if (member.member_code) {
      addRow('Member Code:', member.member_code);
    }
  }

  if (transaction.reference_number) {
    addRow('Reference:', transaction.reference_number);
  }

  if (transaction.description) {
    addRow('Description:', transaction.description);
  }

  y += 2;

  // Divider
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 3;

  // --- Amount (prominent) ---
  doc.setFontSize(format === 'a4' ? 16 : fontSize.subtitle);
  doc.setFont('helvetica', 'bold');
  const amountLabel = 'AMOUNT PAID:';
  const amountValue = formatCurrency(Number(transaction.amount));

  if (format === 'a4') {
    doc.text(amountLabel, marginX, y);
    const amtValW = doc.getTextWidth(amountValue);
    doc.text(amountValue, pageWidth - marginX - amtValW, y);
  } else {
    const amtLabelW = doc.getTextWidth(amountLabel);
    doc.text(amountLabel, (pageWidth - amtLabelW) / 2, y);
    y += lineHeight + 1;
    const amtValW = doc.getTextWidth(amountValue);
    doc.text(amountValue, (pageWidth - amtValW) / 2, y);
  }
  y += lineHeight + 2;

  // Divider
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 4;

  // --- Footer ---
  doc.setFontSize(fontSize.small);
  doc.setFont('helvetica', 'italic');

  const thankYou = 'Thank you for your generous contribution!';
  const tyW = doc.getTextWidth(thankYou);
  doc.text(thankYou, (pageWidth - tyW) / 2, y);
  y += fontSize.small * 0.5;

  const blessText = 'God bless you abundantly.';
  const blW = doc.getTextWidth(blessText);
  doc.text(blessText, (pageWidth - blW) / 2, y);
  y += fontSize.small * 0.5 + 3;

  // --- Stamp & Signature Section ---
  if (format === 'a4') {
    y += 8;

    // Parish stamp (circular seal)
    const stampCenterX = pageWidth / 2;
    const stampCenterY = y + 18;
    const stampRadius = 16;

    // Outer circle
    doc.setDrawColor(0, 80, 160);
    doc.setLineWidth(0.8);
    doc.circle(stampCenterX, stampCenterY, stampRadius);
    // Inner circle
    doc.setLineWidth(0.4);
    doc.circle(stampCenterX, stampCenterY, stampRadius - 3);

    // Parish name around the top arc
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 80, 160);
    const stampText = parish.parish_name.toUpperCase();
    const stampTextW = doc.getTextWidth(stampText);
    doc.text(stampText, stampCenterX - stampTextW / 2, stampCenterY - 8);

    // Center text
    doc.setFontSize(7);
    doc.text('OFFICIAL', stampCenterX - doc.getTextWidth('OFFICIAL') / 2, stampCenterY + 1);
    doc.setFontSize(5);
    doc.text('RECEIPT', stampCenterX - doc.getTextWidth('RECEIPT') / 2, stampCenterY + 5);

    // Bottom arc text
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'normal');
    const sealDate = formatDate(transaction.transaction_date);
    doc.text(sealDate, stampCenterX - doc.getTextWidth(sealDate) / 2, stampCenterY + 10);

    doc.setTextColor(0, 0, 0);
    y = stampCenterY + stampRadius + 8;

    // Signature lines
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize.body);

    const sigY = y;
    const col1X = marginX;
    const col2X = pageWidth / 2 + 10;
    const lineLen = 55;

    // Received By
    doc.line(col1X, sigY, col1X + lineLen, sigY);
    doc.setFontSize(fontSize.small);
    doc.text('Received By (Name & Signature)', col1X, sigY + 4);

    // Authorized By
    doc.line(col2X, sigY, col2X + lineLen, sigY);
    doc.text('Authorized By (Name & Signature)', col2X, sigY + 4);

    y = sigY + 12;

    // Date line
    doc.line(col1X, y, col1X + lineLen, y);
    doc.text('Date', col1X, y + 4);

    // Receiver signature
    doc.line(col2X, y, col2X + lineLen, y);
    doc.text('Money Receiver (Signature)', col2X, y + 4);

  } else {
    // Thermal receipt: compact stamp + signature
    y += 3;
    doc.setDrawColor(0, 80, 160);
    doc.setLineWidth(0.4);
    const tStampCX = pageWidth / 2;
    const tStampR = format === 'thermal-80' ? 10 : 8;
    doc.circle(tStampCX, y + tStampR, tStampR);
    doc.setFontSize(4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 80, 160);
    const tName = parish.parish_name.toUpperCase().substring(0, 20);
    doc.text(tName, tStampCX - doc.getTextWidth(tName) / 2, y + tStampR - 3);
    doc.setFontSize(5);
    doc.text('RECEIPT', tStampCX - doc.getTextWidth('RECEIPT') / 2, y + tStampR + 2);
    doc.setTextColor(0, 0, 0);
    y += tStampR * 2 + 4;

    doc.setFontSize(fontSize.small);
    doc.setFont('helvetica', 'normal');
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 3;
    doc.text('Signature: _______________', marginX, y);
    y += fontSize.small * 0.5 + 1;
    doc.text('Date: _______________', marginX, y);
  }

  return doc;
}

export async function downloadReceipt(data: ReceiptData): Promise<void> {
  const doc = await generateReceiptPdf(data);
  const filename = `receipt_${data.transaction.transaction_number.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}

export async function printReceipt(data: ReceiptData): Promise<void> {
  const doc = await generateReceiptPdf(data);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }
}
