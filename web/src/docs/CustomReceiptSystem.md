# 🧾 Customizable Receipt System

A comprehensive, highly customizable receipt generation system for church contribution management. This system provides extensive configuration options for creating professional receipts tailored to specific needs.

## ✨ Key Features

### 📐 **Flexible Layout Options**
- **Multiple Formats**: Thermal 58mm, Thermal 80mm, A4, and Custom sizes
- **Orientation Control**: Portrait and Landscape modes
- **Custom Margins**: Precise margin control for optimal spacing
- **Logo Positioning**: Top-left, top-center, top-right, or hidden
- **Alignment Options**: Left, center, right alignment for titles and content

### 🎨 **Typography & Styling**
- **Font Families**: Helvetica, Times, Courier
- **Size Control**: Individual font sizes for title, subtitle, heading, body, small, and large text
- **Color Customization**: Text, accent, and border colors with hex color picker
- **Spacing Control**: Line height and section spacing adjustments

### ⚙️ **Content Configuration**
- **Element Toggles**: Show/hide any receipt element
- **Custom Messages**: Personalized thank you messages
- **QR Code Integration**: Configurable QR codes with custom data
- **Signature Lines**: Customizable signature labels and positions
- **Official Stamps**: Professional receipt stamps

### 🔧 **Advanced Features**
- **Import/Export**: Save and load receipt configurations
- **Presets**: Pre-configured templates for common use cases
- **Real-time Preview**: Live preview as you customize
- **Bulk Actions**: Apply configurations to multiple receipts

## 🚀 Quick Start

### Basic Usage

```typescript
import { generateCustomReceipt, defaultReceiptConfigs } from './components/CustomReceipt';

// Use a preset configuration
const config = defaultReceiptConfigs['thermal-80'];

// Generate receipt
const doc = await generateCustomReceipt({
  transaction: incomeTransaction,
  parish: parishData,
  member: memberData,
  config
});

// Download or print
doc.save('receipt.pdf');
```

### Custom Configuration

```typescript
import { ReceiptConfig, CustomReceiptGenerator } from './components/CustomReceipt';

const customConfig: ReceiptConfig = {
  format: 'thermal-80',
  orientation: 'portrait',
  margins: { top: 6, right: 4, bottom: 6, left: 4 },
  fontFamily: 'helvetica',
  fontSizes: {
    title: 12,
    subtitle: 9,
    heading: 8,
    body: 8,
    small: 6,
    large: 14
  },
  colors: {
    text: '#000000',
    accent: '#0050a0',
    border: '#0050a0'
  },
  layout: {
    logoPosition: 'top-center',
    logoSize: 16,
    titleAlignment: 'center',
    detailsAlignment: 'two-column',
    amountPosition: 'center',
    qrCodePosition: 'center',
    showBorders: true,
    showWatermark: false
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
    signatureLabels: {
      authorized: 'Authorized Signature',
      date: 'Date'
    }
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
};

const generator = new CustomReceiptGenerator(customConfig);
const doc = await generator.generateReceipt({
  transaction: incomeTransaction,
  parish: parishData,
  member: memberData,
  config: customConfig
});
```

## 📋 Configuration Options

### Page Settings
- `format`: 'a4' | 'thermal-58' | 'thermal-80' | 'custom'
- `orientation`: 'portrait' | 'landscape'
- `customSize`: `{ width: number; height: number }` (for custom format)

### Margins & Spacing
- `margins`: `{ top, right, bottom, left }` in millimeters
- `lineHeight`: Line spacing multiplier (0.5 - 2.0)
- `sectionSpacing`: Space between sections in millimeters

### Typography
- `fontFamily`: 'helvetica' | 'times' | 'courier'
- `fontSizes`: Individual sizes for different text elements
- `colors`: Hex color values for text, accent, and borders

### Layout Options
- `logoPosition`: 'top-left' | 'top-center' | 'top-right' | 'hidden'
- `logoSize`: Logo size in millimeters
- `titleAlignment`: 'left' | 'center' | 'right'
- `detailsAlignment`: 'left' | 'two-column' | 'right-aligned'
- `amountPosition`: 'left' | 'center' | 'right'
- `qrCodePosition`: 'left' | 'center' | 'right'
- `showBorders`: Toggle border lines
- `showWatermark`: Toggle watermark text

### Content Options
- `showParishAddress`: Show/hide parish address
- `showContactInfo`: Show/hide contact information
- `showMemberCode`: Show/hide member code
- `showReference`: Show/hide reference number
- `showDescription`: Show/hide transaction description
- `showAmountInWords`: Show/hide amount in words
- `showThankYouMessage`: Show/hide thank you message
- `showSignatureLines`: Show/hide signature lines
- `showOfficialStamp`: Show/hide official stamp
- `showVerificationUrl`: Show/hide verification URL
- `thankYouMessage`: Custom thank you message text
- `signatureLabels`: Custom labels for signature fields

### QR Code Settings
- `enabled`: Enable/disable QR code
- `size`: QR code size in pixels
- `includeBorder`: Add border around QR code
- `data`: 'basic' | 'detailed' | 'custom'
- `customData`: Custom QR code data function

