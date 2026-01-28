import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const CustomerModal = ({ isOpen, onClose, customer, onSuccess }) => {
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({ name: '', tax_id: '', email: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name,
                tax_id: customer.tax_id || '',
                email: customer.email || ''
            });
        } else {
            setFormData({ name: '', tax_id: '', email: '' });
        }
    }, [customer, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (customer) {
                await api.put(`/customers/${customer.id}`, formData);
            } else {
                await api.post('/customers/', formData);
            }
            onSuccess();
        } catch (err) {
            console.error(err);
            showNotification("Error saving customer", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={customer ? "Edit Customer" : "New Customer"}>
            <form onSubmit={handleSubmit} className="erp-form">
                <div className="input-group">
                    <label>Full Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        autoFocus
                    />
                </div>

                <div className="input-group">
                    <label>Tax ID / NIT / VAT</label>
                    <input
                        type="text"
                        value={formData.tax_id}
                        onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                        placeholder="Optional"
                    />
                </div>

                <div className="input-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Optional"
                    />
                </div>

                <button type="submit" className="primary-btn w-full" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Customer'}
                </button>
            </form>
        </Modal>
    );
};

export default CustomerModal;
