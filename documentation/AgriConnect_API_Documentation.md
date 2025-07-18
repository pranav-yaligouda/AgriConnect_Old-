# AgriConnect API Documentation

## Overview
This document provides a comprehensive overview of all API endpoints for the AgriConnect platform, including authentication, user management, product management, contact requests, admin functionality, analytics, and email services. Both backend (Express/MongoDB) and frontend (React/TypeScript) usage are covered, with detailed request/response formats, authentication, and best practices.

---

## Table of Contents
1. [User Authentication & Profile](#user-authentication--profile)
2. [Product Management](#product-management)
3. [Contact Request System](#contact-request-system)
4. [Admin Management](#admin-management)
5. [Analytics](#analytics)
6. [Email Services](#email-services)
7. [Image Upload (Products & Profile)](#image-upload-products--profile)
8. [Frontend API Usage](#frontend-api-usage)
9. [Authentication](#authentication)
10. [Error Handling](#error-handling)
11. [API Endpoint Summary](#api-endpoint-summary)

---

## 1. User Authentication & Profile

### 1.1 Register User
**Endpoint:** `POST /api/users/register`

**Purpose:** Register a new user (farmer, vendor, or customer) with Firebase OTP verification.

**Request Body:**
```json
{
  "name": "string",
  "username": "string", // optional, auto-generated if not provided
  "email": "string", // optional
  "password": "string",
  "phone": "string", // required, normalized to 10 digits
  "role": "farmer" | "vendor" | "user",
  "address": {
    "street": "string", // optional
    "district": "string", // required
    "state": "string", // required
    "zipcode": "string" // 6 digits
  },
  "idToken": "string", // Firebase ID token for OTP verification
  "profileImageUrl": "https://..." // optional
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "_id": "...",
    "name": "...",
    "username": "...",
    "email": "...",
    "phone": "...",
    "role": "...",
    "address": { ... },
    "profileImageUrl": "...",
    "createdAt": "..."
  },
  "token": "JWT_TOKEN"
}
```

**Logic:** Validates Firebase OTP token, normalizes phone number, generates unique username if not provided, hashes password, and returns JWT.

---

### 1.2 Login User
**Endpoint:** `POST /api/users/login`

**Purpose:** Authenticate user with email/phone and password.

**Request Body:**
```json
{
  "email": "string", // either email or phone required
  "phone": "string", // either email or phone required
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "...",
    "phone": "...",
    "address": { ... }
  },
  "token": "JWT_TOKEN"
}
```

**Logic:** Finds user by email or normalized phone, validates password, prevents admin login through this endpoint.

---

### 1.3 Reset Password
**Endpoint:** `POST /api/users/reset-password`

**Purpose:** Reset user password with Firebase OTP verification.

**Request Body:**
```json
{
  "phone": "string",
  "newPassword": "string",
  "idToken": "string" // Firebase ID token
}
```

**Response:** `200 OK`
```json
{ "success": true }
```

**Logic:** Verifies Firebase OTP token, hashes new password, and updates user record.

---

### 1.4 Get Profile
**Endpoint:** `GET /api/users/profile`

**Purpose:** Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "_id": "...",
  "name": "...",
  "username": "...",
  "email": "...",
  "phone": "...",
  "role": "...",
  "profileImageUrl": "https://...",
  "address": {
    "street": "...",
    "district": "...",
    "state": "...",
    "zipcode": "..."
  },
  "isVerified": false,
  "createdAt": "..."
}
```

---

### 1.5 Update Profile
**Endpoint:** `PATCH /api/users/profile`

**Purpose:** Update current user's profile (excluding image upload).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "string", // optional
  "email": "string", // optional
  "phone": "string", // optional
  "address": {
    "street": "string",
    "district": "string",
    "state": "string",
    "zipcode": "string"
  }, // optional, merged with existing
  "profileImageUrl": "string" // optional
}
```

**Response:** `200 OK`
```json
{
  "_id": "...",
  "name": "...",
  // ... updated user object without password
}
```

---

### 1.6 Upload Profile Image
**Endpoint:** `PATCH /api/users/profile/image`

**Purpose:** Upload or update the user's profile image via Cloudinary.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**
- Form field: `profileImage` (file, JPEG/PNG, max 2MB)

**Response:** `200 OK`
```json
{ "profileImageUrl": "https://res.cloudinary.com/..." }
```

**Logic:** Validates file type, uploads to Cloudinary, updates user's profileImageUrl.

---

### 1.7 Delete Account
**Endpoint:** `DELETE /api/users/profile`

**Purpose:** Delete current user's account and related data.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{ "message": "Account deleted successfully" }
```

**Logic:** Deletes user's products if farmer, then deletes user account.

---

### 1.8 Get Dashboard Data
**Endpoint:** `GET /api/users/dashboard`

**Purpose:** Get role-specific dashboard data for authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "user": { ... },
  "products": [ ... ] // for farmers: their products, for vendors: local products
}
```

**Logic:** Returns user info plus role-specific data (products for farmers/vendors).

---

### 1.9 Generate Username
**Endpoint:** `POST /api/users/generate-username`

**Purpose:** Generate a unique username from a full name.

**Request Body:**
```json
{ "name": "string" }
```

**Response:** `200 OK`
```json
{ "username": "generated_username" }
```

**Rate Limit:** 10 requests per minute per IP.

---

### 1.10 Check Username Availability
**Endpoint:** `POST /api/users/check-username`

**Purpose:** Check if a username is available and valid.

**Request Body:**
```json
{ "username": "string" }
```

**Response:** `200 OK`
```json
{
  "available": true,
  "message": "Username is available" // or error message
}
```

**Rate Limit:** 10 requests per minute per IP.

---

### 1.11 Check Phone Registration
**Endpoint:** `POST /api/users/check-phone`

**Purpose:** Check if a phone number is already registered.

**Request Body:**
```json
{ "phone": "string" }
```

**Response:** `200 OK`
```json
{ "exists": true }
```

**Rate Limit:** 20 requests per minute per IP.

---

### 1.12 Get Current User (Auth)
**Endpoint:** `GET /api/auth/me`

**Purpose:** Get current authenticated user profile (alternative endpoint).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "phone": "...",
    "role": "...",
    "username": "...",
    "address": { ... },
    "profileImageUrl": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 2. Product Management

### 2.1 List All Products
**Endpoint:** `GET /api/products`

**Purpose:** List all products with filtering, search, and pagination.

**Query Parameters:**
- `category` - Filter by category (supports multiple: `category=fruits,vegetables`)
- `minPrice` / `maxPrice` - Price range filter
- `district` / `state` - Location filters
- `search` - Text search in name/description
- `isOrganic` - Filter organic products (`true`/`false`)
- `sort` - Sort by: `price-asc`, `price-desc`, `newest` (default)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `name` - Filter by specific product name key

**Response:** `200 OK`
```json
{
  "products": [
    {
      "_id": "...",
      "name": "...",
      "price": 100,
      "unit": "kg",
      "category": "vegetables",
      "description": "...",
      "images": ["https://res.cloudinary.com/..."],
      "farmer": {
        "_id": "...",
        "name": "...",
        "email": "...",
        "phone": "...",
        "profileImageUrl": "..."
      },
      "location": {
        "district": "...",
        "state": "..."
      },
      "availableQuantity": 50,
      "minimumOrderQuantity": 5,
      "harvestDate": "2024-01-15T00:00:00.000Z",
      "isOrganic": true,
      "rating": 4.5,
      "reviews": [...],
      "isAvailable": true,
      "createdAt": "..."
    }
  ],
  "total": 150,
  "page": 1,
  "pageCount": 8
}
```

---

### 2.2 Get Product Categories
**Endpoint:** `GET /api/products/categories`

**Purpose:** Get list of all available product categories.

**Response:** `200 OK`
```json
["all", "vegetables", "fruits", "grains", "pulses", "oilseeds", "spices", "dairy"]
```

---

### 2.3 Get Product Names by Category
**Endpoint:** `GET /api/products/names`

**Purpose:** Get predefined product names for a specific category.

**Query Parameters:**
- `category` - Required category name

**Response:** `200 OK`
```json
[
  { "name": "tomato", "label": "Tomato" },
  { "name": "potato", "label": "Potato" },
  // ... more product options
]
```

---

### 2.4 Get Single Product
**Endpoint:** `GET /api/products/:id`

**Purpose:** Get detailed information about a specific product.

**Response:** `200 OK`
```json
{
  "_id": "...",
  "name": "...",
  "description": "...",
  "price": 100,
  "unit": "kg",
  "category": "vegetables",
  "images": ["https://res.cloudinary.com/..."],
  "farmer": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "phone": "...",
    "location": { ... },
    "address": { ... },
    "profileImageUrl": "..."
  },
  "location": {
    "district": "...",
    "state": "..."
  },
  "availableQuantity": 50,
  "minimumOrderQuantity": 5,
  "harvestDate": "2024-01-15T00:00:00.000Z",
  "isOrganic": true,
  "rating": 4.5,
  "reviews": [
    {
      "user": "...",
      "rating": 5,
      "comment": "...",
      "createdAt": "..."
    }
  ],
  "storageInfo": "...",
  "nutritionalInfo": {
    "calories": 18,
    "protein": "0.9g",
    "carbs": "3.9g",
    "fat": "0.2g",
    "fiber": "1.2g",
    "vitamins": "Vitamin C, K"
  },
  "isAvailable": true,
  "createdAt": "..."
}
```

---

### 2.5 List My Products (Farmer Only)
**Endpoint:** `GET /api/products/farmer/my-products`

**Purpose:** List products created by the authenticated farmer.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `farmer`

**Response:** `200 OK`
```json
[
  {
    "_id": "...",
    "name": "...",
    "price": 100,
    "unit": "kg",
    "category": "vegetables",
    "description": "...",
    "images": ["https://res.cloudinary.com/..."],
    "farmer": {
      "_id": "...",
      "name": "...",
      "email": "...",
      "phone": "..."
    },
    "location": { ... },
    "availableQuantity": 50,
    "minimumOrderQuantity": 5,
    "harvestDate": "...",
    "isOrganic": true,
    "rating": 4.5,
    "isAvailable": true,
    "createdAt": "..."
  }
]
```

---

### 2.6 Create Product (Farmer Only)
**Endpoint:** `POST /api/products`

**Purpose:** Create a new product with image upload.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Role Required:** `farmer`

**Request:**
- Form fields:
  - `name` - Product name (string)
  - `description` - Product description (string)
  - `price` - Price per unit (number)
  - `unit` - Unit of measurement (enum: kg, g, lb, piece, dozen, bunch)
  - `category` - Product category (enum: vegetables, fruits, grains, pulses, oilseeds, spices, dairy)
  - `location` - JSON string: `{"district": "...", "state": "..."}`
  - `availableQuantity` - Available quantity (number)
  - `minimumOrderQuantity` - Minimum order quantity (number, optional)
  - `harvestDate` - Harvest date (ISO date string)
  - `isOrganic` - Is organic product (boolean)
  - `storageInfo` - Storage information (string, optional)
  - `nutritionalInfo` - JSON string with nutritional data (optional)
- Files: `images` - 1-3 image files (JPEG/PNG, max 5MB each)

**Response:** `201 Created`
```json
{
  "_id": "...",
  "name": "...",
  "description": "...",
  "price": 100,
  "unit": "kg",
  "category": "vegetables",
  "images": [
    "https://res.cloudinary.com/...",
    "https://res.cloudinary.com/..."
  ],
  "farmer": "...",
  "location": { ... },
  "availableQuantity": 50,
  "minimumOrderQuantity": 5,
  "harvestDate": "...",
  "isOrganic": true,
  "rating": 0,
  "reviews": [],
  "isAvailable": true,
  "createdAt": "..."
}
```

---

### 2.7 Update Product (Farmer Only)
**Endpoint:** `PATCH /api/products/:id`

**Purpose:** Update an existing product (farmer can only update their own products).

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `farmer`

**Request Body:**
```json
{
  "name": "string", // optional
  "description": "string", // optional
  "price": 100, // optional
  "unit": "kg", // optional
  "category": "vegetables", // optional
  "availableQuantity": 50, // optional
  "minimumOrderQuantity": 5, // optional
  "harvestDate": "2024-01-15T00:00:00.000Z", // optional
  "isOrganic": true, // optional
  "storageInfo": "string", // optional
  "nutritionalInfo": { ... }, // optional
  "isAvailable": true // optional
}
```

**Response:** `200 OK`
```json
{
  // ... updated product object
}
```

---

### 2.8 Delete Product (Farmer Only)
**Endpoint:** `DELETE /api/products/:id`

**Purpose:** Delete a product (farmer can only delete their own products).

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `farmer`

**Response:** `200 OK`
```json
{ "message": "Product deleted" }
```

---

### 2.9 Upload Additional Product Images (Farmer Only)
**Endpoint:** `POST /api/products/:id/images`

**Purpose:** Upload additional images for an existing product.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Role Required:** `farmer`

**Request:**
- Files: `images` - 1-3 image files (JPEG/PNG, max 5MB each)

**Response:** `200 OK`
```json
{ "urls": ["https://res.cloudinary.com/...", "..."] }
```

**Logic:** Validates file types, uploads to Cloudinary, appends URLs to product's images array.

---

## 3. Contact Request System

The contact request system allows users/vendors to request contact information from farmers for specific products, with a complete workflow from request to completion/dispute resolution.

### 3.1 Check Existing Contact Request
**Endpoint:** `GET /api/contact-requests/status/:farmerId/:productId`

**Purpose:** Check if a pending contact request already exists for a farmer-product combination.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{ "exists": true }
```

---

### 3.2 Create Contact Request
**Endpoint:** `POST /api/contact-requests/create`

**Purpose:** Create a new contact request to a farmer for a specific product.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "productId": "string",
  "requestedQuantity": 10
}
```

**Response:** `201 Created`
```json
{
  "_id": "...",
  "farmerId": "...",
  "productId": "...",
  "status": "pending",
  "requestedQuantity": 10
}
```

**Rate Limits:**
- Users: 2 requests per day
- Vendors: 5 requests per day
- Blocked if user has unresolved accepted requests older than 2 days

---

### 3.3 Accept Contact Request (Farmer)
**Endpoint:** `PUT /api/contact-requests/:id/accept`

**Purpose:** Farmer accepts a contact request, sharing contact information.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `farmer`

**Response:** `200 OK`
```json
{
  "_id": "...",
  "status": "accepted",
  "acceptedAt": "2024-01-15T10:30:00.000Z",
  // ... full request object
}
```

**Logic:** Blocked if farmer has unresolved accepted requests older than 2 days.

---

### 3.4 Reject Contact Request (Farmer)
**Endpoint:** `PUT /api/contact-requests/:id/reject`

**Purpose:** Farmer rejects a contact request.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `farmer`

**Response:** `200 OK`
```json
{
  "_id": "...",
  "status": "rejected",
  "rejectedAt": "2024-01-15T10:30:00.000Z",
  // ... full request object
}
```

---

### 3.5 Get My Contact Requests
**Endpoint:** `GET /api/contact-requests/my`

**Purpose:** Get all contact requests sent by or received by the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "sent": [
    {
      "_id": "...",
      "productId": {
        "name": "...",
        "price": 100,
        "unit": "kg",
        "availableQuantity": 50,
        "minimumOrderQuantity": 5,
        "location": { ... }
      },
      "farmerId": {
        "name": "...",
        "email": "...",
        "phone": "...",
        "address": { ... }
      },
      "status": "accepted",
      "requestedQuantity": 10,
      "requestedAt": "...",
      "acceptedAt": "..."
    }
  ],
  "received": [
    {
      "_id": "...",
      "productId": { ... },
      "requesterId": {
        "name": "...",
        "email": "...",
        "phone": "...",
        "role": "user",
        "address": { ... }
      },
      "status": "pending",
      "requestedQuantity": 15,
      "requestedAt": "..."
    }
  ]
}
```

---

### 3.6 User Confirmation
**Endpoint:** `POST /api/contact-requests/:id/user-confirm`

**Purpose:** User confirms the outcome of their contact request.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "didBuy": true,
  "finalQuantity": 8,
  "finalPrice": 800,
  "feedback": "Great quality produce!"
}
```

**Response:** `200 OK`
```json
{
  "_id": "...",
  "userConfirmed": true,
  "userConfirmationAt": "...",
  "finalQuantity": 8,
  "finalPrice": 800,
  "userFeedback": "Great quality produce!",
  "status": "completed", // or "disputed" if farmer details don't match
  // ... full request object
}
```

---

### 3.7 Farmer Confirmation
**Endpoint:** `POST /api/contact-requests/:id/farmer-confirm`

**Purpose:** Farmer confirms the outcome of the contact request.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `farmer`

**Request Body:**
```json
{
  "didSell": true,
  "finalQuantity": 8,
  "finalPrice": 800,
  "feedback": "Smooth transaction!"
}
```

**Response:** `200 OK`
```json
{
  "_id": "...",
  "farmerConfirmed": true,
  "farmerConfirmationAt": "...",
  "farmerFinalQuantity": 8,
  "farmerFinalPrice": 800,
  "farmerFeedback": "Smooth transaction!",
  "status": "completed", // or "disputed" if user details don't match
  // ... full request object
}
```

---

### 3.8 Get Disputes (Admin Only)
**Endpoint:** `GET /api/contact-requests/disputes`

**Purpose:** Get all disputed contact requests for admin review.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `admin`

**Response:** `200 OK`
```json
[
  {
    "_id": "...",
    "status": "disputed",
    "finalQuantity": 8,
    "finalPrice": 800,
    "farmerFinalQuantity": 10,
    "farmerFinalPrice": 1000,
    "userFeedback": "...",
    "farmerFeedback": "...",
    "productId": { ... },
    "farmerId": { ... },
    "requesterId": { ... }
  }
]
```

---

### 3.9 Admin Resolve Dispute
**Endpoint:** `POST /api/contact-requests/:id/admin-resolve`

**Purpose:** Admin resolves a disputed contact request.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `admin`

**Request Body:**
```json
{
  "finalStatus": "completed",
  "adminNote": "Resolved in favor of user based on evidence provided."
}
```

**Response:** `200 OK`
```json
{
  "_id": "...",
  "status": "completed",
  "confirmationStatus": "completed",
  "adminNote": "Resolved in favor of user based on evidence provided.",
  // ... full request object
}
```

---

## 4. Admin Management

### 4.1 Admin Login
**Endpoint:** `POST /api/admin/login`

**Purpose:** Authenticate admin users with device fingerprinting.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "deviceFingerprint": "string"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "admin",
    "phone": "...",
    "address": { ... }
  },
  "token": "JWT_TOKEN"
}
```

**Rate Limit:** 5 attempts per 15 minutes per IP.

**Logic:** Validates device fingerprint for security, logs all login attempts.

---

### 4.2 Get All Users (Admin)
**Endpoint:** `GET /api/admin/users`

**Purpose:** Get paginated list of all users with search and filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `admin`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search in name, username, email, phone
- `role` - Filter by role (user, farmer, vendor, admin)

**Response:** `200 OK`
```json
{
  "users": [
    {
      "_id": "...",
      "name": "...",
      "username": "...",
      "email": "...",
      "phone": "...",
      "role": "farmer",
      "address": { ... },
      "profileImageUrl": "...",
      "isVerified": true,
      "adminNotes": "...",
      "createdAt": "..."
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

### 4.3 Get All Products (Admin)
**Endpoint:** `GET /api/admin/products`

**Purpose:** Get paginated list of all products with search and filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `admin`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search in name, description
- `farmer` - Filter by farmer ID

**Response:** `200 OK`
```json
{
  "products": [
    {
      "_id": "...",
      "name": "...",
      "description": "...",
      "price": 100,
      "category": "vegetables",
      "farmer": {
        "_id": "...",
        "name": "...",
        "email": "..."
      },
      "location": { ... },
      "availableQuantity": 50,
      "isAvailable": true,
      "createdAt": "..."
    }
  ],
  "total": 300,
  "page": 1,
  "limit": 20
}
```

---

### 4.4 Get All Contact Requests (Admin)
**Endpoint:** `GET /api/admin/contact-requests`

**Purpose:** Get paginated list of all contact requests with filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `admin`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status (pending, accepted, completed, disputed, expired, rejected)
- `search` - Search in requester/farmer names

**Response:** `200 OK`
```json
{
  "requests": [
    {
      "_id": "...",
      "status": "completed",
      "requestedQuantity": 10,
      "finalQuantity": 8,
      "finalPrice": 800,
      "productId": { ... },
      "farmerId": { ... },
      "requesterId": { ... },
      "requestedAt": "...",
      "acceptedAt": "...",
      "userConfirmationAt": "...",
      "farmerConfirmationAt": "..."
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20
}
```

---

### 4.5 Change User Role (Admin)
**Endpoint:** `PATCH /api/admin/users/role`

**Purpose:** Change a user's role.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `admin`

**Request Body:**
```json
{
  "userId": "string",
  "role": "farmer" // user, farmer, vendor, admin
}
```

**Response:** `200 OK`
```json
{
  "_id": "...",
  "name": "...",
  "role": "farmer",
  // ... updated user object
}
```

**Logic:** Admins cannot demote themselves, all actions are logged.

---

### 4.6 Update Admin Notes
**Endpoint:** `PATCH /api/admin/users/admin-notes`

**Purpose:** Update admin notes for a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `admin`

**Request Body:**
```json
{
  "userId": "string",
  "adminNotes": "User reported for suspicious activity on 2024-01-15"
}
```

**Response:** `200 OK`
```json
{
  "message": "Admin notes updated",
  "userId": "..."
}
```

---

### 4.7 Get Admin Logs
**Endpoint:** `GET /api/admin/logs`

**Purpose:** Get paginated admin action logs.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `admin`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "_id": "...",
      "admin": {
        "username": "...",
        "name": "...",
        "email": "..."
      },
      "action": "role_change",
      "target": "user_id",
      "details": {
        "newRole": "farmer"
      },
      "createdAt": "..."
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### 4.8 Get Admin Settings
**Endpoint:** `GET /api/admin/settings`

**Purpose:** Get admin configuration settings.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `admin`

**Response:** `200 OK`
```json
{
  "maintenanceMode": false,
  "allowNewAdmins": true,
  "passwordPolicy": "strong"
}
```

---

## 5. Analytics

### 5.1 Get Summary Statistics
**Endpoint:** `GET /api/analytics/summary`

**Purpose:** Get basic platform statistics for admin dashboard.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `admin`

**Response:** `200 OK`
```json
{
  "userCount": 1250,
  "productCount": 3400
}
```

---

### 5.2 Get Order Status Statistics
**Endpoint:** `GET /api/analytics/orders/status`

**Purpose:** Get order statistics grouped by status.

**Headers:**
```
Authorization: Bearer <token>
```

**Role Required:** `admin`

**Response:** `200 OK`
```json
[
  { "_id": "completed", "count": 150 },
  { "_id": "pending", "count": 45 },
  { "_id": "disputed", "count": 8 }
]
```

---

## 6. Email Services

### 6.1 Send Message
**Endpoint:** `POST /api/send-message`

**Purpose:** Send a message from the About page contact form.

**Request Body:**
```json
{
  "message": "string" // max 2000 characters
}
```

**Response:** `200 OK`
```json
{ "success": true }
```

**Logic:** Sends email to `connect.agriconnect@gmail.com` with the user's message.

---

## 7. Health Check

### 7.1 Health Check
**Endpoint:** `GET /health`

**Purpose:** Check if the server is running and responsive.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "uptime": 3600.5,
  "timestamp": 1705312800000
}
```

---

## 8. Image Upload (Products & Profile)

- **Profile images:** Upload via `PATCH /api/users/profile/image` (multipart/form-data, field: `profileImage`).
- **Product images:** Upload during creation via `POST /api/products` or separately via `POST /api/products/:id/images` (multipart/form-data, field: `images`).
- **All images are stored in Cloudinary. Only URLs are saved in MongoDB.**
- **File validation:** Only JPEG/PNG files allowed, with size limits (2MB for profiles, 5MB for products).

---

## 9. Frontend API Usage

### 9.1 Key API Service Functions (`frontend/src/services/apiService.ts`)

**Authentication:**
- `registerUser(payload)` → `POST /api/users/register`
- `loginUser(credentials)` → `POST /api/users/login`
- `resetPassword(payload)` → `POST /api/users/reset-password`
- `adminLogin(credentials)` → `POST /api/admin/login`

**User Management:**
- `updateProfile(data)` → `PATCH /api/users/profile`
- `uploadProfileImageFile(file)` → `PATCH /api/users/profile/image`
- `deleteProfile()` → `DELETE /api/users/profile`
- `generateUsername(name)` → `POST /api/users/generate-username`
- `checkUsername(username)` → `POST /api/users/check-username`

**Product Management:**
- `fetchProducts(params)` → `GET /api/products`
- `fetchProductById(id)` → `GET /api/products/:id`
- `fetchMyProducts()` → `GET /api/products/farmer/my-products`
- `addProduct(formData)` → `POST /api/products`
- `deleteProduct(id)` → `DELETE /api/products/:id`
- `fetchCategories()` → `GET /api/products/categories`
- `fetchProductNames(category)` → `GET /api/products/names`

**Contact Requests:**
- `createContactRequest(productId, quantity)` → `POST /api/contact-requests/create`
- `fetchMyContactRequests()` → `GET /api/contact-requests/my`
- `acceptContactRequest(id)` → `PUT /api/contact-requests/:id/accept`
- `rejectContactRequest(id)` → `PUT /api/contact-requests/:id/reject`
- `confirmContactRequestAsUser(id, data)` → `POST /api/contact-requests/:id/user-confirm`
- `confirmContactRequestAsFarmer(id, data)` → `POST /api/contact-requests/:id/farmer-confirm`

**Admin Functions:**
- `fetchAdminUsers(params)` → `GET /api/admin/users`
- `fetchAdminProducts(params)` → `GET /api/admin/products`
- `fetchAdminContactRequests(params)` → `GET /api/admin/contact-requests`
- `changeUserRole(userId, role)` → `PATCH /api/admin/users/role`
- `updateAdminNotes(userId, notes)` → `PATCH /api/admin/users/admin-notes`
- `fetchDisputes()` → `GET /api/contact-requests/disputes`
- `resolveDispute(id, data)` → `POST /api/contact-requests/:id/admin-resolve`

---

## 10. Authentication

### JWT Token Management
- **Token Storage**: Frontend stores JWT in localStorage
- **Token Validation**: Backend validates JWT on protected routes
- **Token Expiration**: 7 days default expiration
- **Token Versioning**: Supports token invalidation via version increment

### Role-Based Access Control
- **user**: Can browse products, create contact requests
- **farmer**: Can create/manage products, handle contact requests
- **vendor**: Can browse products, create bulk contact requests
- **admin**: Full system access, user management, dispute resolution

---

## 11. Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "message": "Error description",
    "status": "error|fail",
    "details": { /* field-specific errors */ }
  }
}
```

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate data)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

---

## 12. API Endpoint Summary

### Complete Endpoint List (42 total)

#### Authentication & Users (12 endpoints)
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/users/register` | User registration with OTP | No |
| POST | `/api/users/login` | User login | No |
| POST | `/api/users/reset-password` | Password reset with OTP | No |
| GET | `/api/users/profile` | Get user profile | Yes |
| PATCH | `/api/users/profile` | Update profile | Yes |
| PATCH | `/api/users/profile/image` | Upload profile image | Yes |
| DELETE | `/api/users/profile` | Delete account | Yes |
| GET | `/api/users/dashboard` | Get dashboard data | Yes |
| POST | `/api/users/generate-username` | Generate unique username | No |
| POST | `/api/users/check-username` | Check username availability | No |
| POST | `/api/users/check-phone` | Check phone registration | No |
| GET | `/api/auth/me` | Get current user | Yes |

#### Products (9 endpoints)
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/products` | List products with filters | No |
| GET | `/api/products/categories` | Get product categories | No |
| GET | `/api/products/names` | Get product names by category | No |
| GET | `/api/products/:id` | Get single product | No |
| GET | `/api/products/farmer/my-products` | Get farmer's products | Yes (farmer) |
| POST | `/api/products` | Create product | Yes (farmer) |
| PATCH | `/api/products/:id` | Update product | Yes (farmer) |
| DELETE | `/api/products/:id` | Delete product | Yes (farmer) |
| POST | `/api/products/:id/images` | Upload product images | Yes (farmer) |

#### Contact Requests (9 endpoints)
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/contact-requests/status/:farmerId/:productId` | Check existing request | Yes |
| POST | `/api/contact-requests/create` | Create contact request | Yes |
| PUT | `/api/contact-requests/:id/accept` | Accept request | Yes (farmer) |
| PUT | `/api/contact-requests/:id/reject` | Reject request | Yes (farmer) |
| GET | `/api/contact-requests/my` | Get user's requests | Yes |
| POST | `/api/contact-requests/:id/user-confirm` | User confirmation | Yes |
| POST | `/api/contact-requests/:id/farmer-confirm` | Farmer confirmation | Yes (farmer) |
| GET | `/api/contact-requests/disputes` | Get disputes | Yes (admin) |
| POST | `/api/contact-requests/:id/admin-resolve` | Resolve dispute | Yes (admin) |

#### Admin (8 endpoints)
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/admin/login` | Admin login | No |
| GET | `/api/admin/users` | Get all users | Yes (admin) |
| GET | `/api/admin/products` | Get all products | Yes (admin) |
| GET | `/api/admin/contact-requests` | Get all contact requests | Yes (admin) |
| PATCH | `/api/admin/users/role` | Change user role | Yes (admin) |
| PATCH | `/api/admin/users/admin-notes` | Update admin notes | Yes (admin) |
| GET | `/api/admin/logs` | Get admin logs | Yes (admin) |
| GET | `/api/admin/settings` | Get admin settings | Yes (admin) |

#### Analytics (2 endpoints)
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/analytics/summary` | Get summary statistics | Yes (admin) |
| GET | `/api/analytics/orders/status` | Get order status stats | Yes (admin) |

#### Email & Health (2 endpoints)
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/send-message` | Send contact message | No |
| GET | `/health` | Health check | No |

---

## Best Practices

### API Usage
1. **Always include Authorization header** for protected endpoints
2. **Use proper Content-Type** for file uploads (`multipart/form-data`)
3. **Handle rate limiting** gracefully with retry logic
4. **Validate input data** on both client and server
5. **Use pagination** for large data sets

### Security
1. **Store JWT securely** (localStorage with XSS protection)
2. **Validate file uploads** (type, size, content)
3. **Use HTTPS** in production
4. **Implement proper CORS** configuration
5. **Rate limit sensitive endpoints**

### Performance
1. **Use React Query** for efficient data fetching
2. **Implement proper caching** strategies
3. **Optimize images** before upload
4. **Use pagination** for large lists
5. **Implement lazy loading** for components

---

*This documentation covers all 42 API endpoints of the AgriConnect platform. For implementation details, refer to the source code in the respective controller and route files.*isputes()` → `GET /api/contact-requests/disputes`
- `resolveDispute(id, data)` → `POST /api/contact-requests/:id/admin-resolve`

---

## 10. Authentication

- **JWT Tokens:** Issued on registration/login, stored in `localStorage` on frontend
- **Token Structure:** Contains `userId` and `tokenVersion` for security
- **Headers:** Most protected routes require `Authorization: Bearer <token>`
- **Role-based Access:** Routes protected by role (farmer, admin) using middleware
- **Rate Limiting:** Applied to sensitive endpoints (login, registration, contact requests)
- **Device Fingerprinting:** Used for admin login security

---

## 11. Error Handling

### Error Response Format
```json
{
  "message": "Error description",
  "details": {
    "field1": "Field-specific error message",
    "field2": "Another field error"
  },
  "status": 400
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Frontend Error Handling
- All API errors are normalized using `normalizeApiError()` function
- Toast notifications display user-friendly error messages
- Form validation errors are displayed inline
- Network errors are handled gracefully with retry options

---

## 12. Summary Table

### User Authentication & Profile
| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/api/users/register` | POST | No | - | Register new user with OTP |
| `/api/users/login` | POST | No | - | Login with email/phone |
| `/api/users/resetle`                              | PATCH  | Yes  | profile fields, profileImage           | updated user                            |
| `/api/users/profile`                              | DELETE | Yes  | -                                      | message                                 |
| `/api/users/profile/image`                        | PATCH  | Yes  | profileImage (file)                    | profileImageUrl                         |
| `/api/users/connections`                          | GET    | Yes  | -                                      | connection list                         |
| `/api/users/connection-requests`                  | GET    | Yes  | -                                      | pending requests                        |
| `/api/users/connection-requests/:userId/accept`   | POST   | Yes  | -                                      | message                                 |
| `/api/users/connection-requests/:userId/decline`  | POST   | Yes  | -                                      | message                                 |
| `/api/products`                                   | GET    | No   | -                                      | product list                            |
| `/api/products/farmer/my-products`                | GET    | Yes  | -                                      | my products                             |
| `/api/products`                                   | POST   | Yes  | product fields, images (base64)        | product                                 |
| `/api/products/:id`                               | GET    | No   | -                                      | product                                 |
| `/api/products/:id`                               | DELETE | Yes  | -                                      | message                                 |
| `/api/products/:id/images`                        | POST   | Yes  | images (files)                         | image URLs                              |
| `/api/posts`                                      | GET    | No   | -                                      | post list                               |
| `/api/posts`                                      | POST   | Yes  | title, content                         | post                                    |

---

## 10. Best Practices
- Always use HTTPS in production.
- Validate all request data on both frontend and backend.
- Use JWT for authentication and store tokens securely.
- Handle errors gracefully and provide user-friendly messages.
- **Store images as URLs in MongoDB (Cloudinary).**
- Keep API documentation up to date with code changes.

---

For any questions or further details, refer to the backend and frontend source code or contact the AgriConnect development team.
