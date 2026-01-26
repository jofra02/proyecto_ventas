import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Drawer from '../../components/common/Drawer';

const ReceiveStockDrawer = ({ isOpen, onClose, onSuccess }) => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            api.get('/products/').then(res => {
                setProducts(res.data);
                if (res.data.length > 0) setSelectedProduct(res.data[0].id);
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/inventory/receive', {
                product_id: parseInt(selectedProduct),
                warehouse_id: 1, // Default warehouse
                qty: parseFloat(qty)
            });
            alert("Stock received successfully!");
            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Error receiving stock");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title="Receive Stock" size="md">
            <form onSubmit={handleSubmit} className="erp-form">
                <div className="input-group">
                    <label>Product</label>
                    <select
                        value={selectedProduct}
                        onChange={e => setSelectedProduct(e.target.value)}
                        required
                    >
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label>Quantity to Add</label>
                    <input
                        type="number"
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                        min="1"
                        required
                        placeholder="e.g. 100"
                    />
                </div>

                <button type="submit" className="primary-btn w-full mt-4" disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm Receipt'}
                </button>
            </form>
        </Drawer>
    );
};

export default ReceiveStockDrawer;
