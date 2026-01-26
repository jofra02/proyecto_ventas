import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, UserPlus, Shield } from 'lucide-react';
import { format } from 'date-fns';
import CreateUserDrawer from './CreateUserDrawer';
import DataLayout from '../../components/layout/DataLayout';
import StatusBadge from '../../components/common/StatusBadge';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const onSuccess = () => {
        setIsModalOpen(false);
        fetchUsers();
    };

    return (
        <DataLayout
            title="User Management (Staff)"
            subtitle="Manage roles and access permissions"
            icon={Shield}
            actions={
                <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
                    <UserPlus size={18} /> Create User
                </button>
            }
        >
            <table className="custom-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created At</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="4" className="text-center py-8 text-gray-400">Loading users...</td></tr>
                    ) : users.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-gray-400">No users found.</td></tr>
                    ) : users.map(u => (
                        <tr key={u.id}>
                            <td className="font-bold text-gray-900">{u.username}</td>
                            <td>
                                <StatusBadge type={u.role === 'ADMIN' ? 'error' : u.role === 'SUPERVISOR' ? 'warning' : 'info'}>
                                    {u.role}
                                </StatusBadge>
                            </td>
                            <td>{format(new Date(u.created_at || Date.now()), 'dd/MM/yyyy')}</td>
                            <td>
                                <StatusBadge type="success">Active</StatusBadge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <CreateUserDrawer
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={onSuccess}
            />
        </DataLayout>
    );
};

export default UserList;
