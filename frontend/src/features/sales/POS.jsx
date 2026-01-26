import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import POSLayout from './POSLayout';
import api from '../../services/api';
import { Trash2, Plus, Minus } from 'lucide-react';
import CheckoutDrawer from './CheckoutDrawer';

const POS = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [stockMap, setStockMap] = useState({}); // { productId: qty }
    const [cart, setCart] = useState([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [lastSale, setLastSale] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, stockRes] = await Promise.all([
                    api.get('/products/'),
                    api.get('/inventory/stock')
                ]);

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
            alert(`Only ${currentStock} units available!`);
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
                        alert(`Cannot add more. Stock limit: ${currentStock}`);
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
        setLastSale(result);
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

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    return (
        <POSLayout>
            <div className="pos-grid">
                {/* Left: Product Selection */}
                <div className="products-panel">
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
                                        {isOOS && <div className="oos-overlay">OUT OF STOCK</div>}
                                    </div>
                                    <div className="p-info">
                                        <h4>{p.name}</h4>
                                        <div className="p-meta">
                                            <span className="p-price">${p.price.toFixed(2)}</span>
                                            <span className={`p-stock ${stock < 5 ? 'low-stock' : ''}`}>
                                                {stock} left
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Cart & Checkout */}
                <div className="cart-panel">
                    <div className="cart-header">
                        <h3>Current Order</h3>
                        <button className="clear-btn" onClick={() => setCart([])}>Clear All</button>
                    </div>

                    <div className="cart-items">
                        {cart.length === 0 && <div className="empty-msg">Cart is empty</div>}
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
                            <span>Subtotal</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="totals-row total-big">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <button
                            className="pay-btn"
                            disabled={cart.length === 0}
                            onClick={() => setIsCheckoutOpen(true)}
                        >
                            PAY NOW
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
                        <h2>Sale Completed!</h2>
                        <p>Invoice #{lastSale?.docId}</p>
                        <div className="success-actions">
                            <button className="secondary-btn">Print Receipt</button>
                            <button className="primary-btn" onClick={startNewSale}>New Sale</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .pos-grid {
          display: flex;
          height: 100%;
        }

        .products-panel {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
        }

        .grid-products {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem;
        }

        .product-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.1s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .product-card:active { transform: scale(0.98); }

        .p-image-placeholder {
          height: 100px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #94a3b8;
          font-size: 1.5rem;
        }

        .p-info { padding: 0.8rem; }
        .p-info h4 { font-size: 0.9rem; margin-bottom: 0.2rem; }
        .p-meta { display: flex; justify-content: space-between; align-items: center; }
        .p-price { font-weight: 600; color: var(--primary); }
        .p-stock { font-size: 0.7rem; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        .p-stock.low-stock { color: #d97706; background: #fef3c7; }
        
        .product-card.oos { opacity: 0.6; cursor: not-allowed; grayscale: 1; }
        .product-card.oos .p-image-placeholder { background: #cbd5e1; }
        .oos-overlay {
            position: absolute;
            background: rgba(0,0,0,0.6);
            color: white;
            padding: 4px 8px;
            font-size: 0.7rem;
            border-radius: 4px;
        }

        .cart-panel {
          width: 400px;
          background: white;
          border-left: 1px solid #e2e8f0;
          box-shadow: -4px 0 20px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          z-index: 2;
        }

        .cart-header {
          padding: 1.5rem;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cart-header h3 {
            margin: 0;
            font-size: 1.15rem;
            color: #1e293b;
            font-weight: 700;
            letter-spacing: -0.025em;
        }

        .cart-items {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.5rem;
          background: #ffffff;
        }

        .empty-msg { 
            text-align: center; 
            color: #cbd5e1; 
            margin-top: 4rem; 
            font-style: italic;
            font-size: 0.95rem;
        }

        .cart-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .cart-item:hover {
            border-color: #e2e8f0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            background: white;
        }

        .item-name { flex: 1; display: flex; flex-direction: column; line-height: 1.2; }
        .item-name small { color: #64748b; }

        .item-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 4px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .secondary-btn {
            background: #f1f5f9;
            color: #1e293b;
            padding: 0.8rem;
            border-radius: 8px;
            font-weight: 600;
            border: 1px solid #e2e8f0;
            transition: all 0.2s;
        }
        .secondary-btn:hover { background: #e2e8f0; }

        .pay-btn {
          width: 100%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: 12px;
          border: none;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
          transition: transform 0.1s, box-shadow 0.2s;
        }
        .pay-btn:hover {
            box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
            transform: translateY(-1px);
        }
        .pay-btn:active { transform: translateY(0); }
        .pay-btn:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; }

        .icon-btn { 
          width: 28px; height: 28px; 
          display: flex; align-items: center; justify-content: center;
          background: white; border-radius: 6px; 
          border: 1px solid #e2e8f0;
          color: #64748b;
          transition: all 0.2s;
        }
        .icon-btn:hover { border-color: #cbd5e1; color: #1e293b; background: #f8fafc; }

        .clear-btn {
            color: #ef4444; 
            font-size: 0.75rem; 
            font-weight: 600;
            padding: 6px 12px;
            background: #fef2f2;
            border-radius: 20px;
            border: 1px solid #fee2e2;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .clear-btn:hover { 
            background: #fee2e2; 
            border-color: #fca5a5;
        }
      `}</style>
        </POSLayout>
    );
};

export default POS;
