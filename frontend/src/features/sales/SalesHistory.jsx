import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import api from '../../services/api';
// import Modal from '../../components/common/Modal'; // Removed
import Drawer from '../../components/common/Drawer'; // Added
import { ShoppingCart, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import ThermalReceipt from '../../components/printing/ThermalReceipt';
import DataLayout from '../../components/layout/DataLayout';
import { usePrinter } from '../../context/PrintContext';
import StatusBadge from '../../components/common/StatusBadge';

const SalesHistory = () => {
    const { t } = useLanguage();
    const { print } = usePrinter();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [products, setProducts] = useState({});
    const [customers, setCustomers] = useState({});
    const [storeSettings, setStoreSettings] = useState(null);

    useEffect(() => {
        // Fetch sales and products to map names
        const fetchData = async () => {
            try {
                const [salesRes, prodRes, custRes, nameRes, addrRes, cuitRes, ivaRes] = await Promise.all([
                    api.get('/sales/'),
                    api.get('/products/'),
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

                const prodMap = {};
                prodRes.data.forEach(p => prodMap[p.id] = p);

                const custMap = {};
                custRes.data.forEach(c => custMap[c.id] = c);

                setProducts(prodMap);
                setCustomers(custMap);
                setSales(salesRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const openSale = (sale) => {
        setSelectedSale(sale);
        setIsModalOpen(true);
    };

    const calculateTotal = (items) => {
        return items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    };

    return (
        <>

            <DataLayout
                title={t("Sales History")}
                subtitle={t("View past transactions and receipts")}
                icon={ShoppingCart}
            >
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>{t("Receipt")} #</th>
                            <th>{t("Status")}</th>
                            <th>{t("Items")}</th>
                            <th className="text-right">{t("Total")}</th>
                            <th className="text-right">{t("Action")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-8 text-gray-400">{t("Loading sales...")}</td></tr>
                        ) : sales.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-8 text-gray-400">{t("No sales found.")}</td></tr>
                        ) : sales.map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50">
                                <td className="font-mono text-blue-600 font-bold">#{sale.id.toString().padStart(6, '0')}</td>
                                <td>
                                    <StatusBadge type={sale.status === 'CONFIRMED' ? 'success' : 'warning'}>
                                        {sale.status === 'CONFIRMED' ? t("CONFIRMED") : sale.status}
                                    </StatusBadge>
                                </td>
                                <td>{sale.items.length} {t("items")}</td>
                                <td className="text-right font-bold">
                                    ${calculateTotal(sale.items).toFixed(2)}
                                </td>
                                <td className="text-right">
                                    <button className="text-blue-600 flex items-center gap-1 ml-auto font-medium" onClick={() => openSale(sale)}>
                                        <Eye size={16} /> {t("View")}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataLayout>

            {/* Sale Detail Drawer */}
            <Drawer
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${t("Receipt")} #${selectedSale?.id}`}
                size="md"
            >
                {selectedSale && (
                    <div className="receipt-view">
                        <div className="receipt-header">
                            <h3>STORE NAME</h3>
                            <p>123 Main Street</p>
                            <p>State, Zip</p>
                        </div>
                        <div className="receipt-meta">
                            <p><strong>{t("Receipt")} #:</strong> {selectedSale.id}</p>
                            <p><strong>{t("Date")}:</strong> {format(new Date(), 'yyyy-MM-dd')}</p>
                            <p><strong>{t("Customer")}:</strong> {selectedSale.customer_id ? (customers[selectedSale.customer_id]?.name || `${t("Client")} #${selectedSale.customer_id}`) : t('Walk-in Client')}</p>
                            <p><strong>{t("Status")}:</strong> {selectedSale.status}</p>
                        </div>

                        <table className="w-full text-sm my-4">
                            <thead>
                                <tr className="border-b text-left text-gray-500">
                                    <th className="py-2">Item</th>
                                    <th className="py-2 text-center">Qty</th>
                                    <th className="py-2 text-right">Price</th>
                                    <th className="py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedSale.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-dashed">
                                        <td className="py-2">{products[item.product_id]?.name || 'Unknown Product'}</td>
                                        <td className="py-2 text-center">{item.qty}</td>
                                        <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                                        <td className="py-2 text-right">${(item.price * item.qty).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="receipt-total text-right mt-4">
                            <p className="text-gray-500">Subtotal: ${calculateTotal(selectedSale.items).toFixed(2)}</p>
                            <h2 className="text-xl font-bold mt-1">Total: ${calculateTotal(selectedSale.items).toFixed(2)}</h2>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <button className="secondary-btn flex items-center gap-2" onClick={() => print({
                                sale: selectedSale,
                                customer: selectedSale.customer_id ? customers[selectedSale.customer_id] : null,
                                items: selectedSale.items.map(i => ({ ...i, name: products[i.product_id]?.name })),
                                storeInfo: storeSettings
                            })}>
                                <FileText size={16} /> {t("Print Receipt")}
                            </button>
                        </div>
                    </div>
                )}
            </Drawer>

            <style>{`
            .receipt-view {
                padding: 1rem;
                color: #1e293b;
            }
            .receipt-header {
                text-align: center;
                margin-bottom: 2rem;
                border-bottom: 1px dashed #cbd5e1;
                padding-bottom: 1rem;
            }
            .receipt-header h3 { font-weight: 800; letter-spacing: 1px; margin-bottom: 0.2rem; }
            .receipt-header p { font-size: 0.85rem; color: #64748b; }
            .receipt-meta { display: flex; justify-content: space-between; font-size: 0.9rem; }
          `}</style>
        </>
    );
};

export default SalesHistory;
