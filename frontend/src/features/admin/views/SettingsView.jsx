import React, { useState, useEffect } from 'react';
import { Save, Clock } from 'lucide-react';
import { adminService } from '../../../services/adminService';

const SettingsView = () => {
    const [timezoneOffset, setTimezoneOffset] = useState("0");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const setting = await adminService.getSetting('timezone_offset');
                if (setting && setting.value) setTimezoneOffset(setting.value);
            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await adminService.updateSetting('timezone_offset', timezoneOffset, "Global Timezone Offset in Hours");
            setMessage({ type: 'success', text: 'Timezone updated successfully. Charts will reflect this on refresh.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>

            {/* Timezone Card */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Regional Settings</h3>
                        <p className="text-gray-500 text-sm">Configure how time is handled across the platform.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone Offset (Hours)</label>
                        <select
                            value={timezoneOffset}
                            onChange={(e) => setTimezoneOffset(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="0">UTC (GMT+0)</option>
                            <option value="-3">UTC-3 (Argentina, Brazil East)</option>
                            <option value="-4">UTC-4 (Chile, Eastern US)</option>
                            <option value="-5">UTC-5 (New York, Colombia)</option>
                            <option value="-6">UTC-6 (Mexico City)</option>
                            <option value="+1">UTC+1 (Central Europe)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Current offset: <strong>{timezoneOffset} hours</strong> relative to UTC.
                        </p>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${saving ? 'opacity-50' : ''}`}
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
