import React, { useState } from 'react';
import Drawer from '../../components/common/Drawer';
import api from '../../services/api';

const ProductDrawer = ({ isOpen, onClose, onRefresh }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: 0,
        track_expiry: false,
        is_batch_tracked: false
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/products/', formData);
            onRefresh();
            onClose();
            setFormData({ name: '', sku: '', price: 0, track_expiry: false, is_batch_tracked: false });
        } catch (err) {
            alert("Error adding product. Check if SKU exists.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title="Add New Product" size="md">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="flex-1 space-y-4">
                    <div className="input-group">
                        <label>Product Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Wireless Mouse"
                        />
                    </div>
                    <div className="input-group">
                        <label>SKU</label>
                        <input
                            type="text"
                            required
                            value={formData.sku}
                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="e.g. WM-001"
                        />
                    </div>
                    <div className="input-group">
                        <label>Price</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.track_expiry}
                                onChange={e => setFormData({ ...formData, track_expiry: e.target.checked })}
                            />
                            Track Expiry Date
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.is_batch_tracked}
                                onChange={e => setFormData({ ...formData, is_batch_tracked: e.target.checked })}
                            />
                            Batch Tracking
                        </label>
                    </div>
                </div>

                <div className="pt-4 mt-auto border-t border-gray-100">
                    <button type="submit" className="primary-btn w-full justify-center" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Product'}
                    </button>
                </div>
            </form>
        </Drawer>
    );
};

export default ProductDrawer;
