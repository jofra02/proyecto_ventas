import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import CustomerDrawer from './CustomerDrawer';
import { Users, UserPlus, Edit, CreditCard } from 'lucide-react';
import DataLayout from '../../components/layout/DataLayout';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers/');
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCustomers(); }, []);

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const onSuccess = () => {
        setIsModalOpen(false);
        fetchCustomers();
    };

    return (
        <DataLayout
            title="Customer Management"
            subtitle="CRM and Client Database"
            icon={Users}
            actions={
                <button className="primary-btn" onClick={handleCreate}>
                    <UserPlus size={18} /> New Customer
                </button>
            }
        >
            <table className="custom-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Tax ID / VAT</th>
                        <th>Email</th>
                        <th className="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="4" className="text-center py-8 text-gray-400">Loading customers...</td></tr>
                    ) : customers.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-gray-400">No customers found.</td></tr>
                    ) : customers.map(c => (
                        <tr key={c.id}>
                            <td className="font-semibold text-gray-900">{c.name}</td>
                            <td className="font-mono text-sm text-gray-600">{c.tax_id || '-'}</td>
                            <td className="text-gray-600">{c.email || '-'}</td>
                            <td className="text-right flex justify-end gap-2">
                                <button className="text-gray-500 hover:text-blue-600" onClick={() => handleEdit(c)} title="Edit">
                                    <Edit size={16} />
                                </button>
                                <a href={`/customers/${c.id}/account`} className="text-blue-600 hover:text-blue-800" title="View Account/Debt">
                                    <CreditCard size={16} />
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <CustomerDrawer
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                customer={editingCustomer}
                onSuccess={onSuccess}
            />
        </DataLayout>
    );
};

export default CustomerList;
