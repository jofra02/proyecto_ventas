import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Drawer from '../../components/common/Drawer';
import ThermalReceipt from '../../components/printing/ThermalReceipt';
import DataLayout from '../../components/layout/DataLayout';
import StatusBadge from '../../components/common/StatusBadge';
import { useLanguage } from '../../i18n/LanguageContext';
import { usePrinter } from '../../context/PrintContext';
import { Printer } from 'lucide-react';

const InvoiceList = () => {
    const { t } = useLanguage();
    const { print } = usePrinter();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [customers, setCustomers] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [storeSettings, setStoreSettings] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invRes, custRes, nameRes, addrRes, cuitRes, ivaRes] = await Promise.all([
                    api.get('/documents/'),
                    api.get('/customers/'),
                    api.get('/admin/settings/store_name').catch(() => ({ data: { value: '' } })),
                    api.get('/admin/settings/store_address').catch(() => ({ data: { value: '' } })),
                    api.get('/admin/settings/store_cuit').catch(() => ({ data: { value: '' } })),
                    api.get('/admin/settings/store_iva_status').catch(() => ({ data: { value: '' } }))
                ]);

                setStoreSettings({
                    store_name: nameRes.data.value,
                    store_address: addrRes.data.value,
                    store_cuit: cuitRes.data.value,
                    store_iva_status: ivaRes.data.value
                });

                const custMap = {};
                custRes.data.forEach(c => custMap[c.id] = c);
                setCustomers(custMap);
                setInvoices(invRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const viewDocument = async (id) => {
        try {
            const res = await api.get(`/documents/${id}`);
            setSelectedDoc(res.data);
            setIsModalOpen(true);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <DataLayout
            title={t("Invoices (Documentos)")}
            subtitle={t("View and managed issued tax documents")}
            icon={FileText}
        >
            <table className="custom-table">
                <thead>
                    <tr>
                        <th>{t('Doc #')}</th>
                        <th>{t('Date')}</th>
                        <th>{t('Total')}</th>
                        <th>{t('Status')}</th>
                        <th className="text-right">{t('Actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="5" className="text-center py-8 text-gray-400">{t('Loading documents...')}</td></tr>
                    ) : invoices.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-8 text-gray-400">{t('No documents issued.')}</td></tr>
                    ) : invoices.map(doc => (
                        <tr key={doc.id}>
                            <td className="font-mono text-blue-600 font-bold">#{doc.id.toString().padStart(8, '0')}</td>
                            <td>{format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm')}</td>
                            <td className="font-bold">${doc.total.toFixed(2)}</td>
                            <td>
                                <StatusBadge type="success">{t(doc.status)}</StatusBadge>
                            </td>
                            <td className="text-right">
                                <button className="text-blue-600 hover:text-blue-800" onClick={() => viewDocument(doc.id)} title={t("View Receipt")}>
                                    <Eye size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Document Drawer */}
            <Drawer isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t("Document View")} size="md">
                {selectedDoc && (
                    <div className="p-4 flex flex-col items-center">
                        <ThermalReceipt
                            sale={{ id: selectedDoc.document.sale_id, status: 'ISSUED' }}
                            customer={selectedDoc.customer_id ? customers[selectedDoc.customer_id] : null}
                            items={selectedDoc.items.map(i => ({ ...i, name: "Item " + i.product_id }))}
                            storeInfo={selectedDoc.document.store_name ? {
                                store_name: selectedDoc.document.store_name,
                                store_address: selectedDoc.document.store_address,
                                store_cuit: selectedDoc.document.store_cuit,
                                store_iva_status: selectedDoc.document.store_iva_status
                            } : storeSettings}
                        />
                        <button
                            className="primary-btn mt-6 flex items-center gap-2 w-full justify-center"
                            onClick={() => print({
                                sale: { id: selectedDoc.document.sale_id, status: 'ISSUED' },
                                customer: selectedDoc.customer_id ? customers[selectedDoc.customer_id] : null,
                                items: selectedDoc.items.map(i => ({ ...i, name: "Item " + i.product_id })),
                                storeInfo: selectedDoc.document.store_name ? {
                                    store_name: selectedDoc.document.store_name,
                                    store_address: selectedDoc.document.store_address,
                                    store_cuit: selectedDoc.document.store_cuit,
                                    store_iva_status: selectedDoc.document.store_iva_status
                                } : storeSettings
                            })}
                        >
                            <Printer size={18} />
                            {t("Print Document")}
                        </button>
                    </div>
                )}
            </Drawer>
        </DataLayout>
    );
};

export default InvoiceList;
