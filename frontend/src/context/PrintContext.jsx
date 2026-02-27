import React, { createContext, useContext, useState, useCallback } from 'react';
import ThermalReceipt from '../components/printing/ThermalReceipt';
import api from '../services/api';
import { useNotification } from './NotificationContext';

const PrintContext = createContext(null);

export const PrintProvider = ({ children }) => {
    const [printData, setPrintData] = useState(null);
    const { showNotification } = useNotification();

    const rawPrint = async (data) => {
        try {
            const configStr = localStorage.getItem('printerConfig');
            if (!configStr) return false;
            const config = JSON.parse(configStr);

            if (!config.enabled) return false;

            // 1. Get RAW bytes from Backend
            const payload = {
                receipt: {
                    store_name: data.storeInfo?.store_name || "Store",
                    store_address: data.storeInfo?.store_address,
                    store_cuit: data.storeInfo?.store_cuit,
                    store_iva: data.storeInfo?.store_iva_status,
                    sale_id: data.sale?.id?.toString() || "0000",
                    date: new Date().toISOString(),
                    customer_name: data.customer?.name,
                    items: data.items.map(i => ({
                        name: i.name,
                        qty: i.qty,
                        price: i.price,
                        total: i.qty * i.price
                    })),
                    subtotal: data.sale?.total || 0,
                    total: data.sale?.total || 0,
                    payments: [{ method: "Efectivo", amount: data.sale?.total || 0 }],
                    qr_data: `https://ip-fiscal.com/${data.sale?.id}` // Example QR
                },
                config: {
                    paper_width: config.paperWidth || 80,
                    feed_lines: config.feedLines || 4,
                    cut_mode: config.cutMode || "partial"
                }
            };

            const backendRes = await api.post('/printing/generate-raw', payload);
            if (!backendRes.data.raw_bytes_base64) throw new Error("No bytes returned");

            // 2. Send to Local Bridge
            const bridgePayload = {
                printer_name: config.printerName,
                data: backendRes.data.raw_bytes_base64
            };

            const bridgeRes = await fetch(`${config.bridgeUrl}/print`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bridgePayload)
            });

            if (!bridgeRes.ok) throw new Error("Bridge error: " + bridgeRes.statusText);

            showNotification("Ticket sent (RAW)", "success");
            return true;

        } catch (e) {
            console.error("RAW Print failed", e);
            showNotification(`RAW failed: ${e.message}. Fallback to browser.`, "warning");
            return false;
        }
    };

    const print = useCallback(async (data) => {
        // Try RAW first
        setPrintData(data); // Needs to be set for fallback, but also maybe used for raw data mapping if refactored

        let sent = false;
        try {
            sent = await rawPrint(data);
        } catch (err) {
            console.error(err);
        }

        if (sent) return;

        // Fallback to Browser Print
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);

    return (
        <PrintContext.Provider value={{ print }}>
            {children}
            <div id="printable-area" style={{ display: printData ? 'block' : 'none' }}>
                {printData && (
                    <ThermalReceipt
                        sale={printData.sale}
                        customer={printData.customer}
                        items={printData.items}
                        storeInfo={printData.storeInfo}
                    />
                )}
            </div>
        </PrintContext.Provider>
    );
};

export const usePrinter = () => {
    const context = useContext(PrintContext);
    if (!context) {
        throw new Error('usePrinter must be used within a PrintProvider');
    }
    return context;
};
