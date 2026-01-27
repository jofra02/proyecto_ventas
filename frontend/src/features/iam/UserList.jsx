import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../services/api';
import { Shield, UserPlus } from 'lucide-react';
import CreateUserDrawer from './CreateUserDrawer';
import DataLayout from '../../components/layout/DataLayout';
import StatusBadge from '../../components/common/StatusBadge';
import { useLanguage } from '../../i18n/LanguageContext';

const UserList = () => {
    const { t } = useLanguage();
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
            title={t("User Management (Staff)")}
            subtitle={t("Manage roles and access permissions")}
            icon={Shield}
            actions={
                <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
                    <UserPlus size={18} /> {t('Create User')}
                </button>
            }
        >
            <table className="custom-table">
                <thead>
                    <tr>
                        <th>{t('Username')}</th>
                        <th>{t('Role')}</th>
                        <th>{t('Created At')}</th>
                        <th>{t('Status')}</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="4" className="text-center py-8 text-gray-400">{t('Loading users...')}</td></tr>
                    ) : users.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-gray-400">{t('No users found.')}</td></tr>
                    ) : users.map(u => (
                        <tr key={u.id}>
                            <td className="font-bold text-gray-900">{u.username}</td>
                            <td>
                                <StatusBadge type={u.role === 'ADMIN' ? 'error' : u.role === 'SUPERVISOR' ? 'warning' : 'info'}>
                                    {t(u.role === 'ADMIN' ? 'Admin (Full Access)' : u.role === 'SUPERVISOR' ? 'Supervisor (Manage Stock)' : 'Employee (POS Access)')}
                                </StatusBadge>
                            </td>
                            <td>{format(new Date(u.created_at || Date.now()), 'dd/MM/yyyy')}</td>
                            <td>
                                <StatusBadge type="success">{t('Active')}</StatusBadge>
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
