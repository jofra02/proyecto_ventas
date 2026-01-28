import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

const StockAdjustmentModal = ({ isOpen, onClose, onSuccess, initialProduct }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(initialProduct?.product_id || '');
    const [qty, setQty] = useState('');
    const [reason, setReason] = useState(t('Manual Adjustment'));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            api.get('/products/').then(res => {
                setProducts(res.data);
                if (!selectedProduct && res.data.length > 0) {
                    setSelectedProduct(res.data[0].id);
                }
            });
            if (initialProduct) {
                setSelectedProduct(initialProduct.product_id);
            }
        }
    }, [isOpen, initialProduct, selectedProduct]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/inventory/adjust', {
                product_id: parseInt(selectedProduct),
                warehouse_id: 1, // Default warehouse
                qty: parseFloat(qty),
                reason: reason
            });
            showNotification(t("Stock corrected successfully!"), "success");
            onSuccess();
        } catch (err) {
            console.error(err);
            showNotification(t("Error adjusting stock"), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t("Stock Adjustment (Correction)")}>
            <form onSubmit={handleSubmit} className="erp-form">
                <div className="bg-yellow-50 p-3 rounded mb-4 text-sm text-yellow-800">
                    {t("Use this form to correct inventory errors. Enter a **negative** value to decrease stock, or a **positive** value to increase it.")}
                </div>

                <div className="input-group">
                    <label>{t('Product')}</label>
                    <select
                        value={selectedProduct}
                        onChange={e => setSelectedProduct(e.target.value)}
                        required
                    >
                        <option value="">{t('Select Product...')}</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label>
                        {t('Adjustment Quantity (+/-)')}
                        {products.find(p => p.id === parseInt(selectedProduct))?.product_type === 'pack' && (
                            <span className="text-orange-600 font-bold ml-1">({t('In Packs')})</span>
                        )}
                    </label>
                    <input
                        type="number"
                        step="any"
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                        required
                        placeholder="-5 o 10"
                    />
                    {products.find(p => p.id === parseInt(selectedProduct))?.product_type === 'pack' && qty && (
                        <div className="text-[10px] text-gray-400 mt-1 italic">
                            {t('This will adjust')} {Math.abs(parseFloat(qty) * (products.find(p => p.id === parseInt(selectedProduct))?.measurement_value || 1))} {t('units')}
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label>{t('Reason')}</label>
                    <input
                        type="text"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="primary-btn w-full bg-yellow-600 hover:bg-yellow-700" disabled={loading}>
                    {loading ? t('Processing...') : t('Apply Correction')}
                </button>
            </form>
        </Modal>
    );
};

export default StockAdjustmentModal;
