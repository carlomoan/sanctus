import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { IncomeTransaction, Parish, Member } from '../types';

// Receipt configuration types
export interface ReceiptConfig {
  // Page settings
  format: 'a4' | 'thermal-58' | 'thermal-80' | 'custom';
  customSize?: { width: number; height: number };
  orientation: 'portrait' | 'landscape';

  // Margins and spacing
  margins: { top: number; right: number; bottom: number; left: number };
  lineHeight: number;
  sectionSpacing: number;

  // Typography
  fontFamily: 'helvetica' | 'times' | 'courier';
  fontSizes: {
    title: number;
    subtitle: number;
    heading: number;
    body: number;
    small: number;
    large: number;
  };

  // Colors
  colors: {
    text: string;
    accent: string;
    border: string;
    background?: string;
  };

  // Layout options
  layout: {
    logoPosition: 'top-center' | 'top-left' | 'top-right' | 'hidden';
    logoSize: number;
    titleAlignment: 'left' | 'center' | 'right';
    detailsAlignment: 'left' | 'two-column' | 'right-aligned';
    amountPosition: 'center' | 'right' | 'left';
    qrCodePosition: 'center' | 'right' | 'left';
    showBorders: boolean;
    showWatermark: boolean;
    watermarkText?: string;
  };

  // Content options
  content: {
    showParishAddress: boolean;
    showContactInfo: boolean;
    showMemberCode: boolean;
    showReference: boolean;
    showDescription: boolean;
    showAmountInWords: boolean;
    showThankYouMessage: boolean;
    showSignatureLines: boolean;
    showOfficialStamp: boolean;
    showVerificationUrl: boolean;
    thankYouMessage?: string;
    signatureLabels: {
      authorized: string;
      date: string;
      receiver?: string;
    };
  };

  // QR Code settings
  qrCode: {
    enabled: boolean;
    size: number;
    includeBorder: boolean;
    data: 'basic' | 'detailed' | 'custom';
    customData?: (transaction: IncomeTransaction, parish: Parish) => string;
  };

  // Advanced options
  advanced: {
    showPageNumbers: boolean;
    showDateTime: boolean;
    showReceiptNumber: boolean;
    customHeader?: string;
    customFooter?: string;
    enableCondensedMode: boolean;
  };
}

