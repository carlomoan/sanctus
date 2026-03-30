import jsPDF from 'jspdf';
import QRCode from 'qrcode';
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

async function generateQRCode(text: string, size: number = 40): Promise<string | null> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
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
  let fontSize: { title: number; subtitle: number; body: number; small: number; large: number };

  if (format === 'thermal-58') {
    pageWidth = 48; // 58mm - margins
    pageHeight = 200;
    marginX = 3;
    fontSize = { title: 8, subtitle: 7, body: 6, small: 5, large: 10 };
  } else if (format === 'thermal-80') {
    pageWidth = 72; // 80mm - margins
    pageHeight = 200;
    marginX = 4;
    fontSize = { title: 10, subtitle: 8, body: 7, small: 6, large: 12 };
  } else {
    pageWidth = 210; // A4
    pageHeight = 297;
    marginX = 20;
    fontSize = { title: 18, subtitle: 12, body: 10, small: 8, large: 24 };
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: format === 'a4' ? 'a4' : [pageWidth, pageHeight],
  });

  const contentWidth = pageWidth - marginX * 2;
  let y = format === 'a4' ? 20 : 8;

  // Set all text to black
  doc.setTextColor(0, 0, 0);

  // --- Header Section ---
  // Logo with proper sizing
  if (parish.logo_url) {
    const logoData = await loadImageAsDataUrl(parish.logo_url);
    if (logoData) {
      const logoSize = format === 'thermal-80' ? 16 : format === 'thermal-58' ? 12 : 20;
      const logoX = (pageWidth - logoSize) / 2;
      try {
        doc.addImage(logoData, 'JPEG', logoX, y, logoSize, logoSize);
        y += logoSize + 3;
      } catch {
        // skip logo if it fails
      }
    }
  }

  // Parish name with better typography
  doc.setFontSize(fontSize.large);
  doc.setFont('helvetica', 'bold');
  const parishName = parish.parish_name.toUpperCase();
  const parishNameWidth = doc.getTextWidth(parishName);
  doc.text(parishName, (pageWidth - parishNameWidth) / 2, y);
  y += fontSize.large * 0.6;

  // Parish address with better spacing
  if (parish.physical_address) {
    doc.setFontSize(fontSize.small);
    doc.setFont('helvetica', 'normal');
    const addrLines = doc.splitTextToSize(parish.physical_address, contentWidth);
    for (const line of addrLines) {
      const lineWidth = doc.getTextWidth(line);
      doc.text(line, (pageWidth - lineWidth) / 2, y);
      y += fontSize.small * 0.5;
    }
  }

  // Contact info in a single line
  if (parish.contact_phone || parish.contact_email) {
    doc.setFontSize(fontSize.small);
    doc.setFont('helvetica', 'normal');
    let contactText = '';
    if (parish.contact_phone) contactText += `Tel: ${parish.contact_phone}`;
    if (parish.contact_phone && parish.contact_email) contactText += ' | ';
    if (parish.contact_email) contactText += parish.contact_email;

    const contactWidth = doc.getTextWidth(contactText);
    doc.text(contactText, (pageWidth - contactWidth) / 2, y);
    y += fontSize.small * 0.5;
  }

  y += 4;

  // --- Decorative Separator ---
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 4;

  // --- RECEIPT TITLE with emphasis ---
  doc.setFontSize(fontSize.title);
  doc.setFont('helvetica', 'bold');
  const receiptTitle = 'CONTRIBUTION RECEIPT';
  const titleWidth = doc.getTextWidth(receiptTitle);
  doc.text(receiptTitle, (pageWidth - titleWidth) / 2, y);
  y += fontSize.title * 0.8;

  // --- Transaction Details with better layout ---
  doc.setFontSize(fontSize.body);
  const lineHeight = fontSize.body * 0.7;

  const addDetailRow = (label: string, value: string) => {
    // Label on left, value on right
    doc.setFont('helvetica', 'bold');
    doc.text(label, marginX, y);

    doc.setFont('helvetica', 'normal');
    const valueWidth = doc.getTextWidth(value);
    doc.text(value, pageWidth - marginX - valueWidth, y);

    y += lineHeight;
  };

  // Receipt info with better formatting
  addDetailRow('Receipt No:', transaction.transaction_number);
  addDetailRow('Date:', formatDate(transaction.transaction_date));
  addDetailRow('Category:', formatCategory(transaction.category));
  addDetailRow('Payment:', transaction.payment_method.replace(/_/g, ' ').toUpperCase());

  // Member information with emphasis
  if (member) {
    y += 1;
    addDetailRow('Received From:', `${member.first_name} ${member.last_name}`.toUpperCase());
    if (member.member_code) {
      addDetailRow('Member Code:', member.member_code);
    }
  }

  // Additional details
  if (transaction.reference_number) {
    addDetailRow('Reference:', transaction.reference_number);
  }

  if (transaction.description) {
    y += 1;
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', marginX, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(transaction.description, contentWidth);
    for (const line of descLines) {
      doc.text(line, marginX, y);
      y += lineHeight;
    }
  }

  y += 3;

  // --- AMOUNT SECTION with emphasis ---
  doc.setLineWidth(0.8);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 4;

  // Amount label
  doc.setFontSize(fontSize.subtitle);
  doc.setFont('helvetica', 'bold');
  const amountLabel = 'TOTAL PAID';
  const amountLabelWidth = doc.getTextWidth(amountLabel);
  doc.text(amountLabel, (pageWidth - amountLabelWidth) / 2, y);
  y += fontSize.subtitle * 0.7;

  // Amount value with large font
  doc.setFontSize(fontSize.large);
  doc.setFont('helvetica', 'bold');
  const amountValue = formatCurrency(Number(transaction.amount));
  const amountValueWidth = doc.getTextWidth(amountValue);
  doc.text(amountValue, (pageWidth - amountValueWidth) / 2, y);
  y += fontSize.large * 0.8;

  // Amount in words
  const amountInWords = numberToWords(Number(transaction.amount)) + ' TANZANIA SHILLINGS ONLY';
  doc.setFontSize(fontSize.small);
  doc.setFont('helvetica', 'italic');
  const wordsLines = doc.splitTextToSize(amountInWords, contentWidth);
  for (const line of wordsLines) {
    const lineWidth = doc.getTextWidth(line);
    doc.text(line, (pageWidth - lineWidth) / 2, y);
    y += fontSize.small * 0.5;
  }

  y += 3;

  doc.setLineWidth(0.8);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 4;

  // --- QR CODE SECTION ---
  if (format !== 'a4') {
    // Generate QR code with better data
    const qrData = JSON.stringify({
      receipt: transaction.transaction_number,
      amount: transaction.amount,
      date: transaction.transaction_date,
      parish: parish.parish_name,
      verify: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${transaction.transaction_number}`
    });

    const qrSize = format === 'thermal-80' ? 35 : 28;
    const qrDataUrl = await generateQRCode(qrData, qrSize);

    if (qrDataUrl) {
      // QR Code with border
      const qrX = (pageWidth - qrSize / 3.78) / 2;
      const qrY = y;

      // Add QR code border
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(qrX - 1, qrY - 1, qrSize / 3.78 + 2, qrSize / 3.78 + 2);

      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize / 3.78, qrSize / 3.78);
      y += qrSize / 3.78 + 3;

      // Scan text with emphasis
      doc.setFontSize(fontSize.small);
      doc.setFont('helvetica', 'bold');
      const scanText = 'SCAN TO VERIFY';
      const scanW = doc.getTextWidth(scanText);
      doc.text(scanText, (pageWidth - scanW) / 2, y);
      y += fontSize.small * 0.6;

      // Verification URL
      doc.setFontSize(fontSize.small - 1);
      doc.setFont('helvetica', 'normal');
      const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${transaction.transaction_number}`;
      const urlLines = doc.splitTextToSize(verifyUrl, contentWidth - 4);
      for (const line of urlLines) {
        const lineWidth = doc.getTextWidth(line);
        doc.text(line, (pageWidth - lineWidth) / 2, y);
        y += (fontSize.small - 1) * 0.5;
      }
    }
  }

  // --- Message Section ---
  y += 2;
  doc.setFontSize(fontSize.body);
  doc.setFont('helvetica', 'italic');
  const thankYou = 'Thank you for your generous contribution!';
  const tyW = doc.getTextWidth(thankYou);
  doc.text(thankYou, (pageWidth - tyW) / 2, y);
  y += fontSize.body * 0.6;

  doc.setFontSize(fontSize.small);
  doc.setFont('helvetica', 'italic');
  const blessText = 'God bless you abundantly.';
  const blW = doc.getTextWidth(blessText);
  doc.text(blessText, (pageWidth - blW) / 2, y);
  y += fontSize.small * 0.6 + 3;

  // --- Footer Section ---
  if (format !== 'a4') {
    // Thermal receipt footer
    doc.setLineWidth(0.3);
    doc.setDrawColor(100);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 3;

    // Official stamp
    doc.setDrawColor(0);
    const stampX = (pageWidth - 20) / 2;
    doc.setLineWidth(0.5);
    doc.rect(stampX, y, 20, 8);
    doc.setFontSize(fontSize.small - 1);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL', stampX + 10 - doc.getTextWidth('OFFICIAL') / 2, y + 3);
    doc.text('RECEIPT', stampX + 10 - doc.getTextWidth('RECEIPT') / 2, y + 6);
    y += 10;

    // Signature section
    doc.setFontSize(fontSize.small);
    doc.setFont('helvetica', 'normal');
    doc.text('_________________________', marginX, y);
    doc.text('Authorized Signature', marginX, y + 4);

    const dateX = pageWidth - marginX - 30;
    doc.text('_________________________', dateX, y);
    doc.text('Date', dateX + 10, y + 4);
    y += 10;

    // Footer info
    doc.setFontSize(fontSize.small - 1);
    doc.setFont('helvetica', 'normal');
    const footerText = `This receipt is computer generated and valid without signature`;
    const footerW = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerW) / 2, y);
  }

  return doc;
}

// Helper function to convert numbers to words
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  let words = '';

  if (num >= 1000000) {
    words += numberToWords(Math.floor(num / 1000000)) + ' Million ';
    num %= 1000000;
  }

  if (num >= 1000) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }

  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }

  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }

  if (num >= 10) {
    words += teens[num - 10] + ' ';
    num = 0;
  }

  if (num > 0) {
    words += ones[num] + ' ';
  }

  return words.trim();
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
