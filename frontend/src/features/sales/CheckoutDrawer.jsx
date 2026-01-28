import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Drawer from '../../components/common/Drawer';
import { User, Banknote, CreditCard } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNotification } from '../../context/NotificationContext';

const CheckoutDrawer = ({ isOpen, onClose, cart, total, onComplete }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [method, setMethod] = useState('cash');
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Fetch customers for dropdown
            api.get('/customers/').then(res => {
                setCustomers(res.data);
                if (res.data.length > 0) setSelectedCustomer(res.data[0].id);
            });
        }
    }, [isOpen]);

    const handlePay = async () => {
        setLoading(true);
        try {
            // 1. Create Sale
            const salePayload = {
                warehouse_id: 1, // Hardcoded for now, ideal: select from user context/shift
                customer_id: selectedCustomer || null,
                items: cart.map(item => ({
                    product_id: item.id,
                    qty: item.qty,
                    price: item.price
                }))
            };

            const saleRes = await api.post('/sales/', salePayload);
            const saleId = saleRes.data.id;

            // 2. Confirm Sale (Reserves Stock)
            await api.post(`/sales/${saleId}/confirm`);

            // 3. Issue Document (Commits Stock)
            const docRes = await api.post('/documents/issue', { sale_id: saleId });

            // 4. Register Payment
            await api.post('/finance/payments/', {
                customer_id: selectedCustomer || null,
                amount: total,
                method: method,
                idempotency_key: `POS-${saleId}-${Date.now()}`
            });

            const customerObj = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : null;
            onComplete({
                saleId,
                docId: docRes.data.document_id,
                customer: customerObj
            });
            onClose();
        } catch (err) {
            console.error(err);
            showNotification(t("Transaction failed. Check console."), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={t("Complete Sale")} size="md">
            <div className="flex flex-col h-full gap-6">
                <div className="bg-gray-50 p-6 rounded-lg text-center border border-gray-100">
                    <h2 className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</h2>
                    <p className="text-gray-500 text-sm">{t('Total Amount Due')}</p>
                </div>

                <div className="input-group">
                    <label><User size={16} className="inline mr-1" /> {t('Customer')}</label>
                    <select
                        value={selectedCustomer}
                        onChange={e => setSelectedCustomer(e.target.value)}
                    >
                        <option value="">{t('-- Walk-in Client --')}</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.tax_id || 'N/A'})</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <button
                        className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all ${method === 'cash' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                        onClick={() => setMethod('cash')}
                    >
                        <Banknote size={24} />
                        <span className="text-sm font-medium">{t('Cash')}</span>
                    </button>
                    <button
                        className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all ${method === 'transfer' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                        onClick={() => setMethod('transfer')}
                    >
                        <CreditCard size={24} />
                        <span className="text-sm font-medium">{t('Transfer')}</span>
                    </button>
                    <button
                        className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all ${method === 'account' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                        onClick={() => setMethod('account')}
                        disabled={!selectedCustomer}
                        title={!selectedCustomer ? t("Select a customer to use Current Account") : t("Add to Client Debt")}
                    >
                        <User size={24} />
                        <span className="text-sm font-medium">{t('Account')}</span>
                    </button>
                </div>

                <button
                    className="primary-btn w-full mt-auto py-4 text-lg justify-center bg-green-600 hover:bg-green-700"
                    onClick={handlePay}
                    disabled={loading}
                >
                    {loading ? t('Processing...') : `${t('Confirm Payment')} ($${total.toFixed(2)})`}
                </button>
            </div>
        </Drawer>
    );
};

export default CheckoutDrawer;
