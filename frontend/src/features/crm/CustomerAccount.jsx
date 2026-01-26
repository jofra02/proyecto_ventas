import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import DebtPaymentModal from './DebtPaymentModal';

const CustomerAccount = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ledger, setLedger] = useState([]);
    const [balance, setBalance] = useState(0);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [custRes, balRes, legRes] = await Promise.all([
                api.get('/customers/'), // Ineffiecient to fetch all, but simplest without specific ID endpoint
                api.get(`/accounts-receivable/${id}/balance`),
                api.get(`/accounts-receivable/${id}/ledger`)
            ]);

            setCustomer(custRes.data.find(c => c.id === parseInt(id)));
            setBalance(balRes.data.balance);
            setLedger(legRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    const handlePaymentSuccess = () => {
        setIsPayModalOpen(false);
        fetchData(); // Refresh balance
    };

    return (
        <div className="erp-module">
            <div className="module-header">
                <div className="header-title">
                    <button className="icon-btn mr-2" onClick={() => navigate('/customers')}>
                        <ArrowLeft size={20} />
                    </button>
                    <Wallet size={24} className="text-secondary" />
                    <h1>{customer ? `${customer.name}'s Account` : 'Account Details'}</h1>
                </div>
                <div className="flex gap-4 items-center">
                    <div className={`text-xl font-bold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        Balance: ${balance.toFixed(2)}
                    </div>
                    <button className="primary-btn" onClick={() => setIsPayModalOpen(true)}>
                        <DollarSign size={18} /> Register Payment
                    </button>
                </div>
            </div>

            <div className="erp-table-container">
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Reference</th>
                            <th>Type</th>
                            <th className="text-right">Debit (+Debt)</th>
                            <th className="text-right">Credit (-Pay)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledger.map((entry) => {
                            const isDebit = entry.amount > 0;
                            return (
                                <tr key={entry.id}>
                                    <td>{format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}</td>
                                    <td className="font-mono text-sm">{entry.reference_id}</td>
                                    <td>
                                        <span className={`badge ${entry.type === 'INVOICE' ? 'badge-warning' : 'badge-success'}`}>
                                            {entry.type}
                                        </span>
                                    </td>
                                    <td className="text-right font-mono text-red-500">
                                        {isDebit ? `$${entry.amount.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="text-right font-mono text-green-600">
                                        {!isDebit ? `$${Math.abs(entry.amount).toFixed(2)}` : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                        {ledger.length === 0 && (
                            <tr><td colSpan="5" className="text-center py-4 text-gray-400">No movements yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <DebtPaymentModal
                isOpen={isPayModalOpen}
                onClose={() => setIsPayModalOpen(false)}
                customerId={parseInt(id)}
                currentBalance={balance}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
};

export default CustomerAccount;
