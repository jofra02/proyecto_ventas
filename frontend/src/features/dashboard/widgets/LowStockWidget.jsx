import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useLanguage } from '../../../i18n/LanguageContext';

const LowStockWidget = () => {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const data = await dashboardService.getLowStockAlerts();
                setItems(data);
            } catch (err) {
                console.error("Failed to fetch low stock alerts", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
    }, []);

    return (
        <div className="glass-panel p-6 bg-orange-50/50 border-orange-100 h-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                        <AlertTriangle size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{t('Low Stock Alerts')}</h3>
                </div>
                <button
                    onClick={() => navigate('/inventory')}
                    className="text-sm text-orange-600 font-medium hover:text-orange-800 flex items-center"
                >
                    {t('View All')} <ChevronRight size={16} />
                </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="h-16 bg-white/50 animate-pulse rounded-lg"></div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-8 text-secondary text-sm">{t('Stock levels are healthy.')}</div>
                ) : (
                    items.map(item => (
                        <div key={item.product_id} className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800 text-sm truncate max-w-[120px]" title={item.name}>{item.name}</p>
                                <p className="text-xs text-gray-500">{t('Min. Limit: ')}{item.min_level}</p>
                            </div>
                            <div className={`text-sm font-bold px-3 py-1 rounded-full ${item.quantity <= 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                {item.quantity}{t(' left')}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LowStockWidget;
