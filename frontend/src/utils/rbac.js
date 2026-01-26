export const PERMISSIONS = {
    VIEW_DASHBOARD: 'view_dashboard',
    MANAGE_CATALOG: 'manage_catalog',
    MANAGE_INVENTORY: 'manage_inventory',
    VIEW_SALES: 'view_sales',
    MANAGE_CUSTOMERS: 'manage_customers',
    VIEW_PAYMENTS: 'view_payments',
    MANAGE_IAM: 'manage_iam',
};

const ROLE_PERMISSIONS = {
    ADMIN: Object.values(PERMISSIONS), // Admin has everything
    SUPERVISOR: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.MANAGE_CATALOG,
        PERMISSIONS.MANAGE_INVENTORY,
        PERMISSIONS.VIEW_SALES,
        PERMISSIONS.MANAGE_CUSTOMERS,
        PERMISSIONS.VIEW_PAYMENTS
    ],
    EMPLOYEE: [
        // Employee default is POS only, which doesn't need specific permission if it's the default view,
        // but we can grant "view_sales" if we want them to see history.
        // For now, base employee has NO extra module access beyond POS.
    ]
};

export const hasAccess = (user, permission) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    // 1. Check Role Base Permissions
    const rolePerms = ROLE_PERMISSIONS[user.role] || [];
    if (rolePerms.includes(permission)) return true;

    // 2. Check Custom Permissions
    // custom_permissions comes as a comma-separated string from backend
    const customPerms = (user.custom_permissions || '').split(',');
    if (customPerms.includes(permission)) return true;

    return false;
};
