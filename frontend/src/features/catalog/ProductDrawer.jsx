import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Drawer from '../../components/common/Drawer';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { Save, PlusCircle, Calculator, Info, Package, AlertCircle, Calendar, Check, ChevronDown, ChevronUp, TrendingUp, Box } from 'lucide-react';

const ProductDrawer = ({ isOpen, onClose, onRefresh, initialData }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: 0,
        cost_price: 0,
        track_expiry: false,
        is_batch_tracked: false,
        supplier_ids: [],
        unit_of_measure: 'unit',
        product_type: 'unitary',
        measurement_value: '',
        measurement_unit: '',
        description: ''
    });

    const [packPrice, setPackPrice] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [marginPercent, setMarginPercent] = useState(0);

    // Dropdown state
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const uomOptions = [
        { value: 'unit', label: t('Units (un)'), type: 'unitary' },
        { value: 'kg', label: t('Kilograms (kg)'), type: 'fractional' },
        { value: 'g', label: t('Grams (g)'), type: 'fractional' },
        { value: 'l', label: t('Liters (l)'), type: 'fractional' },
        { value: 'm', label: t('Meters (m)'), type: 'fractional' },
        { value: 'ml', label: t('Milliliters (ml)'), type: 'fractional' },
        { value: 'pack', label: t('Pack / Box'), type: 'pack' },
    ];

    useEffect(() => {
        if (isOpen) {
            api.get('/suppliers/').then(supRes => {
                setSuppliers(supRes.data);
            }).catch(console.error);

            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    sku: initialData.sku || '',
                    price: initialData.price || 0,
                    cost_price: initialData.cost_price || 0,
                    track_expiry: initialData.track_expiry || false,
                    is_batch_tracked: initialData.is_batch_tracked || false,
                    supplier_ids: initialData.suppliers ? initialData.suppliers.map(s => s.id) : [],
                    unit_of_measure: initialData.unit_of_measure || 'unit',
                    product_type: initialData.product_type || 'unitary',
                    measurement_value: initialData.measurement_value || '',
                    measurement_unit: initialData.measurement_unit || '',
                    description: initialData.description || ''
                });

                if (initialData.cost_price > 0 && initialData.price > 0) {
                    const m = ((initialData.price - initialData.cost_price) / initialData.cost_price) * 100;
                    setMarginPercent(m.toFixed(1));
                } else {
                    setMarginPercent(0);
                }

                if (initialData.product_type === 'pack') {
                    setPackPrice(initialData.price.toFixed(2));
                } else if (initialData.measurement_value && initialData.price) {
                    setPackPrice((initialData.price * initialData.measurement_value).toFixed(2));
                } else {
                    setPackPrice('');
                }
            } else {
                setFormData({
                    name: '',
                    sku: '',
                    price: 0,
                    cost_price: 0,
                    track_expiry: false,
                    is_batch_tracked: false,
                    supplier_ids: [],
                    unit_of_measure: 'unit',
                    product_type: 'unitary',
                    measurement_value: '',
                    measurement_unit: '',
                    description: ''
                });
                setPackPrice('');
                setMarginPercent(0);
            }
        }
    }, [isOpen, initialData]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsSupplierDropdownOpen(false);
            }
        };

        if (isSupplierDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSupplierDropdownOpen]);

    // Auto-calculate Price based on Margin
    const applyMarginToPrice = (cost, margin) => {
        const c = parseFloat(cost) || 0;
        const m = parseFloat(margin) || 0;
        const newPrice = c * (1 + (m / 100));
        setFormData(prev => ({ ...prev, price: parseFloat(newPrice.toFixed(2)), cost_price: c }));
    };

    // Auto-calculate Margin based on Price
    const applyPriceToMargin = (price, cost) => {
        const p = parseFloat(price) || 0;
        const c = parseFloat(cost) || 0;
        if (c > 0) {
            const m = ((p - c) / c) * 100;
            setMarginPercent(m.toFixed(1));
        }
        setFormData(prev => ({ ...prev, price: p, cost_price: c }));
    };

    const handleUomChange = (e) => {
        const newUom = e.target.value;
        const selectedOpt = uomOptions.find(o => o.value === newUom);
        setFormData(prev => ({
            ...prev,
            unit_of_measure: newUom,
            product_type: selectedOpt ? selectedOpt.type : prev.product_type,
            measurement_unit: newUom === 'unit' ? '' : newUom
        }));
    };

    const handleSmartPriceChange = (newPackPrice, newPackSize) => {
        const sizeVal = parseFloat(newPackSize);
        if (formData.product_type === 'pack') {
            setFormData(prev => ({ ...prev, measurement_value: newPackSize }));
            return;
        }

        setPackPrice(newPackPrice);
        setFormData(prev => ({ ...prev, measurement_value: newPackSize }));

        const priceVal = parseFloat(newPackPrice);
        if (!isNaN(priceVal) && !isNaN(sizeVal) && sizeVal > 0) {
            // priceVal here represents TOTAL PACK COST
            const unitCost = priceVal / sizeVal;

            // logic: Set Cost Price -> Then Apply Margin -> Updates Sales Price
            setFormData(prev => ({ ...prev, cost_price: parseFloat(unitCost.toFixed(2)) }));
            applyMarginToPrice(unitCost, marginPercent);
        }
    };

    const toggleSupplier = (id) => {
        setFormData(prev => {
            const current = prev.supplier_ids || [];
            if (current.includes(id)) {
                return { ...prev, supplier_ids: current.filter(sid => sid !== id) };
            } else {
                return { ...prev, supplier_ids: [...current, id] };
            }
        });
    };

    const isWeighted = formData.product_type === 'fractional' || formData.product_type === 'pack';

    const getSelectedSupplierNames = () => {
        if (formData.supplier_ids.length === 0) return t('Select suppliers...');
        const selected = suppliers.filter(s => formData.supplier_ids.includes(s.id));
        if (selected.length === 0) return t('Select suppliers...');

        if (selected.length <= 2) {
            return selected.map(s => s.name).join(', ');
        } else {
            return `${selected.length} ${t('suppliers selected')}`;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                measurement_value: formData.measurement_value ? parseFloat(formData.measurement_value) : null
            };

            if (initialData) {
                await api.put(`/products/${initialData.id}`, payload);
                showNotification(t("Product updated successfully!"), "success");
            } else {
                await api.post('/products/', payload);
                showNotification(t("Product added successfully!"), "success");
            }

            onRefresh();
            onClose();
        } catch (err) {
            showNotification(err.message || "Error saving product", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? t("Edit Product") : t("Add New Product")}
            size="md"
        >
            <form onSubmit={handleSubmit} className="h-full flex flex-col bg-gray-50/50">
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

                    {/* SECTION 1: GENERAL INFO */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative z-20">
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Package size={16} className="text-blue-600" /> {t('General Information')}
                        </h4>
                        <div className="space-y-4">
                            <div className="input-group">
                                <label>{t('Product Name')}</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Queso Barra Danbo"
                                    className="font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="input-group">
                                    <label>{t('SKU / Code')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sku}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                        placeholder="e.g. QUESO-001"
                                    />
                                </div>

                                <div className="input-group relative" ref={dropdownRef}>
                                    <label>{t('Suppliers')}</label>
                                    <div
                                        onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                                        className={`w-full bg-white border rounded-lg p-2.5 flex justify-between items-center cursor-pointer transition-all ${isSupplierDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'}`}
                                    >
                                        <span className={`text-sm ${formData.supplier_ids.length ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                            {getSelectedSupplierNames()}
                                        </span>
                                        {isSupplierDropdownOpen ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                                    </div>

                                    {isSupplierDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto">
                                            {suppliers.length === 0 && <div className="p-4 text-center text-sm text-gray-400 italic">{t('No suppliers found')}</div>}
                                            {suppliers.length > 0 && <ul className="divide-y divide-gray-50">
                                                {suppliers.map(s => {
                                                    const isSelected = formData.supplier_ids.includes(s.id);
                                                    return (
                                                        <li
                                                            key={s.id}
                                                            onClick={() => toggleSupplier(s.id)}
                                                            className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-gray-700'}`}
                                                        >
                                                            <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>{s.name}</span>
                                                            {isSelected && <Check size={16} className="text-blue-600" />}
                                                        </li>
                                                    );
                                                })}
                                            </ul>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: PRODUCT TYPE & MEASUREMENT */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Calculator size={16} className="text-blue-600" /> {t('Product Configuration')}
                        </h4>
                        <div className="space-y-4">
                            <div className="input-group">
                                <label>{t('Product Type')}</label>
                                <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                                    {[
                                        { id: 'unitary', label: t('Unitary'), icon: Package },
                                        { id: 'fractional', label: t('Fractional'), icon: Calculator },
                                        { id: 'pack', label: t('Pack'), icon: Box }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => {
                                                const firstValidUom = uomOptions.find(o => o.type === type.id);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    product_type: type.id,
                                                    unit_of_measure: firstValidUom ? firstValidUom.value : prev.unit_of_measure
                                                }));
                                            }}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-bold transition-all ${formData.product_type === type.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <type.icon size={14} />
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>{t('Sold By (Unit of Measure)')}</label>
                                <select
                                    value={formData.unit_of_measure}
                                    onChange={handleUomChange}
                                    className="bg-gray-50 border-blue-200 font-medium"
                                >
                                    {uomOptions.filter(opt => opt.type === formData.product_type).map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: PRICING & PROFIT */}
                    <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <TrendingUp size={16} className="text-green-600" /> {t('Pricing & Profit')}
                        </h4>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="input-group">
                                    <label>{t('Cost Price')}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.cost_price}
                                            onChange={e => applyMarginToPrice(e.target.value, marginPercent)}
                                            className="pl-7 font-bold text-gray-900"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>{t('Margin (%)')}</label>
                                    <div className="relative">
                                        <span className="absolute right-3 top-2.5 text-gray-400">%</span>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={marginPercent}
                                            onChange={e => {
                                                setMarginPercent(e.target.value);
                                                applyMarginToPrice(formData.cost_price, e.target.value);
                                            }}
                                            className="pr-8 font-bold text-emerald-600"
                                            placeholder="30"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="flex items-center justify-between">
                                    <span>{t('Final Sales Price')} <span className="text-gray-400 font-normal text-xs">/ {formData.unit_of_measure}</span></span>
                                    {isWeighted && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Auto-Calculated</span>}
                                </label>
                                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-600">
                                    <span className="flex select-none items-center pl-3 pr-2 text-gray-500 font-bold bg-gray-50 rounded-l-md border-r border-gray-200 text-xl">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        min="0"
                                        className={`block flex-1 border-0 bg-transparent py-3 pl-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-xl sm:leading-6 font-bold ${isWeighted ? 'bg-gray-100 text-gray-500' : 'text-green-700'}`}
                                        value={formData.price}
                                        onChange={e => applyPriceToMargin(e.target.value, formData.cost_price)}
                                        placeholder="0.00"
                                        readOnly={isWeighted}
                                    />
                                </div>
                            </div>

                            {isWeighted && (
                                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200 grid grid-cols-2 gap-4">
                                    <div className="col-span-2 text-xs text-blue-600 font-medium flex items-center gap-1">
                                        <Info size={12} /> {t('Enter Pack details to calculate Unit Price automatically')}
                                    </div>
                                    <div className="input-group">
                                        <label className="text-blue-800">
                                            {formData.product_type === 'pack' ? t('Units per Pack') : `${t('Total Weight')} (${formData.unit_of_measure})`}
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.measurement_value}
                                            onChange={e => handleSmartPriceChange(packPrice, e.target.value)}
                                            placeholder={formData.product_type === 'pack' ? "e.g. 6" : "e.g. 8"}
                                            min="0"
                                            className="bg-white border-blue-300 focus:ring-blue-200"
                                        />
                                    </div>
                                    {formData.product_type === 'fractional' && (
                                        <div className="input-group">
                                            <label className="text-blue-800">
                                                {t('Total Pack Cost')}
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <span className="text-blue-500 font-bold sm:text-sm">$</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={packPrice}
                                                    onChange={e => handleSmartPriceChange(e.target.value, formData.measurement_value)}
                                                    placeholder="e.g. 15000"
                                                    min="0"
                                                    className="block w-full rounded-md border-blue-300 pl-8 py-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-blue-900"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.product_type === 'pack' && formData.measurement_value > 0 && (
                                <p className="text-xs text-gray-500 mt-1 text-right">
                                    ${formData.price} / {formData.measurement_value} {t('units')} = <span className="font-bold text-gray-800">${(parseFloat(formData.price) / parseFloat(formData.measurement_value)).toFixed(2)} / {t('unit')}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* SECTION 4: INVENTORY CONTROLS */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Calendar size={16} className="text-orange-500" /> {t('Inventory Tracking')}
                        </h4>

                        <div className="flex flex-col gap-3">
                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={formData.track_expiry}
                                    onChange={e => setFormData({ ...formData, track_expiry: e.target.checked })}
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">{t('Track Expiry Date')}</span>
                                    <span className="text-xs text-gray-500 leading-tight">
                                        {t('Enables expiry date entry when receiving stock. Useful for perishable goods.')}
                                    </span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={formData.is_batch_tracked}
                                    onChange={e => setFormData({ ...formData, is_batch_tracked: e.target.checked })}
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">{t('Batch / Lot Tracking')}</span>
                                    <span className="text-xs text-gray-500 leading-tight">
                                        {t('Track Manufacture Dates and Batch Codes for traceability.')}
                                    </span>
                                </div>
                            </label>
                        </div>

                        <div className="mt-4 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <p>{t('Note: Actual Expiry and Manufacture dates are entered when you receive stock in the "Inventory" module.')}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                    <button type="submit" className="primary-btn w-full justify-center gap-2 text-lg" disabled={loading}>
                        {loading ? (
                            <span className="animate-pulse">{t('Saving...')}</span>
                        ) : (
                            <>
                                {initialData ? <Save size={20} /> : <PlusCircle size={20} />}
                                {initialData ? t('Update Product') : t('Create Product')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Drawer >
    );
};

export default ProductDrawer;
