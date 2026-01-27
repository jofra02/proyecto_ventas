import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DataLayout from '../../components/layout/DataLayout';
import SupplierDrawer from './SupplierDrawer';
import { Truck, Plus, Search, MapPin, CreditCard, Phone, Mail, Edit } from 'lucide-react';
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
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DataLayout
            title={t("Providers (Suppliers)")}
            subtitle={t("Manage your vendors and payment details")}
            icon={Truck}
            actions={
                <button className="primary-btn flex items-center gap-2" onClick={handleCreate}>
                    <Plus size={18} /> {t('Add Provider')}
                </button>
            }
        >
            <div className="mb-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={t("Search providers...")}
                        className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-gray-500">{t('Loading suppliers...')}</div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500">{t('No suppliers found.')}</div>
                ) : (
                    filteredSuppliers.map(supplier => (
                        <div key={supplier.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{supplier.name}</h3>
                                    {supplier.contact_name && <p className="text-sm text-gray-500">{t('Contact:')} {supplier.contact_name}</p>}
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600`}>
                                    {t(supplier.payment_method)}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                {supplier.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-gray-400" />
                                        <span>{supplier.email}</span>
                                    </div>
                                )}
                                {supplier.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400" />
                                        <span>{supplier.phone}</span>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span className="truncate">{supplier.address}</span>
                                    </div>
                                )}

                                {(supplier.payment_details && Object.keys(supplier.payment_details).length > 0) && (
                                    <div className="mt-3 pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-1 text-xs font-medium text-blue-600 mb-1">
                                            <CreditCard size={12} /> {t('Payment Info')}
                                        </div>
                                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                            {supplier.payment_method === 'TRANSFER' && (
                                                <>
                                                    {supplier.payment_details.bank && <div>{t('Bank:')} {supplier.payment_details.bank}</div>}
                                                    {supplier.payment_details.alias && <div>{t('Alias:')} <span className="font-mono text-gray-700">{supplier.payment_details.alias}</span></div>}
                                                    {supplier.payment_details.cbu && <div>{t('CBU:')} <span className="font-mono text-gray-700">{supplier.payment_details.cbu}</span></div>}
                                                </>
                                            )}
                                            {supplier.payment_method === 'CHECK' && (
                                                <div>{t('Beneficiary:')} {supplier.payment_details.beneficiary || '-'}</div>
                                            )}
                                            {supplier.payment_method !== 'TRANSFER' && supplier.payment_method !== 'CHECK' && (
                                                <div>{JSON.stringify(supplier.payment_details)}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => handleEdit(supplier)}
                                    className="text-gray-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
                                >
                                    <Edit size={16} /> {t('Edit')}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <SupplierDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSuccess={fetchSuppliers}
                initialData={editingSupplier}
            />
        </DataLayout>
    );
};

export default SupplierList;
