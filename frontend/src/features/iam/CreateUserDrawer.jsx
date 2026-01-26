import React, { useState } from 'react';
import Drawer from '../../components/common/Drawer';
import api from '../../services/api';
import PermissionSelector from './PermissionSelector';

const CreateUserDrawer = ({ isOpen, onClose, onSuccess }) => {
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
            alert("Failed to create user. Username might exist.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title="Create New Staff User">
            <form onSubmit={handleSubmit} className="erp-form h-full flex flex-col">
                <div className="flex-1">
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            required
                            placeholder="e.g. jdoe"
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                            placeholder="••••••••"
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
                </div>

                <div className="pt-4 mt-auto border-t border-gray-100">
                    <button type="submit" className="primary-btn w-full justify-center" disabled={loading}>
                        {loading ? 'Creating...' : 'Create User'}
                    </button>
                </div>
            </form>
        </Drawer>
    );
};

export default CreateUserDrawer;
