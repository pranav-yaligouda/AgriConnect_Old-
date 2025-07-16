// Utility functions for profile components

export function isPlaceholder(url?: string): boolean {
  if (!url) return true;
  return (
    url.includes('farmerProfilePlaceholder.png') ||
    url.includes('vendorProfilePlaceholder.png') ||
    url.includes('userProfilePlaceholder.png')
  );
}

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