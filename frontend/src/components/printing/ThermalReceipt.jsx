import React from 'react';
import { storeConfig } from '../../config/store';
import { format } from 'date-fns';

const ThermalReceipt = ({ sale, customer, items, storeInfo }) => {
    if (!sale) return null;

    const total = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

    return (
        <div className="thermal-receipt">
            {/* Header - REMOVED from top, now at bottom for continuous roll */}
            {/* <div className="header">...</div> */}

            {/* Meta */}
            <div className="meta-row">
                <span>fecha</span>
                <span>hora</span>
                <span>ticket</span>
                <span>caj</span>
            </div>
            <div className="meta-row data">
                <span>{format(new Date(), 'dd-MM-yy')}</span>
                <span>{format(new Date(), 'HH:mm')}</span>
                <span>{sale.id.toString().padStart(8, '0')}</span>
                <span>01</span>
            </div>
            <hr className="dashed" />

            {/* Items */}
            <div className="items">
                {items.map((item, idx) => (
                    <div key={idx} className="item-row">
                        <div className="item-desc">
                            {item.name || 'Articulo Variado'}
                        </div>
                        <div className="item-nums">
                            <span>{(item.qty).toFixed(2)} x ${(item.price).toFixed(2)}</span>
                            <span className="item-total">${(item.qty * item.price).toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="footer">
                <hr className="dashed" />
                <div className="total-row">
                    <span>SUBTOTAL</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                <div className="total-row big">
                    <span>TOTAL</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                <br />
                <div className="total-row">
                    <span>EFECTIVO</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                <div className="total-row">
                    <span>CAMBIO</span>
                    <span>$0.00</span>
                </div>
                <br />
                <br />
                <br />
                <p className="legal">GRACIAS POR SU COMPRA</p>
                <br />
                <br />
                <br />
                <br />
                <br />

                {/* Clean spacer for 5-7mm margin (approx 25px) */}
                <div style={{ height: '25px', width: '100%' }}></div>

                {/* Header for NEXT Ticket (Continuous Roll) */}
                <div className="header" style={{ borderTop: '1px dashed black', paddingTop: '10px' }}>
                    <h2>{storeInfo?.store_name || storeConfig.name}</h2>
                    <p>{storeInfo?.store_address || storeConfig.address}</p>
                    <p>CUIT {storeInfo?.store_cuit || storeConfig.cuit}</p>
                    <p>{storeInfo?.store_iva_status || storeConfig.iva}</p>
                    <p>A CONSUMIDOR FINAL</p>
                    <hr className="dashed" />
                </div>
            </div>
        </div>
    );
};

export default ThermalReceipt;
