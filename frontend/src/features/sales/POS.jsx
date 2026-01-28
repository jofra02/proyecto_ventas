import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Minus, Plus, Trash2, LayoutGrid, List, Package, Calculator, Box } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import POSLayout from './POSLayout';
import CheckoutDrawer from './CheckoutDrawer';
import { usePrinter } from '../../context/PrintContext';
import { formatPackStock } from '../../utils/format';
import '../../assets/print.css';

const POS = () => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const { print } = usePrinter();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [stockMap, setStockMap] = useState({}); // { productId: qty }
    const [cart, setCart] = useState([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [lastSale, setLastSale] = useState(null);
    const [storeSettings, setStoreSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedFractionalProduct, setSelectedFractionalProduct] = useState(null);
    const [selectedPackProduct, setSelectedPackProduct] = useState(null);
    const [weightInput, setWeightInput] = useState('0');
    const [packUnitsInput, setPackUnitsInput] = useState('1');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, stockRes, nameRes, addrRes, cuitRes, ivaRes] = await Promise.all([
                    api.get('/products/'),
                    api.get('/inventory/stock'),
                    api.get('/admin/settings/store_name').catch(() => ({ data: { value: '' } })),
                    api.get('/admin/settings/store_address').catch(() => ({ data: { value: '' } })),
                    api.get('/admin/settings/store_cuit').catch(() => ({ data: { value: '' } })),
                    api.get('/admin/settings/store_iva_status').catch(() => ({ data: { value: '' } }))
                ]);

                setStoreSettings({
                    store_name: nameRes.data.value,
                    store_address: addrRes.data.value,
                    store_cuit: cuitRes.data.value,
                    store_iva_status: ivaRes.data.value
                });

                // Create stock map for faster lookup
                const sMap = {};
                stockRes.data.forEach(s => {
                    sMap[s.product_id] = s.quantity;
                });
                setStockMap(sMap);
                setProducts(prodRes.data);
            } catch (error) {
                console.error("Failed to load POS data", error);
                showNotification("Failed to load POS data", {
                    type: "error",
                    action: {
                        label: t("Retry"),
                        onClick: fetchData
                    }
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const addToCart = (product) => {
        const currentStock = stockMap[product.id] || 0;
        const existingItem = cart.find(item => item.id === product.id);
        const currentQty = existingItem ? existingItem.qty : 0;

        if (product.product_type === 'fractional') {
            setSelectedFractionalProduct(product);
            setWeightInput('0');
            return;
        }

        if (product.product_type === 'pack') {
            setSelectedPackProduct(product);
            setPackUnitsInput('1');
            return;
        }

        if (currentQty + 1 > currentStock) {
            showNotification(t('Only {stock} {uom} available!').replace('{stock}', currentStock).replace('{uom}', t(product.unit_of_measure || 'unit')), 'warning');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const confirmFractionalAdd = () => {
        if (!selectedFractionalProduct) return;
        const qty = parseFloat(weightInput);
        if (isNaN(qty) || qty <= 0) {
            showNotification(t("Please enter a valid weight/volume"), "warning");
            return;
        }

        const currentStock = stockMap[selectedFractionalProduct.id] || 0;
        const existingItem = cart.find(item => item.id === selectedFractionalProduct.id);
        const currentQty = existingItem ? existingItem.qty : 0;

        if (currentQty + qty > currentStock) {
            showNotification(t('Only {stock} {uom} available!').replace('{stock}', currentStock).replace('{uom}', t(selectedFractionalProduct.unit_of_measure || 'unit')), 'warning');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === selectedFractionalProduct.id);
            if (existing) {
                return prev.map(item =>
                    item.id === selectedFractionalProduct.id ? { ...item, qty: item.qty + qty } : item
                );
            }
            return [...prev, { ...selectedFractionalProduct, qty: qty }];
        });
        setSelectedFractionalProduct(null);
    };

    const confirmPackAdd = (mode) => {
        if (!selectedPackProduct) return;

        // mode: 'pack' or 'unit'
        // If the user has 3 packs, stock = 3. 
        // Selling 1 pack = adding 1.0. 
        // Selling 1 unit = adding (1 / mv).
        const mv = parseFloat(selectedPackProduct.measurement_value) || 1;
        let qtyToAdd = 0;

        if (mode === 'pack') {
            qtyToAdd = 1;
        } else {
            const units = parseInt(packUnitsInput);
            if (isNaN(units) || units <= 0) {
                showNotification(t("Please enter a valid quantity"), "warning");
                return;
            }
            qtyToAdd = units / mv;
        }

        const currentStock = parseFloat(stockMap[selectedPackProduct.id]) || 0;
        const existingItem = cart.find(item => item.id === selectedPackProduct.id);
        const currentQty = existingItem ? parseFloat(existingItem.qty) : 0;

        // Use a small epsilon for float comparison
        if (currentQty + qtyToAdd > currentStock + 0.0001) {
            showNotification(t('Only {stock} available!').replace('{stock}', currentStock), 'warning');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === selectedPackProduct.id);
            if (existing) {
                return prev.map(item =>
                    item.id === selectedPackProduct.id ? { ...item, qty: item.qty + qtyToAdd } : item
                );
            }
            return [...prev, { ...selectedPackProduct, qty: qtyToAdd }];
        });
        setSelectedPackProduct(null);
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                let actualDelta = delta;
                if (item.product_type === 'pack' && item.measurement_value) {
                    const mv = parseFloat(item.measurement_value) || 1;
                    // If delta is 1 (unitary increment), for a pack it means 1 bottle = 1/mv packs
                    if (Math.abs(delta) === 1) {
                        actualDelta = delta > 0 ? (1 / mv) : (-1 / mv);
                    }
                }

                // Use rounding to avoid floating point errors
                let newQty = Math.round((item.qty + actualDelta) * 1000000) / 1000000;

                if (newQty < 0.001) return item; // Don't allow 0 or negative via buttons

                // Check stock limit if increasing
                if (delta > 0) {
                    const currentStock = stockMap[item.id] || 0;
                    if (newQty > currentStock) {
                        showNotification(t('Cannot add more. Stock limit: {stock} {uom}').replace('{stock}', currentStock).replace('{uom}', t(item.unit_of_measure || 'unit')), 'warning');
                        return item;
                    }
                }
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const [showSuccess, setShowSuccess] = useState(false);

    const handleTransactionComplete = (result) => {
        setLastSale({
            ...result,
            id: result.saleId, // ThermalReceipt expects sale.id
            items: [...cart],
            total: total,
            date: new Date()
        });
        setCart([]);
        setIsCheckoutOpen(false);
        setShowSuccess(true);
        // Refresh stock after sale
        api.get('/inventory/stock').then(res => {
            const sMap = {};
            res.data.forEach(s => {
                sMap[s.product_id] = s.quantity;
            });
            setStockMap(sMap);
        });
    };

    const startNewSale = () => {
        setShowSuccess(false);
        setLastSale(null);
    };

    const handlePrint = () => {
        if (lastSale) {
            print({
                sale: lastSale,
                customer: lastSale.customer,
                items: lastSale.items,
                storeInfo: storeSettings
            });
        }
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    return (
        <POSLayout>
            <div className="pos-grid">
                {/* Left: Product Selection */}
                <div className="products-panel">
                    <div className="panel-header">
                        <div className="panel-info">
                            <h3>{t('Products')}</h3>
                            <span className="count-badge">{products.length} {t('items')}</span>
                        </div>
                        <div className="view-toggle">
                            <button
                                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title={t('Grid View')}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title={t('List View')}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>

                    {viewMode === 'grid' ? (
                        <div className="grid-products">
                            {products.map(p => {
                                const stock = stockMap[p.id] || 0;
                                const isOOS = stock <= 0;
                                return (
                                    <div
                                        key={p.id}
                                        className={`product-card ${isOOS ? 'oos' : ''}`}
                                        onClick={() => !isOOS && addToCart(p)}
                                    >
                                        <div className="p-image-placeholder text-center flex-col">
                                            <span className="text-2xl">{p.name.substring(0, 2).toUpperCase()}</span>
                                            <span className="text-[10px] text-gray-400 font-mono mt-1 opacity-50">{p.sku}</span>
                                            {isOOS && <div className="oos-overlay">{t('OUT OF STOCK')}</div>}
                                        </div>
                                        <div className="p-info">
                                            <h4 className="truncate flex items-center gap-1" title={p.name}>
                                                {p.product_type === 'fractional' && <Calculator size={12} className="text-blue-500" />}
                                                {p.product_type === 'pack' && <Box size={12} className="text-orange-500" />}
                                                {p.name}
                                                {p.measurement_value && (
                                                    <span className="text-[8px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100 font-bold shrink-0">
                                                        {p.measurement_value}{p.measurement_unit}
                                                    </span>
                                                )}
                                            </h4>
                                            <div className="p-meta">
                                                <div className="flex flex-col">
                                                    <span className="p-price">${p.price.toFixed(2)}</span>
                                                    <span className="text-[9px] text-gray-400 -mt-1 uppercase tracking-tighter">/ {t(p.unit_of_measure || 'unit')}</span>
                                                </div>
                                                <span className={`p-stock ${stock < 5 ? 'low-stock' : ''}`}>
                                                    {p.product_type === 'pack' ? (
                                                        formatPackStock(stock, p.measurement_value)
                                                    ) : (
                                                        `${stock} ${t(p.unit_of_measure || 'unit')}`
                                                    )}
                                                    {p.product_type === 'pack' && p.measurement_value && (
                                                        <span className="block text-[8px] opacity-75">
                                                            ({Math.round(stock * p.measurement_value)} {t('units')})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="list-products">
                            <table className="compact-table">
                                <thead>
                                    <tr>
                                        <th>{t('Product')}</th>
                                        <th className="text-right">{t('Price')}</th>
                                        <th className="text-center">{t('Stock')}</th>
                                        <th className="text-right">{t('Action')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => {
                                        const stock = stockMap[p.id] || 0;
                                        const isOOS = stock <= 0;
                                        return (
                                            <tr key={p.id} className={isOOS ? 'oos-row' : ''}>
                                                <td className="p-name-cell">
                                                    <div className="p-avatar">{p.name.substring(0, 1).toUpperCase()}</div>
                                                    <div>
                                                        <div className="font-bold flex items-center gap-1">
                                                            {p.product_type === 'fractional' && <Calculator size={12} className="text-blue-500" />}
                                                            {p.product_type === 'pack' && <Box size={12} className="text-orange-500" />}
                                                            {p.name}
                                                            {p.measurement_value && (
                                                                <span className="text-[8px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100 font-bold">
                                                                    {p.measurement_value}{p.measurement_unit}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{p.sku}</div>
                                                    </div>
                                                </td>
                                                <td className="text-right">
                                                    <div className="font-mono font-bold">${p.price.toFixed(2)}</div>
                                                    <div className="text-[10px] text-gray-400 uppercase tracking-tighter">/ {t(p.unit_of_measure || 'unit')}</div>
                                                </td>
                                                <td className="text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`stock-indicator ${stock < 5 ? 'low' : ''}`}>
                                                            {p.product_type === 'pack' ? (
                                                                formatPackStock(stock, p.measurement_value)
                                                            ) : (
                                                                `${stock} ${t(p.unit_of_measure || 'unit')}`
                                                            )}
                                                        </span>
                                                        {p.product_type === 'pack' && p.measurement_value && (
                                                            <span className="text-[9px] text-gray-400 mt-0.5">
                                                                ({Math.round(stock * p.measurement_value)} {t('units')})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        className="add-btn-small"
                                                        onClick={() => addToCart(p)}
                                                        disabled={isOOS}
                                                    >
                                                        {isOOS ? t('Sold Out') : t('Add')}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right: Cart & Checkout */}
                <div className="cart-panel">
                    <div className="cart-header">
                        <h3>{t('Current Order')}</h3>
                        <button className="clear-btn" onClick={() => setCart([])}>{t('Clear All')}</button>
                    </div>

                    <div className="cart-items custom-scrollbar">
                        {cart.length === 0 && <div className="empty-msg">{t('Cart is empty')}</div>}
                        {cart.map(item => (
                            <div key={item.id} className="cart-item">
                                <div className="item-name">
                                    <span className="flex items-center gap-1">
                                        {item.product_type === 'fractional' && <Calculator size={12} className="text-blue-500" />}
                                        {item.product_type === 'pack' && <Box size={12} className="text-orange-500" />}
                                        {item.name}
                                        {item.product_type === 'pack' && item.measurement_value && (
                                            <span className="text-[10px] ml-2 text-orange-600 font-bold">
                                                {formatPackStock(item.qty, item.measurement_value)}
                                            </span>
                                        )}
                                        {item.product_type !== 'pack' && item.measurement_value && (
                                            <span className="text-[8px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100 font-bold">
                                                {item.measurement_value}{item.measurement_unit}
                                            </span>
                                        )}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <small>${item.price.toFixed(2)}</small>
                                        <small className="text-[10px] text-gray-400">/ {t(item.unit_of_measure || 'unit')}</small>
                                    </div>
                                </div>
                                <div className="item-controls">
                                    <button
                                        className="icon-btn"
                                        onClick={() => updateQty(item.id, - (item.product_type === 'fractional' ? 0.1 : 1))}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <div className="flex flex-col items-center w-16">
                                        <input
                                            type="number"
                                            className="w-full text-center bg-transparent border-none font-bold text-sm focus:outline-none focus:ring-1 focus:ring-blue-200 rounded px-1"
                                            value={item.qty}
                                            step={item.product_type === 'fractional' ? "0.001" : "1"}
                                            min="0"
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val) && val >= 0) {
                                                    setCart(prev => prev.map(p =>
                                                        p.id === item.id ? { ...p, qty: val } : p
                                                    ));
                                                }
                                            }}
                                        />
                                        <span className="text-[8px] text-gray-400 uppercase tracking-tighter">{t(item.unit_of_measure || 'unit')}</span>
                                    </div>
                                    <button
                                        className="icon-btn"
                                        onClick={() => updateQty(item.id, (item.product_type === 'fractional' ? 0.1 : 1))}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="item-total">
                                    ${(item.price * item.qty).toFixed(2)}
                                </div>
                                <button className="del-btn" onClick={() => removeFromCart(item.id)}><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="cart-footer">
                        <div className="totals-row">
                            <span>{t('Subtotal')}</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="totals-row total-big">
                            <span>{t('Total')}</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <button
                            className="pay-btn"
                            disabled={cart.length === 0}
                            onClick={() => setIsCheckoutOpen(true)}
                        >
                            {t('PAY NOW')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Weight/Fractional Modal */}
            {selectedFractionalProduct && (
                <div className="modal-overlay">
                    <div className="modal-content weight-modal p-0 overflow-hidden max-w-sm w-full">
                        <div className="bg-blue-600 p-6 text-white">
                            <h3 className="text-lg font-bold uppercase tracking-wider">{selectedFractionalProduct.name}</h3>
                            <div className="flex items-baseline gap-2 mt-4">
                                <span className="text-4xl font-mono font-bold">{weightInput}</span>
                                <span className="text-xl opacity-75">{t(selectedFractionalProduct.unit_of_measure)}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-white">
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '.', 'C'].map(btn => (
                                    <button
                                        key={btn}
                                        type="button"
                                        onClick={() => {
                                            if (btn === 'C') setWeightInput('0');
                                            else if (btn === '.') {
                                                if (!weightInput.includes('.')) setWeightInput(weightInput + '.');
                                            } else {
                                                setWeightInput(weightInput === '0' ? btn.toString() : weightInput + btn);
                                            }
                                        }}
                                        className="h-14 flex items-center justify-center text-xl font-bold bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100 text-gray-800"
                                    >
                                        {btn}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="secondary-btn py-3" onClick={() => setSelectedFractionalProduct(null)}>{t('Cancel')}</button>
                                <button className="primary-btn py-3" onClick={confirmFractionalAdd}>{t('Add to Cart')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Pack Selection Modal */}
            {selectedPackProduct && (
                <div className="modal-overlay">
                    <div className="modal-content p-0 overflow-hidden max-w-sm w-full">
                        <div className="bg-orange-500 p-6 text-white">
                            <h3 className="text-lg font-bold uppercase tracking-wider">{selectedPackProduct.name}</h3>
                            <p className="text-sm opacity-90">{t('Pack contains')} {selectedPackProduct.measurement_value} {t('units')}</p>
                        </div>

                        <div className="p-6 bg-white space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    className="flex flex-col items-center justify-center p-4 border-2 border-orange-100 hover:border-orange-500 hover:bg-orange-50 rounded-xl transition-all group w-full"
                                    onClick={() => confirmPackAdd('pack')}
                                >
                                    <Box size={32} className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-gray-800">{t('Sell Full Pack')}</span>
                                    <span className="text-xs text-gray-400">({selectedPackProduct.measurement_value} {t('units')})</span>
                                </button>

                                <div className="relative py-2">
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center px-4">
                                        <div className="w-full border-t border-gray-100"></div>
                                        <span className="px-3 text-[10px] text-gray-300 font-bold uppercase tracking-widest bg-white">{t('OR')}</span>
                                        <div className="w-full border-t border-gray-100"></div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{t('Sell Individual Units')}</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 flex items-center bg-gray-50 rounded-lg border border-gray-100 px-3">
                                            <Minus
                                                size={18}
                                                className="text-gray-400 cursor-pointer hover:text-orange-500"
                                                onClick={() => setPackUnitsInput(Math.max(1, parseInt(packUnitsInput) - 1).toString())}
                                            />
                                            <input
                                                type="number"
                                                className="w-full text-center bg-transparent border-none font-bold text-lg py-2 focus:outline-none"
                                                value={packUnitsInput}
                                                onChange={(e) => setPackUnitsInput(e.target.value)}
                                            />
                                            <Plus
                                                size={18}
                                                className="text-gray-400 cursor-pointer hover:text-orange-500"
                                                onClick={() => setPackUnitsInput((parseInt(packUnitsInput) + 1).toString())}
                                            />
                                        </div>
                                        <button
                                            className="px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors"
                                            onClick={() => confirmPackAdd('unit')}
                                        >
                                            {t('Add')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="w-full py-2 text-gray-400 hover:text-gray-600 font-semibold text-sm transition-colors"
                                onClick={() => setSelectedPackProduct(null)}
                            >
                                {t('Cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Drawer */}
            <CheckoutDrawer
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                cart={cart}
                total={total}
                onComplete={handleTransactionComplete}
            />

            {/* Success Modal */}
            {showSuccess && (
                <div className="modal-overlay">
                    <div className="modal-content success-modal">
                        <div className="success-icon">✓</div>
                        <h2>{t('Sale Completed!')}</h2>
                        <p>{t('Invoice #')}{lastSale?.docId}</p>
                        <div className="success-actions">
                            <button className="secondary-btn" onClick={handlePrint}>{t('Print Receipt')}</button>
                            <button className="primary-btn" onClick={startNewSale}>{t('New Sale')}</button>
                        </div>
                    </div>
                </div>
            )}


            <style>{`
        .pos-grid {
          display: flex;
          height: 100%;
          background: #f8fafc;
        }

        .products-panel {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .panel-info h3 { margin: 0; color: #0f172a; font-weight: 800; }
        .count-badge { font-size: 0.8rem; color: #64748b; font-weight: 500; }

        .view-toggle {
            display: flex;
            background: #e2e8f0;
            padding: 4px;
            border-radius: 8px;
            gap: 4px;
        }

        .toggle-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            color: #64748b;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .toggle-btn:hover { color: #1e293b; }
        .toggle-btn.active {
            background: white;
            color: var(--primary);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .grid-products {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1.5rem;
        }

        /* List View Styling */
        .list-products {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }

        .compact-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }

        .compact-table th {
            text-align: left;
            padding: 1rem;
            background: #f8fafc;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e2e8f0;
        }

        .compact-table td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
        }

        .compact-table tr:hover { background: #f8fafc; }

        .p-name-cell {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .p-avatar {
            width: 32px;
            height: 32px;
            background: #e2e8f0;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            color: #64748b;
            font-size: 0.8rem;
        }

        .stock-indicator {
            background: #f1f5f9;
            color: #64748b;
            padding: 2px 10px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 0.8rem;
        }
        .stock-indicator.low { background: #fef3c7; color: #b45309; }

        .add-btn-small {
            background: #f1f5f9;
            color: #1e293b;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
        }
        .add-btn-small:hover:not(:disabled) {
            background: var(--primary);
            color: white;
        }
        .add-btn-small:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: #e2e8f0;
        }

        .oos-row { opacity: 0.6; }
        .oos-row .p-avatar { filter: grayscale(1); }

        .product-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.06);
          border: 1px solid transparent;
        }
        .product-card:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          border-color: var(--primary);
        }
        .product-card:active { transform: translateY(0); }

        .p-image-placeholder {
          height: 120px;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #64748b;
          font-size: 1.8rem;
          position: relative;
        }

        .p-info { padding: 1rem; }
        .p-info h4 { font-size: 0.95rem; margin-bottom: 0.4rem; color: #1e293b; font-weight: 600; }
        .p-meta { display: flex; justify-content: space-between; align-items: center; }
        .p-price { font-weight: 700; color: var(--primary); font-size: 1.1rem; }
        .p-stock { font-size: 0.75rem; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 9999px; }
        .p-stock.low-stock { color: #b45309; background: #fef3c7; }
        
        .product-card.oos { opacity: 0.6; cursor: not-allowed; filter: grayscale(1); }
        .oos-overlay {
            position: absolute;
            inset: 0;
            background: rgba(15, 23, 42, 0.6);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.05em;
        }

        .cart-panel {
          width: 420px;
          background: white;
          border-left: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          z-index: 2;
          box-shadow: -10px 0 15px -3px rgba(0, 0, 0, 0.02);
        }

        .cart-header {
          padding: 1.5rem 2rem;
          background: white;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cart-header h3 {
            margin: 0;
            font-size: 1.25rem;
            color: #0f172a;
            font-weight: 800;
        }

        .cart-items {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .empty-msg { 
            text-align: center; 
            color: #94a3b8; 
            margin-top: 5rem; 
            font-size: 1rem;
        }

        .cart-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          transition: border-color 0.2s;
        }
        .cart-item:hover { border-color: #cbd5e1; }

        .item-name { flex: 1; display: flex; flex-direction: column; }
        .item-name span { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
        .item-name small { color: #64748b; font-size: 0.8rem; }

        .item-controls-stepper {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 9999px; /* Pill shape */
          padding: 2px;
          height: 36px;
        }

        .stepper-btn {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent; /* Default transparent */
            border: none;
            color: #64748b;
            cursor: pointer;
            border-radius: 50%; /* Circular buttons inside */
            transition: all 0.2s;
        }
        .stepper-btn:hover { background: #f1f5f9; color: var(--primary); }
        .stepper-btn:active { background: #e2e8f0; }

        .stepper-input-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 50px; /* Fixed width for stability directly */
            position: relative;
        }

        .stepper-input {
            width: 100%;
            text-align: center;
            border: none;
            background: transparent;
            font-weight: 700;
            font-size: 0.95rem;
            color: #1e293b;
            padding: 0;
            margin: 0;
            line-height: 1.2;
        }
        .stepper-input:focus { outline: none; }
        
        /* Remove arrows from number input */
        .stepper-input::-webkit-outer-spin-button,
        .stepper-input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        .stepper-unit {
            font-size: 0.65rem;
            color: #94a3b8;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.05em;
            line-height: 1;
        }

        .item-total { font-weight: 700; color: #1e293b; width: 60px; text-align: right; }

        .cart-footer {
          padding: 1.5rem 2rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          color: #64748b;
          font-size: 0.95rem;
        }
        .totals-row.total-big {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 2px dashed #e2e8f0;
          color: #0f172a;
          font-weight: 800;
          font-size: 1.4rem;
        }

        .pay-btn {
          width: 100%;
          margin-top: 1.5rem;
          background: #10b981;
          color: white;
          padding: 1.25rem;
          font-size: 1.1rem;
          font-weight: 800;
          border-radius: 12px;
          border: none;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pay-btn:hover:not(:disabled) {
            background: #059669;
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
        }
        .pay-btn:disabled { background: #cbd5e1; cursor: not-allowed; box-shadow: none; }

        .del-btn {
          color: #fca5a5;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .del-btn:hover { color: #ef4444; }

        .clear-btn {
            color: #ef4444; 
            font-size: 0.75rem; 
            font-weight: 700;
            padding: 6px 14px;
            background: #fee2e2;
            border-radius: 9999px;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }
        .clear-btn:hover { background: #fecaca; }

        /* Modal & Success State Styles */
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999;
            animation: fadeIn 0.3s ease;
        }

        .success-modal {
            background: white;
            padding: 3rem;
            border-radius: 24px;
            text-align: center;
            width: 100%;
            max-width: 440px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            transform: scale(1);
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .success-icon {
            width: 80px;
            height: 80px;
            background: #ecfdf5;
            color: #10b981;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            margin: 0 auto 1.5rem;
            animation: bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .success-modal h2 {
            font-size: 1.8rem;
            color: #0f172a;
            font-weight: 800;
            margin-bottom: 0.5rem;
        }

        .success-modal p {
            color: #64748b;
            margin-bottom: 2rem;
            font-size: 1.1rem;
        }

        .success-actions {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .secondary-btn {
            background: #f1f5f9;
            color: #1e293b;
            padding: 1rem;
            border-radius: 12px;
            font-weight: 700;
            border: 1px solid #e2e8f0;
            transition: all 0.2s;
            cursor: pointer;
        }
        .secondary-btn:hover {
            background: #e2e8f0;
            border-color: #cbd5e1;
        }

        .primary-btn {
            background: var(--primary);
            color: white;
            padding: 1rem;
            border-radius: 12px;
            font-weight: 700;
            border: none;
            transition: all 0.2s;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(var(--primary-rgb), 0.2);
        }
        .primary-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(var(--primary-rgb), 0.3);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounceIn {
            0% { transform: scale(0); }
            60% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
      `}</style>
        </POSLayout>
    );
};

export default POS;
