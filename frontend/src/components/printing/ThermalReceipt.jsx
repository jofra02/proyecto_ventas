import React from 'react';
import { storeConfig } from '../../config/store';
import { format } from 'date-fns';

const ThermalReceipt = ({ sale, customer, items }) => {
    if (!sale) return null;

    const total = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

    return (
        <div className="thermal-receipt">
            {/* Header */}
            <div className="header">
                <h2>{storeConfig.name}</h2>
                <p>{storeConfig.address}</p>
                <p>CUIT {storeConfig.cuit}</p>
                <p>{storeConfig.iva}</p>
                <p>A CONSUMIDOR FINAL</p>
                <hr className="dashed" />
            </div>

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
                <p className="legal">GRACIAS POR SU COMPRA</p>
            </div>
        </div>
    );
};

export default ThermalReceipt;
