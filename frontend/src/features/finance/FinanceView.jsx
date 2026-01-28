import React, { useState } from 'react';
import DataLayout from '../../components/layout/DataLayout';
import { DollarSign, CreditCard, PieChart } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

// Sub-views
import PaymentList from './payments/PaymentList';
import CostCategoryManager from './CostCategoryManager';

const FinanceView = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('payments');

    return (
        <div className="finance-dashboard h-full flex flex-col">
            <div className="finance-header mb-4 flex items-center gap-4 border-b border-gray-200 pb-2">
                <div className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
                    <CreditCard size={18} />
                    {t('Payments')}
                </div>
                <div className={`tab-btn ${activeTab === 'costs' ? 'active' : ''}`} onClick={() => setActiveTab('costs')}>
                    {/* Using PieChart or DollarSign to distinguish */}
                    <PieChart size={18} />
                    {t('Costs & Pricing')}
                </div>
            </div>

            <div className="finance-content flex-1 overflow-auto">
                {activeTab === 'payments' && <PaymentList />}
                {activeTab === 'costs' && <CostCategoryManager />}
            </div>

            <style>{`
                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    color: #64748b;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .tab-btn:hover {
                    background: #f1f5f9;
                    color: #1e293b;
                }
                .tab-btn.active {
                    background: #e0f2fe;
                    color: #0284c7;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

export default FinanceView;
