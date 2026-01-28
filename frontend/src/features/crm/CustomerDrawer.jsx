import React, { useState, useEffect } from 'react';
import Drawer from '../../components/common/Drawer';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNotification } from '../../context/NotificationContext';

const CustomerDrawer = ({ isOpen, onClose, customer, onSuccess }) => {
    const { t } = useLanguage();
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
            showNotification(t("Error saving customer"), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={customer ? t("Edit Customer") : t("New Customer")} size="md">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="flex-1 space-y-4">
                    <div className="input-group">
                        <label>{t('Full Name')}</label>
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
                        <label>{t('Tax ID / NIT / VAT')}</label>
                        <input
                            type="text"
                            value={formData.tax_id}
                            onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                            placeholder={t("Optional")}
                        />
                    </div>

                    <div className="input-group">
                        <label>{t('Email Address')}</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder={t("Optional")}
                        />
                    </div>
                </div>

                <div className="pt-4 mt-auto border-t border-gray-100">
                    <button type="submit" className="primary-btn w-full justify-center" disabled={loading}>
                        {loading ? t('Saving...') : t('Save Customer')}
                    </button>
                </div>
            </form>
        </Drawer>
    );
};

export default CustomerDrawer;
