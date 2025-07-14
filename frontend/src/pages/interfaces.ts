// Shared interfaces for API responses and authentication

export interface ApiResponse<T = any> {
  exists?: boolean;
  token: any;
  success: boolean;
  message?: string;
  data?: T;
}

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}
