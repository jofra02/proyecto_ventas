import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../services/dashboardService';

const SalesTrendWidget = ({ globalTimeRange = 7 }) => {
    const [data, setData] = useState([]);
    const [localPeriod, setLocalPeriod] = useState('global'); // 'global' or number
    const [loading, setLoading] = useState(true);

    const activePeriod = localPeriod === 'global' ? globalTimeRange : localPeriod;

    // Helper to format the global label
    const getGlobalLabel = () => {
        if (typeof globalTimeRange === 'number') return `${globalTimeRange} days`;
        return "Custom Range";
    };

    useEffect(() => {
        const fetchTrend = async () => {
            setLoading(true);
            try {
                const trendData = await dashboardService.getSalesTrend(activePeriod);
                setData(trendData);
            } catch (err) {
                console.error("Failed to fetch sales trend", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrend();
    }, [activePeriod]);

    return (
        <div className="bg-white rounded-xl p-6 border border-border shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-bold text-primary">Sales Trend</h3>
                <select
                    value={typeof localPeriod === 'object' ? 'custom' : localPeriod}
                    onChange={(e) => setLocalPeriod(e.target.value === 'global' ? 'global' : Number(e.target.value))}
                    className="bg-body border border-border rounded-md px-3 py-1 text-sm outline-none focus:border-primary transition-colors cursor-pointer"
                >
                    <option value="global">Global ({getGlobalLabel()})</option>
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                </select>
            </div>

            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="h-full w-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default SalesTrendWidget;
