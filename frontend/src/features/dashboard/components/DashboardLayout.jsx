import React, { useState } from 'react';
import { LayoutDashboard, TrendingUp, Package, Calendar, Settings } from 'lucide-react';

const DashboardLayout = ({ currentView, onViewChange, children, timeRange, onTimeRangeChange }) => {
    const views = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'sales', label: 'Sales Performance', icon: TrendingUp },
        { id: 'inventory', label: 'Inventory Health', icon: Package },
    ];

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Internal Dashboard Header */}
            <div className="bg-white border-b border-border px-6 py-3 flex justify-between items-center shrink-0">
                <div className="flex gap-4">
                    {views.map(view => (
                        <button
                            key={view.id}
                            onClick={() => onViewChange(view.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === view.id ? 'bg-primary text-white shadow-md' : 'text-secondary hover:bg-gray-100'}`}
                        >
                            {view.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {/* Global Time Selector */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-border rounded-lg px-3 py-1.5">
                        <Calendar size={14} className="text-secondary" />
                        <select
                            className="bg-transparent text-sm font-semibold text-primary outline-none cursor-pointer"
                            value={typeof timeRange === 'object' ? 'custom' : timeRange}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'custom') {
                                    // Default to today if switching to custom
                                    const end = new Date();
                                    const start = new Date();
                                    start.setHours(0, 0, 0, 0);
                                    onTimeRangeChange({ start, end });
                                } else if (val === '0.0104') { // 15 mins approx in days? No, let's just use a distinct value logic helper
                                    // 15 Minutes Logic
                                    const end = new Date();
                                    const start = new Date(end.getTime() - 15 * 60000); // 15 mins ago
                                    onTimeRangeChange({ start, end });
                                } else {
                                    onTimeRangeChange(Number(val));
                                }
                            }}
                        >
                            <option value="0.0104">Last 15 Minutes</option>
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                            <option value={90}>Last 90 Days</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {/* Custom Date Pickers (Only visible if custom/object) */}
                    {typeof timeRange === 'object' && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <input
                                type="datetime-local"
                                className="border border-border rounded px-2 py-1 text-xs"
                                value={timeRange.start.toISOString().slice(0, 16)}
                                onChange={e => onTimeRangeChange({ ...timeRange, start: new Date(e.target.value) })}
                            />
                            <span className="text-secondary self-center">-</span>
                            <input
                                type="datetime-local"
                                className="border border-border rounded px-2 py-1 text-xs"
                                value={timeRange.end.toISOString().slice(0, 16)}
                                onChange={e => onTimeRangeChange({ ...timeRange, end: new Date(e.target.value) })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {children}
            </div>
        </div>
    );
};

export default DashboardLayout;
