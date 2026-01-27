import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ReceiveStockDrawer from './ReceiveStockDrawer';
import StockAdjustmentModal from './StockAdjustmentModal';
import { Package, ArrowDownLeft, PenTool } from 'lucide-react';
import DataLayout from '../../components/layout/DataLayout';
import StatusBadge from '../../components/common/StatusBadge';

import { useLanguage } from '../../i18n/LanguageContext';

const StockList = () => {
    const { t } = useLanguage();
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null); // For detail view
    const [adjustItem, setAdjustItem] = useState(null);   // For modal

    const fetchStock = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory/stock');
            setStock(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    const handleAdjust = (item) => {
        setAdjustItem(item);
        setIsAdjustOpen(true);
    };

    const handleSuccess = () => {
        setIsReceiveOpen(false);
        setIsAdjustOpen(false);
        setAdjustItem(null);
        fetchStock();
    };

    return (
        <DataLayout
            title={t('Inventory Management')}
            subtitle={t('Real-time stock levels and tracking')}
            icon={Package}
            actions={
                <button className="primary-btn" onClick={() => setIsReceiveOpen(true)}>
                    <ArrowDownLeft size={18} /> {t('Receive Stock')}
                </button>
            }
        >
            <table className="custom-table">
                <thead>
                    <tr>
                        <th className="w-12"></th> {/* Expansion Arrow */}
                        <th>{t('SKU')}</th>
                        <th>{t('Product')}</th>
                        <th className="text-right">{t('Stock Level')}</th>
                        <th>{t('Status')}</th>
                        <th>{t('Actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="6" className="text-center py-8 text-gray-400">{t('Loading stock...')}</td></tr>
                    ) : stock.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-8 text-gray-400">{t('No inventory data found.')}</td></tr>
                    ) : stock.map(item => (
                        <React.Fragment key={item.product_id}>
                            <tr
                                className={`hover:bg-gray-50 cursor-pointer ${expandedRow === item.product_id ? 'bg-blue-50' : ''}`}
                                onClick={() => setExpandedRow(expandedRow === item.product_id ? null : item.product_id)}
                            >
                                <td className="text-gray-400 px-4">
                                    {expandedRow === item.product_id ? '▼' : '▶'}
                                </td>
                                <td className="font-mono text-sm text-blue-600">{item.sku}</td>
                                <td className="font-medium">{item.name}</td>
                                <td className="text-right font-bold text-lg">
                                    {item.quantity}
                                </td>
                                <td>
                                    {item.quantity <= 0 ? (
                                        <StatusBadge type="error">{t('Out of Stock')}</StatusBadge>
                                    ) : item.quantity < 10 ? (
                                        <StatusBadge type="warning">{t('Low Stock')}</StatusBadge>
                                    ) : (
                                        <StatusBadge type="success">{t('In Stock')}</StatusBadge>
                                    )}
                                </td>
                                <td onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => handleAdjust(item)}
                                        className="text-gray-600 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
                                    >
                                        <PenTool size={14} /> {t('Adjust')}
                                    </button>
                                </td>
                            </tr>
                            {expandedRow === item.product_id && (
                                <StockDetailsRow productId={item.product_id} />
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>

            {/* Modals & Drawers */}
            <ReceiveStockDrawer
                isOpen={isReceiveOpen}
                onClose={() => setIsReceiveOpen(false)}
                onSuccess={handleSuccess}
            />

            <StockAdjustmentModal
                isOpen={isAdjustOpen}
                onClose={() => { setIsAdjustOpen(false); setAdjustItem(null); }}
                onSuccess={handleSuccess}
                initialProduct={adjustItem}
            />
        </DataLayout>
    );
};
const StockDetailsRow = ({ productId }) => {
    const { t } = useLanguage();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/inventory/stock/${productId}/details`)
            .then(res => setDetails(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [productId]);

    if (loading) return (
        <tr className="bg-gray-50 border-b border-gray-100">
            <td colSpan="6" className="py-2 pl-16 text-xs text-gray-500 italic">
                {t('Loading details...')}
            </td>
        </tr>
    );

    if (!details || details.length === 0) return (
        <tr className="bg-gray-50 border-b border-gray-100">
            <td colSpan="6" className="py-2 pl-16 text-xs text-gray-400 italic">
                {t('No breakdown available.')}
            </td>
        </tr>
    );

    // Flatten details for display if needed, or just iterate.
    // Structure: details = [{ supplier, qty, batches: [] }]
    // We want to show one row per supplier, or one row per batch?
    // User said "products aggregated for suppliers... see how many have from each".
    // So we show the Supplier totals.
    // If user wants to see batches, maybe tooltip or sub-text.
    // Let's go with Supplier Rows.

    return (
        <>
            <tr className="bg-gray-50 border-b border-gray-200">
                <td colSpan="6" className="py-1 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-100">
                    <div className="pl-12 flex">
                        <span className="w-1/5">{t('Batch / Ref')}</span>
                        <span className="w-1/4">{t('Source / Supplier')}</span>
                        <span className="w-1/6 text-right ml-auto mr-12">{t('Quantity')}</span>
                    </div>
                </td>
            </tr>
            {details.map((d, i) => (
                <tr key={i} className="bg-gray-50 hover:bg-gray-100 border-b border-gray-100">
                    <td></td> {/* Indent */}
                    <td className="font-mono text-xs text-gray-500 py-2">
                        {/* Batches list */}
                        {d.batches.map(b => b.sku).join(', ') || t('General')}
                    </td>
                    <td className="text-sm font-medium text-gray-700 py-2">
                        {d.supplier}
                    </td>
                    <td className="text-right text-sm font-bold text-gray-700 py-2 pr-4">
                        {d.qty}
                    </td>
                    <td className="text-xs text-gray-500 py-2">
                        {d.batches[0]?.expiry ? `Exp: ${new Date(d.batches[0].expiry).toLocaleDateString()}` : ''}
                        {d.batches.length > 1 && <span className="ml-2 italic text-gray-400">({d.batches.length} batches)</span>}
                    </td>
                    <td></td>
                </tr>
            ))}
        </>
    );
};


export default StockList;
