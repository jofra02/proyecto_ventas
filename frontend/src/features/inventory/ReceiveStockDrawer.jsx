import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Drawer from '../../components/common/Drawer';
import { Plus, Trash, Save, Upload } from 'lucide-react';

import { useLanguage } from '../../i18n/LanguageContext';

const ReceiveStockDrawer = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([{ product_id: '', qty: '', expiry_date: '' }]);
    const [supplierId, setSupplierId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Load products and suppliers
            Promise.all([
                api.get('/products/'),
                api.get('/suppliers/')
            ]).then(([prodRes, suppRes]) => {
                setProducts(prodRes.data);
                setSuppliers(suppRes.data);
                // Reset
                setItems([{ product_id: prodRes.data[0]?.id || '', qty: '', expiry_date: '' }]);
                setSupplierId('');
            }).catch(console.error);
        }
    }, [isOpen]);

    const addItem = () => {
        setItems([...items, { product_id: products[0]?.id || '', qty: '', expiry_date: '' }]);
    };

    const removeItem = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const newItems = [];
            let missingProviders = 0;

            lines.forEach(line => {
                // Expected format: SKU, Qty, ProviderName (Optional/Mandatory)
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const sku = parts[0].trim();
                    const qty = parseFloat(parts[1].trim());
                    const providerName = parts[2] ? parts[2].trim() : null;

                    if (sku && !isNaN(qty)) {
                        const product = products.find(p => p.sku === sku);
                        if (product) {
                            let sId = '';
                            if (providerName) {
                                const supplier = suppliers.find(s => s.name.toLowerCase() === providerName.toLowerCase());
                                if (supplier) sId = supplier.id;
                                else missingProviders++;
                            } else if (supplierId) {
                                // Inherit default if set
                                sId = supplierId;
                            }

                            newItems.push({
                                product_id: product.id,
                                qty: qty,
                                supplier_id: sId,
                                expiry_date: ''
                            });
                        }
                    }
                }
            });

            if (newItems.length > 0) {
                const currentItems = items.filter(i => i.product_id !== '' || i.qty !== '');
                setItems([...currentItems, ...newItems]);
                let msg = t('Loaded {count} items from CSV.').replace('{count}', newItems.length);
                if (missingProviders > 0) msg += `\n${t('Warning: {missing} providers in CSV came up empty or not found. Please select manually.').replace('{missing}', missingProviders)}`;
                alert(msg);
            } else {
                alert(t("No valid items found in CSV. Expected format: SKU, Qty, Provider (opt)"));
            }
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Every item must have a supplier
        const missingSupplier = items.some(i => i.product_id && !i.supplier_id);
        if (missingSupplier) {
            alert(t("Every row must have a Provider selected..."));
            return;
        }

        setLoading(true);
        try {
            const validItems = items.filter(i => i.product_id && i.qty > 0).map(i => ({
                product_id: parseInt(i.product_id),
                qty: parseFloat(i.qty),
                supplier_id: parseInt(i.supplier_id),
                expiry_date: i.expiry_date || null
            }));

            if (validItems.length === 0) {
                alert(t("Please add at least one valid item"));
                setLoading(false);
                return;
            }

            await api.post('/inventory/receive-batch', {
                warehouse_id: 1,
                supplier_id: supplierId ? parseInt(supplierId) : null,
                items: validItems
            });
            alert(t("Stock received successfully!"));
            onSuccess();
        } catch (err) {
            console.error(err);
            alert(t("Error receiving stock batch"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={t("Receive Stock (Batch)")} size="md">
            <div className="flex flex-col h-full">

                {/* Global Helper */}
                <div className="mb-4 space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="input-group">
                        <label className="text-sm font-semibold text-gray-700">{t('Default Provider (optional helper)')}</label>
                        <select
                            value={supplierId}
                            onChange={e => {
                                setSupplierId(e.target.value);
                                // Optional: Update all empty items? 
                                if (e.target.value) {
                                    setItems(items.map(i => ({ ...i, supplier_id: i.supplier_id || e.target.value })));
                                }
                            }}
                            className="bg-white w-full p-2 border rounded"
                        >
                            <option value="">{t('Select Default...')}</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('Selecting this applies to all new lines or lines without a provider.')}
                        </p>
                    </div>
                </div>

                <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer text-blue-700 font-medium hover:text-blue-900">
                        <Upload size={18} />
                        <span>{t('Upload CSV (SKU, Qty, ProviderName)')}</span>
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <p className="text-xs text-blue-500 mt-1">{t('Format: SKU, Quantity, Provider Name')}</p>
                </div>

                <form onSubmit={handleSubmit} className="erp-form flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="flex-[2]">
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">{t('Product')}</label>
                                    <select
                                        value={item.product_id}
                                        onChange={e => updateItem(index, 'product_id', e.target.value)}
                                        className="w-full text-sm p-2 border rounded"
                                        required
                                    >
                                        <option value="">{t('Select Product...')}</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">{t('Provider')}</label>
                                    <select
                                        value={item.supplier_id || ''}
                                        onChange={e => updateItem(index, 'supplier_id', e.target.value)}
                                        className="w-full text-sm p-2 border rounded"
                                        required
                                    >
                                        <option value="">{t('Select...')}</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">{t('Qty')}</label>
                                    <input
                                        type="number"
                                        value={item.qty}
                                        onChange={e => updateItem(index, 'qty', e.target.value)}
                                        className="w-full text-sm p-2 border rounded"
                                        min="1"
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                    disabled={items.length === 1 && index === 0}
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={addItem} className="secondary-btn w-full flex items-center justify-center gap-2">
                            <Plus size={16} /> {t('Add Another Item')}
                        </button>
                        <button type="submit" className="primary-btn w-full flex items-center justify-center gap-2" disabled={loading}>
                            <Save size={16} /> {loading ? t('Processing...') : t('Confirm Receipt')}
                        </button>
                    </div>
                </form>
            </div>
        </Drawer>
    );
};

export default ReceiveStockDrawer;
