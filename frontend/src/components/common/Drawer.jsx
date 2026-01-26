import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Drawer = ({ isOpen, onClose, title, children, size = 'md' }) => {
    // Handle Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Size Classes
    const maxWidths = {
        sm: '400px',
        md: '600px',
        lg: '800px',
        xl: '1000px',
        full: '100vw'
    };

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div
                className="drawer-content"
                onClick={e => e.stopPropagation()}
                style={{ width: maxWidths[size] || maxWidths.md }}
            >
                <div className="drawer-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="close-btn">
                        <X size={24} />
                    </button>
                </div>
                <div className="drawer-body">
                    {children}
                </div>
            </div>

            <style>{`
                .drawer-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(2px);
                    z-index: 2000;
                    display: flex;
                    justify-content: flex-end;
                    animation: fadeIn 0.2s ease-out;
                }

                .drawer-content {
                    height: 100%;
                    background: white;
                    box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .drawer-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8fafc;
                }

                .drawer-header h2 {
                    margin: 0;
                    font-size: 1.25rem;
                    color: var(--text-primary);
                }

                .drawer-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                }

                .close-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: all 0.2s;
                    display: flex; /* Fix alignment */
                }

                .close-btn:hover {
                    background: #e2e8f0;
                    color: var(--danger);
                }

                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default Drawer;
