// Canonical API types for AgriConnect
// This file should be the single source of truth for all API data types in the frontend.
// It matches the backend Mongoose models exactly, including all fields and reference shapes.

// DO NOT DUPLICATE THESE TYPES ANYWHERE ELSE IN THE FRONTEND.
// --- User ---
export interface User {
  _id: string;
  name: string;
  username: string;
  email?: string;
  password?: string; // Only present on creation, never in API responses
  role: 'user' | 'farmer' | 'vendor' | 'admin';
  phone: string;
  address: {
    street?: string;
    district: string;
    state: string;
    zipcode?: string;
  };
  profileImageUrl?: string | null;
  isVerified?: boolean;
  tokenVersion?: number;
  createdAt: string;
  deviceFingerprint?: string | null;
  lastAdminLogin?: string | null;
  adminNotes?: string;
}

// --- Farmer reference (for populated fields) ---
export type FarmerRef = string | (Pick<User, '_id' | 'name' | 'email' | 'phone' | 'profileImageUrl' | 'address'> & { name?: string });

// --- Product ---
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  unit: 'kg' | 'g' | 'lb' | 'piece' | 'dozen' | 'bunch';
  category: 'vegetables' | 'fruits' | 'grains' | 'pulses' | 'oilseeds' | 'spices' | 'dairy';
  images: string[];
  farmer: FarmerRef;
  location: {
    district: string;
    state: string;
  };
  availableQuantity: number;
  minimumOrderQuantity?: number | null;
  harvestDate: string; // ISO string
  isOrganic: boolean;
  rating: number;
  reviews: Array<{
    user: string | Pick<User, '_id' | 'name'>;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
  storageInfo?: string;
  nutritionalInfo?: {
    calories?: number;
    protein?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
    vitamins?: string;
  };
  isAvailable: boolean;
  createdAt: string;
}

// --- ProductNameOption ---
export interface ProductNameOption {
  key: string;
  en: string;
  hi: string;
  kn: string;
  mr: string;
  [key: string]: string;
}

// --- ContactRequest ---
export interface ContactRequest {
  _id: string;
  productId: string | Product;
  farmerId: string | FarmerRef;
  requesterId: string | FarmerRef;
  requesterRole: 'user' | 'vendor';
  requestedQuantity: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'not_completed' | 'disputed' | 'expired';
  requestedAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  finalQuantity?: number;
  finalPrice?: number;
  userConfirmed?: boolean;
  farmerConfirmed?: boolean;
  userConfirmationAt?: string;
  farmerConfirmationAt?: string;
  userFeedback?: string;
  farmerFeedback?: string;
  confirmationStatus?: 'pending' | 'completed' | 'not_completed' | 'disputed' | 'expired';
  farmerFinalQuantity?: number;
  farmerFinalPrice?: number;
  adminNote?: string;
}

// --- Notification ---
export interface Notification {
  _id: string;
  user: string | Pick<User, '_id' | 'name'>;
  type: 'order' | 'product' | 'system' | 'custom';
  message: string;
  read: boolean;
  createdAt: string;
}

// --- ActivityLog ---
export interface ActivityLog {
  _id: string;
  user: string | Pick<User, '_id' | 'name'>;
  action: string;
  resource?: string;
  resourceId?: string;
  meta?: Record<string, any>;
  ip?: string;
  createdAt: string;
}

// --- AdminActionLog ---
export interface AdminActionLog {
  _id: string;
  admin: string | Pick<User, '_id' | 'name'>;
  action: string;
  target?: string;
  details?: Record<string, any>;
  createdAt: string;
}

// --- API Response Shapes ---
export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  pageCount: number;
}

// --- Registration Types ---
/**
 * Address object for registration (used in Register.tsx)
 */
export interface RegisterAddress {
  district: string;
  state: string;
  street?: string;
  zipcode?: string;
}

/**
 * Payload for registering a new user (farmer, vendor, or consumer)
 */
export interface RegisterUserPayload {
  role: 'user' | 'farmer' | 'vendor';
  username: string;
  name: string;
  email?: string;
  phone: string;
  password: string;
  address: RegisterAddress;
}

/**
 * Response shape for registration API
 */
export interface RegisterResponse {
  token: string;
}


// --- Canonical API Error Response ---
/**
 * Standard error response for all API endpoints.
 */
export interface ApiErrorResponse {
  /** Human-readable error message */
  message: string;
  /** Optional error details, field-specific or general */
  details?: Record<string, string | string[]>;
  /** Optional HTTP status code */
  status?: number;
  /** Optional raw error string (for debugging, not for production) */
  error?: string;
}

// --- Upload Responses ---
/**
 * Response for profile image upload
 */
export interface ProfileImageUploadResponse {
  profileImageUrl: string;
}
/**
 * Response for product image upload
 */
export interface ProductImageUploadResponse {
  urls: string[];
}

// --- Admin Endpoints ---
/**
 * Admin user object (for admin directory, logs, etc)
 */
export interface AdminUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: 'admin';
  address: User['address'];
  createdAt: string;
  adminNotes?: string;
}
/**
 * Paginated list of admin users
 */
export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pageCount: number;
}

// --- Confirmation Payloads ---
/**
 * Payload for user confirming a contact request
 */
export interface ConfirmContactRequestAsUserPayload {
  finalQuantity: number;
  finalPrice: number;
  didBuy: boolean;
  feedback?: string;
}
/**
 * Payload for farmer confirming a contact request
 */
export interface ConfirmContactRequestAsFarmerPayload {
  finalQuantity: number;
  finalPrice: number;
  didSell: boolean;
  feedback?: string;
}

// --- Dispute/Resolution ---
/**
 * Payload for admin resolving a dispute
 */
export interface DisputeResolutionPayload {
  adminNote: string;
  resolution: string;
}

// --- Reset Password Payload ---
/**
 * Payload for resetting a password (after Firebase update)
 */
export interface ResetPasswordPayload {
  phone: string;
  newPassword: string;
  idToken: string;
}

// --- Username Generation Response ---
/**
 * Response for username generation API
 */
export interface GenerateUsernameResponse {
  username: string;
}

// --- Generic Success Response ---
/**
 * Generic success response for simple mutation endpoints
 */
export interface SuccessResponse {
  message: string;
}

// --- Contact Request Creation Response ---
/**
 * Response for creating a contact request
 */
export interface CreateContactRequestResponse {
  message: string;
  existingRequestId?: string;
}

// --- Check Phone Response ---
/**
 * Response for checking if a phone is registered
 */
export interface CheckPhoneResponse {
  exists: boolean;
  message?: string;
}

// --- Product Delete Response ---
/**
 * Response for deleting a product
 */
export interface ProductDeleteResponse {
  message: string;
}

// --- Account Delete Response ---
/**
 * Response for deleting a user account
 */
export interface AccountDeleteResponse {
  message: string;
}

// --- Profile Fetch Response ---
/**
 * Response for fetching user profile
 */
export interface ProfileFetchResponse {
  user: Omit<User, 'password'>;
}

// --- Dashboard Data Response ---
/**
 * Response for dashboard data (role-based)
 */
export interface DashboardDataResponse {
  user: Omit<User, 'password'>;
  products?: Product[];
}

// --- Add more as needed for your API responses ---