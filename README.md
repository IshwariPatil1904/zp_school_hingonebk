# Zilla Parishad Primary School, Hingone BK (School Management System)
### जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु. • ता. धरणगाव, जि. जळगाव

A modern, full-stack school management system and official web portal built with React, Vite, TypeScript, Tailwind CSS, Node.js, Express, and MongoDB.

---

## 🔐 Authentication & Role-Based Access Control (RBAC)
The system enforces strict RBAC with exactly two staff roles: `principal` and `teacher`.

### 1. Role Capabilities & Security Matrix
| Module / Capability | Permission Key | Principal (`principal`) | Teacher (`teacher`) | Enforcement |
| :--- | :--- | :---: | :---: | :--- |
| **View Students** | `students:view` | ✅ Full Access | ✅ Authorized Access | Backend Middleware & Route Guard |
| **Admit Student** | `students:admit` | ✅ Allowed | ❌ **Forbidden (403)** | Backend Middleware (`requirePermission`) |
| **Promote Students** | `students:promote` | ✅ Allowed | ❌ **Forbidden (403)** | Backend Middleware (`requirePermission`) |
| **Teacher Staff Roster** | `teachers:view` | ✅ Allowed | ❌ **Forbidden (403)** | Backend Middleware & Frontend `RoleGuard` |
| **View School Finances** | `finance:view` | ✅ Full Access | ✅ Read-Only Overview | Backend Middleware |
| **Record / Edit Expenses** | `finance:edit` | ✅ Allowed | ❌ **Forbidden (403)** | Backend Middleware (`requirePermission`) |
| **Scholarships Approval** | `scholarships:manage` | ✅ Allowed | ❌ **Forbidden (403)** | Backend Middleware (`requirePermission`) |
| **Request Certificate** | `certificates:request` | ✅ Allowed | ✅ Allowed | Backend Middleware |
| **Download Approved Certs** | `certificates:download` | ✅ Allowed | ✅ Allowed | Backend Middleware |
| **Approve Certificate** | `certificates:approve` | ✅ Allowed | ❌ **Forbidden (403)** | Backend Middleware (`requirePermission`) |
| **Configure Certificates** | `certificates:configure` | ✅ Allowed | ❌ **Forbidden (403)** | Backend Middleware (`requirePermission`) |
| **Website Content Update** | `website:manage` | ✅ Allowed | ❌ **Forbidden (403)** | Backend Middleware (`requirePermission`) |
| **Change Own Password** | `profile:update_basic` | ✅ Allowed | ✅ Allowed | Validates current password & minimum length |

### 2. Security Stack
- **Passswords**: Hashed using bcrypt with salt rounds >= 10. Plain text passwords are never stored.
- **Cookies**: HTTP-only, secure, `SameSite: 'lax'` cookie `token` for session authentication.
- **CSRF Protection**: Double-submit cookie pattern with `csrfToken` cookie and `X-CSRF-Token` header validation on all mutating requests (`POST`, `PUT`, `DELETE`, `PATCH`).
- **Rate Limiting**: Brute-force protection on `/api/auth/login` (max 10 attempts per 15 minutes window per IP) returning `429 Too Many Requests`.
- **Controlled Bootstrap**: No public staff registration or principal creation endpoints are exposed. Initial principal and staff initialization is strictly controlled through `npm run bootstrap` or environment credentials (`BOOTSTRAP_PRINCIPAL_EMAIL`, `BOOTSTRAP_PRINCIPAL_PASSWORD`).

---

## 🎨 Design Theme & Brand Colors
- **Primary Green**: `#176638` (Navigation bar, brand elements, primary accents)
- **Dark Green**: `#14532D` (Staff sidebar, header strip)
- **Hero Green**: `#103D27` (Public website hero banner, footer background)
- **Saffron Orange**: `#FFA500` (ZP logo badge, active indicators, principal badge, CTA buttons)
- **White Background**: `#FFFFFF` (Main page background, dashboard workspace, cards)
- **Light Green**: `#F4F7F4` (Subtle section background, table hover states)
- **Main Text**: `#24352A` (High-contrast typography)
- **Borders**: `#E1E8E1` (Clean structural borders)

---

## 🔑 Demo Staff Login Accounts
*Quick-fill 1-click buttons are built into the [Login Page](http://localhost:5173/login).*

| Role | Username / Email | Password | Role Badge | Designation |
| :--- | :--- | :--- | :--- | :--- |
| **Principal** (मुख्याध्यापक) | `principal` / `principal@zphingone.edu.in` | `Principal@123` | Saffron Orange | Headmaster / मुख्याध्यापक |
| **Primary Teacher** (शिक्षक) | `teacher.pawar` / `teacher.pawar@zphingone.edu.in` | `Teacher@123` | Primary Green | Senior Primary Teacher (Grades 1 & 2) |
| **Maths & Science Teacher** | `teacher.shinde` / `teacher.shinde@zphingone.edu.in` | `Teacher@123` | Primary Green | Science & Mathematics Specialist |

---

## 🚀 Commands & Development

### 1. Run Development Server (Both Client + Server concurrently)
```powershell
npm run dev
```

### 2. Controlled Principal & Staff Bootstrap
```powershell
npm run bootstrap
```

### 3. Run Automated RBAC Test Suite (26/26 Security Assertions)
```powershell
npm --prefix server run test:rbac
```

### 4. Database Seeding
```powershell
npm run seed
```

---

## 🌐 URLs & Endpoints
- **Public Website**: `http://localhost:5173/`
- **Photo Gallery**: `http://localhost:5173/gallery`
- **Staff Login**: `http://localhost:5173/login`
- **Staff Dashboard**: `http://localhost:5173/dashboard`
- **Teacher Staff Roster (Principal Only)**: `http://localhost:5173/dashboard/teachers`
- **School Finances & Grants**: `http://localhost:5173/dashboard/finances`
- **Certificates Management**: `http://localhost:5173/dashboard/certificates`
- **Profile & Change Password**: `http://localhost:5173/dashboard/settings`
- **Backend API Health Check**: `http://localhost:5000/api/auth/health`

---

## 🚀 Production Deployment on Vercel

### Required Vercel environment variables

Configure these for the Production environment in Vercel (and Preview if previews need to use the API):

- `MONGODB_URI`: MongoDB Atlas connection string for the database that contains the school's records.
- `JWT_SECRET`: long, random secret used to sign login tokens.
- `COOKIE_SECRET`: long, random secret used to sign cookies.
- `BLOB_READ_WRITE_TOKEN`: read/write token for the Vercel Blob store used by CMS photo uploads.
- `NODE_ENV`: `production`.

Set `CLIENT_URL` to the deployed site URL if the frontend and API are on different domains. With the same-domain Vercel setup, the API is routed under `/api`.

### Keeping existing data and photos

- Vercel deployments do not include a local MongoDB database. Point `MONGODB_URI` to the existing Atlas database, or migrate the local MongoDB data to Atlas before deployment.
- **Do not run `npm run seed` against production.** The seed script deletes existing collections before inserting development sample data.
- Built-in school photos are deployed from `client/public/imgs`. Photos added through the CMS are uploaded directly to Vercel Blob and their URLs/metadata are stored in MongoDB.
- Files previously uploaded to a local `client/public/imgs/uploads` folder are not automatically migrated. Keep a backup of those files and upload them again through the CMS after configuring Blob storage.

After adding or changing environment variables in Vercel, redeploy so the API functions receive them.
