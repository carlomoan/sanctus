/**
 * ID Generation Utilities
 * 
 * Provides functions to generate auto-incrementing IDs with customizable 3-character prefixes
 * for different entity types (Diocese, Parish, Cluster, SCC, Family, Member).
 */

export interface IdConfig {
  dioceseInitials: string;
  parishInitials: string;
  clusterInitials: string;
  sccInitials: string;
  familyInitials: string;
  memberInitials: string;
}

export type EntityType = 'diocese' | 'parish' | 'cluster' | 'scc' | 'family' | 'member';

// Default configuration
export const DEFAULT_ID_CONFIG: IdConfig = {
  dioceseInitials: 'DIO',
  parishInitials: 'PAR',
  clusterInitials: 'CLU',
  sccInitials: 'SCC',
  familyInitials: 'FAM',
  memberInitials: 'MEM',
};

/**
 * Validates that initials are exactly 3 characters and contain only letters/numbers
 */
export function validateInitials(initials: string): boolean {
  return /^[A-Z0-9]{3}$/.test(initials.toUpperCase());
}

/**
 * Sanitizes initials to ensure they are 3 characters and uppercase
 */
export function sanitizeInitials(initials: string): string {
  const cleaned = initials.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return cleaned.padEnd(3, 'X').substring(0, 3);
}

/**
 * Gets the initials for a specific entity type from the configuration
 */
export function getEntityInitials(entityType: EntityType, config: Partial<IdConfig> = {}): string {
  const fullConfig = { ...DEFAULT_ID_CONFIG, ...config };
  
  switch (entityType) {
    case 'diocese':
      return sanitizeInitials(fullConfig.dioceseInitials);
    case 'parish':
      return sanitizeInitials(fullConfig.parishInitials);
    case 'cluster':
      return sanitizeInitials(fullConfig.clusterInitials);
    case 'scc':
      return sanitizeInitials(fullConfig.sccInitials);
    case 'family':
      return sanitizeInitials(fullConfig.familyInitials);
    case 'member':
      return sanitizeInitials(fullConfig.memberInitials);
    default:
      return 'UNK';
  }
}

/**
 * Generates a new ID with the specified initials and sequence number
 */
export function generateId(
  entityType: EntityType,
  sequenceNumber: number,
  config?: Partial<IdConfig>
): string {
  const initials = getEntityInitials(entityType, config);
  const paddedNumber = sequenceNumber.toString().padStart(6, '0');
  return `${initials}${paddedNumber}`;
}

/**
 * Parses an ID to extract the initials and sequence number
 */
export function parseId(id: string): { initials: string; sequenceNumber: number } | null {
  if (!id || id.length < 9) return null;
  
  const initials = id.substring(0, 3);
  const sequencePart = id.substring(3);
  
  if (!/^[0-9]+$/.test(sequencePart)) return null;
  
  const sequenceNumber = parseInt(sequencePart, 10);
  
  return {
    initials,
    sequenceNumber,
  };
}

/**
 * Determines the entity type from an ID based on the initials
 */
export function getEntityTypeFromId(id: string, config: Partial<IdConfig> = {}): EntityType | null {
  const parsed = parseId(id);
  if (!parsed) return null;
  
  const fullConfig = { ...DEFAULT_ID_CONFIG, ...config };
  const { initials } = parsed;
  
  if (sanitizeInitials(fullConfig.dioceseInitials) === initials) return 'diocese';
  if (sanitizeInitials(fullConfig.parishInitials) === initials) return 'parish';
  if (sanitizeInitials(fullConfig.clusterInitials) === initials) return 'cluster';
  if (sanitizeInitials(fullConfig.sccInitials) === initials) return 'scc';
  if (sanitizeInitials(fullConfig.familyInitials) === initials) return 'family';
  if (sanitizeInitials(fullConfig.memberInitials) === initials) return 'member';
  
  return null;
}

/**
 * Formats an ID for display (adds dashes for readability)
 */
