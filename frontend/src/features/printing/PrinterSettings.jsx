import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { Settings, Printer, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const PrinterSettings = () => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    
    // Default config
    const [config, setConfig] = useState(() => {
        const saved = localStorage.getItem('printerConfig');
        return saved ? JSON.parse(saved) : {
            enabled: false,
            bridgeUrl: 'http://localhost:3001',
            printerName: '',
            paperWidth: 80,
            feedLines: 4,
            cutMode: 'partial'
        };
    });

    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bridgeStatus, setBridgeStatus] = useState('unknown'); // unknown, online, offline

    useEffect(() => {
        checkBridge();
    }, [config.bridgeUrl]);

    const checkBridge = async () => {
        try {
            const res = await fetch(`${config.bridgeUrl}/health`);
            if (res.ok) {
                setBridgeStatus('online');
                fetchPrinters();
            } else {
                setBridgeStatus('offline');
            }
        } catch (e) {
            setBridgeStatus('offline');
        }
    };

    const fetchPrinters = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${config.bridgeUrl}/printers`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setPrinters(data);
            }
        } catch (e) {
            console.error("Failed to fetch printers", e);
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = () => {
        localStorage.setItem('printerConfig', JSON.stringify(config));
        showNotification(t('Settings saved'), 'success');
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Printer className="text-blue-500" />
                {t('Thermal Printer Configuration')}
            </h2>

            <div className="space-y-6">
                
                {/* Enable Toggle */}
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="printEnabled"
                        checked={config.enabled}
                        onChange={e => setConfig({...config, enabled: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded"
                    />
                    <label htmlFor="printEnabled" className="font-medium">{t('Enable RAW Thermal Printing')}</label>
                </div>

                {/* Bridge Connection */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('Bridge URL')}</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border p-2 rounded" 
                            value={config.bridgeUrl}
                            onChange={e => setConfig({...config, bridgeUrl: e.target.value})}
                        />
                        <button onClick={checkBridge} className="bg-gray-200 px-3 rounded hover:bg-gray-300">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                    
                    <div className="mt-2 text-sm flex items-center gap-2">
                        Status: 
                        {bridgeStatus === 'online' ? (
                            <span className="text-green-600 flex items-center gap-1 font-bold"><CheckCircle size={14}/> {t('Connected')}</span>
                        ) : (
                            <span className="text-red-500 flex items-center gap-1 font-bold"><AlertTriangle size={14}/> {t('Bridge Offline')} (Run tools/printer_bridge.py)</span>
                        )}
                    </div>
                </div>

                {/* Printer Selection */}
                {config.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Select Printer')}</label>
                            <select 
                                className="w-full border p-2 rounded bg-white"
                                value={config.printerName}
                                onChange={e => setConfig({...config, printerName: e.target.value})}
                                disabled={bridgeStatus !== 'online'}
                            >
                                <option value="">{t('-- Select Printer --')}</option>
                                {printers.map((p, i) => (
                                    <option key={i} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                            {bridgeStatus === 'offline' && (
                                <input 
                                    type="text" 
                                    placeholder={t('Or type printer name manually')}
                                    className="w-full border p-2 rounded mt-2 text-sm"
                                    value={config.printerName}
                                    onChange={e => setConfig({...config, printerName: e.target.value})}
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Paper Width')}</label>
                            <select 
                                className="w-full border p-2 rounded bg-white"
                                value={config.paperWidth}
                                onChange={e => setConfig({...config, paperWidth: parseInt(e.target.value)})}
                            >
                                <option value={80}>80mm (Standard)</option>
                                <option value={58}>58mm (Narrow)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Feed Lines (Bottom Margin)')}</label>
                            <input 
                                type="number" 
                                className="w-full border p-2 rounded"
                                value={config.feedLines}
                                onChange={e => setConfig({...config, feedLines: parseInt(e.target.value)})}
                                min="0" max="10"
                            />
                        </div>

                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Cut Mode')}</label>
                            <select 
                                className="w-full border p-2 rounded bg-white"
                                value={config.cutMode}
                                onChange={e => setConfig({...config, cutMode: e.target.value})}
                            >
                                <option value="partial">{t('Partial Cut')}</option>
                                <option value="full">{t('Full Cut')}</option>
                            </select>
                        </div>
                    </div>
                )}

                <button 
                    onClick={saveConfig} 
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold"
                >
                    {t('Save Configuration')}
                </button>
            </div>
        </div>
    );
};

export default PrinterSettings;
