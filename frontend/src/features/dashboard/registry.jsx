import React from 'react';
import StatCard from './components/StatCard';
import SalesTrendWidget from './widgets/SalesTrendWidget';
import TopProductsWidget from './widgets/TopProductsWidget';
import RecentTransactionsWidget from './widgets/RecentTransactionsWidget';
import LowStockWidget from './widgets/LowStockWidget';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

// Wrapper for StatCards to adapt them to the grid system context
const StatWrapper = ({ title, value, icon, color, trend, stats, loading, dataKey, format }) => {
    let displayValue = value;
    if (stats && dataKey && stats[dataKey] !== undefined) {
        displayValue = format ? format(stats[dataKey]) : stats[dataKey];
    }

    return (
        <div className="h-full">
            <StatCard
                title={title}
                value={displayValue}
                icon={icon}
                color={color}
                trend={trend}
                isLoading={loading}
            />
        </div>
    );
};

export const WIDGETS = {
    'revenue': {
        id: 'revenue',
        component: (props) => <StatWrapper {...props} title="Total Revenue" icon={DollarSign} color="#10b981" trend={0} dataKey="total_revenue" format={formatCurrency} />,
        label: 'Total Revenue',
        defaultW: 1,
        defaultH: 4,
        minW: 1,
        minH: 2
    },
    'orders': {
        id: 'orders',
        component: (props) => <StatWrapper {...props} title="Total Orders" icon={ShoppingBag} color="#3b82f6" trend={0} dataKey="total_orders" />,
        label: 'Total Orders',
        defaultW: 1,
        defaultH: 4,
        minW: 1,
        minH: 2
    },
    'customers': {
        id: 'customers',
        component: (props) => <StatWrapper {...props} title="New Customers" icon={Users} color="#8b5cf6" trend={0} value="--" />, // API doesn't have customers yet
        label: 'New Customers',
        defaultW: 1,
        defaultH: 4,
        minW: 1,
        minH: 2
    },
    'avg_order': {
        id: 'avg_order',
        component: (props) => <StatWrapper {...props} title="Avg. Order Value" icon={TrendingUp} color="#f59e0b" trend={0} dataKey="avg_order_value" format={formatCurrency} />,
        label: 'Avg. Order Value',
        defaultW: 1,
        defaultH: 4,
        minW: 1,
        minH: 2
    },
    'sales_trend': {
        id: 'sales_trend',
        component: SalesTrendWidget,
        label: 'Sales Trend Graph',
        defaultW: 3,
        defaultH: 10,
        minW: 2,
        minH: 6
    },
    'top_products': {
        id: 'top_products',
        component: TopProductsWidget,
        label: 'Top Products',
        defaultW: 1, // In standard 4-col layout
        defaultH: 10,
        minW: 1,
        minH: 6
    },
    'recent_transactions': {
        id: 'recent_transactions',
        component: RecentTransactionsWidget,
        label: 'Recent Transactions',
        defaultW: 2,
        defaultH: 8,
        minW: 2,
        minH: 5
    },
    'low_stock': {
        id: 'low_stock',
        component: LowStockWidget,
        label: 'Low Stock Alerts',
        defaultW: 1,
        defaultH: 8,
        minW: 1,
        minH: 4
    }
};

export const INITIAL_LAYOUT = [
    { i: 'revenue', x: 0, y: 0, w: 1, h: 4 },
    { i: 'orders', x: 1, y: 0, w: 1, h: 4 },
    { i: 'customers', x: 2, y: 0, w: 1, h: 4 },
    { i: 'avg_order', x: 3, y: 0, w: 1, h: 4 },
    { i: 'sales_trend', x: 0, y: 4, w: 3, h: 10 },
    { i: 'low_stock', x: 3, y: 4, w: 1, h: 10 },
    { i: 'recent_transactions', x: 0, y: 14, w: 2, h: 8 },
    { i: 'top_products', x: 2, y: 14, w: 2, h: 8 },
];
