# AgriConnect API Documentation

## Overview
This document provides a comprehensive overview of all API endpoints for the AgriConnect platform, including authentication, user management, product management, posts/community, and image handling. Both backend (Express/MongoDB) and frontend (React/TypeScript) usage are covered, with detailed request/response formats, authentication, and best practices.

---

## Table of Contents
1. [User Authentication & Profile](#user-authentication--profile)
2. [Product Management](#product-management)
3. [Posts/Community](#postscommunity)
4. [Image Upload (Products & Profile)](#image-upload-products--profile)
5. [Frontend API Usage](#frontend-api-usage)
6. [Authentication](#authentication)
7. [Profile Image Handling](#profile-image-handling)
8. [Error Handling](#error-handling)
9. [Summary Table](#summary-table)

---

## 1. User Authentication & Profile

### 1.1 Register User
**Endpoint:** `POST /api/users/register`

**Purpose:** Register a new user (farmer, vendor, or customer).

**Request Body:**
```json
{
  "name": "string",
  "username": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "role": "farmer" | "vendor" | "user",
  "address": {
    "street": "string",
    "district": "string",
    "state": "string",
    "zipcode": "string"
  },
  "profileImageUrl": "https://..." // (optional, set after upload)
}
```

**Response:** `201 Created`
```json
{
  "user": { ...userObject },
  "token": "JWT_TOKEN"
}
```

**Logic:** Stores user with hashed password, assigns a role-based placeholder image if no profileImageUrl, and returns a JWT.

---

### 1.2 Login User
**Endpoint:** `POST /api/users/login`

**Purpose:** Authenticate user and return JWT.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "user": { ...userObject },
  "token": "JWT_TOKEN"
}
```

**Logic:** Validates credentials and returns user and JWT on success.

---

### 1.3 Get Profile
**Endpoint:** `GET /api/users/profile`

**Purpose:** Get current user's profile.

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
  "address": { ... },
  "createdAt": "..."
}
```

**Logic:** Auth required. Returns user info including profileImageUrl.

---

### 1.4 Update Profile
**Endpoint:** `PATCH /api/users/profile`

**Purpose:** Update current user's profile (excluding image upload).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
- Any updatable fields (name, phone, address, etc.)
- For profile image, use the dedicated upload endpoint below.

**Response:** `200 OK`
```json
{ "message": "Profile updated", "user": { ...updatedUser } }
```

---

### 1.5 Upload Profile Image
**Endpoint:** `PATCH /api/users/profile/image`

**Purpose:** Upload or update the user's profile image.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**
- Form field: `profileImage` (file, JPEG/PNG, max 2MB)

**Response:**
```json
{ "profileImageUrl": "https://res.cloudinary.com/..." }
```

**Logic:** Auth required. Uploads image to Cloudinary, updates user's profileImageUrl.

---

### 1.6 Delete Profile
**Endpoint:** `DELETE /api/users/profile`

**Purpose:** Delete current user's account.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{ "message": "Account deleted" }
```

**Logic:** Removes user and related data.

---

### 1.7 List Connections
**Endpoint:** `GET /api/users/connections`

**Purpose:** List user's connections.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[ { "_id": "...", "name": "...", "profileImage": {...}, ... }, ... ]
```

**Logic:** Returns all accepted connections.

---

### 1.8 Get Connection Requests
**Endpoint:** `GET /api/users/connection-requests`

**Purpose:** Get pending connection requests.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[ { "from": { "_id": "...", "name": "...", ... }, "status": "pending", ... }, ... ]
```

**Logic:** Returns pending requests for the user.

---

### 1.9 Accept Connection Request
**Endpoint:** `POST /api/users/connection-requests/:userId/accept`

**Purpose:** Accept a connection request.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{ "message": "Request accepted" }
```

---

### 1.10 Decline Connection Request
**Endpoint:** `POST /api/users/connection-requests/:userId/decline`

**Purpose:** Decline a connection request.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{ "message": "Request declined" }
```

---

## 2. Product Management

### 2.1 List All Products
**Endpoint:** `GET /api/products`

**Purpose:** List all products.

**Response:**
```json
[
  {
    "_id": "...",
    "name": "...",
    "price": ...,
    "unit": "...",
    "category": "...",
    "images": ["https://res.cloudinary.com/..."],
    ...
  },
  ...
]
```

---

### 2.2 List My Products (Farmer)
**Endpoint:** `GET /api/products/farmer/my-products`

**Purpose:** List products uploaded by the current farmer.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[ ...productObjects ]
```

---

### 2.3 Create Product
**Endpoint:** `POST /api/products`

**Purpose:** Create a new product (farmer only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "string",
  "price": number,
  "unit": "string",
  "category": "string",
  "description": "string",
  "availableQuantity": number,
  "images": ["https://res.cloudinary.com/..."]
  // (set after upload)
  ...
}
```

**Response:** `201 Created`
```json
{ "message": "Product created", "product": { ... } }
```

---

### 2.4 Upload Product Images
**Endpoint:** `POST /api/products/:id/images`

**Purpose:** Upload images for a product (farmer only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**
- Form field: `images` (file(s), JPEG/PNG, max 5MB each, up to 5)

**Response:**
```json
{ "images": ["https://res.cloudinary.com/...", ...] }
```

**Logic:** Auth and farmer role required. Uploads images to Cloudinary, appends URLs to product's images array.

---

### 2.5 Delete Product
**Endpoint:** `DELETE /api/products/:id`

**Purpose:** Delete a product by ID (farmer only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{ "message": "Product deleted" }
```

---

### 2.6 Get Product Details
**Endpoint:** `GET /api/products/:id`

**Purpose:** Get product details by ID.

**Response:**
```json
{ ...productObject }
```

---

## 3. Posts/Community

### 3.1 List All Posts
**Endpoint:** `GET /api/posts`

**Purpose:** List all posts.

**Response:**
```json
[ ...postObjects ]
```

---

### 3.2 Create Post
**Endpoint:** `POST /api/posts`

**Purpose:** Create a new post.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{ "title": "string", "content": "string" }
```

**Response:**
```json
{ "message": "Post created", "post": { ... } }
```

---

## 4. Image Upload (Products & Profile)

- **Profile images:** Upload via `PATCH /api/users/profile/image` (multipart/form-data, field: `profileImage`).
- **Product images:** Upload via `POST /api/products/:id/images` (multipart/form-data, field: `images`).
- **All images are stored in Cloudinary. Only URLs are saved in MongoDB.**

---

## 5. Frontend API Usage

### 5.1 API Service Functions (`frontend/src/services/apiService.ts`)
- **fetchUserProfile()** → `GET /api/users/profile`
- **updateProfile(data: object)** → `PATCH /api/users/profile`
- **deleteProfile()** → `DELETE /api/users/profile`
- **fetchProducts()** → `GET /api/products`
- **fetchMyProducts()** → `GET /api/products/farmer/my-products`
- **deleteProduct(id: string)** → `DELETE /api/products/:id`
- **fetchPosts()** → `GET /api/posts`
- **uploadImages(formData)** → `POST /api/upload` (products only)
- **fetchConnections()** → `GET /api/users/connections`

---

## 6. Authentication
- Most routes require `Authorization: Bearer <token>` header.
- JWT is issued on registration/login and stored in `localStorage` on the frontend.

---

## 7. Profile Image Handling
- **Upload:**
  - Use the dedicated endpoint with file upload (not base64).
  - Store the returned URL in the user's profile.
- **Display:**
  - Use the `profileImageUrl` as the `src` for `<img>` tags.

---

## 8. Error Handling
- All endpoints return appropriate HTTP status codes and error messages.
- Frontend displays errors using toast notifications.

---

## 9. Summary Table

| API Endpoint                                      | Method | Auth | Request Body / Params                  | Response / Notes                        |
|---------------------------------------------------|--------|------|----------------------------------------|-----------------------------------------|
| `/api/users/register`                             | POST   | No   | user fields                            | user, token                             |
| `/api/users/login`                                | POST   | No   | username, password                     | user, token                             |
| `/api/users/profile`                              | GET    | Yes  | -                                      | user object                             |
| `/api/users/profile`                              | PATCH  | Yes  | profile fields, profileImage           | updated user                            |
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
