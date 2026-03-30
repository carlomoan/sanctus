# 🏷️ Auto-Generated ID System with Customizable Initials

A comprehensive ID generation system that creates meaningful, auto-incrementing IDs with customizable 3-character prefixes for different entity types in the parish management system.

## ✨ Key Features

### 🎯 **Customizable Initials**
- **3-Character Prefixes**: Administrators can set meaningful initials for each entity type
- **Example**: DOM for Diocese of Morogoro, STM for St. Mary's Parish
- **Validation**: Ensures initials are exactly 3 characters (letters/numbers only)
- **Auto-Sanitization**: Automatically formats and validates input

### 🔢 **Auto-Generated Sequences**
- **6-Digit Sequences**: Auto-incrementing numbers (000001, 000002, etc.)
- **No Gaps**: Ensures continuous numbering within each entity type
- **Collision Prevention**: Each entity type has its own sequence space

### 🏗️ **Entity Types Supported**
- **Diocese**: DIO000001 → DOM000001
- **Parish**: PAR000001 → STM000001
- **Cluster**: CLU000001 → CHR000001
- **SCC**: SCC000001 → SCC000001
- **Family**: FAM000001 → FAM000001
- **Member**: MEM000001 → MEM000001

## 🚀 Quick Start

### Basic Usage

```typescript
import { generateId, getNextSequenceNumber } from './utils/idGenerator';

// Generate a new parish ID with custom initials
const parishId = generateId('parish', 1, { parishInitials: 'STM' });
// Result: "STM000001"

// Get next sequence number from existing IDs
const existingParishIds = ['STM000001', 'STM000002'];
const nextSequence = getNextSequenceNumber(existingParishIds, 'parish');
// Result: 3
```

### Configuration from Settings

```typescript
// Load configuration from system settings
const idConfig = {
  dioceseInitials: settings['id.diocese_initials'] || 'DIO',
  parishInitials: settings['id.parish_initials'] || 'PAR',
  // ... other initials
};

// Generate ID using current configuration
const memberId = generateId('member', 123, idConfig);
// Result: "MEM000123"
```

## 📋 Configuration Interface

### Settings Page Integration

The ID initials are configured in **Settings → UI Configuration**:

```
🎨 UI Configuration
├── Primary Color                    [Color Picker]
├── Application Name                 [Text Input]
├── Logo URL                        [Text Input]
└── ID Initials Configuration       [⚙️ Configure ID Initials]
                                   Using "DOM", "STM", "CHR", "SCC", "FAM", "MEM"
                                   
                                   📊 ID Format Preview
                                   ┌─────────┬─────────────┐
                                   │ Diocese │ DOM-000001 │
                                   │ Parish  │ STM-000001 │
                                   │ Member  │ MEM-000001 │
                                   └─────────┴─────────────┘
```

### ID Configuration Modal

Clicking "Configure ID Initials" opens a comprehensive modal:

