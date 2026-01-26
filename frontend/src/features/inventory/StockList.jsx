import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ReceiveStockDrawer from './ReceiveStockDrawer';
import { Package, ArrowDownLeft } from 'lucide-react';
import DataLayout from '../../components/layout/DataLayout';
import StatusBadge from '../../components/common/StatusBadge';

const StockList = () => {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchStock = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory/stock');
            setStock(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    return (
        <DataLayout
            title="Inventory Management"
            subtitle="Real-time stock levels and tracking"
            icon={Package}
            actions={
                <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
                    <ArrowDownLeft size={18} /> Receive Stock
                </button>
            }
        >
            <table className="custom-table">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Product</th>
                        <th className="text-right">Stock Level</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading stock...</td></tr>
                    ) : stock.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-8 text-gray-400">No inventory data found.</td></tr>
                    ) : stock.map(item => (
                        <tr key={item.product_id}>
                            <td className="font-mono text-sm text-blue-600">{item.sku}</td>
                            <td className="font-medium">{item.name}</td>
                            <td className="text-right font-bold text-lg">
                                {item.quantity}
                            </td>
                            <td>
                                {item.quantity <= 0 ? (
                                    <StatusBadge type="error">Out of Stock</StatusBadge>
                                ) : item.quantity < 10 ? (
                                    <StatusBadge type="warning">Low Stock</StatusBadge>
                                ) : (
                                    <StatusBadge type="success">In Stock</StatusBadge>
                                )}
                            </td>
                            <td>
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View History</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Receive Stock Drawer */}
            {/* Receive Stock Drawer */}
            <ReceiveStockDrawer
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchStock();
                    setIsModalOpen(false);
                }}
            />
        </DataLayout>
    );
};

export default StockList;
