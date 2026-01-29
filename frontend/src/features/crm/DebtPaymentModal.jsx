import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useState } from 'react'; // Added missing import for useState

const DebtPaymentModal = ({ isOpen, onClose, customerId, currentBalance, onSuccess }) => {
    const { showNotification } = useNotification();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Note: We use the general /payments endpoint, but the backend service 
            // will detect the customer_id and post to the ledger automatically.
            await api.post('/finance/payments/', {
                customer_id: customerId,
                amount: parseFloat(amount),
                method: method,
                idempotency_key: `DEBT-${customerId}-${Date.now()}` // Unique key prevents double-charge
            });
            onSuccess();
            showNotification("Payment successful", "success"); // Added success notification
        } catch (err) {
            console.error(err);
            showNotification(err);
        } finally {
            setLoading(false);
            setAmount('');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Register Account Payment">
            <div className="p-4 bg-yellow-50 rounded-lg mb-4 text-center">
                <p className="text-sm text-yellow-800">Current Debt</p>
                <h2 className="text-2xl font-bold text-red-600">${currentBalance.toFixed(2)}</h2>
            </div>

            <form onSubmit={handleSubmit} className="erp-form">
                <div className="input-group">
                    <label>Amount to Pay</label>
                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                        max={currentBalance > 0 ? currentBalance : undefined}
                        // Usually you pay up to the debt, but prepayments might be allowed.
                        autoFocus
                    />
                </div>

                <div className="input-group">
                    <label>Payment Method</label>
                    <select value={method} onChange={e => setMethod(e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="transfer">Transfer</option>
                    </select>
                </div>

                <button type="submit" className="primary-btn w-full state-success" disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm Payment'}
                </button>
            </form>
        </Modal>
    );
};

export default DebtPaymentModal;
