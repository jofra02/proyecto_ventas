import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Drawer from '../../components/common/Drawer';
import ThermalReceipt from '../../components/printing/ThermalReceipt';
import DataLayout from '../../components/layout/DataLayout';
import StatusBadge from '../../components/common/StatusBadge';

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [customers, setCustomers] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invRes, custRes] = await Promise.all([
                    api.get('/documents/'),
                    api.get('/customers/')
                ]);

                const custMap = {};
                custRes.data.forEach(c => custMap[c.id] = c);
                setCustomers(custMap);
                setInvoices(invRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const viewDocument = async (id) => {
        try {
            const res = await api.get(`/documents/${id}`);
            setSelectedDoc(res.data);
            setIsModalOpen(true);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <DataLayout
            title="Invoices (Documentos)"
            subtitle="View and managed issued tax documents"
            icon={FileText}
        >
            <table className="custom-table">
                <thead>
                    <tr>
                        <th>Doc #</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading documents...</td></tr>
                    ) : invoices.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-8 text-gray-400">No documents issued.</td></tr>
                    ) : invoices.map(doc => (
                        <tr key={doc.id}>
                            <td className="font-mono text-blue-600 font-bold">#{doc.id.toString().padStart(8, '0')}</td>
                            <td>{format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm')}</td>
                            <td className="font-bold">${doc.total.toFixed(2)}</td>
                            <td>
                                <StatusBadge type="success">{doc.status}</StatusBadge>
                            </td>
                            <td className="text-right">
                                <button className="text-blue-600 hover:text-blue-800" onClick={() => viewDocument(doc.id)} title="View Receipt">
                                    <Eye size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Document Drawer */}
            <Drawer isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Document View" size="md">
                {selectedDoc && (
                    <div className="p-4 flex flex-col items-center">
                        <ThermalReceipt
                            sale={{ id: selectedDoc.document.sale_id, status: 'ISSUED' }}
                            customer={selectedDoc.customer_id ? customers[selectedDoc.customer_id] : null}
                            items={selectedDoc.items.map(i => ({ ...i, name: "Item " + i.product_id }))}
                        />
                    </div>
                )}
            </Drawer>
        </DataLayout>
    );
};

export default InvoiceList;
