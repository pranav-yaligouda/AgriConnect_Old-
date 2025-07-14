// Environment variables and configuration settings

// API URLs
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Frontend URL
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';


// Payment settings
export const DELIVERY_CHARGE = 40; // in INR

// Other app settings
export const APP_NAME = 'AgriConnect';
export const CONTACT_EMAIL = 'Connect@agriConnect.com';
export const CONTACT_PHONE = '+91 9876543210';

// Environment
export const isProduction = import.meta.env.PROD; 