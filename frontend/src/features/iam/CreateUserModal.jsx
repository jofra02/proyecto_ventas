import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import PermissionSelector from './PermissionSelector';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../i18n/LanguageContext'; // Added import

const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
    const { showNotification } = useNotification();
    const { t } = useLanguage(); // Added useLanguage hook
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'EMPLOYEE'
    });
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/users', { ...formData, permissions });
            onSuccess();
            setFormData({ username: '', password: '', role: 'EMPLOYEE' }); // Reset
            setPermissions([]);
        } catch (err) {
            console.error(err);
            showNotification(t("Failed to create user. Username might exist."), "error"); // Modified message with t()
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Staff User">
            <form onSubmit={handleSubmit} className="erp-form">
                <div className="input-group">
                    <label>Username</label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Role</label>
                    <select
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="EMPLOYEE">Employee (POS Access)</option>
                        <option value="SUPERVISOR">Supervisor (Manage Stock)</option>
                        <option value="ADMIN">Admin (Full Access)</option>
                    </select>
                </div>

                {formData.role === 'EMPLOYEE' && (
                    <div className="mb-4">
                        <PermissionSelector selected={permissions} onChange={setPermissions} />
                    </div>
                )}

                <button type="submit" className="primary-btn w-full state-success" disabled={loading}>
                    {loading ? 'Creating...' : 'Create User'}
                </button>
            </form>
        </Modal>
    );
};

export default CreateUserModal;
