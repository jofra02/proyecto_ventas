import React, { useState, useEffect } from 'react';
import DashboardGrid from '../components/DashboardGrid';
import { dashboardService } from '../services/dashboardService';

const OverviewView = ({ timeRange = 7 }) => {
    const [stats, setStats] = useState({
        total_revenue: 0,
        total_orders: 0,
        avg_order_value: 0,
        recent_trend: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await dashboardService.getSalesSummary(timeRange);
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [timeRange]);

    return <DashboardGrid dashboardData={{ stats, loading, globalTimeRange: timeRange }} />;
};

export default OverviewView;
