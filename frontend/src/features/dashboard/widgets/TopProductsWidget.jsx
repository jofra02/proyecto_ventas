import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Trophy } from 'lucide-react';

const TopProductsWidget = () => {
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                const data = await dashboardService.getTopProducts();
                setProducts(data);
            } catch (err) {
                console.error("Failed to fetch top products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTopProducts();
    }, []);

    return (
        <div className="bg-white rounded-xl p-6 border border-border shadow-sm h-full">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-primary">{t('Top Products')}</h3>
                    <Trophy size={16} className="text-warning" />
                </div>
                <button className="text-sm text-primary hover:underline">{t('View Report')}</button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between items-center animate-pulse">
                                <div className="flex gap-3 w-full">
                                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-8 text-secondary text-sm">{t('No sales yet.')}</div>
                ) : (
                    products.map((p, i) => (
                        <div key={p.product_id || p.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    i === 1 ? 'bg-gray-100 text-gray-700' :
                                        'bg-orange-50 text-orange-700'
                                    }`}>
                                    #{i + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-sidebar">{p.name || `${t('Product #')}${p.product_id}`}</p>
                                    <p className="text-xs text-secondary">{p.total_sold} {t('units sold')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-sidebar">${p.revenue?.toFixed(2)}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TopProductsWidget;
