import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, Package, Barcode as ScanIcon, Edit, Trash2, Calculator, Box } from 'lucide-react';
import ProductDrawer from './ProductDrawer';
import DataLayout from '../../components/layout/DataLayout';
import StatusBadge from '../../components/common/StatusBadge';

import { useLanguage } from '../../i18n/LanguageContext';
import { useNotification } from '../../context/NotificationContext';

const ProductList = () => {
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/');
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
      showNotification(t("Failed to load products"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (product) => {
    if (window.confirm(t("Are you sure you want to delete {{name}}?", { name: product.name }))) {
      try {
        await api.delete(`/products/${product.id}`);
        showNotification(t("Product deleted successfully"), "success");
        fetchProducts();
      } catch (err) {
        showNotification(err, "error");
      }
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsDrawerOpen(true);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <DataLayout
        title={t('Product Catalog')}
        subtitle={t('Manage items, pricing and barcodes')}
        icon={Package}
        actions={
          <button className="primary-btn" onClick={handleCreate}>
            <Plus size={18} /> {t('Add Product')}
          </button>
        }
        filters={
          <div className="flex items-center gap-2 w-full max-w-md bg-gray-50 p-2 rounded border">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder={t('Search by SKU or name...')}
              className="bg-transparent border-none outline-none w-full text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        }
      >
        <table className="custom-table">
          <thead>
            <tr>
              <th>{t('Product Name')}</th>
              <th>{t('SKU')}</th>
              <th>{t('Price')}</th>
              <th>{t('Barcodes')}</th>
              <th>{t('Inv. Controls')}</th>
              <th>{t('Status')}</th>
              <th className="text-right">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-8 text-gray-400">{t('Loading catalog...')}</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-8 text-gray-400">{t('No products found.')}</td></tr>
            ) : filteredProducts.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="font-semibold text-gray-900 group flex items-center gap-1.5">
                    {p.product_type === 'fractional' && <Calculator size={14} className="text-blue-500" />}
                    {p.product_type === 'pack' && <Box size={14} className="text-orange-500" />}
                    {p.name}
                    {p.measurement_value && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-100">
                        {p.measurement_value} {p.measurement_unit}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{p.description || '-'}</div>
                </td>
                <td className="font-mono text-blue-600 text-sm">{p.sku}</td>
                <td>
                  {p.product_type === 'pack' && p.measurement_value ? (
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-gray-900 text-base">
                        ${p.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium tooltip" title={t('Price per unit')}>
                        ${(p.price / p.measurement_value).toFixed(2)} / {t('unit')}
                      </span>
                    </div>
                  ) : p.product_type === 'fractional' && p.measurement_value ? (
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-gray-900 text-base">
                        ${(p.price * p.measurement_value).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        ${p.price.toFixed(2)} / {t(p.unit_of_measure)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="font-mono font-bold text-gray-900">${p.price.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-tighter">/ {t(p.unit_of_measure || 'unit')}</div>
                    </div>
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                    <ScanIcon size={12} />
                    {p.barcodes?.length || 0}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    {p.track_expiry && <StatusBadge type="warning">{t('Expiry')}</StatusBadge>}
                    {p.is_batch_tracked && <StatusBadge type="info">{t('Batch')}</StatusBadge>}
                    {!p.track_expiry && !p.is_batch_tracked && <span className="text-gray-400 text-xs">-</span>}
                  </div>
                </td>
                <td>
                  <StatusBadge type="success">{t('Active')}</StatusBadge>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title={t('Edit')}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title={t('Delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataLayout>

      <ProductDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRefresh={fetchProducts}
        initialData={editingProduct}
      />
    </>
  );
};

export default ProductList;
