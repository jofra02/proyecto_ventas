import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DataLayout from '../../components/layout/DataLayout';
import SupplierDrawer from './SupplierDrawer';
import { Truck, Plus, Search, Edit } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const SupplierList = () => {
    const { t } = useLanguage();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/suppliers/');
            setSuppliers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setIsDrawerOpen(true);
    };

    const handleCreate = () => {
        setEditingSupplier(null);
        setIsDrawerOpen(true);
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <DataLayout
                title={t("Providers (Suppliers)")}
                subtitle={t("Manage your vendors and payment details")}
                icon={Truck}
                actions={
                    <button className="primary-btn flex items-center gap-2" onClick={handleCreate}>
                        <Plus size={18} /> {t('Add Provider')}
                    </button>
                }
                filters={
                    <div className="flex items-center gap-2 w-full max-w-md bg-gray-50 p-2 rounded border">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder={t("Search by name, contact or email...")}
                            className="bg-transparent border-none outline-none w-full text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                }
            >
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>{t('Provider Name')}</th>
                            <th>{t('Contact')}</th>
                            <th>{t('Phone / Email')}</th>
                            <th>{t('Payment Method')}</th>
                            <th className="text-right">{t('Actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="text-center py-8 text-gray-400">
                                    {t('Loading suppliers...')}
                                </td>
                            </tr>
                        ) : filteredSuppliers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center py-8 text-gray-400">
                                    {t('No suppliers found.')}
                                </td>
                            </tr>
                        ) : (
                            filteredSuppliers.map(supplier => (
                                <tr key={supplier.id}>
                                    <td>
                                        <div className="font-semibold text-gray-900">{supplier.name}</div>
                                        <div className="text-xs text-gray-400 truncate max-w-[200px]">{supplier.address}</div>
                                    </td>
                                    <td className="text-gray-600">{supplier.contact_name || '-'}</td>
                                    <td>
                                        <div className="text-sm font-medium text-gray-700">{supplier.phone || '-'}</div>
                                        <div className="text-xs text-gray-400">{supplier.email || '-'}</div>
                                    </td>
                                    <td>
                                        <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600">
                                            {t(supplier.payment_method)}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button
                                            onClick={() => handleEdit(supplier)}
                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                            title={t('Edit')}
                                        >
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </DataLayout>

            <SupplierDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSuccess={fetchSuppliers}
                initialData={editingSupplier}
            />
        </>
    );
};

export default SupplierList;