### Advanced Options
- `showPageNumbers`: Show page numbers
- `showDateTime`: Show date/time
- `showReceiptNumber`: Show receipt number
- `customHeader`: Custom header text
- `customFooter`: Custom footer text
- `enableCondensedMode`: Reduce spacing for compact layout

## 🎨 UI Components

### ReceiptBuilder
Interactive UI component for building custom receipts with live preview.

```typescript
<ReceiptBuilder
  transaction={transaction}
  parish={parish}
  member={member}
  onConfigChange={(config) => setConfig(config)}
  initialConfig={defaultConfig}
/>
```

### ReceiptDemo
Demo component showcasing the receipt builder capabilities.

```typescript
<ReceiptDemo showFullDemo={false} />
```

## 📱 Integration Examples

### Finance Page Integration
The receipt builder is integrated into the Finance page with these features:

1. **Settings Button** (⚙️): Opens the custom receipt builder
2. **Preview Button** (👁️): Quick preview with current settings
3. **Download Button** (⬇️): Download receipt with current format
4. **Print Button** (🖨️): Print receipt directly

### Usage Workflow
1. Navigate to Finance → Income tab
2. Click the ⚙️ Settings icon on any transaction
3. Customize the receipt using the builder interface
4. Preview changes in real-time
5. Download or print the customized receipt

## 🔧 Advanced Customization

### Custom QR Code Data
```typescript
const config: ReceiptConfig = {
  qrCode: {
    enabled: true,
    data: 'custom',
    customData: (transaction, parish) => {
      return JSON.stringify({
        id: transaction.id,
        parish: parish.parish_name,
        verify: `https://your-domain.com/verify/${transaction.transaction_number}`
      });
    }
  }
};
```

### Conditional Content
```typescript
const config: ReceiptConfig = {
  content: {
    showMemberCode: transaction.member_id !== null,
    showReference: transaction.reference_number !== undefined,
    thankYouMessage: transaction.category === 'tithe' 
      ? 'Thank you for your faithful tithe offering!'
      : 'Thank you for your generous contribution!'
  }
};
```

### Dynamic Styling
```typescript
const config: ReceiptConfig = {
  colors: {
    text: '#000000',
    accent: parish.accent_color || '#0050a0',
    border: '#cccccc'
  },
  fontSizes: {
    ...defaultFontSizes,
    title: transaction.amount > 100000 ? 14 : 12 // Larger title for big amounts
  }
};
```

## 📋 Best Practices

### Thermal Printer Optimization
- Use black text only (`#000000`) for best thermal printer compatibility
- Keep font sizes between 6-12pt for thermal printers
- Use condensed mode for space-saving
- Test with actual thermal printer for best results

### Design Principles
- Maintain clear visual hierarchy
- Use consistent spacing throughout
- Ensure important information stands out
- Keep professional appearance for church environments

### Performance Considerations
- Cache receipt configurations for repeated use
- Use preset configurations for common scenarios
- Generate PDFs on-demand rather than pre-generating
- Optimize QR code size for readability

## 🐛 Troubleshooting

### Common Issues

**QR Code Not Displaying**
- Check if QR code is enabled in configuration
- Verify QR code size is appropriate for format
- Ensure QR code data is valid JSON/string

**Text Cut Off**
- Adjust margins for the specific format
- Reduce font sizes for thermal printers
- Check line height settings

**Colors Not Showing**
- Thermal printers only print black text
- Use `#000000` for thermal printer compatibility
- Color settings only apply to PDF/A4 format

**Layout Issues**
- Verify format matches printer capabilities
- Check custom size dimensions
- Test with sample data first

## 🔄 Migration from Old System

### Old Receipt System
```typescript
// Old way - limited customization
await downloadReceipt({
  transaction,
  parish,
  member,
  format: 'thermal-80' // Fixed format
});
```

### New Customizable System
```typescript
// New way - extensive customization
const config = {
  ...defaultReceiptConfigs['thermal-80'],
  fontSizes: { ...defaultReceiptConfigs['thermal-80'].fontSizes, title: 14 },
  colors: { text: '#000000', accent: '#ff0000', border: '#cccccc' },
  content: { ...defaultReceiptConfigs['thermal-80'].content, thankYouMessage: 'Custom message' }
};

await downloadCustomReceipt({
  transaction,
  parish,
  member,
  config
});
```

## 📚 API Reference

### Main Functions
- `generateCustomReceipt(data: ReceiptData): Promise<jsPDF>`
- `downloadCustomReceipt(data: ReceiptData): Promise<void>`
- `printCustomReceipt(data: ReceiptData): Promise<void>`

### Classes
- `CustomReceiptGenerator`: Main receipt generation class

### Types
- `ReceiptConfig`: Complete configuration interface
- `ReceiptData`: Data required for receipt generation

### Defaults
- `defaultReceiptConfigs`: Pre-configured templates for common formats

---

## 🎉 Conclusion

The customizable receipt system provides unparalleled flexibility for creating professional, church-specific receipts. With extensive configuration options, real-time preview, and intuitive UI, you can create receipts that perfectly match your parish's branding and requirements.

Whether you need compact thermal receipts for Sunday services or formal A4 receipts for major donations, this system has you covered with professional results every time.
