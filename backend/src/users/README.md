# Users Module

This module handles user profile management and address management functionality.

## Features

### User Profile Management
- Get user profile information
- Update user profile (first name, last name)
- Change password with old password verification

### Address Management
- List all user addresses (sorted by default first, then by creation date)
- Get a specific address
- Create new address
- Update existing address
- Delete address
- Automatic default address management:
  - First address is automatically set as default
  - When setting a new default, previous default is unset
  - When deleting default address, another address becomes default

## API Endpoints

### Profile Endpoints

#### GET /users/profile
Get the current user's profile information.

**Authentication:** Required (JWT)

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER",
  "isEmailVerified": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /users/profile
Update the current user's profile.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** Same as GET /users/profile

#### PUT /users/password
Change the current user's password.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "oldPassword": "currentPassword123",
  "newPassword": "newPassword123"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

### Address Endpoints

#### GET /users/addresses
Get all addresses for the current user.

**Authentication:** Required (JWT)

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US",
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /users/addresses/:id
Get a specific address by ID.

**Authentication:** Required (JWT)

**Response:** Single address object

#### POST /users/addresses
Create a new address.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phone": "+1234567890",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "US",
  "isDefault": false
}
```

**Response:** Created address object

#### PUT /users/addresses/:id
Update an existing address.

**Authentication:** Required (JWT)

**Request Body:** Same as POST (all fields optional)

**Response:** Updated address object

#### DELETE /users/addresses/:id
Delete an address.

**Authentication:** Required (JWT)

**Response:**
```json
{
  "message": "Address deleted successfully"
}
```

## Validation Rules

### Profile Update
- `firstName`: Required, 1-100 characters
- `lastName`: Required, 1-100 characters

### Password Update
- `oldPassword`: Required
- `newPassword`: Required, minimum 8 characters

### Address
- `fullName`: Required, 1-200 characters
- `phone`: Required, must match phone number pattern
- `addressLine1`: Required, 1-500 characters
- `addressLine2`: Optional, max 500 characters
- `city`: Required, 1-100 characters
- `state`: Required, 1-100 characters
- `postalCode`: Required, 1-20 characters
- `country`: Required, exactly 2 characters (ISO country code)
- `isDefault`: Optional boolean

## Error Handling

- `404 Not Found`: User or address not found
- `401 Unauthorized`: Invalid old password when changing password
- `400 Bad Request`: Validation errors
