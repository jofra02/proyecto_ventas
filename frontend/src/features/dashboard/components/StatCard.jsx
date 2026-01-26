import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, trend, isLoading }) => (
    <div className="bg-white rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between h-[140px] relative overflow-hidden">
        <div className="flex justify-between items-start z-10">
            <div>
                <p className="text-secondary text-sm font-medium mb-1">{title}</p>
                {isLoading ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                    <h3 className="text-primary text-2xl font-bold">{value}</h3>
                )}
            </div>
            <div className="p-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, color: color }}>
                <Icon size={22} />
            </div>
        </div>

        {trend && (
            <div className="flex items-center gap-2 text-sm font-medium z-10">
                <span className={trend > 0 ? 'text-success' : 'text-danger'}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
                <span className="text-secondary opacity-70 font-normal">from last month</span>
            </div>
        )}

        {/* Decorative Background Blob - Tailwind doesn't support dynamic style injection cleanly for this, keeping style tag for dynamic color */}
        <div
            className="absolute -right-5 -bottom-5 w-24 h-24 rounded-full opacity-10 z-0"
            style={{ backgroundColor: color }}
        />
    </div>
);

export default StatCard;
