// RBAC utility for checking roles and permissions

export type RBACUser = {
  id: string | number;
  roles?: string[];
  permissions?: string[];
};

// Predefined permissions for the sales dashboard
export const PERMISSIONS = {
  // Client permissions
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_EDIT: 'clients:edit',
  CLIENTS_DELETE: 'clients:delete',
  
  // Product permissions
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_EDIT: 'products:edit',
  PRODUCTS_DELETE: 'products:delete',
  
  // Sales permissions
  SALES_VIEW: 'sales:view',
  SALES_CREATE: 'sales:create',
  SALES_EDIT: 'sales:edit',
  SALES_DELETE: 'sales:delete',
  
  // User management permissions
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  
  // Role management permissions
  ROLES_VIEW: 'roles:view',
  ROLES_CREATE: 'roles:create',
  ROLES_EDIT: 'roles:edit',
  ROLES_DELETE: 'roles:delete',
  ROLES_ASSIGN: 'roles:assign',
  
  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_ADMIN: 'dashboard:admin',
  
  // Reports permissions
  REPORTS_VIEW: 'reports:view',
  REPORTS_CREATE: 'reports:create',
  REPORTS_EDIT: 'reports:edit',
  REPORTS_DELETE: 'reports:delete',

  // Sales Rep management permissions
  SALES_REPS_VIEW: 'sales_reps:view',
  SALES_REPS_CREATE: 'sales_reps:create',
  SALES_REPS_EDIT: 'sales_reps:edit',
  SALES_REPS_DELETE: 'sales_reps:delete',
} as const;

// Predefined roles with their permissions
export const PREDEFINED_ROLES = {
  ADMIN: {
    name: 'admin',
    description: 'Full system administrator with all permissions',
    permissions: Object.values(PERMISSIONS)
  },
  SALES_MANAGER: {
    name: 'sales_manager',
    description: 'Sales manager with client and sales management permissions',
    permissions: [
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.CLIENTS_CREATE,
      PERMISSIONS.CLIENTS_EDIT,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.SALES_EDIT,
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_CREATE,
      // Sales Rep management permissions
      PERMISSIONS.SALES_REPS_VIEW,
      PERMISSIONS.SALES_REPS_CREATE,
      PERMISSIONS.SALES_REPS_EDIT,
      PERMISSIONS.SALES_REPS_DELETE
    ]
  },
  SALES_REP: {
    name: 'sales_rep',
    description: 'Sales representative with limited client and sales permissions',
    permissions: [
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.CLIENTS_CREATE,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.DASHBOARD_VIEW,
      // Sales Rep permissions (view own profile, maybe edit own profile)
      PERMISSIONS.SALES_REPS_VIEW
    ]
  },
  VIEWER: {
    name: 'viewer',
    description: 'Read-only access to dashboard and reports',
    permissions: [
      PERMISSIONS.CLIENTS_VIEW,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.REPORTS_VIEW
    ]
  }
} as const;

/**
 * Checks if the user has at least one of the required roles.
 * @param user The user object (must have roles array)
 * @param requiredRoles Array of role names (e.g., ["admin", "sales_manager"])
 */
export function hasRole(user: RBACUser | undefined | null, requiredRoles: string[]): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some(role => requiredRoles.includes(role));
}

/**
 * Checks if the user has a specific permission.
 * @param user The user object (must have permissions array)
 * @param permission The permission string (e.g., "can_edit_product")
 */
export function hasPermission(user: RBACUser | undefined | null, permission: string): boolean {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission) || user.permissions.includes("*");
}

/**
 * Checks if the user has any of the specified permissions.
 * @param user The user object (must have permissions array)
 * @param permissions Array of permission strings
 */
export function hasAnyPermission(user: RBACUser | undefined | null, permissions: string[]): boolean {
  if (!user || !user.permissions) return false;
  return permissions.some(permission => 
    user.permissions!.includes(permission) || user.permissions!.includes("*")
  );
}

/**
 * Checks if the user has all of the specified permissions.
 * @param user The user object (must have permissions array)
 * @param permissions Array of permission strings
 */
export function hasAllPermissions(user: RBACUser | undefined | null, permissions: string[]): boolean {
  if (!user || !user.permissions) return false;
  return permissions.every(permission => 
    user.permissions!.includes(permission) || user.permissions!.includes("*")
  );
}

