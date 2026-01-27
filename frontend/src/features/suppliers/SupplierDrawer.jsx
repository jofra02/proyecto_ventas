import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Drawer from '../../components/common/Drawer';
import { Truck, Save } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const SupplierDrawer = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        payment_method: 'CASH',
        payment_details: {}
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    contact_name: initialData.contact_name || '',
                    email: initialData.email || '',
                    phone: initialData.phone || '',
                    address: initialData.address || '',
                    payment_method: initialData.payment_method || 'CASH',
                    payment_details: initialData.payment_details || {}
                });
            } else {
                // Reset
                setFormData({
                    name: '',
                    contact_name: '',
                    email: '',
                    phone: '',
                    address: '',
                    payment_method: 'CASH',
                    payment_details: {}
                });
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDetailChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            payment_details: {
                ...prev.payment_details,
                [key]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                await api.put(`/suppliers/${initialData.id}`, formData);
            } else {
                await api.post('/suppliers/', formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert(t("Error saving supplier"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={initialData ? t("Edit Provider") : t("New Provider")} size="md">
            <form onSubmit={handleSubmit} className="erp-form space-y-4">
                {/* Basic Info */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">{t('Basic Info')}</h3>
                    <div className="input-group">
                        <label>{t('Provider Name *')}</label>
                        <input name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="flex gap-2">
                        <div className="input-group flex-1">
                            <label>{t('Contact Person')}</label>
                            <input name="contact_name" value={formData.contact_name} onChange={handleChange} />
                        </div>
                        <div className="input-group flex-1">
                            <label>{t('Phone')}</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>{t('Email')}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>{t('Address')}</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} rows="2"></textarea>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">{t('Payment Details')}</h3>
                    <div className="input-group">
                        <label>{t('Payment Method')}</label>
                        <select name="payment_method" value={formData.payment_method} onChange={handleChange}>
                            <option value="CASH">{t('Cash (Efectivo)')}</option>
                            <option value="TRANSFER">{t('Bank Transfer (Transferencia)')}</option>
                            <option value="CHECK">{t('Check (Cheque)')}</option>
                            <option value="OTHER">{t('Other')}</option>
                        </select>
                    </div>

                    {/* Conditional Fields */}
                    {formData.payment_method === 'TRANSFER' && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-2">
                            <div className="input-group">
                                <label className="text-xs text-blue-700">{t('Bank Name')}</label>
                                <input
                                    className="bg-white"
                                    value={formData.payment_details.bank || ''}
                                    onChange={e => handleDetailChange('bank', e.target.value)}
                                    placeholder="e.g. Banco Galicia"
                                />
                            </div>
                            <div className="input-group">
                                <label className="text-xs text-blue-700">{t('CBU / CVU')}</label>
                                <input
                                    className="bg-white"
                                    value={formData.payment_details.cbu || ''}
                                    onChange={e => handleDetailChange('cbu', e.target.value)}
                                    placeholder="22 digit code"
                                />
                            </div>
                            <div className="input-group">
                                <label className="text-xs text-blue-700">{t('Alias')}</label>
                                <input
                                    className="bg-white"
                                    value={formData.payment_details.alias || ''}
                                    onChange={e => handleDetailChange('alias', e.target.value)}
                                    placeholder="alias.name.mp"
                                />
                            </div>
                            <div className="input-group">
                                <label className="text-xs text-blue-700">{t('Account Number')}</label>
                                <input
                                    className="bg-white"
                                    value={formData.payment_details.account_num || ''}
                                    onChange={e => handleDetailChange('account_num', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {formData.payment_method === 'CHECK' && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 space-y-2">
                            <div className="input-group">
                                <label className="text-xs text-yellow-700">{t('Beneficiary Name')}</label>
                                <input
                                    className="bg-white"
                                    value={formData.payment_details.beneficiary || ''}
                                    onChange={e => handleDetailChange('beneficiary', e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <label className="text-xs text-yellow-700">{t('Delivery Instructions')}</label>
                                <textarea
                                    className="bg-white"
                                    rows="2"
                                    value={formData.payment_details.instructions || ''}
                                    onChange={e => handleDetailChange('instructions', e.target.value)}
                                    placeholder="e.g. Deliver to office on Tuesdays"
                                />
                            </div>
                        </div>
                    )}

                    {formData.payment_method === 'OTHER' && (
                        <div className="input-group">
                            <label>{t('Notes')}</label>
                            <textarea
                                value={formData.payment_details.notes || ''}
                                onChange={e => handleDetailChange('notes', e.target.value)}
                                placeholder="Payment details..."
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4">
                    <button type="submit" className="primary-btn w-full flex items-center justify-center gap-2" disabled={loading}>
                        <Save size={16} /> {loading ? t('Saving...') : t('Save Provider')}
                    </button>
                </div>
            </form>
        </Drawer>
    );
};

export default SupplierDrawer;
