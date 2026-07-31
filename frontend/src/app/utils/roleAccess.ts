export type AppRole = string;
export type RoleAction = 'edit' | 'delete' | 'update';

export interface RolePermissions {
  moduleAccess: string[];
  dataAccess: string[];
}

export interface RoleDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  users: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
  permissions: RolePermissions;
}

const USER_ROLES_STORAGE_KEY = 'honey_translation_user_roles';
const REGISTERED_USERS_STORAGE_KEY = 'registered_users';
const ROLES_STORAGE_KEY = 'honey_roles';
const ADMIN_EMAILS = new Set(['admin@honeytranslations.com', 'swetha@gmail.com']);
const normalizeEmail = (email?: string | null) => String(email || '').trim().toLowerCase();
const normalizeAction = (action?: string | null): RoleAction | '' => {
  const value = String(action || '').trim().toLowerCase();
  if (value === 'edit' || value === 'delete' || value === 'update') {
    return value;
  }
  return '';
};
const normalizeRoleKey = (role: unknown): string => {
  const value = String(role || '').trim().toLowerCase();
  if (!value) return 'customer';
  return value.replace(/\s+/g, '_');
};

export const normalizeAppRole = (role: unknown): AppRole => {
  return normalizeRoleKey(role);
};

const getStoredRole = (email?: string | null): AppRole | null => {
  if (typeof window === 'undefined' || !email) return null;
  const emailKey = normalizeEmail(email);
  if (!emailKey) return null;

  try {
    const raw = localStorage.getItem(USER_ROLES_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const matchKey = Object.keys(parsed).find((key) => normalizeEmail(key) === emailKey);
    return matchKey ? normalizeAppRole(parsed[matchKey]) : null;
  } catch {
    return null;
  }
};

const getRegisteredRole = (email?: string | null): AppRole | null => {
  if (typeof window === 'undefined' || !email) return null;
  const emailKey = normalizeEmail(email);
  if (!emailKey) return null;

  try {
    const raw = localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
    if (!raw) return null;

    const users = JSON.parse(raw) as Array<{ email?: string; role?: unknown }>;
    const match = users.find((user) => normalizeEmail(user.email) === emailKey);
    return match?.role ? normalizeAppRole(match.role) : null;
  } catch {
    return null;
  }
};

const getRoleDefinitions = (): RoleDefinition[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Array<Partial<RoleDefinition> & { key?: string; permissions?: Partial<RolePermissions> }>;
    if (!Array.isArray(parsed)) return [];

    return parsed.map((role) => {
      const rawKey = String(role.key ?? role.name ?? '').trim().toLowerCase();
      const key = normalizeRoleKey(role.key ?? role.name);
      if (key === 'customer' && rawKey && rawKey !== 'customer') {
        return null;
      }
      return {
        id: role.id || `role-${key}`,
        key,
        name: role.name || key,
        description: role.description || '',
        users: Number(role.users || 0),
        status: role.status === 'Inactive' ? 'Inactive' : 'Active',
        createdAt: role.createdAt || new Date().toISOString(),
        permissions: {
          moduleAccess: Array.isArray(role.permissions?.moduleAccess) ? role.permissions!.moduleAccess.map(String) : [],
          dataAccess: Array.isArray(role.permissions?.dataAccess) ? role.permissions!.dataAccess.map(String) : [],
        },
      };
    }).filter(Boolean) as RoleDefinition[];
  } catch {
    return [];
  }
};

export const getRoleDefinition = (role?: string | null): RoleDefinition | null => {
  const key = normalizeRoleKey(role);
  const definition = getRoleDefinitions().find((item) => item.key === key);
  return definition || null;
};

export const canAccessRoleFeature = (role?: string | null, featureKey?: string | null): boolean => {
  const key = normalizeRoleKey(role);
  const normalizedFeature = normalizeRoleKey(featureKey);

  if (!normalizedFeature) return false;
  if (key === 'admin') return true;

  const definition = getRoleDefinition(key);
  if (!definition) return false;

  const allPermissions = [
    ...definition.permissions.moduleAccess,
    ...definition.permissions.dataAccess,
  ].map(normalizeRoleKey);

  return allPermissions.includes(normalizedFeature) ||
    definition.permissions.dataAccess.some((permission) => {
      const parsed = parseDataAccessToken(permission);
      return parsed?.moduleKey === normalizedFeature || parsed?.moduleKey === '*';
    });
};

const parseDataAccessToken = (value: unknown): { moduleKey: string; action: RoleAction } | null => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;

  if (raw === '*') {
    return { moduleKey: '*', action: 'update' };
  }

  const [modulePart, actionPart] = raw.split(':').map((part) => part.trim());
  const action = normalizeAction(actionPart);
  if (!modulePart || !action) return null;

  return {
    moduleKey: normalizeRoleKey(modulePart),
    action,
  };
};

export const canAccessRoleAction = (
  role?: string | null,
  moduleKey?: string | null,
  action?: RoleAction | string | null,
): boolean => {
  const key = normalizeRoleKey(role);
  const normalizedModule = normalizeRoleKey(moduleKey);
  const normalizedAction = normalizeAction(action);

  if (!normalizedModule || !normalizedAction) return false;
  if (key === 'admin') return true;

  const definition = getRoleDefinition(key);
  if (!definition) return false;

  return definition.permissions.dataAccess.some((permission) => {
    const parsed = parseDataAccessToken(permission);
    if (!parsed) return false;
    if (parsed.moduleKey === '*') return true;
    return parsed.moduleKey === normalizedModule && parsed.action === normalizedAction;
  });
};

export const resolveAppRole = (
  email?: string | null,
  runtimeRole?: unknown,
): AppRole => {
  // An explicit runtime role (sourced from the backend/DB) reflects the
  // current, authoritative role and must win over the hardcoded bootstrap
  // email list and any stale local caches, so admin role changes stick.
  if (runtimeRole !== undefined && runtimeRole !== null && runtimeRole !== '') {
    return normalizeAppRole(runtimeRole);
  }

  const emailKey = normalizeEmail(email);
  if (emailKey && ADMIN_EMAILS.has(emailKey)) {
    return 'admin';
  }
  const storedRole = getStoredRole(emailKey);
  const registeredRole = getRegisteredRole(emailKey);

  if (storedRole) {
    return storedRole;
  }

  if (registeredRole) {
    return registeredRole;
  }

  return normalizeAppRole('customer');
};

export const hasAdminAccess = (
  email?: string | null,
  runtimeRole?: unknown,
): boolean => {
  const role = resolveAppRole(email, runtimeRole);
  return role === 'admin' || !!getRoleDefinition(role);
};

export const isFullAdmin = (
  email?: string | null,
  runtimeRole?: unknown,
): boolean => {
  return resolveAppRole(email, runtimeRole) === 'admin';
};

export const isSalesManager = (
  email?: string | null,
  runtimeRole?: unknown,
): boolean => {
  const role = resolveAppRole(email, runtimeRole);
  return role !== 'admin' && canAccessRoleFeature(role, 'orders');
};
