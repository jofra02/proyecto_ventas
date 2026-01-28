import React, { createContext, useContext, useState, useCallback } from 'react';
import ThermalReceipt from '../components/printing/ThermalReceipt';

const PrintContext = createContext(null);

export const PrintProvider = ({ children }) => {
    const [printData, setPrintData] = useState(null);

    const print = useCallback((data) => {
        setPrintData(data);
        // We wait for React to render the printable area before calling print
        setTimeout(() => {
            window.print();
            // Optional: clear print data after print dialog is closed
            // setPrintData(null); 
        }, 100);
    }, []);

    return (
        <PrintContext.Provider value={{ print }}>
            {children}

            {/* Global Printable Area */}
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
