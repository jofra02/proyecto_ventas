import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Minus, Plus, Trash2, LayoutGrid, List } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import POSLayout from './POSLayout';
import CheckoutDrawer from './CheckoutDrawer';
import ThermalReceipt from '../../components/printing/ThermalReceipt';
import '../../assets/print.css';

const POS = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [stockMap, setStockMap] = useState({}); // { productId: qty }
    const [cart, setCart] = useState([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [lastSale, setLastSale] = useState(null);
    const [storeSettings, setStoreSettings] = useState(null);
    const [loading, setLoading] = useState(true);

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

        if (currentQty + 1 > currentStock) {
            alert(t('Only {stock} units available!').replace('{stock}', currentStock));
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

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.qty + delta;
                if (newQty < 1) return item;

                // Check stock limit if increasing
                if (delta > 0) {
                    const currentStock = stockMap[item.id] || 0;
                    if (newQty > currentStock) {
                        alert(t('Cannot add more. Stock limit: {stock}').replace('{stock}', currentStock));
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
            window.print();
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
                                        <div className="p-image-placeholder">
                                            {p.name.substring(0, 2).toUpperCase()}
                                            {isOOS && <div className="oos-overlay">{t('OUT OF STOCK')}</div>}
                                        </div>
                                        <div className="p-info">
                                            <h4>{p.name}</h4>
                                            <div className="p-meta">
                                                <span className="p-price">${p.price.toFixed(2)}</span>
                                                <span className={`p-stock ${stock < 5 ? 'low-stock' : ''}`}>
                                                    {stock} {t('left')}
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
                                                        <div className="font-bold">{p.name}</div>
                                                        <div className="text-xs text-gray-500">{p.sku}</div>
                                                    </div>
                                                </td>
                                                <td className="text-right font-mono font-bold">${p.price.toFixed(2)}</td>
                                                <td className="text-center">
                                                    <span className={`stock-indicator ${stock < 5 ? 'low' : ''}`}>
                                                        {stock}
                                                    </span>
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

                    <div className="cart-items">
                        {cart.length === 0 && <div className="empty-msg">{t('Cart is empty')}</div>}
                        {cart.map(item => (
                            <div key={item.id} className="cart-item">
                                <div className="item-name">
                                    <span>{item.name}</span>
                                    <small>${item.price.toFixed(2)}</small>
                                </div>
                                <div className="item-controls">
                                    <button className="icon-btn" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                                    <span>{item.qty}</span>
                                    <button className="icon-btn" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
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

            {/* Hidden Printable Area */}
            <div id="printable-area">
                {lastSale && (
                    <ThermalReceipt
                        sale={lastSale}
                        customer={lastSale.customer}
                        items={lastSale.items}
                        storeInfo={storeSettings}
                    />
                )}
            </div>

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

        .item-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 4px 8px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-weight: 700;
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

        .icon-btn { 
          width: 24px; height: 24px; 
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none;
          color: #64748b; cursor: pointer;
          border-radius: 4px;
        }
        .icon-btn:hover { background: #f1f5f9; color: var(--primary); }

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
