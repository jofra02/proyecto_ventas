import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card animate-fade-in">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="close-btn">
                        <X size={24} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>

            <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          width: 90%;
          max-width: 500px;
          padding: 2rem;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .close-btn {
          background: transparent;
          color: var(--text-muted);
        }

        .close-btn:hover {
          color: white;
        }
      `}</style>
        </div>
    );
};

export default Modal;
