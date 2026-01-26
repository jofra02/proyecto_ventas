import React, { useState, useEffect } from 'react';
import { MoreHorizontal, ShoppingCart } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';

const RecentTransactionsWidget = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await dashboardService.getRecentSales(5);
                setTransactions(data);
            } catch (err) {
                console.error("Failed to fetch recent sales", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // Helper to format currency
    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between py-2 animate-pulse">
                                <div className="h-8 w-32 bg-gray-200 rounded"></div>
                                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-secondary text-sm">No transactions found.</div>
                ) : (
                    transactions.map(tx => {
                        // Calculate total from items since backend might not send total attribute directly in list view
                        // Wait, list_sales currently returns Sale model which has items.
                        const total = tx.items?.reduce((sum, item) => sum + (item.qty * item.price), 0) || 0;

                        return (
                            <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-800 flex items-center gap-2">
                                        Sale #{tx.id}
                                        {/* Since we don't have customer names populated yet (unless joined), show ID or generic */}
                                        {tx.customer_id ? <span className="text-xs text-blue-500 font-normal">Customer #{tx.customer_id}</span> : <span className="text-xs text-gray-400 font-normal">Walk-in</span>}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {/* Mock time or format created_at if available */}
                                        {tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-800">{formatCurrency(total)}</div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                            tx.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {tx.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RecentTransactionsWidget;