#### **Configuration Fields**
- **Diocese Initials**: 3 characters (e.g., DOM for Diocese of Morogoro)
- **Parish Initials**: 3 characters (e.g., STM for St. Mary's)
- **Cluster Initials**: 3 characters (e.g., CHR for Christian Community)
- **SCC Initials**: 3 characters (e.g., SCC for Small Christian Community)
- **Family Initials**: 3 characters (e.g., FAM for Family)
- **Member Initials**: 3 characters (e.g., MEM for Member)

#### **Features**
- **Real-time Validation**: Ensures 3-character format and uniqueness
- **Live Preview**: Shows sample IDs as you type
- **Quick Templates**: "Morogoro Example" button for common setup
- **Reset to Defaults**: Restore standard initials
- **Error Handling**: Clear validation messages

## 🔧 Technical Implementation

### Core Functions

#### `generateId(entityType, sequenceNumber, config?)`
Generates a new ID with specified initials and sequence.

```typescript
generateId('parish', 1, { parishInitials: 'STM' });
// Returns: "STM000001"
```

#### `parseId(id)`
Extracts initials and sequence number from an ID.

```typescript
parseId('STM000001');
// Returns: { initials: 'STM', sequenceNumber: 1 }
```

#### `validateIdFormat(id, config?)`
Validates that an ID follows the expected format.

```typescript
validateIdFormat('STM000001', { parishInitials: 'STM' });
// Returns: true
```

#### `getNextSequenceNumber(existingIds, entityType, config?)`
Calculates the next sequence number for an entity type.

```typescript
getNextSequenceNumber(['STM000001', 'STM000002'], 'parish');
// Returns: 3
```

### ID Format Structure

```
[3-CHARACTER INITIALS][6-DIGIT SEQUENCE]

Example: STM000001
├── STM: Parish initials (St. Mary's)
└── 000001: First parish in sequence

Formatted Display: STM-000001
```

### Validation Rules

#### Initials Validation
- **Length**: Exactly 3 characters
- **Characters**: Letters (A-Z) and numbers (0-9) only
- **Case**: Automatically converted to uppercase
- **Uniqueness**: No duplicate initials across entity types

#### ID Format Validation
- **Total Length**: 9 characters minimum
- **Structure**: 3 letters/numbers + 6 numbers
- **Sequence**: Numeric only, padded with zeros

## 📊 Configuration Examples

### Default Configuration
```typescript
const defaultConfig = {
  dioceseInitials: 'DIO',
  parishInitials: 'PAR',
  clusterInitials: 'CLU',
  sccInitials: 'SCC',
  familyInitials: 'FAM',
  memberInitials: 'MEM',
};

// Generated IDs:
// DIO000001, PAR000001, CLU000001, SCC000001, FAM000001, MEM000001
```

### Diocese of Morogoro Example
```typescript
const morogoroConfig = {
  dioceseInitials: 'DOM',    // Diocese of Morogoro
  parishInitials: 'STM',    // St. Mary's
  clusterInitials: 'CHR',   // Christian Community
  sccInitials: 'SCC',       // Small Christian Community
  familyInitials: 'FAM',    // Family
  memberInitials: 'MEM',    // Member
};

// Generated IDs:
// DOM000001, STM000001, CHR000001, SCC000001, FAM000001, MEM000001
```

### Custom Parish Example
```typescript
const customConfig = {
  dioceseInitials: 'ARU',    // Archdiocese
  parishInitials: 'STJ',    // St. Joseph
  clusterInitials: 'YTH',   // Youth
  sccInitials: 'SCC',       // Small Christian Community
  familyInitials: 'FML',    // Family
  memberInitials: 'MBR',    // Member
};

// Generated IDs:
// ARU000001, STJ000001, YTH000001, SCC000001, FML000001, MBR000001
```

## 🎨 User Interface Components

### IdInitialsConfig Component

A comprehensive React component for configuring ID initials:

```typescript
<IdInitialsConfig
  config={currentConfig}
  onChange={handleConfigChange}
  disabled={false}
/>
```

#### Features:
- **6 Configuration Fields**: One for each entity type
- **Real-time Validation**: Instant feedback on input
- **Live Preview**: Shows sample IDs for all entity types
- **Error Display**: Clear validation messages
- **Quick Actions**: Reset defaults, load examples
- **Responsive Design**: Works on all screen sizes

### Settings Integration

The ID configuration integrates seamlessly with the existing settings system:

- **Storage**: Saved as individual settings in the database
- **Global/Parish**: Supports both global and parish-specific configurations
- **Validation**: Server-side validation ensures data integrity
- **Caching**: Loaded efficiently through the settings context

## 🔍 Advanced Usage

### Batch ID Generation

```typescript
// Generate multiple IDs for different entities
const entityTypes = ['diocese', 'parish', 'member'] as const;
const newIds = entityTypes.map((type, index) => 
  generateId(type, index + 1, customConfig)
);
// Result: ['DOM000001', 'STM000001', 'MEM000001']
```

### ID Parsing and Display

```typescript
// Parse and format for display
const memberId = 'MEM000123';
const parsed = parseId(memberId);
const formatted = formatIdForDisplay(memberId);
const description = getIdDescription(memberId, config);

// Results:
// parsed: { initials: 'MEM', sequenceNumber: 123 }
// formatted: 'MEM-000123'
// description: 'Member #123'
```

### Validation in Forms

```typescript
// Validate user input
const validateMemberId = (id: string) => {
  const isValid = validateIdFormat(id, currentConfig);
  const entityType = getEntityTypeFromId(id, currentConfig);
  
  return {
    isValid,
    entityType,
    error: !isValid ? 'Invalid ID format' : null
  };
};
```

## 🛡️ Security and Data Integrity

### Collision Prevention
- **Sequence Isolation**: Each entity type has independent sequence numbers
- **Database Constraints**: Unique constraints prevent duplicate IDs
- **Atomic Operations**: ID generation is atomic to prevent race conditions

### Input Sanitization
- **Auto-formatting**: User input automatically formatted to 3 characters
- **Character Filtering**: Invalid characters automatically removed
- **Case Normalization**: All letters converted to uppercase

### Validation Layers
- **Client-side**: Instant feedback in the UI
- **Server-side**: Final validation before saving
- **Database**: Constraints ensure data integrity

## 📈 Performance Considerations

### Efficient Generation
- **Sequence Caching**: Last sequence numbers cached for performance
- **Batch Operations**: Support for generating multiple IDs efficiently
- **Minimal Queries**: Optimized database queries for sequence numbers

### Storage Optimization
- **Compact Format**: 9-character IDs minimize storage requirements
- **Indexing**: Efficient database indexing for ID lookups
- **Compression**: Settings stored as compact JSON strings

## 🔄 Migration Strategy

### From UUID to Custom IDs
```typescript
// Existing entities with UUIDs can be migrated
const migrateEntity = (entity: any, entityType: string, sequence: number) => {
  const newId = generateId(entityType, sequence, currentConfig);
  return {
    ...entity,
    id: newId,
    legacy_id: entity.id // Keep reference to old UUID
  };
};
```

### Backward Compatibility
- **Dual Support**: System supports both UUID and custom ID formats
- **Gradual Migration**: Entities can be migrated incrementally
- **Legacy Support**: Old UUIDs preserved for reference

## 🎯 Best Practices

### Initials Selection
- **Meaningful**: Use recognizable abbreviations
- **Unique**: Ensure no conflicts with other entity types
- **Consistent**: Follow naming conventions across the diocese
- **Future-proof**: Consider expansion when choosing initials

### Sequence Management
- **Continuous**: Avoid manual sequence number manipulation
- **Monitoring**: Track sequence number usage and growth
- **Planning**: Consider sequence number capacity for long-term use

### Configuration Management
- **Documentation**: Document the meaning of each set of initials
- **Backup**: Keep records of ID configuration changes
- **Testing**: Test new configurations in development first

## 🚀 Future Enhancements

### Planned Features
- **Batch Import**: Import existing IDs from external systems
- **Advanced Formatting**: More display format options
- **Sequence Resetting**: Ability to reset sequences (with safeguards)
- **Audit Trail**: Track ID generation and configuration changes

### Integration Opportunities
- **Barcode Generation**: Generate barcodes from IDs
- **QR Codes**: Create QR codes with ID information
- **Export/Import**: Backup and restore ID configurations
- **API Endpoints**: RESTful API for ID generation

---

## 📋 Summary

The Auto-Generated ID System provides:

✅ **Customizable Initials**: 3-character prefixes for meaningful IDs  
✅ **Auto-incrementing Sequences**: Continuous numbering without gaps  
✅ **Administrative Control**: Easy configuration through Settings page  
✅ **Validation & Security**: Multi-layer validation and data integrity  
✅ **Professional Display**: Formatted IDs with dash separators  
✅ **Scalable Architecture**: Supports millions of entities per type  
✅ **Migration Support**: Gradual migration from existing systems  

This system transforms generic UUIDs into meaningful, professional identifiers that reflect the organizational structure and make the system more user-friendly for administrators and users alike.
