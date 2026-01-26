import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, Package, Barcode as ScanIcon } from 'lucide-react';
import ProductDrawer from './ProductDrawer';
import DataLayout from '../../components/layout/DataLayout';
import StatusBadge from '../../components/common/StatusBadge';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/');
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <DataLayout
        title="Product Catalog"
        subtitle="Manage items, pricing and barcodes"
        icon={Package}
        actions={
          <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add Product
          </button>
        }
        filters={
          <div className="flex items-center gap-2 w-full max-w-md bg-gray-50 p-2 rounded border">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU or name..."
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
              <th>Product Name</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Barcodes</th>
              <th>Inventory Controls</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-400">Loading catalog...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-400">No products found.</td></tr>
            ) : filteredProducts.map(p => (
              <tr key={p.id}>
                <td className="font-semibold text-gray-900">{p.name}</td>
                <td className="font-mono text-blue-600 text-sm">{p.sku}</td>
                <td className="font-mono font-bold">${p.price.toFixed(2)}</td>
                <td>
                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                    <ScanIcon size={12} />
                    {p.barcodes?.length || 0}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    {p.track_expiry && <StatusBadge type="warning">Expiry</StatusBadge>}
                    {p.is_batch_tracked && <StatusBadge type="info">Batch</StatusBadge>}
                    {!p.track_expiry && !p.is_batch_tracked && <span className="text-gray-400 text-xs">-</span>}
                  </div>
                </td>
                <td>
                  <StatusBadge type="success">Active</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataLayout>

      <ProductDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchProducts}
      />
    </>
  );
};

export default ProductList;
