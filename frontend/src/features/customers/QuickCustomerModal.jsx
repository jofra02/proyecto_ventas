import React, { useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';

const QuickCustomerModal = ({ isOpen, onClose, onCreated }) => {
    const [name, setName] = useState("Consumidor Final");
    const [taxId, setTaxId] = useState("0");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/customers/', {
                name,
                tax_id: taxId,
                email: "generic@store.com"
            });
            onCreated(res.data);
            onClose();
        } catch (err) {
            alert("Error creating customer");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Customer">
            <form onSubmit={handleSubmit} className="erp-form">
                <div className="input-group">
                    <label>Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="input-group">
                    <label>Tax ID (DNI/CUIT)</label>
                    <input value={taxId} onChange={e => setTaxId(e.target.value)} required />
                </div>
                <button type="submit" className="primary-btn">Save</button>
            </form>
        </Modal>
    );
};

export default QuickCustomerModal;