/**
 * Gets all available permissions for display in UI
 */
export function getAllPermissions(): Array<{value: string, label: string, category: string}> {
  return [
    // Client permissions
    { value: PERMISSIONS.CLIENTS_VIEW, label: 'View Clients', category: 'Clients' },
    { value: PERMISSIONS.CLIENTS_CREATE, label: 'Create Clients', category: 'Clients' },
    { value: PERMISSIONS.CLIENTS_EDIT, label: 'Edit Clients', category: 'Clients' },
    { value: PERMISSIONS.CLIENTS_DELETE, label: 'Delete Clients', category: 'Clients' },
    
    // Product permissions
    { value: PERMISSIONS.PRODUCTS_VIEW, label: 'View Products', category: 'Products' },
    { value: PERMISSIONS.PRODUCTS_CREATE, label: 'Create Products', category: 'Products' },
    { value: PERMISSIONS.PRODUCTS_EDIT, label: 'Edit Products', category: 'Products' },
    { value: PERMISSIONS.PRODUCTS_DELETE, label: 'Delete Products', category: 'Products' },
    
    // Sales permissions
    { value: PERMISSIONS.SALES_VIEW, label: 'View Sales', category: 'Sales' },
    { value: PERMISSIONS.SALES_CREATE, label: 'Create Sales', category: 'Sales' },
    { value: PERMISSIONS.SALES_EDIT, label: 'Edit Sales', category: 'Sales' },
    { value: PERMISSIONS.SALES_DELETE, label: 'Delete Sales', category: 'Sales' },

    // Sales Rep management permissions
    { value: PERMISSIONS.SALES_REPS_VIEW, label: 'View Sales Reps', category: 'Sales Reps' },
    { value: PERMISSIONS.SALES_REPS_CREATE, label: 'Create Sales Reps', category: 'Sales Reps' },
    { value: PERMISSIONS.SALES_REPS_EDIT, label: 'Edit Sales Reps', category: 'Sales Reps' },
    { value: PERMISSIONS.SALES_REPS_DELETE, label: 'Delete Sales Reps', category: 'Sales Reps' },
    
    // User management permissions
    { value: PERMISSIONS.USERS_VIEW, label: 'View Users', category: 'Users' },
    { value: PERMISSIONS.USERS_CREATE, label: 'Create Users', category: 'Users' },
    { value: PERMISSIONS.USERS_EDIT, label: 'Edit Users', category: 'Users' },
    { value: PERMISSIONS.USERS_DELETE, label: 'Delete Users', category: 'Users' },
    
    // Role management permissions
    { value: PERMISSIONS.ROLES_VIEW, label: 'View Roles', category: 'Roles' },
    { value: PERMISSIONS.ROLES_CREATE, label: 'Create Roles', category: 'Roles' },
    { value: PERMISSIONS.ROLES_EDIT, label: 'Edit Roles', category: 'Roles' },
    { value: PERMISSIONS.ROLES_DELETE, label: 'Delete Roles', category: 'Roles' },
    { value: PERMISSIONS.ROLES_ASSIGN, label: 'Assign Roles', category: 'Roles' },
    
    // Dashboard permissions
    { value: PERMISSIONS.DASHBOARD_VIEW, label: 'View Dashboard', category: 'Dashboard' },
    { value: PERMISSIONS.DASHBOARD_ADMIN, label: 'Admin Dashboard', category: 'Dashboard' },
    
    // Reports permissions
    { value: PERMISSIONS.REPORTS_VIEW, label: 'View Reports', category: 'Reports' },
    { value: PERMISSIONS.REPORTS_CREATE, label: 'Create Reports', category: 'Reports' },
    { value: PERMISSIONS.REPORTS_EDIT, label: 'Edit Reports', category: 'Reports' },
    { value: PERMISSIONS.REPORTS_DELETE, label: 'Delete Reports', category: 'Reports' },
  ];
}

/**
 * Gets permissions grouped by category for display in UI
 */
export function getPermissionsByCategory(): Record<string, Array<{value: string, label: string}>> {
  const permissions = getAllPermissions();
  const grouped: Record<string, Array<{value: string, label: string}>> = {};
  
  permissions.forEach(permission => {
    if (!grouped[permission.category]) {
      grouped[permission.category] = [];
    }
    grouped[permission.category].push({
      value: permission.value,
      label: permission.label
    });
  });
  
  return grouped;
} 