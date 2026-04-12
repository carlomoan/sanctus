import { Parish, UserRole } from '../types';
import { User } from '../types';

/**
 * Filter parishes based on user role and permissions
 * Super admins can see all parishes
 * Other roles can only see their assigned parish and only active ones
 */
export const filterParishesByRole = (parishes: Parish[], user: User | null): Parish[] => {
  if (!user) return [];
  
  // Super admins can see all parishes
  if (user.role === UserRole.SUPER_ADMIN) {
    return parishes;
  }
  
  // Other roles can only see their assigned parish and only active ones
  return parishes.filter(p => 
    p.id === user.parish_id && p.is_active
  );
};

/**
 * Get the effective parish ID for a user
 * For super admins, this returns null (they can select any parish)
 * For other roles, this returns their assigned parish ID
 */
export const getEffectiveParishId = (user: User | null): string | null => {
  if (!user) return null;
  
  if (user.role === UserRole.SUPER_ADMIN) {
    return null; // Super admins can select any parish
  }
  
  return user.parish_id || null;
};

/**
 * Check if a user can access a specific parish
 */
export const canAccessParish = (user: User | null, parishId: string): boolean => {
  if (!user) return false;
  
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  return user.parish_id === parishId;
};

/**
 * Get parishes for dropdown selection
 * Returns only active parishes for non-super admins
 */
export const getParishesForDropdown = (parishes: Parish[], user: User | null): Parish[] => {
  if (!user) return [];
  
  // Super admins can see all parishes (active and inactive)
  if (user.role === UserRole.SUPER_ADMIN) {
    return parishes;
  }
  
  // Other roles can only see their assigned parish and it must be active
  return parishes.filter(p => 
    p.id === user.parish_id && p.is_active
  );
};
