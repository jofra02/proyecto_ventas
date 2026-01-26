import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Drawer from '../../components/common/Drawer';

const CustomerDrawer = ({ isOpen, onClose, customer, onSuccess }) => {
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
            alert("Error saving customer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={customer ? "Edit Customer" : "New Customer"} size="md">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="flex-1 space-y-4">
                    <div className="input-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            autoFocus
                            placeholder="e.g. Acme Corp"
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
                </div>

                <div className="pt-4 mt-auto border-t border-gray-100">
                    <button type="submit" className="primary-btn w-full justify-center" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Customer'}
                    </button>
                </div>
            </form>
        </Drawer>
    );
};

export default CustomerDrawer;
