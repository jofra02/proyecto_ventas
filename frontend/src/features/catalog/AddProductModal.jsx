import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import api from '../../services/api';

const AddProductModal = ({ isOpen, onClose, onRefresh }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: 0,
        track_expiry: false,
        is_batch_tracked: false
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products/', formData);
            onRefresh();
            onClose();
            setFormData({ name: '', sku: '', price: 0, track_expiry: false, is_batch_tracked: false });
        } catch (err) {
            alert("Error adding product. Check if SKU exists.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Product">
            <form onSubmit={handleSubmit} className="form-grid">
                <div className="input-group">
                    <label>Product Name</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="input-group">
                    <label>SKU</label>
                    <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
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
                    />
                </div>

                <div className="checkbox-row">
                    <label className="checkbox-wrap">
                        <input
                            type="checkbox"
                            checked={formData.track_expiry}
                            onChange={e => setFormData({ ...formData, track_expiry: e.target.checked })}
                        />
                        Track Expiry
                    </label>
                    <label className="checkbox-wrap">
                        <input
                            type="checkbox"
                            checked={formData.is_batch_tracked}
                            onChange={e => setFormData({ ...formData, is_batch_tracked: e.target.checked })}
                        />
                        Batch Tracking
                    </label>
                </div>

                <button type="submit" className="primary-btn submit-btn">Create Product</button>
            </form>

            <style>{`
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .input-group input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          padding: 0.8rem;
          border-radius: var(--radius-md);
          color: white;
          outline: none;
        }

        .checkbox-row {
          display: flex;
          gap: 2rem;
        }

        .checkbox-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .submit-btn {
          margin-top: 1rem;
          width: 100%;
          padding: 1rem !important;
        }
      `}</style>
        </Modal>
    );
};

export default AddProductModal;
