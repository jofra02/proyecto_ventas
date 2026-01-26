import api from '../../../services/api';

export const dashboardService = {
    // Sales Analytics
    getSalesSummary: async (rangeParam = 7) => {
        const params = typeof rangeParam === 'object' ?
            { start_date: rangeParam.start.toISOString(), end_date: rangeParam.end.toISOString() } :
            { days: rangeParam };
        const response = await api.get('/sales/analytics/summary', { params });
        return response.data;
    },

    getTopProducts: async (rangeParam = 7, limit = 5) => {
        const params = typeof rangeParam === 'object' ?
            { start_date: rangeParam.start.toISOString(), end_date: rangeParam.end.toISOString(), limit } :
            { days: rangeParam, limit };
        const response = await api.get('/sales/analytics/top-products', { params });
        return response.data;
    },

    // Inventory Analytics
    getLowStockAlerts: async () => {
        const response = await api.get('/inventory/alerts/low-stock');
        return response.data;
    },

    // Transaction History
    getRecentSales: async (limit = 5) => {
        // Re-using the main sales list endpoint, but we might want a specialized one later
        const response = await api.get('/sales/', { params: { limit, skip: 0 } });
        return response.data;
    },

    getSalesTrend: async (rangeParam = 7) => {
        const params = typeof rangeParam === 'object' ?
            { start_date: rangeParam.start.toISOString(), end_date: rangeParam.end.toISOString() } :
            { days: rangeParam };
        const response = await api.get('/sales/analytics/trend', { params });
        return response.data;
    }
};
