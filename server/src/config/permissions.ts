export type UserRole = 'principal' | 'teacher';

export type Permission =
  // Students
  | 'students:view'
  | 'students:manage'
  | 'students:admit'
  | 'students:promote'
  // Teachers
  | 'teachers:view'
  | 'teachers:manage'
  // Finance & Funds
  | 'finance:view'
  | 'finance:edit'
  | 'finance:manage'
  // Scholarships
  | 'scholarships:view'
  | 'scholarships:manage'
  // Certificates
  | 'certificates:request'
  | 'certificates:download'
  | 'certificates:approve'
  | 'certificates:configure'
  // Reports
  | 'reports:view'
  | 'reports:export'
  // Website
  | 'website:manage'
  // Profile
  | 'profile:view'
  | 'profile:update_basic'
  | 'profile:update_all';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  principal: [
    // Students
    'students:view',
    'students:manage',
    'students:admit',
    'students:promote',
    // Teachers
    'teachers:view',
    'teachers:manage',
    // Finance & Funds
    'finance:view',
    'finance:edit',
    'finance:manage',
    // Scholarships
    'scholarships:view',
    'scholarships:manage',
    // Certificates
    'certificates:request',
    'certificates:download',
    'certificates:approve',
    'certificates:configure',
    // Reports
    'reports:view',
    'reports:export',
    // Website
    'website:manage',
    // Profile
    'profile:view',
    'profile:update_basic',
    'profile:update_all',
  ],
  teacher: [
    // Students (Authorized view only)
    'students:view',
    // Finance (Read-only overview)
    'finance:view',
    // Scholarships (Read-only view)
    'scholarships:view',
    // Certificates (Request & download approved certificates only)
    'certificates:request',
    'certificates:download',
    // Reports (View academic & attendance reports)
    'reports:view',
    'reports:export',
    // Profile (View own profile & update permitted fields e.g. phone, password)
    'profile:view',
    'profile:update_basic',
  ],
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
};
