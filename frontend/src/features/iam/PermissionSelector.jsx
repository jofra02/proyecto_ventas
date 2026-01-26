import React from 'react';
import { PERMISSIONS } from '../../utils/rbac';

const PermissionSelector = ({ selected, onChange }) => {
    const toggle = (perm) => {
        if (selected.includes(perm)) {
            onChange(selected.filter(p => p !== perm));
        } else {
            onChange([...selected, perm]);
        }
    };

    const definitions = [
        { id: PERMISSIONS.MANAGE_INVENTORY, label: "Inventory (Stock Management)" },
        { id: PERMISSIONS.VIEW_SALES, label: "Sales History" },
        { id: PERMISSIONS.MANAGE_CUSTOMERS, label: "Customer Management" },
        { id: PERMISSIONS.VIEW_PAYMENTS, label: "Treasury/Payments" },
        { id: PERMISSIONS.MANAGE_CATALOG, label: "Product Catalog (Edit Items)" },
    ];

    return (
        <div className="permission-selector p-3 border rounded bg-gray-50">
            <h4 className="text-sm font-bold mb-2 text-gray-700">Custom Permissions (Optional)</h4>
            <div className="grid grid-cols-1 gap-2">
                {definitions.map(d => (
                    <label key={d.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                        <input
                            type="checkbox"
                            checked={selected.includes(d.id)}
                            onChange={() => toggle(d.id)}
                            className="accent-primary"
                        />
                        <span className="text-sm">{d.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default PermissionSelector;
