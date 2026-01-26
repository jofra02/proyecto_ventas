import React, { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import OverviewView from './views/OverviewView';
import CustomView from './views/CustomView';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const Dashboard = () => {
    console.log("Dashboard Component Rendering");
    const [currentView, setCurrentView] = useState('overview');
    const [timeRange, setTimeRange] = useState(7);
    const renderView = () => {
        switch (currentView) {
            case 'overview':
                return <OverviewView timeRange={timeRange} />;
            case 'sales':
                return <div className="p-8 text-center text-gray-500">Sales Performance View (Coming Soon)</div>;
            case 'inventory':
                return <div className="p-8 text-center text-gray-500">Inventory Health View (Coming Soon)</div>;
            case 'custom':
                return <CustomView />;
            default:
                return <OverviewView timeRange={timeRange} />;
        }
    };

    return (
        <DashboardLayout currentView={currentView} onViewChange={setCurrentView} timeRange={timeRange} onTimeRangeChange={setTimeRange}>
            <ErrorBoundary>
                {renderView()}
            </ErrorBoundary>
        </DashboardLayout>
    );
};

export default Dashboard;
