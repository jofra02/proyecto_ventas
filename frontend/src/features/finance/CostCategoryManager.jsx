import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import DataLayout from '../../components/layout/DataLayout';
import Drawer from '../../components/common/Drawer';

const CostCategoryManager = () => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [categories, setCategories] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', default_type: 'fixed_amount' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/finance/categories/');
            setCategories(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                // Update logic would go here if endpoint exists
            } else {
                await api.post('/finance/categories/', formData);
                showNotification(t("Category created"), "success");
            }
            setIsDrawerOpen(false);
            fetchCategories();
            setFormData({ name: '', description: '', default_type: 'fixed_amount' });
        } catch (error) {
            showNotification(t("Error saving category"), "error");
        }
    };

    return (
        <DataLayout
            title={t('Cost Categories')}
            subtitle={t('Manage types of costs (Freight, Taxes, etc.)')}
            actions={
                <button onClick={() => setIsDrawerOpen(true)} className="primary-btn">
                    <Plus size={18} /> {t('Add Category')}
                </button>
            }
        >
            <table className="custom-table">
                <thead>
                    <tr>
                        <th>{t('Name')}</th>
                        <th>{t('Type')}</th>
                        <th>{t('Description')}</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(c => (
                        <tr key={c.id}>
                            <td className="font-bold">{c.name}</td>
                            <td>{c.default_type === 'fixed_amount' ? t('Fixed Amount ($)') : t('Percentage (%)')}</td>
                            <td>{c.description || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={t('Add Cost Category')}>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="input-group">
                        <label>{t('Name')}</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>{t('Type')}</label>
                        <select value={formData.default_type} onChange={e => setFormData({ ...formData, default_type: e.target.value })}>
                            <option value="fixed_amount">{t('Fixed Amount ($)')}</option>
                            <option value="percentage_of_base">{t('Percentage of Base Cost (%)')}</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>{t('Description')}</label>
                        <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <button type="submit" className="primary-btn w-full justify-center">{t('Save')}</button>
                </form>
            </Drawer>
        </DataLayout>
    );
};

export default CostCategoryManager;
