import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { Plus, Trash, Save } from 'lucide-react';

const ReceiveStockModal = ({ isOpen, onClose, onSuccess }) => {
    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([{ product_id: '', qty: '', expiry_date: '' }]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            api.get('/products/').then(res => {
                setProducts(res.data);
                // Reset items when opening
                setItems([{ product_id: res.data[0]?.id || '', qty: '', expiry_date: '' }]);
            });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Filter out incomplete items
            const validItems = items.filter(i => i.product_id && i.qty > 0).map(i => ({
                product_id: parseInt(i.product_id),
                qty: parseFloat(i.qty),
                expiry_date: i.expiry_date || null
            }));

            if (validItems.length === 0) {
                alert("Please add at least one valid item");
                setLoading(false);
                return;
            }

            await api.post('/inventory/receive-batch', {
                warehouse_id: 1, // Default warehouse
                items: validItems
            });
            alert("Batch stock received successfully!");
            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Error receiving stock batch");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Receive Stock (Batch)">
            <form onSubmit={handleSubmit} className="erp-form space-y-4">
                <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Product</label>
                                <select
                                    value={item.product_id}
                                    onChange={e => updateItem(index, 'product_id', e.target.value)}
                                    className="w-full text-sm p-2 border rounded"
                                    required
                                >
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Qty</label>
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
                                disabled={items.length === 1}
                            >
                                <Trash size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={addItem} className="secondary-btn flex items-center gap-2 flex-1 justify-center">
                        <Plus size={16} /> Add Another Item
                    </button>
                    <button type="submit" className="primary-btn flex-1 flex items-center gap-2 justify-center" disabled={loading}>
                        <Save size={16} /> {loading ? 'Processing...' : 'Confirm Batch'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ReceiveStockModal;
