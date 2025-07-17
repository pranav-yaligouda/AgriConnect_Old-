// --- API Service Layer ---
// Centralized API handler for all endpoints
import api from '../utils/axiosConfig';
import type {
  RegisterUserPayload,
  RegisterResponse,
  ResetPasswordPayload,
  ApiErrorResponse,
  User,
  Product,
  PaginatedProducts,
  ProductNameOption,
  ProfileImageUploadResponse,
  ProductImageUploadResponse,
  AdminUser,
  AdminUsersResponse,
  ConfirmContactRequestAsUserPayload,
  ConfirmContactRequestAsFarmerPayload,
  DisputeResolutionPayload,
  GenerateUsernameResponse,
  SuccessResponse,
  CreateContactRequestResponse,
  CheckPhoneResponse,
  ProductDeleteResponse,
  AccountDeleteResponse,
  ProfileFetchResponse,
  DashboardDataResponse
} from '../types/api';


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
export async function createContactRequest(productId: string, requestedQuantity: number): Promise<CreateContactRequestResponse> {
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

export async function loginUser(values: { email: string; password: string }): Promise<RegisterResponse | ApiErrorResponse> {
  try {
    const response = await api.post<any>('/users/login', values);
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- User Registration ----
/**
 * Register a new user (farmer, vendor, or consumer).
 * @param values - Registration form values (validated in Register.tsx)
 * @returns JWT token and user info
 */

export async function registerUser(values: RegisterUserPayload): Promise<RegisterResponse> {
  try {
    const response = await api.post<RegisterResponse>('/users/register', values);
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

/**
 * Generate a unique username based on a user's name.
 * @param name - Full name
 * @returns Object with generated username
 */
export async function generateUsername(name: string): Promise<GenerateUsernameResponse> {
  try {
    const response = await api.post<{ username: string }>('/users/generate-username', { name });
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

/**
 * Sync new password hash to your backend after Firebase updatePassword.
 */
export function resetPassword(payload: ResetPasswordPayload): Promise<SuccessResponse> {
  return api.post<SuccessResponse>('/users/reset-password', payload).then(r => r.data);
}

// ---- Posts ----
export async function fetchPosts(): Promise<SuccessResponse[]> {
  try {
    const response = await api.get('/posts');
    return response.data as any[];
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- Profile ----
// Remove fetchUserProfile (now handled by AuthContext)
// Remove fetchDashboardData (now handled by AuthContext)
// Keep updateProfile and uploadProfileImageFile as update-only utilities
export async function updateProfile(editForm: Partial<User>): Promise<ProfileFetchResponse> {
  try {
    const response = await api.patch('/users/profile', editForm);
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- Profile Image Upload (Cloudinary) ----
/**
 * Uploads a new profile image for the current user.
 * @param file The image file to upload
 * @returns The updated user profile (with new image URL)
 */
export async function uploadProfileImageFile(file: File): Promise<ProfileImageUploadResponse> {
  const formData = new FormData();
  formData.append('profileImage', file); // Correct field name for Multer
  try {
    const response = await api.patch('/users/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- Product Image Upload (Cloudinary) ----
/**
 * Uploads one or more product images for a given product.
 * @param productId The product's ID
 * @param files Array of image files to upload
 * @returns The updated product (with new image URLs)
 */
export async function uploadProductImages(productId: string, files: File[]): Promise<ProductImageUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  try {
    const response = await api.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

export async function deleteProfile(): Promise<AccountDeleteResponse> {
  try {
    const response = await api.delete<AccountDeleteResponse>('/users/profile');
    return response.data;
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

export async function fetchProductNames(category: string): Promise<ProductNameOption[]> {
  try {
    const response = await api.get(`/products/names?category=${category}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    return [];
  }
}

export async function fetchProducts(params?: Record<string, any>): Promise<PaginatedProducts> {
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

/**
 * Fetch a single product by its ID
 */
export async function fetchProductById(id: string): Promise<Product> {
  const response = await api.get(`/products/${id}`);
  return response.data;
}

export async function addProduct(formData: FormData): Promise<Product> {
  try {
    const response = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

export async function deleteProduct(productId: string): Promise<ProductDeleteResponse> {
  try {
    const response = await api.delete<ProductDeleteResponse>(`/products/${productId}`);
    return response.data;
  } catch (error: any) {
    throw normalizeApiError(error);
  }
}

// ---- Image Upload ----
export async function uploadImages(formData: FormData): Promise<ProductImageUploadResponse> {
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
// Remove fetchDashboardData (now handled by AuthContext)

// ---- Users Directory ----
export async function fetchUsers(query?: string): Promise<User[]> {
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
export async function confirmContactRequestAsUser(requestId: string, data: ConfirmContactRequestAsUserPayload): Promise<SuccessResponse> {
  const response = await api.post<SuccessResponse>(`/contact-requests/${requestId}/user-confirm`, data);
  return response.data;
}

// Farmer confirms sale (final quantity, price, didSell, feedback)
export async function confirmContactRequestAsFarmer(requestId: string, data: ConfirmContactRequestAsFarmerPayload): Promise<SuccessResponse> {
  const response = await api.post<SuccessResponse>(`/contact-requests/${requestId}/farmer-confirm`, data);
  return response.data;
}

// Fetch all disputes (admin only)
export async function fetchDisputes(): Promise<SuccessResponse[]> {
  const response = await api.get<SuccessResponse[]>('/contact-requests/disputes');
  return response.data;
}

// Admin resolves a dispute
export async function resolveDispute(requestId: string, data: DisputeResolutionPayload): Promise<SuccessResponse> {
  const response = await api.post<SuccessResponse>(`/contact-requests/${requestId}/admin-resolve`, data);
  return response.data;
}

// Admin login (sends deviceFingerprint)
export async function adminLogin({ username, password, deviceFingerprint }: { username: string; password: string; deviceFingerprint: string }): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/admin/login', { username, password, deviceFingerprint });
  return response.data;
}

// Admin: fetch all users (with pagination/filter/search)
export async function fetchAdminUsers(params?: Record<string, any>): Promise<AdminUsersResponse> {
  const response = await api.get<AdminUsersResponse>('/admin/users', { params });
  return response.data;
}

// Admin: fetch all products (with pagination/filter/search)
export async function fetchAdminProducts(params?: Record<string, any>): Promise<PaginatedProducts> {
  const response = await api.get<PaginatedProducts>('/admin/products', { params });
  return response.data;
}

// Admin: fetch logs
export async function fetchAdminLogs(params?: Record<string, any>): Promise<SuccessResponse[]> {
  const response = await api.get<SuccessResponse[]>('/admin/logs', { params });
  return response.data;
}

// Admin: fetch settings
export async function fetchAdminSettings(): Promise<SuccessResponse> {
  const response = await api.get<SuccessResponse>('/admin/settings');
  return response.data;
}

// Admin: create a new admin
export async function createAdmin(data: Omit<AdminUser, '_id' | 'createdAt' | 'adminNotes'> & { password: string }): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/users/register', { ...data, role: 'admin' });
  return response.data;
}

// Admin: change user role
export async function changeUserRole(userId: string, role: string): Promise<SuccessResponse> {
  const response = await api.patch<SuccessResponse>('/admin/users/role', { userId, role });
  return response.data;
}

// Admin: update admin notes
export async function updateAdminNotes(userId: string, adminNotes: string): Promise<SuccessResponse> {
  const response = await api.patch<SuccessResponse>('/admin/users/admin-notes', { userId, adminNotes });
  return response.data;
}

// Admin: fetch all contact requests (with pagination/filter/search)
export async function fetchAdminContactRequests(params?: Record<string, any>): Promise<SuccessResponse[]> {
  const response = await api.get<SuccessResponse[]>('/admin/contact-requests', { params });
  return response.data;
}

/**
 * Check if a username is available (unique and valid)
 * @param username - Username to check
 * @returns Object with available: boolean
 */
export async function checkUsername(username: string): Promise<{ available: boolean; message?: string }> {
  try {
    const response = await api.post<{ available: boolean; message?: string }>('/users/check-username', { username });
    return response.data;
  } catch (error: any) {
    return { available: false, message: error?.message || 'Error checking username' };
  }
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

