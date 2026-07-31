import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { ArrowLeft, CheckSquare, Edit, Plus, Search, Shield, Trash2 } from 'lucide-react';
import type { RoleAction, RolePermissions } from '@/app/utils/roleAccess';

const ROLES_STORAGE_KEY = 'honey_roles';
const REGISTERED_USERS_STORAGE_KEY = 'registered_users';

type RoleStatus = 'Active' | 'Inactive';
type PermissionSectionKey = 'moduleAccess' | 'dataAccess';

interface PermissionItem {
  id: string;
  label: string;
  checked: boolean;
}

interface PermissionSection {
  title: string;
  description: string;
  items: PermissionItem[];
  newItemValue: string;
  selectedModuleValue: string;
  selectedActionValue: RoleAction;
}

interface RoleItem {
  id: string;
  key: string;
  name: string;
  description: string;
  users: number;
  status: RoleStatus;
  createdAt: string;
  permissions: RolePermissions;
}

interface RoleFormState {
  name: string;
  description: string;
  status: RoleStatus;
  selectedTab: PermissionSectionKey;
  sections: Record<PermissionSectionKey, PermissionSection>;
}

const normalizeRoleKey = (value: unknown) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'customer';
  if (normalized === 'sales manager' || normalized === 'manager') return 'customer';
  return normalized.replace(/\s+/g, '_');
};

const createSection = (title: string, description: string): PermissionSection => ({
  title,
  description,
  items: [],
  newItemValue: '',
  selectedModuleValue: '',
  selectedActionValue: 'edit',
});

const createEmptyForm = (): RoleFormState => ({
  name: '',
  description: '',
  status: 'Active',
  selectedTab: 'moduleAccess',
  sections: {
    moduleAccess: createSection(
      'Module Access',
      'Choose which modules this role can open from the admin panel.'
    ),
    dataAccess: createSection(
      'Data Access',
      ''
    ),
  },
});

const createEmptyRoleForm = (): RoleFormState => {
  const form = createEmptyForm();
  form.sections.moduleAccess.items = createModuleAccessItems();
  return form;
};

const sectionTabs: { key: PermissionSectionKey; label: string }[] = [
  { key: 'moduleAccess', label: 'Module Access' },
  { key: 'dataAccess', label: 'Data Access' },
];

const moduleAccessOptions = [
  'Home',
  'Items',
  'All Items',
  'Add New Item',
  'Categories',
  'Coupons',
  'Item Reviews',
  'User Management',
  'Accounts',
  'Role',
  'Orders',
  'Reports',
  'Customer Emails',
  'Customer Queries',
];

