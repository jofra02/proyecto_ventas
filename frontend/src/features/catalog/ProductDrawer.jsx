import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Drawer from '../../components/common/Drawer';
import { useLanguage } from '../../i18n/LanguageContext';

const ProductDrawer = ({ isOpen, onClose, onRefresh }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: 0,
        track_expiry: false,
        is_batch_tracked: false,
        supplier_id: ''
    });
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            api.get('/suppliers/').then(res => setSuppliers(res.data)).catch(console.error);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null
            };
            await api.post('/products/', payload);
            onRefresh();
            onClose();
            setFormData({ name: '', sku: '', price: 0, track_expiry: false, is_batch_tracked: false, supplier_id: '' });
        } catch (err) {
            alert(t("Error adding product. Check if SKU exists."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={t("Add New Product")} size="md">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="flex-1 space-y-4">
                    <div className="input-group">
                        <label>{t('Product Name')}</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Wireless Mouse"
                        />
                    </div>
                    <div className="input-group">
                        <label>{t('SKU')}</label>
                        <input
                            type="text"
                            required
                            value={formData.sku}
                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="e.g. WM-001"
                        />
                    </div>
                    <div className="input-group">
                        <label>{t('Price')}</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="input-group">
                        <label>{t('Provider (Supplier)')}</label>
                        <select
                            value={formData.supplier_id}
                            onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                            className="bg-white"
                        >
                            <option value="">{t('None / Unknown')}</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.payment_method})</option>
                            ))}
                        </select>
                    </div>

                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.track_expiry}
                                onChange={e => setFormData({ ...formData, track_expiry: e.target.checked })}
                            />
                            {t('Track Expiry Date')}
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.is_batch_tracked}
                                onChange={e => setFormData({ ...formData, is_batch_tracked: e.target.checked })}
                            />
                            {t('Batch Tracking')}
                        </label>
                    </div>
                </div>

                <div className="pt-4 mt-auto border-t border-gray-100">
                    <button type="submit" className="primary-btn w-full justify-center" disabled={loading}>
                        {loading ? t('Creating...') : t('Create Product')}
                    </button>
                </div>
            </form>
        </Drawer>
    );
};

export default ProductDrawer;
