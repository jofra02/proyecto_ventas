import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CreditCard, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const PaymentList = () => {
    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState({});
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ cash: 0, transfer: 0, total: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [payRes, custRes] = await Promise.all([
                    api.get('/payments/'),
                    api.get('/customers/')
                ]);

                const custMap = {};
                custRes.data.forEach(c => custMap[c.id] = c);
                setCustomers(custMap);
                setPayments(payRes.data);

                // Calculate Daily Stats
                const today = new Date().toDateString();
                const todays = payRes.data.filter(p => new Date(p.created_at).toDateString() === today);

                const cash = todays.filter(p => p.method === 'cash').reduce((acc, p) => acc + p.amount, 0);
                const transfer = todays.filter(p => p.method === 'transfer').reduce((acc, p) => acc + p.amount, 0);

                setStats({ cash, transfer, total: cash + transfer });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="erp-module">
            <div className="module-header">
                <div className="header-title">
                    <CreditCard size={24} className="text-secondary" />
                    <h1>Treasury & Payments</h1>
                </div>
            </div>

            {/* Daily Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card stat-card bg-green-50 border-green-200">
                    <div className="stat-label text-green-700">Today's Cash</div>
                    <div className="stat-value text-green-800">${stats.cash.toFixed(2)}</div>
                </div>
                <div className="card stat-card bg-blue-50 border-blue-200">
                    <div className="stat-label text-blue-700">Today's Transfers</div>
                    <div className="stat-value text-blue-800">${stats.transfer.toFixed(2)}</div>
                </div>
                <div className="card stat-card bg-gray-50 border-gray-200">
                    <div className="stat-label text-gray-700">Total Inflow</div>
                    <div className="stat-value text-gray-800">${stats.total.toFixed(2)}</div>
                </div>
            </div>

            <div className="erp-table-container">
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Method</th>
                            <th className="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map(p => (
                            <tr key={p.id}>
                                <td>{format(new Date(p.created_at), 'dd/MM/yyyy HH:mm')}</td>
                                <td>{customers[p.customer_id]?.name || `ID: ${p.customer_id}`}</td>
                                <td>
                                    <span className={`badge ${p.method === 'cash' ? 'badge-success' : 'badge-info'}`}>
                                        {p.method.toUpperCase()}
                                    </span>
                                </td>
                                <td className="text-right font-mono font-bold">
                                    ${p.amount.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && !loading && (
                            <tr><td colSpan="4" className="text-center py-8 text-gray-400">No payments found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                .stat-card { padding: 1.5rem; border-width: 1px; }
                .stat-label { font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
                .stat-value { font-size: 2rem; font-weight: 800; }
            `}</style>
        </div>
    );
};

export default PaymentList;
