import React, { useState, useEffect } from 'react';
import { Save, Clock, Globe, Store, CheckCircle2, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { useLanguage } from '../../../i18n/LanguageContext';
import DataLayout from '../../../components/layout/DataLayout';

const SettingsView = () => {
    const { language, changeLanguage, t } = useLanguage();
    const [settings, setSettings] = useState({
        timezone_offset: "0",
        store_name: '',
        store_address: '',
        store_cuit: '',
        store_iva_status: ''
    });
    const [initialSettings, setInitialSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const timezones = [
        { offset: "-12", label: "UTC-12:00 (Baker Island)" },
        { offset: "-11", label: "UTC-11:00 (Samoa)" },
        { offset: "-10", label: "UTC-10:00 (Hawaii)" },
        { offset: "-9", label: "UTC-09:00 (Alaska)" },
        { offset: "-8", label: "UTC-08:00 (Pacific Time)" },
        { offset: "-7", label: "UTC-07:00 (Mountain Time)" },
        { offset: "-6", label: "UTC-06:00 (Mexico City, Central Time)" },
        { offset: "-5", label: "UTC-05:00 (New York, Colombia)" },
        { offset: "-4", label: "UTC-04:00 (Chile, Atlantic Time)" },
        { offset: "-3", label: "UTC-03:00 (Argentina, Brazil)" },
        { offset: "-2", label: "UTC-02:00 (South Georgia)" },
        { offset: "-1", label: "UTC-01:00 (Azores)" },
        { offset: "0", label: "UTC+00:00 (London, GMT)" },
        { offset: "1", label: "UTC+01:00 (Central Europe)" },
        { offset: "2", label: "UTC+02:00 (Eastern Europe, Cairo)" },
        { offset: "3", label: "UTC+03:00 (Moscow, Riyadh)" },
        { offset: "4", label: "UTC+04:00 (Dubai)" },
        { offset: "5", label: "UTC+05:00 (Pakistan, Maldives)" },
        { offset: "6", label: "UTC+06:00 (Bangladesh)" },
        { offset: "7", label: "UTC+07:00 (Thailand, Vietnam)" },
        { offset: "8", label: "UTC+08:00 (China, Singapore, Perth)" },
        { offset: "9", label: "UTC+09:00 (Japan, Korea)" },
        { offset: "10", label: "UTC+10:00 (Sydney, Guam)" },
        { offset: "11", label: "UTC+11:00 (Solomon Islands)" },
        { offset: "12", label: "UTC+12:00 (New Zealand, Fiji)" },
        { offset: "13", label: "UTC+13:00 (Tonga)" },
        { offset: "14", label: "UTC+14:00 (Line Islands)" }
    ];

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const keys = ['timezone_offset', 'store_name', 'store_address', 'store_cuit', 'store_iva_status'];
                const loaded = {};
                await Promise.all(keys.map(async (key) => {
                    const s = await adminService.getSetting(key);
                    if (s && s.value !== undefined) loaded[key] = s.value;
                }));

                const finalSettings = {
                    timezone_offset: loaded.timezone_offset || "0",
                    store_name: loaded.store_name || "",
                    store_address: loaded.store_address || "",
                    store_cuit: loaded.store_cuit || "",
                    store_iva_status: loaded.store_iva_status || ""
                };

                setSettings(finalSettings);
                setInitialSettings(finalSettings);
            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await adminService.updateSettingsBatch(settings);
            setInitialSettings(settings);
            setMessage({ type: 'success', text: t('Settings updated successfully.') });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: t('Failed to save settings. Please try again.') });
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <DataLayout
            title={t('System Settings')}
            subtitle={t('Configure basic information and regional preferences')}
            icon={SettingsIcon}
            actions={
                <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className={`primary-btn flex items-center gap-2 ${!isDirty ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Save size={18} />
                    {saving ? t('Saving...') : t('Save Changes')}
                </button>
            }
        >
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th className="w-1/3">{t('Setting')}</th>
                            <th>{t('Value')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="2" className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </td>
                            </tr>
                        ) : (
                            <>
                                {/* Language Section */}
                                <tr className="bg-gray-50/50">
                                    <td colSpan="2" className="px-6 py-3 border-y border-gray-100">
                                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                                            <Globe size={14} /> {t('Interface Language')}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-700">{t('Display Language')}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => changeLanguage('en')}
                                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${language === 'en'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                English
                                            </button>
                                            <button
                                                onClick={() => changeLanguage('es')}
                                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${language === 'es'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                Español
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* Regional Section */}
                                <tr className="bg-gray-50/50">
                                    <td colSpan="2" className="px-6 py-3 border-y border-gray-100">
                                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                                            <Clock size={14} /> {t('Regional Settings')}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-700">{t('Timezone Offset')}</td>
                                    <td>
                                        <select
                                            value={settings.timezone_offset}
                                            onChange={(e) => updateSetting('timezone_offset', e.target.value)}
                                            className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                                        >
                                            {timezones.map(tz => (
                                                <option key={tz.offset} value={tz.offset}>{tz.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>

                                {/* Fiscal Section */}
                                <tr className="bg-gray-50/50">
                                    <td colSpan="2" className="px-6 py-3 border-y border-gray-100">
                                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                                            <Store size={14} /> {t('Store Fiscal Information')}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-700">{t('Store Name')}</td>
                                    <td>
                                        <input
                                            type="text"
                                            value={settings.store_name}
                                            onChange={(e) => updateSetting('store_name', e.target.value)}
                                            className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                            placeholder="Acme Corp S.A."
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-700">{t('CUIT / CUIL')}</td>
                                    <td>
                                        <input
                                            type="text"
                                            value={settings.store_cuit}
                                            onChange={(e) => updateSetting('store_cuit', e.target.value)}
                                            className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                                            placeholder="30-12345678-9"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-700">{t('Address')}</td>
                                    <td>
                                        <input
                                            type="text"
                                            value={settings.store_address}
                                            onChange={(e) => updateSetting('store_address', e.target.value)}
                                            className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                            placeholder="Street, Number, City..."
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-700">{t('IVA Status')}</td>
                                    <td>
                                        <select
                                            value={settings.store_iva_status}
                                            onChange={(e) => updateSetting('store_iva_status', e.target.value)}
                                            className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                                        >
                                            <option value="">{t('Select status...')}</option>
                                            <option value="IVA RESPONSABLE INSCRIPTO">IVA RESPONSABLE INSCRIPTO</option>
                                            <option value="MONOTRIBUTISTA">MONOTRIBUTISTA</option>
                                            <option value="IVA EXENTO">IVA EXENTO</option>
                                            <option value="CONSUMIDOR FINAL">CONSUMIDOR FINAL</option>
                                        </select>
                                    </td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Notification Messenger */}
            {message && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
                    <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${message.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="font-bold text-sm tracking-tight">{message.text}</span>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes bounce-in {
                    0% { transform: translate(-50%, -100%); }
                    60% { transform: translate(-50%, 20px); }
                    100% { transform: translate(-50%, 0); }
                }
                .animate-bounce-in {
                    animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
            `}</style>
        </DataLayout>
    );
};

export default SettingsView;
