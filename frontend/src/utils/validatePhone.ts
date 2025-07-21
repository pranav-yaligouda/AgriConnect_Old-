// Utility to validate Indian mobile numbers
export function isValidIndianMobile(number: string): boolean {
  number = number.replace(/^(\+91|91)/, '');
  return /^[6-9]\d{9}$/.test(number) && !/^(\d)\1{9}$/.test(number);
} 