export function formatIdForDisplay(id: string): string {
  if (!id || id.length < 9) return id;
  
  const initials = id.substring(0, 3);
  const sequence = id.substring(3);
  
  // Format: ABC-123456 or ABC-123-456 depending on length
  if (sequence.length <= 3) {
    return `${initials}-${sequence}`;
  } else if (sequence.length <= 6) {
    return `${initials}-${sequence.substring(0, 3)}-${sequence.substring(3)}`;
  } else {
    return `${initials}-${sequence.substring(0, 3)}-${sequence.substring(3, 6)}-${sequence.substring(6)}`;
  }
}

/**
 * Validates that an ID follows the expected format
 */
export function validateIdFormat(id: string, config: Partial<IdConfig> = {}): boolean {
  const parsed = parseId(id);
  if (!parsed) return false;
  
  const entityType = getEntityTypeFromId(id, config);
  return entityType !== null;
}

/**
 * Generates the next sequence number for an entity type based on existing IDs
 */
export function getNextSequenceNumber(
  existingIds: string[],
  entityType: EntityType,
  config?: Partial<IdConfig>
): number {
  const entityInitials = getEntityInitials(entityType, config);
  
  const sequenceNumbers = existingIds
    .map(id => parseId(id))
    .filter(parsed => parsed && parsed.initials === entityInitials)
    .map(parsed => parsed!.sequenceNumber);
  
  if (sequenceNumbers.length === 0) {
    return 1;
  }
  
  return Math.max(...sequenceNumbers) + 1;
}

/**
 * Creates a human-readable description of an ID
 */
export function getIdDescription(id: string, config: Partial<IdConfig> = {}): string {
  const parsed = parseId(id);
  if (!parsed) return 'Invalid ID';
  
  const entityType = getEntityTypeFromId(id, config);
  if (!entityType) return `Unknown ID (${parsed.initials})`;
  
  const entityNames: Record<EntityType, string> = {
    diocese: 'Diocese',
    parish: 'Parish',
    cluster: 'Cluster',
    scc: 'Small Christian Community',
    family: 'Family',
    member: 'Member',
  };
  
  return `${entityNames[entityType]} #${parsed.sequenceNumber}`;
}

/**
 * Example usage and test cases
 */
export const ID_EXAMPLES = {
  // Using default configuration
  default: {
    diocese: 'DIO000001',
    parish: 'PAR000001',
    cluster: 'CLU000001',
    scc: 'SCC000001',
    family: 'FAM000001',
    member: 'MEM000001',
  },
  
  // Using custom configuration (Diocese of Morogoro example)
  morogoro: {
    diocese: 'DOM000001',
    parish: 'STM000001',
    cluster: 'CHR000001',
    scc: 'SCC000001',
    family: 'FAM000001',
    member: 'MEM000001',
  },
  
  // Display formatted versions
  formatted: {
    diocese: 'DIO-000001',
    parish: 'PAR-000001',
    cluster: 'CLU-000001',
    scc: 'SCC-000001',
    family: 'FAM-000001',
    member: 'MEM-000001',
  },
};

/**
 * Configuration validation
 */
export function validateIdConfig(config: Partial<IdConfig>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.dioceseInitials && !validateInitials(config.dioceseInitials)) {
    errors.push('Diocese initials must be exactly 3 characters (letters and numbers only)');
  }
  
  if (config.parishInitials && !validateInitials(config.parishInitials)) {
    errors.push('Parish initials must be exactly 3 characters (letters and numbers only)');
  }
  
  if (config.clusterInitials && !validateInitials(config.clusterInitials)) {
    errors.push('Cluster initials must be exactly 3 characters (letters and numbers only)');
  }
  
  if (config.sccInitials && !validateInitials(config.sccInitials)) {
    errors.push('SCC initials must be exactly 3 characters (letters and numbers only)');
  }
  
  if (config.familyInitials && !validateInitials(config.familyInitials)) {
    errors.push('Family initials must be exactly 3 characters (letters and numbers only)');
  }
  
  if (config.memberInitials && !validateInitials(config.memberInitials)) {
    errors.push('Member initials must be exactly 3 characters (letters and numbers only)');
  }
  
  // Check for duplicates
  const initials = Object.values(config).filter(Boolean);
  const uniqueInitials = new Set(initials.map(sanitizeInitials));
  
  if (initials.length !== uniqueInitials.size) {
    errors.push('All entity initials must be unique');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
