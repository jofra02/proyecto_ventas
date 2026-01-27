import api from './api';

export const adminService = {
    getSetting: async (key) => {
        const response = await api.get(`/admin/settings/${key}`);
        return response.data;
    },

    updateSetting: async (key, value, description) => {
        const response = await api.post(`/admin/settings/${key}`, { value, description });
        return response.data;
    },

    updateSettingsBatch: async (settingsMap) => {
        const response = await api.post(`/admin/settings/batch/update`, { settings: settingsMap });
        return response.data;
    }
};
