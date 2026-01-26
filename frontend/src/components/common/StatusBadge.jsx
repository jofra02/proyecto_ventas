import React from 'react';

const StatusBadge = ({ status, type = 'default', children }) => {
    // Map status strings to types if needed, or use type prop directly
    // Types: success, warning, error, info, neutral

    let colorClass = 'bg-gray-100 text-gray-700';

    switch (type) {
        case 'success': colorClass = 'bg-green-100 text-green-700'; break;
        case 'warning': colorClass = 'bg-yellow-100 text-yellow-800'; break;
        case 'error': colorClass = 'bg-red-100 text-red-700'; break;
        case 'info': colorClass = 'bg-blue-100 text-blue-700'; break;
        default: colorClass = 'bg-gray-100 text-gray-700';
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {status || children}
        </span>
    );
};

export default StatusBadge;
