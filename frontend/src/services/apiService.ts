// --- API Service Layer ---
// Centralized API handler for all endpoints
import api from '../utils/axiosConfig';
import { LoginResponse } from '../pages/interfaces';


// ----check exisiting contact requests----
export const checkExistingContactRequest = async (
  farmerId: string,
  productId: string,
  timestamp?: number
) => {
  try {
    const response = await api.get(
      `/contact-requests/status/${farmerId}/${productId}${timestamp ? `?t=${timestamp}` : ''}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Check existing request failed:', error);
    return { exists: false };
  }
};

// ---- Contact Requests ----
export async function createContactRequest(productId: string, requestedQuantity: number): Promise<{ message: string; existingRequestId?: string }> {
  try {
    const res = await api.post('/contact-requests/create', { productId, requestedQuantity });
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      return { 
        message: 'Request already exists',
        existingRequestId: error.response.data.existingRequestId
      };
    }
    // Handle 429 error (Too Many Requests)
    if (error.response?.status === 429) {
      throw new Error(error.response.data?.message || 'You have reached your daily contact request limit. Please try again tomorrow.');
    }
    throw error;
  }
}


export async function fetchMyContactRequests(): Promise<{ sent: any[]; received: any[]; pendingFarmers: string[] }> {
  const res = await api.get('/contact-requests/my');
  return res.data;
}



// ---- Auth ----
export const acceptContactRequest = (id: string) =>
  api.put(`/contact-requests/${id}/accept`);
export const rejectContactRequest = (id: string) =>
  api.put(`/contact-requests/${id}/reject`);

export async function loginUser(values: { email: string; password: string }): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/users/login', values);
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- User Registration ----
export async function registerUser(values: any): Promise<any> {
  try {
    const response = await api.post('/users/register', values);
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

export async function generateUsername(name: string): Promise<{ username: string }> {
  try {
    const response = await api.post('/users/generate-username', { name });
    return response.data as { username: string };
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

export interface ResetPasswordPayload {
  phone: string;
  newPassword: string;
  idToken: string;
}

/**
 * Sync new password hash to your backend after Firebase updatePassword.
 */
export function resetPassword(payload: ResetPasswordPayload) {
  // baseURL already includes "/api"
  return api.post<{ success: boolean }>('/users/reset-password', payload);
}

// ---- Posts ----
export async function fetchPosts(): Promise<any[]> {
  try {
    const response = await api.get('/posts');
    return response.data as any[];
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- Profile ----
export async function fetchUserProfile(): Promise<any> {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

export async function updateProfile(editForm: any): Promise<any> {
  try {
    const response = await api.patch('/users/profile', editForm);
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// Upload only profile image (base64)
export async function uploadProfileImage(base64: string, contentType: string): Promise<any> {
  try {
    const response = await api.patch('/users/profile', {
      profileImage: { data: base64, contentType },
    });
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

export async function deleteProfile(): Promise<void> {
  try {
    await api.delete('/users/profile');
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- Products ----
// Define Product type locally to avoid circular dependency
// AFTER (Robust error handling)
export async function fetchMyProducts(config?: { signal?: AbortSignal }): Promise<Product[]> {
  try {
    const response = await api.get('/products/farmer/my-products', {
      signal: config?.signal
    });
    return response.data;
  } catch (error: any) {
    if (error.name === 'CanceledError') return [];
    if (error.response?.status === 403) {
      // Silent handling for non-farmer roles
      console.log('Access denied to farmer products');
      return [];
    }
    // Preserve existing error handling for other cases
    throw normalizeApiError(error);
  }
}

export async function fetchCategories(): Promise<string[]> {
  try {
    const response = await api.get('/products/categories');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  images: string[];
  isOrganic: boolean;
  availableQuantity: number;
  harvestDate: string;
  farmer: {
    name: string;
    address: {
      district: string;
      state: string;
    };
  };
  location: {
    district: string;
    state: string;
  };
}


export async function fetchProducts(params?: Record<string, any>): Promise<{ products: Product[]; total: number; page: number; pageCount: number }> {
  try {
    const response = await api.get('/products', { params });
    // Defensive: always return a paginated object
    if (response.data && Array.isArray(response.data.products)) {
      return response.data;
    }
    // Fallback for legacy: wrap array in paginated object
    return {
      products: Array.isArray(response.data) ? response.data as Product[] : [],
      total: Array.isArray(response.data) ? response.data.length : 0,
      page: 1,
      pageCount: 1
    };
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

export async function addProduct(productData: any): Promise<any> {
  try {
    const response = await api.post('/products', productData);
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await api.delete(`/products/${productId}`);
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- Image Upload ----
export async function uploadImages(formData: FormData): Promise<any> {
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- Dashboard ----
export async function fetchDashboardData(): Promise<any> {
  try {
    const response = await api.get('/users/dashboard');
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- Users Directory ----
export async function fetchUsers(query?: string): Promise<any[]> {
  try {
    const url = query && query.trim()
      ? `/users/all?q=${encodeURIComponent(query.trim())}`
      : '/users/all';
    const response = await api.get(url);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- Contact Request Confirmation ----
// User confirms purchase (final quantity, price, didBuy, feedback)
export async function confirmContactRequestAsUser(requestId: string, data: { finalQuantity: number; finalPrice: number; didBuy: boolean; feedback?: string }) {
  return api.post(`/contact-requests/${requestId}/user-confirm`, data);
}
// Farmer confirms sale (final quantity, price, didSell, feedback)
export async function confirmContactRequestAsFarmer(requestId: string, data: { finalQuantity: number; finalPrice: number; didSell: boolean; feedback?: string }) {
  return api.post(`/contact-requests/${requestId}/farmer-confirm`, data);
}

// ---- Admin Dispute Tools ----
// Fetch all disputes (admin only)
export async function fetchDisputes() {
  return api.get('/contact-requests/disputes');
}
// Admin resolves a dispute
export async function resolveDispute(requestId: string, data: { adminNote: string; resolution: string }) {
  return api.post(`/contact-requests/${requestId}/admin-resolve`, data);
}

// ---- Admin API ----
// Admin login (sends deviceFingerprint)
export async function adminLogin({ username, password, deviceFingerprint }: { username: string; password: string; deviceFingerprint: string }) {
  return api.post('/admin/login', { username, password, deviceFingerprint });
}
// Admin: fetch all users
export async function fetchAdminUsers() {
  return api.get('/users/admin/users');
}
// Admin: fetch all products
export async function fetchAdminProducts() {
  return api.get('/users/admin/products');
}
// Admin: fetch logs
export async function fetchAdminLogs() {
  return api.get('/users/admin/logs');
}
// Admin: fetch settings
export async function fetchAdminSettings() {
  return api.get('/users/admin/settings');
}

// ---- Utility: Robust error normalization ----
function normalizeApiError(error: any) {
  // Handles axios and native errors gracefully
  if (error && error.response) {
    return {
      message: error.response.data?.message || 'An error occurred',
      details: error.response.data?.details,
      status: error.response.status,
    };
  } else if (error && error.request) {
    return {
      message: 'No response received from server',
      status: 0,
    };
  } else {
    return {
      message: error?.message || 'An error occurred',
      status: 0,
    };
  }
}

