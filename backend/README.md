# MY-BOOK Backend API

A production-ready Node.js, Express, TypeScript, and Prisma backend with PostgreSQL (configured for Railway).

---

## 🚀 Quick Start

### 1. Configure Environment Variables
In `backend/.env`, set your Railway PostgreSQL connection string:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@roundhouse.proxy.rlwy.net:PORT/railway"
JWT_SECRET="your_secure_jwt_secret_key"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

> **Where to get your Railway URL**:
> 1. In Railway, open your PostgreSQL service.
> 2. Go to the **Variables** or **Connect** tab.
> 3. Copy `DATABASE_PUBLIC_URL` (for local development) or `DATABASE_URL`.

---

### 2. Push Prisma Schema to Railway PostgreSQL

Sync the database schema with your Railway PostgreSQL instance:

```bash
npm run prisma:push
```

To create and apply tracked migrations:
```bash
npm run prisma:migrate
```

---

### 3. Seed Default Administrator & Staff

```bash
npm run seed
```

This creates default accounts:
- **Admin**: `admin@mybook.com` / `admin123` (Role: `ADMIN`)
- **Accountant**: `accountant@mybook.com` / `accountant123` (Role: `ACCOUNTANT`)

---

### 4. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:5000`.

---

## 🛠 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run backend with hot-reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to JavaScript (`tsc`) |
| `npm start` | Run compiled production build |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:push` | Push schema directly to database |
| `npm run prisma:migrate` | Create and apply migration |
| `npm run prisma:studio` | Open interactive visual DB browser |
| `npm run seed` | Seed database with initial Admin and demo data |

---

## 📡 API Endpoints

### 🩺 Health & Info
- `GET /` - Root status
- `GET /api/health` - Server uptime & health

---

### 🔐 Authentication (`/api/auth`)

#### 1. Register
- **URL**: `POST /api/auth/register`
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "USER" // Optional: "ADMIN", "MANAGER", "ACCOUNTANT", "USER"
}
```

#### 2. Login
- **URL**: `POST /api/auth/login`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "status": "ACTIVE"
    },
    "tokens": {
      "accessToken": "jwt_token...",
      "refreshToken": "jwt_token..."
    }
  }
}
```

#### 3. Current User Profile
- **URL**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <accessToken>`

#### 4. Refresh Token
- **URL**: `POST /api/auth/refresh`
- **Body**:
```json
{
  "refreshToken": "jwt_refresh_token..."
}
```

#### 5. Logout
- **URL**: `POST /api/auth/logout`
- **Body**:
```json
{
  "refreshToken": "jwt_refresh_token..."
}
```

---

### 👥 User Management (`/api/users`)
*Requires `Authorization: Bearer <accessToken>`*

#### 1. List Users
- **URL**: `GET /api/users?page=1&limit=10&search=john&role=USER&status=ACTIVE`
- **Access**: `ADMIN`, `MANAGER`

#### 2. Get User By ID
- **URL**: `GET /api/users/:id`
- **Access**: `ADMIN`, `MANAGER`

#### 3. Create User
- **URL**: `POST /api/users`
- **Access**: `ADMIN`
- **Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword",
  "role": "ACCOUNTANT",
  "status": "ACTIVE",
  "phone": "+987654321"
}
```

#### 4. Update User
- **URL**: `PUT /api/users/:id`
- **Access**: `ADMIN`
- **Body**:
```json
{
  "name": "Jane Smith",
  "role": "MANAGER",
  "phone": "+1122334455"
}
```

#### 5. Change User Status
- **URL**: `PATCH /api/users/:id/status`
- **Access**: `ADMIN`
- **Body**:
```json
{
  "status": "INACTIVE" // or "ACTIVE", "SUSPENDED"
}
```

#### 6. Change Password
- **URL**: `PATCH /api/users/:id/password`
- **Access**: User themselves or `ADMIN`
- **Body**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

#### 7. Delete User
- **URL**: `DELETE /api/users/:id`
- **Access**: `ADMIN` (cannot delete own account)