// Default configurations for different formats
export const defaultReceiptConfigs: Record<string, ReceiptConfig> = {
  'thermal-58': {
    format: 'thermal-58',
    orientation: 'portrait',
    margins: { top: 5, right: 3, bottom: 5, left: 3 },
    lineHeight: 0.6,
    sectionSpacing: 3,
    fontFamily: 'helvetica',
    fontSizes: { title: 8, subtitle: 7, heading: 6, body: 6, small: 5, large: 10 },
    colors: { text: '#000000', accent: '#000000', border: '#000000' },
    layout: {
      logoPosition: 'top-center',
      logoSize: 12,
      titleAlignment: 'center',
      detailsAlignment: 'right-aligned',
      amountPosition: 'center',
      qrCodePosition: 'center',
      showBorders: true,
      showWatermark: false,
    },
    content: {
      showParishAddress: true,
      showContactInfo: true,
      showMemberCode: true,
      showReference: true,
      showDescription: true,
      showAmountInWords: true,
      showThankYouMessage: true,
      showSignatureLines: true,
      showOfficialStamp: true,
      showVerificationUrl: true,
      thankYouMessage: 'Thank you for your generous contribution!',
      signatureLabels: { authorized: 'Authorized Signature', date: 'Date' }
    },
    qrCode: {
      enabled: true,
      size: 28,
      includeBorder: true,
      data: 'detailed'
    },
    advanced: {
      showPageNumbers: false,
      showDateTime: false,
      showReceiptNumber: true,
      enableCondensedMode: true
    }
  },

  'thermal-80': {
    format: 'thermal-80',
    orientation: 'portrait',
    margins: { top: 6, right: 4, bottom: 6, left: 4 },
    lineHeight: 0.7,
    sectionSpacing: 4,
    fontFamily: 'helvetica',
    fontSizes: { title: 10, subtitle: 8, heading: 7, body: 7, small: 6, large: 12 },
    colors: { text: '#000000', accent: '#000000', border: '#000000' },
    layout: {
      logoPosition: 'top-center',
      logoSize: 16,
      titleAlignment: 'center',
      detailsAlignment: 'two-column',
      amountPosition: 'center',
      qrCodePosition: 'center',
      showBorders: true,
      showWatermark: false,
    },
    content: {
      showParishAddress: true,
      showContactInfo: true,
      showMemberCode: true,
      showReference: true,
      showDescription: true,
      showAmountInWords: true,
      showThankYouMessage: true,
      showSignatureLines: true,
      showOfficialStamp: true,
      showVerificationUrl: true,
      thankYouMessage: 'Thank you for your generous contribution!',
      signatureLabels: { authorized: 'Authorized Signature', date: 'Date' }
    },
    qrCode: {
      enabled: true,
      size: 35,
      includeBorder: true,
      data: 'detailed'
    },
    advanced: {
      showPageNumbers: false,
      showDateTime: false,
      showReceiptNumber: true,
      enableCondensedMode: false
    }
  },

  'a4': {
    format: 'a4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    lineHeight: 0.8,
    sectionSpacing: 8,
    fontFamily: 'helvetica',
    fontSizes: { title: 18, subtitle: 12, heading: 10, body: 10, small: 8, large: 24 },
    colors: { text: '#000000', accent: '#0050a0', border: '#0050a0' },
    layout: {
      logoPosition: 'top-center',
      logoSize: 20,
      titleAlignment: 'center',
      detailsAlignment: 'two-column',
      amountPosition: 'right',
      qrCodePosition: 'right',
      showBorders: true,
      showWatermark: true,
      watermarkText: 'OFFICIAL RECEIPT'
    },
    content: {
      showParishAddress: true,
      showContactInfo: true,
      showMemberCode: true,
      showReference: true,
      showDescription: true,
      showAmountInWords: true,
      showThankYouMessage: true,
      showSignatureLines: true,
      showOfficialStamp: true,
      showVerificationUrl: true,
      thankYouMessage: 'Thank you for your generous contribution!',
      signatureLabels: { authorized: 'Authorized By (Name & Signature)', date: 'Date', receiver: 'Money Receiver (Signature)' }
    },
    qrCode: {
      enabled: true,
      size: 50,
      includeBorder: true,
      data: 'detailed'
    },
    advanced: {
      showPageNumbers: true,
      showDateTime: true,
      showReceiptNumber: true,
      enableCondensedMode: false
    }
  }
};

export interface ReceiptData {
  transaction: IncomeTransaction;
  parish: Parish;
  member?: Member | null;
  config: ReceiptConfig;
}

// Helper functions
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