const dataActionOptions: { value: RoleAction; label: string }[] = [
  { value: 'edit', label: 'Edit' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
];

const getModuleLabelFromKey = (moduleKey: string) => {
  const matched = moduleAccessOptions.find((label) => normalizeRoleKey(label) === moduleKey);
  if (matched) return matched;

  return moduleKey
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatDataAccessLabel = (token: string) => {
  const [modulePart, actionPart] = String(token || '').split(':');
  const moduleLabel = getModuleLabelFromKey(normalizeRoleKey(modulePart));
  const actionLabel = dataActionOptions.find((option) => option.value === actionPart)?.label || actionPart;
  return `${moduleLabel} - ${actionLabel}`;
};

const buildDataAccessToken = (moduleLabel: string, action: RoleAction) => {
  return `${normalizeRoleKey(moduleLabel)}:${action}`;
};

const createDataAccessItemsForModules = (
  moduleLabels: string[],
  checkedTokens: Set<string> = new Set(),
): PermissionItem[] => {
  return moduleLabels.flatMap((moduleLabel) =>
    dataActionOptions.map((option) => {
      const token = buildDataAccessToken(moduleLabel, option.value);
      return {
        id: token,
        label: `${moduleLabel} - ${option.label}`,
        checked: checkedTokens.has(token),
      };
    })
  );
};

const createModuleAccessItems = (): PermissionItem[] =>
  moduleAccessOptions.map((label) => ({
    id: `module-${normalizeRoleKey(label)}`,
    label,
    checked: false,
  }));

const createRoleFormFromRole = (role: RoleItem): RoleFormState => {
  const form = createEmptyForm();
  const moduleAccessSet = new Set(role.permissions.moduleAccess);
  const dataAccessSet = new Set(role.permissions.dataAccess);

  form.name = role.name;
  form.description = role.description;
  form.status = role.status;
  form.sections.moduleAccess.items = moduleAccessOptions.map((label) => ({
    id: `module-${normalizeRoleKey(label)}`,
    label,
    checked: moduleAccessSet.has(label),
  }));
  const selectedModules = form.sections.moduleAccess.items
    .filter((item) => item.checked)
    .map((item) => item.label);
  form.sections.dataAccess.items = createDataAccessItemsForModules(
    selectedModules,
    new Set(role.permissions.dataAccess.map(String))
  );

  return form;
};

function RoleManagementPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<'list' | 'create'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<RoleFormState>(createEmptyRoleForm());
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = () => {
    try {
      setLoading(true);

      const storedRolesRaw = localStorage.getItem(ROLES_STORAGE_KEY);
      const storedRoles = storedRolesRaw ? JSON.parse(storedRolesRaw) : [];
      const roleList: RoleItem[] = Array.isArray(storedRoles)
        ? storedRoles
            .filter((role: any) => {
              const raw = String(role.key || role.name || '').trim().toLowerCase();
              return raw !== 'sales_manager' && raw !== 'sales manager' && raw !== 'manager';
            })
            .map((role: any) => ({
            id: role.id || `role-${normalizeRoleKey(role.key || role.name)}`,
            key: normalizeRoleKey(role.key || role.name),
            name: role.name || '',
            description: role.description || '',
            users: Number(role.users || 0),
            status: role.status === 'Inactive' ? 'Inactive' : 'Active',
            createdAt: role.createdAt || new Date().toISOString(),
            permissions: {
              moduleAccess: Array.isArray(role.permissions?.moduleAccess)
                ? role.permissions.moduleAccess.map(String)
                : [],
              dataAccess: Array.isArray(role.permissions?.dataAccess)
                ? role.permissions.dataAccess.map(String)
                : [],
            },
          }))
        : [];

      const registeredUsersRaw = localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
      const registeredUsers = registeredUsersRaw ? JSON.parse(registeredUsersRaw) : [];
      const userCounts = new Map<string, number>();

      if (Array.isArray(registeredUsers)) {
        registeredUsers.forEach((user: any) => {
          const roleKey = normalizeRoleKey(user.role || 'customer');
          userCounts.set(roleKey, (userCounts.get(roleKey) || 0) + 1);
        });
      }

      const mergedRoles = roleList.map((role) => ({
        ...role,
        users: userCounts.get(role.key) ?? role.users,
      }));

      setRoles(mergedRoles);
    } catch (error) {
      console.error('Failed to load roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch =
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [roles, searchQuery]);

  const dataAccessModuleGroups = useMemo(() => {
    const midpoint = Math.ceil(moduleAccessOptions.length / 2);
    return [
      moduleAccessOptions.slice(0, midpoint),
      moduleAccessOptions.slice(midpoint),
    ];
  }, []);

  const handleCreateRole = () => {
    setForm(createEmptyRoleForm());
    setEditingRoleId(null);
    setScreen('create');
  };

  const handleEditRole = (role: RoleItem) => {
    setForm(createRoleFormFromRole(role));
    setEditingRoleId(role.id);
    setScreen('create');
  };

  const handleDeleteRole = (roleId: string) => {
    const roleToDelete = roles.find((role) => role.id === roleId);
    if (!roleToDelete) return;

    const confirmed = window.confirm(`Delete ${roleToDelete.name}? This cannot be undone.`);
    if (!confirmed) return;

    const updatedRoles = roles.filter((role) => role.id !== roleId);
    setRoles(updatedRoles);
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updatedRoles));

    if (editingRoleId === roleId) {
      setEditingRoleId(null);
      setForm(createEmptyRoleForm());
      setScreen('list');
    }
  };

  const handleAddPermission = (sectionKey: PermissionSectionKey) => {
    setForm((prev) => {
      const section = prev.sections[sectionKey];
      if (sectionKey === 'dataAccess') {
        const moduleLabel = section.selectedModuleValue.trim();
        const action = section.selectedActionValue;
        if (!moduleLabel || !action) return prev;

        const token = buildDataAccessToken(moduleLabel, action);
        if (section.items.some((item) => item.id === token)) return prev;

        const actionLabel = dataActionOptions.find((option) => option.value === action)?.label || action;
        const updatedSection: PermissionSection = {
          ...section,
          items: [
            ...section.items,
            {
              id: token,
              label: `${moduleLabel} - ${actionLabel}`,
              checked: false,
            },
          ],
          newItemValue: '',
        };

        return {
          ...prev,
          sections: {
            ...prev.sections,
            dataAccess: updatedSection,
          },
        };
      }

      const label = section.newItemValue.trim();
      if (!label) return prev;

      const updatedSection: PermissionSection = {
        ...section,
        items: [
          ...section.items,
          {
            id: `${sectionKey}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            label,
            checked: false,
          },
        ],
        newItemValue: '',
      };

      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionKey]: updatedSection,
        },
      };
    });
  };

  const handleTogglePermission = (sectionKey: PermissionSectionKey, itemId: string) => {
    setForm((prev) => {
      const section = prev.sections[sectionKey];
      const updatedSection: PermissionSection = {
        ...section,
        items: section.items.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      };

      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionKey]: updatedSection,
          ...(sectionKey === 'moduleAccess'
            ? {
                dataAccess: {
                  ...prev.sections.dataAccess,
                  items: createDataAccessItemsForModules(
                    updatedSection.items.filter((item) => item.checked).map((item) => item.label),
                    new Set(prev.sections.dataAccess.items.filter((item) => item.checked).map((item) => item.id))
                  ),
                },
              }
            : {}),
        },
      };
    });
  };

  const handleToggleDataAccessAction = (moduleLabel: string, action: RoleAction) => {
    const moduleIsSelected = form.sections.moduleAccess.items.some(
      (item) => item.checked && item.label === moduleLabel
    );

    const token = buildDataAccessToken(moduleLabel, action);

    setForm((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        moduleAccess: {
          ...prev.sections.moduleAccess,
          items: prev.sections.moduleAccess.items.map((item) =>
            item.label === moduleLabel && !moduleIsSelected ? { ...item, checked: true } : item
          ),
        },
        dataAccess: {
          ...prev.sections.dataAccess,
          items: prev.sections.dataAccess.items.map((item) =>
            item.id === token ? { ...item, checked: !item.checked } : item
          ),
        },
      },
    }));
  };

  const handleRemovePermission = (sectionKey: PermissionSectionKey, itemId: string) => {
    setForm((prev) => {
      const section = prev.sections[sectionKey];
      const updatedSection: PermissionSection = {
        ...section,
        items: section.items.filter((item) => item.id !== itemId),
      };

      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionKey]: updatedSection,
        },
      };
    });
  };

  const handleSaveRole = () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      return;
    }

    const existingRole = editingRoleId ? roles.find((role) => role.id === editingRoleId) : null;

    const nextRole: RoleItem = {
      id: existingRole?.id || `role-${normalizeRoleKey(trimmedName)}-${Date.now()}`,
      key: existingRole?.key || normalizeRoleKey(trimmedName),
      name: trimmedName,
      description: form.description.trim(),
      users: existingRole?.users ?? 0,
      status: form.status,
      createdAt: existingRole?.createdAt || new Date().toISOString(),
      permissions: {
        moduleAccess: form.sections.moduleAccess.items.filter((item) => item.checked).map((item) => item.label),
        dataAccess: form.sections.dataAccess.items.filter((item) => item.checked).map((item) => item.id),
      },
    };

    const updatedRoles = editingRoleId
      ? roles.map((role) => (role.id === editingRoleId ? nextRole : role))
      : [...roles, nextRole];

    setRoles(updatedRoles);
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updatedRoles));
    setScreen('list');
    setForm(createEmptyRoleForm());
    setEditingRoleId(null);
  };

  const handleCancel = () => {
    setScreen('list');
    setForm(createEmptyRoleForm());
    setEditingRoleId(null);
  };

  const activeSection = form.sections[form.selectedTab];
  const selectedModuleAccessLabels = new Set(
    form.sections.moduleAccess.items.filter((item) => item.checked).map((item) => item.label)
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading roles...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {screen === 'list' ? (
        <div className="bg-white min-h-screen">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Roles & Permissions</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage roles and set module and data access permissions.
                </p>
              </div>
              <button
                onClick={handleCreateRole}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Role
              </button>
            </div>

            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roles..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Role Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{role.name}</span>
                          <p className="text-xs text-gray-500">Key: {role.key}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{role.description || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{role.users}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          role.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {role.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditRole(role)}
                          className="rounded-md p-2 text-gray-500 hover:bg-violet-50 hover:text-violet-700"
                          aria-label={`Edit ${role.name}`}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(role.id)}
                          className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Delete ${role.name}`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRoles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Shield className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-900 font-medium">
                  {searchQuery ? 'No roles found' : 'No roles created yet'}
                </p>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'Click Create New Role to add your first role.'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white min-h-screen">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={handleCancel}
                className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Roles
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {editingRoleId ? 'Edit Role' : 'Create New Role'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {editingRoleId
                  ? 'Update the role details and permission controls.'
                  : 'Add a new role with role details and permission controls.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] min-h-[calc(100vh-140px)]">
            <aside className="border-r border-gray-200 bg-gray-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                Existing Roles
              </p>
              <div className="space-y-2">
                {roles.length === 0 ? (
                  <p className="text-sm text-gray-500">No existing roles</p>
                ) : (
                  roles.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"
                    >
                      {role.name}
                    </div>
                  ))
                )}
              </div>
            </aside>

            <section className="p-6">
              <div className="max-w-5xl">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-gray-700">Role Name *</span>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter role name"
                        className="rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            status: e.target.value === 'Inactive' ? 'Inactive' : 'Active',
                          }))
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </label>

                    <label className="grid gap-2 lg:col-span-2">
                      <span className="text-sm font-medium text-gray-700">Description</span>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter role description"
                        rows={4}
                        className="rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </label>
                  </div>

                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4">
                      {sectionTabs.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              selectedTab: tab.key,
                            }))
                          }
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            form.selectedTab === tab.key
                              ? 'bg-violet-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
                      <div className="flex flex-col gap-2">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{activeSection.title}</h2>
                          <p className="text-sm text-gray-600">{activeSection.description}</p>
                        </div>
                        {form.selectedTab === 'dataAccess' ? (
                          <div className="mt-4 grid w-full gap-4 md:grid-cols-2">
                            {dataAccessModuleGroups.map((group, groupIndex) => (
                              <div key={`data-access-group-${groupIndex}`} className="grid gap-3">
                                {group.map((moduleLabel) => {
                                  const isModuleSelected = selectedModuleAccessLabels.has(moduleLabel);
                                  const moduleActionItems = dataActionOptions.map((option) => {
                                    const token = buildDataAccessToken(moduleLabel, option.value);
                                    const matchedItem = form.sections.dataAccess.items.find(
                                      (item) => item.id === token
                                    );
                                    return {
                                      ...option,
                                      checked: !!matchedItem?.checked,
                                    };
                                  });

                                  return (
                                    <div
                                      key={moduleLabel}
                                      className={`grid gap-4 rounded-lg border px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start ${
                                        isModuleSelected
                                          ? 'border-gray-200 bg-white'
                                          : 'border-gray-200 bg-gray-50 opacity-70'
                                      }`}
                                    >
                                      <div className="md:pt-1">
                                        <p className="text-sm font-semibold text-gray-900">{moduleLabel}</p>
                                      </div>
                                      <div className="grid gap-2 md:min-w-[180px]">
                                        {moduleActionItems.map((action) => (
                                          <label
                                            key={`${moduleLabel}-${action.value}`}
                                            className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                                              action.checked
                                                ? 'bg-violet-50 text-violet-700'
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={action.checked}
                                              onChange={() =>
                                                handleToggleDataAccessAction(moduleLabel, action.value)
                                              }
                                              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                            />
                                            <span>{action.label}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-6 grid gap-3">
                        {form.selectedTab === 'dataAccess' ? null : activeSection.items.length === 0 ? (
                          <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
                            <CheckSquare className="w-4 h-4 text-gray-400" />
                            No items available in this section.
                          </div>
                        ) : (
                          activeSection.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
                            >
                              <label className="flex items-center gap-3 text-sm font-medium text-gray-800">
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={() => handleTogglePermission(form.selectedTab, item.id)}
                                  className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                />
                                {item.label}
                              </label>
                              {form.selectedTab !== 'moduleAccess' && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePermission(form.selectedTab, item.id)}
                                  className="text-xs font-medium text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                  <div className="mt-8 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRole}
                      disabled={!form.name.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      {editingRoleId ? 'Save Changes' : 'Save Role'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default RoleManagementPage;
