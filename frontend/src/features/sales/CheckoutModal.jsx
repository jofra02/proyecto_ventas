import { CreditCard, Banknote, User } from 'lucide-react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import Modal from '../../components/common/Modal';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const CheckoutModal = ({ isOpen, onClose, cart, total, onComplete }) => {
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
                customer_id: selectedCustomer,
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
                customer_id: selectedCustomer,
                amount: total,
                method: method,
                idempotency_key: `POS-${saleId}-${Date.now()}`
            });

            onComplete({ saleId, docId: docRes.data.document_id });
            onClose();
        } catch (err) {
            console.error(err);
            // The instruction's code edit had a malformed line here.
            // Assuming the intent was to keep the existing message for CheckoutModal
            // or to add a new one if it was missing.
            // Since it already exists, we ensure it's present and correctly formatted.
            showNotification("Transaction failed. Check console.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t("Complete Sale")}>
            <div className="checkout-summary">
                <h2>{t("Total")}: ${total.toFixed(2)}</h2>
            </div>

            <div className="form-section">
                <label><User size={16} /> {t("Customer")}</label>
                <select
                    value={selectedCustomer}
                    onChange={e => setSelectedCustomer(e.target.value)}
                    className="erp-input"
                >
                    <option value="">-- {t("Walk-in Client")} --</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.tax_id || 'N/A'})</option>
                    ))}
                </select>
            </div>

            <div className="payment-methods">
                <button
                    className={`method-card ${method === 'cash' ? 'active' : ''}`}
                    onClick={() => setMethod('cash')}
                >
                    <Banknote size={24} />
                    <span>{t("Cash")}</span>
                </button>
                <button
                    className={`method-card ${method === 'transfer' ? 'active' : ''}`}
                    onClick={() => setMethod('transfer')}
                >
                    <CreditCard size={24} />
                    <span>{t("Transfer")}</span>
                </button>
                <button
                    className={`method-card ${method === 'account' ? 'active' : ''}`}
                    onClick={() => setMethod('account')}
                    disabled={!selectedCustomer}
                    title={!selectedCustomer ? t("Select a customer to use Current Account") : t("Add to Client Debt")}
                >
                    <User size={24} />
                    <span>{t("On Account")}</span>
                </button>
            </div>

            <button className="primary-btn pay-confirm-btn" onClick={handlePay} disabled={loading}>
                {loading ? t('Processing...') : `${t("Confirm Payment")} ($${total.toFixed(2)})`}
            </button>

            <style>{`
        .checkout-summary {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .checkout-summary h2 {
          font-size: 2rem;
          color: #1e293b;
        }

        .form-section {
          margin-bottom: 1.5rem;
        }
        .form-section label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-weight: 500;
          color: #64748b;
        }

        .erp-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
        }

        .payment-methods {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .method-card {
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 10px;
           padding: 1.5rem;
           border: 2px solid #e2e8f0;
           border-radius: 8px;
           background: white;
           color: #64748b;
        }

        .method-card.active {
          border-color: #10b981;
          background: #ecfdf5;
          color: #10b981;
        }

        .pay-confirm-btn {
          width: 100%;
          padding: 1rem !important;
          font-size: 1.2rem;
          background: #10b981;
        }
      `}</style>
        </Modal>
    );
};

export default CheckoutModal;