async function generateQRCode(text: string, size: number): Promise<string | null> {
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

// Main receipt generator class
export class CustomReceiptGenerator {
  private config: ReceiptConfig;
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private contentWidth: number;
  private currentY: number;

  constructor(config: ReceiptConfig) {
    this.config = config;

    // Set page dimensions
    if (config.format === 'custom' && config.customSize) {
      this.pageWidth = config.customSize.width;
      this.pageHeight = config.customSize.height;
    } else if (config.format === 'thermal-58') {
      this.pageWidth = 48;
      this.pageHeight = 200;
    } else if (config.format === 'thermal-80') {
      this.pageWidth = 72;
      this.pageHeight = 200;
    } else {
      this.pageWidth = 210;
      this.pageHeight = 297;
    }

    this.doc = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.format === 'a4' ? 'a4' : [this.pageWidth, this.pageHeight],
    });

    this.contentWidth = this.pageWidth - config.margins.left - config.margins.right;
    this.currentY = config.margins.top;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private setFont(size: number, style: 'normal' | 'bold' | 'italic' = 'normal'): void {
    this.doc.setFont(this.config.fontFamily, style);
    this.doc.setFontSize(size);

    const rgb = this.hexToRgb(this.config.colors.text);
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
  }

  private addText(text: string, x?: number, y?: number, alignment: 'left' | 'center' | 'right' = 'left'): void {
    const xPos = x !== undefined ? x : this.config.margins.left;
    const yPos = y !== undefined ? y : this.currentY;
    this.doc.text(text, xPos, yPos, { align: alignment });

    if (y === undefined) {
      this.currentY += this.config.fontSizes.body * this.config.lineHeight;
    }
  }

  private addLine(x1: number, y1: number, x2: number, y2: number): void {
    const rgb = this.hexToRgb(this.config.colors.border);
    this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    this.doc.setLineWidth(0.3);
    this.doc.line(x1, y1, x2, y2);
  }

  private addSeparator(): void {
    this.addLine(
      this.config.margins.left,
      this.currentY,
      this.pageWidth - this.config.margins.right,
      this.currentY
    );
    this.currentY += this.config.sectionSpacing;
  }

  private addWatermark(): void {
    if (this.config.layout.showWatermark && this.config.layout.watermarkText) {
      this.setFont(this.config.fontSizes.large, 'bold');
      this.doc.setTextColor(200, 200, 200);
      this.addText(this.config.layout.watermarkText, this.pageWidth / 2, this.pageHeight / 2, 'center');
      this.setFont(this.config.fontSizes.body);
      const rgb = this.hexToRgb(this.config.colors.text);
      this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
    }
  }

  async generateReceipt(data: ReceiptData): Promise<jsPDF> {
    const { transaction, parish, member } = data;

    // Add watermark if enabled
    this.addWatermark();

    // Header section
    await this.addHeader(parish);

    // Title section
    this.addTitle();

    // Transaction details
    this.addTransactionDetails(transaction, member);

    // Amount section
    this.addAmountSection(transaction);

    // QR Code section
    if (this.config.qrCode.enabled) {
      await this.addQRCode(transaction, parish);
    }

    // Message section
    if (this.config.content.showThankYouMessage) {
      this.addThankYouMessage();
    }

    // Footer section
    this.addFooter(transaction, parish);

    return this.doc;
  }

  private async addHeader(parish: Parish): Promise<void> {
    // Logo
    if (this.config.layout.logoPosition !== 'hidden' && parish.logo_url) {
      const logoData = await loadImageAsDataUrl(parish.logo_url);
      if (logoData) {
        let logoX: number;

        switch (this.config.layout.logoPosition) {
          case 'top-center':
            logoX = (this.pageWidth - this.config.layout.logoSize) / 2;
            break;
          case 'top-right':
            logoX = this.pageWidth - this.config.margins.right - this.config.layout.logoSize;
            break;
          default:
            logoX = this.config.margins.left;
        }

        try {
          this.doc.addImage(logoData, 'JPEG', logoX, this.currentY, this.config.layout.logoSize, this.config.layout.logoSize);
          this.currentY += this.config.layout.logoSize + 3;
        } catch {
          // Skip logo if it fails
        }
      }
    }

    // Parish name
    this.setFont(this.config.fontSizes.large, 'bold');
    const parishName = parish.parish_name.toUpperCase();

    if (this.config.layout.titleAlignment === 'center') {
      this.addText(parishName, this.pageWidth / 2, undefined, 'center');
    } else if (this.config.layout.titleAlignment === 'right') {
      this.addText(parishName, this.pageWidth - this.config.margins.right, undefined, 'right');
    } else {
      this.addText(parishName);
    }

    this.currentY += this.config.fontSizes.large * 0.3;

    // Address
    if (this.config.content.showParishAddress && parish.physical_address) {
      this.setFont(this.config.fontSizes.small);
      const addrLines = this.doc.splitTextToSize(parish.physical_address, this.contentWidth);

      for (const line of addrLines) {
        if (this.config.layout.titleAlignment === 'center') {
          this.addText(line, this.pageWidth / 2, undefined, 'center');
        } else if (this.config.layout.titleAlignment === 'right') {
          this.addText(line, this.pageWidth - this.config.margins.right, undefined, 'right');
        } else {
          this.addText(line);
        }
      }
    }

    // Contact info
    if (this.config.content.showContactInfo) {
      this.setFont(this.config.fontSizes.small);
      let contactText = '';
      if (parish.contact_phone) contactText += `Tel: ${parish.contact_phone}`;
      if (parish.contact_phone && parish.contact_email) contactText += ' | ';
      if (parish.contact_email) contactText += parish.contact_email;

      if (contactText) {
        if (this.config.layout.titleAlignment === 'center') {
          this.addText(contactText, this.pageWidth / 2, undefined, 'center');
        } else if (this.config.layout.titleAlignment === 'right') {
          this.addText(contactText, this.pageWidth - this.config.margins.right, undefined, 'right');
        } else {
          this.addText(contactText);
        }
      }
    }

    this.currentY += this.config.sectionSpacing;
  }

  private addTitle(): void {
    if (this.config.layout.showBorders) {
      this.addSeparator();
    }

    this.setFont(this.config.fontSizes.title, 'bold');
    const title = 'CONTRIBUTION RECEIPT';

    if (this.config.layout.titleAlignment === 'center') {
      this.addText(title, this.pageWidth / 2, undefined, 'center');
    } else if (this.config.layout.titleAlignment === 'right') {
      this.addText(title, this.pageWidth - this.config.margins.right, undefined, 'right');
    } else {
      this.addText(title);
    }

    this.currentY += this.config.fontSizes.title * 0.5;

    if (this.config.layout.showBorders) {
      this.addSeparator();
    }
  }

  private addTransactionDetails(transaction: IncomeTransaction, member?: Member | null): void {
    this.setFont(this.config.fontSizes.body);

    const addRow = (label: string, value: string) => {
      if (this.config.layout.detailsAlignment === 'two-column') {
        this.setFont(this.config.fontSizes.body, 'bold');
        this.addText(label, this.config.margins.left);

        this.setFont(this.config.fontSizes.body, 'normal');
        this.addText(value, this.pageWidth - this.config.margins.right, undefined, 'right');
      } else if (this.config.layout.detailsAlignment === 'right-aligned') {
        this.setFont(this.config.fontSizes.body, 'bold');
        this.addText(label, this.config.margins.left);

        this.setFont(this.config.fontSizes.body, 'normal');
        const valueWidth = this.doc.getTextWidth(value);
        this.addText(value, this.pageWidth - this.config.margins.right - valueWidth);
      } else {
        this.setFont(this.config.fontSizes.body, 'bold');
        this.addText(label);

        this.setFont(this.config.fontSizes.body, 'normal');
        this.addText(value);
      }
    };

    // Basic details
    if (this.config.advanced.showReceiptNumber) {
      addRow('Receipt No:', transaction.transaction_number);
    }

    addRow('Date:', formatDate(transaction.transaction_date));
    addRow('Category:', formatCategory(transaction.category));
    addRow('Payment:', transaction.payment_method.replace(/_/g, ' ').toUpperCase());

    // Member information
    if (member) {
      this.currentY += 1;
      addRow('Received From:', `${member.first_name} ${member.last_name}`.toUpperCase());

      if (this.config.content.showMemberCode && member.member_code) {
        addRow('Member Code:', member.member_code);
      }
    }

    // Additional details
    if (this.config.content.showReference && transaction.reference_number) {
      addRow('Reference:', transaction.reference_number);
    }

    if (this.config.content.showDescription && transaction.description) {
      this.currentY += 1;
      this.setFont(this.config.fontSizes.body, 'bold');
      this.addText('Description:');
      this.currentY += this.config.fontSizes.body * this.config.lineHeight;

      this.setFont(this.config.fontSizes.body, 'normal');
      const descLines = this.doc.splitTextToSize(transaction.description, this.contentWidth);
      for (const line of descLines) {
        this.addText(line);
      }
    }

    this.currentY += this.config.sectionSpacing;
  }

  private addAmountSection(transaction: IncomeTransaction): void {
    if (this.config.layout.showBorders) {
      this.addLine(
        this.config.margins.left,
        this.currentY,
        this.pageWidth - this.config.margins.right,
        this.currentY
      );
      this.currentY += this.config.sectionSpacing;
    }

    // Amount label
    this.setFont(this.config.fontSizes.subtitle, 'bold');
    const amountLabel = 'TOTAL PAID';

    if (this.config.layout.amountPosition === 'center') {
      this.addText(amountLabel, this.pageWidth / 2, undefined, 'center');
    } else if (this.config.layout.amountPosition === 'right') {
      this.addText(amountLabel, this.pageWidth - this.config.margins.right, undefined, 'right');
    } else {
      this.addText(amountLabel);
    }

    this.currentY += this.config.fontSizes.subtitle * 0.5;

    // Amount value
    this.setFont(this.config.fontSizes.large, 'bold');
    const amountValue = formatCurrency(Number(transaction.amount));

    if (this.config.layout.amountPosition === 'center') {
      this.addText(amountValue, this.pageWidth / 2, undefined, 'center');
    } else if (this.config.layout.amountPosition === 'right') {
      this.addText(amountValue, this.pageWidth - this.config.margins.right, undefined, 'right');
    } else {
      this.addText(amountValue);
    }

    this.currentY += this.config.fontSizes.large * 0.6;

    // Amount in words
    if (this.config.content.showAmountInWords) {
      const amountInWords = numberToWords(Number(transaction.amount)) + ' TANZANIA SHILLINGS ONLY';
      this.setFont(this.config.fontSizes.small, 'italic');
      const wordsLines = this.doc.splitTextToSize(amountInWords, this.contentWidth);

      for (const line of wordsLines) {
        if (this.config.layout.amountPosition === 'center') {
          this.addText(line, this.pageWidth / 2, undefined, 'center');
        } else if (this.config.layout.amountPosition === 'right') {
          this.addText(line, this.pageWidth - this.config.margins.right, undefined, 'right');
        } else {
          this.addText(line);
        }
      }
    }

    this.currentY += this.config.sectionSpacing;

    if (this.config.layout.showBorders) {
      this.addLine(
        this.config.margins.left,
        this.currentY,
        this.pageWidth - this.config.margins.right,
        this.currentY
      );
      this.currentY += this.config.sectionSpacing;
    }
  }

  private async addQRCode(transaction: IncomeTransaction, parish: Parish): Promise<void> {
    let qrData: string;

    switch (this.config.qrCode.data) {
      case 'basic':
        qrData = transaction.transaction_number;
        break;
      case 'detailed':
        qrData = JSON.stringify({
          receipt: transaction.transaction_number,
          amount: transaction.amount,
          date: transaction.transaction_date,
          parish: parish.parish_name,
          verify: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${transaction.transaction_number}`
        });
        break;
      case 'custom':
        qrData = this.config.qrCode.customData ?
          this.config.qrCode.customData(transaction, parish) :
          transaction.transaction_number;
        break;
      default:
        qrData = transaction.transaction_number;
    }

    const qrDataUrl = await generateQRCode(qrData, this.config.qrCode.size);

    if (qrDataUrl) {
      let qrX: number;

      switch (this.config.layout.qrCodePosition) {
        case 'right':
          qrX = this.pageWidth - this.config.margins.right - this.config.qrCode.size / 3.78;
          break;
        case 'left':
          qrX = this.config.margins.left;
          break;
        default:
          qrX = (this.pageWidth - this.config.qrCode.size / 3.78) / 2;
      }

      const qrY = this.currentY;

      // Add border if enabled
      if (this.config.qrCode.includeBorder) {
        this.addLine(
          qrX - 1,
          qrY - 1,
          qrX + this.config.qrCode.size / 3.78 + 1,
          qrY - 1
        );
        this.addLine(
          qrX + this.config.qrCode.size / 3.78 + 1,
          qrY - 1,
          qrX + this.config.qrCode.size / 3.78 + 1,
          qrY + this.config.qrCode.size / 3.78 + 1
        );
        this.addLine(
          qrX + this.config.qrCode.size / 3.78 + 1,
          qrY + this.config.qrCode.size / 3.78 + 1,
          qrX - 1,
          qrY + this.config.qrCode.size / 3.78 + 1
        );
        this.addLine(
          qrX - 1,
          qrY + this.config.qrCode.size / 3.78 + 1,
          qrX - 1,
          qrY - 1
        );
      }

      this.doc.addImage(qrDataUrl, 'PNG', qrX, qrY, this.config.qrCode.size / 3.78, this.config.qrCode.size / 3.78);
      this.currentY += this.config.qrCode.size / 3.78 + 3;

      // Scan text
      this.setFont(this.config.fontSizes.small, 'bold');
      const scanText = 'SCAN TO VERIFY';

      if (this.config.layout.qrCodePosition === 'center') {
        this.addText(scanText, this.pageWidth / 2, undefined, 'center');
      } else if (this.config.layout.qrCodePosition === 'right') {
        this.addText(scanText, this.pageWidth - this.config.margins.right, undefined, 'right');
      } else {
        this.addText(scanText);
      }

      this.currentY += this.config.fontSizes.small * 0.6;

      // Verification URL
      if (this.config.content.showVerificationUrl) {
        this.setFont(this.config.fontSizes.small - 1, 'normal');
        const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${transaction.transaction_number}`;
        const urlLines = this.doc.splitTextToSize(verifyUrl, this.contentWidth - 4);

        for (const line of urlLines) {
          if (this.config.layout.qrCodePosition === 'center') {
            this.addText(line, this.pageWidth / 2, undefined, 'center');
          } else if (this.config.layout.qrCodePosition === 'right') {
            this.addText(line, this.pageWidth - this.config.margins.right, undefined, 'right');
          } else {
            this.addText(line);
          }
        }
      }
    }
  }

  private addThankYouMessage(): void {
    this.currentY += this.config.sectionSpacing;

    this.setFont(this.config.fontSizes.body, 'italic');
    const thankYou = this.config.content.thankYouMessage || 'Thank you for your generous contribution!';

    if (this.config.layout.titleAlignment === 'center') {
      this.addText(thankYou, this.pageWidth / 2, undefined, 'center');
    } else if (this.config.layout.titleAlignment === 'right') {
      this.addText(thankYou, this.pageWidth - this.config.margins.right, undefined, 'right');
    } else {
      this.addText(thankYou);
    }

    this.currentY += this.config.fontSizes.body * 0.6;

    this.setFont(this.config.fontSizes.small, 'italic');
    const blessText = 'God bless you abundantly.';

    if (this.config.layout.titleAlignment === 'center') {
      this.addText(blessText, this.pageWidth / 2, undefined, 'center');
    } else if (this.config.layout.titleAlignment === 'right') {
      this.addText(blessText, this.pageWidth - this.config.margins.right, undefined, 'right');
    } else {
      this.addText(blessText);
    }

    this.currentY += this.config.fontSizes.small * 0.6 + this.config.sectionSpacing;
  }

  private addFooter(transaction: IncomeTransaction, parish: Parish): void {
    if (this.config.format === 'a4') {
      // A4 footer with full signature section
      this.currentY += 8;

      // Official stamp
      if (this.config.content.showOfficialStamp) {
        const stampCenterX = this.pageWidth / 2;
        const stampCenterY = this.currentY + 18;
        const stampRadius = 16;

        const rgb = this.hexToRgb(this.config.colors.accent);
        this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
        this.doc.setLineWidth(0.8);
        this.doc.circle(stampCenterX, stampCenterY, stampRadius);

        this.doc.setLineWidth(0.4);
        this.doc.circle(stampCenterX, stampCenterY, stampRadius - 3);

        this.setFont(5.5, 'bold');
        this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
        const stampText = parish.parish_name.toUpperCase();
        const stampTextW = this.doc.getTextWidth(stampText);
        this.doc.text(stampText, stampCenterX - stampTextW / 2, stampCenterY - 8);

        this.setFont(7, 'bold');
        this.doc.text('OFFICIAL', stampCenterX - this.doc.getTextWidth('OFFICIAL') / 2, stampCenterY + 1);
        this.setFont(5, 'bold');
        this.doc.text('RECEIPT', stampCenterX - this.doc.getTextWidth('RECEIPT') / 2, stampCenterY + 5);

        this.setFont(4.5, 'normal');
        this.doc.setTextColor(0, 0, 0);
        const sealDate = formatDate(transaction.transaction_date);
        this.doc.text(sealDate, stampCenterX - this.doc.getTextWidth(sealDate) / 2, stampCenterY + 10);

        this.currentY = stampCenterY + stampRadius + 8;
      }

      // Signature lines
      if (this.config.content.showSignatureLines) {
        this.setFont(this.config.fontSizes.body, 'normal');
        const sigY = this.currentY;
        const col1X = this.config.margins.left;
        const col2X = this.pageWidth / 2 + 10;
        const lineLen = 55;

        this.addLine(col1X, sigY, col1X + lineLen, sigY);
        this.setFont(this.config.fontSizes.small);
        this.addText(this.config.content.signatureLabels.authorized, col1X, sigY + 4);

        this.addLine(col2X, sigY, col2X + lineLen, sigY);
        this.addText(this.config.content.signatureLabels.date, col2X, sigY + 4);

        this.currentY = sigY + 12;

        if (this.config.content.signatureLabels.receiver) {
          this.addLine(col1X, this.currentY, col1X + lineLen, this.currentY);
          this.addText('Date', col1X, this.currentY + 4);

          this.addLine(col2X, this.currentY, col2X + lineLen, this.currentY);
          this.addText(this.config.content.signatureLabels.receiver, col2X, this.currentY + 4);
        }
      }
    } else {
      // Thermal receipt footer
      if (this.config.layout.showBorders) {
        const rgb = this.hexToRgb(this.config.colors.border);
        this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
        this.doc.setLineWidth(0.3);
        this.addLine(
          this.config.margins.left,
          this.currentY,
          this.pageWidth - this.config.margins.right,
          this.currentY
        );
        this.currentY += 3;
      }

      // Official stamp
      if (this.config.content.showOfficialStamp) {
        const stampX = (this.pageWidth - 20) / 2;
        this.addLine(stampX, this.currentY, stampX + 20, this.currentY);
        this.addLine(stampX + 20, this.currentY, stampX + 20, this.currentY + 8);
        this.addLine(stampX + 20, this.currentY + 8, stampX, this.currentY + 8);
        this.addLine(stampX, this.currentY + 8, stampX, this.currentY);

        this.setFont(this.config.fontSizes.small - 1, 'bold');
        this.addText('OFFICIAL', stampX + 10 - this.doc.getTextWidth('OFFICIAL') / 2, this.currentY + 3);
        this.addText('RECEIPT', stampX + 10 - this.doc.getTextWidth('RECEIPT') / 2, this.currentY + 6);
        this.currentY += 10;
      }

      // Signature section
      if (this.config.content.showSignatureLines) {
        this.setFont(this.config.fontSizes.small, 'normal');
        this.addText('_________________________', this.config.margins.left);
        this.addText(this.config.content.signatureLabels.authorized, this.config.margins.left, this.currentY + 4);

        const dateX = this.pageWidth - this.config.margins.right - 30;
        this.addText('_________________________', dateX);
        this.addText(this.config.content.signatureLabels.date, dateX + 10, this.currentY + 4);
        this.currentY += 10;
      }

      // Footer info
      this.setFont(this.config.fontSizes.small - 1, 'normal');
      const footerText = `This receipt is computer generated and valid without signature`;

      if (this.config.layout.titleAlignment === 'center') {
        this.addText(footerText, this.pageWidth / 2, undefined, 'center');
      } else if (this.config.layout.titleAlignment === 'right') {
        this.addText(footerText, this.pageWidth - this.config.margins.right, undefined, 'right');
      } else {
        this.addText(footerText);
      }
    }
  }
}

// Main export functions
export async function generateCustomReceipt(data: ReceiptData): Promise<jsPDF> {
  const generator = new CustomReceiptGenerator(data.config);
  return await generator.generateReceipt(data);
}

export async function downloadCustomReceipt(data: ReceiptData): Promise<void> {
  const doc = await generateCustomReceipt(data);
  const filename = `receipt_${data.transaction.transaction_number.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}

export async function printCustomReceipt(data: ReceiptData): Promise<void> {
  const doc = await generateCustomReceipt(data);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }
}
