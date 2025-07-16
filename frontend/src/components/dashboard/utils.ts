// Dashboard-specific utility functions
// Only import shared types from src/types/api

/**
 * Returns the profile placeholder image URL based on user role.
 * @param role User role
 */
export function getRoleProfilePlaceholder(role?: string): string {
  switch (role) {
    case 'farmer':
      return '/images/farmerProfilePlaceholder.png';
    case 'vendor':
      return '/images/vendorProfilePlaceholder.png';
    default:
      return '/images/userProfilePlaceholder.png';
  }
} 