import React from 'react';

const DataLayout = ({
    title,
    subtitle,
    icon: Icon,
    actions,
    filters,
    children
}) => {
    return (
        <div className="data-layout animate-fade-in">
            {/* Header Section */}
            <div className="layout-header">
                <div className="header-content">
                    {Icon && <div className="header-icon"><Icon size={24} /></div>}
                    <div className="header-text">
                        <h1>{title}</h1>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                </div>
                <div className="header-actions">
                    {actions}
                </div>
            </div>

            {/* Filters Bar (Floating) */}
            {filters && (
                <div className="layout-filters glass-panel">
                    {filters}
                </div>
            )}

            {/* Main Content (Table) */}
            <div className="layout-content glass-panel">
                {children}
            </div>

            <style>{`
                .data-layout {
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .layout-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding-bottom: 0.5rem;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .header-icon {
                    width: 48px;
                    height: 48px;
                    background: white;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .header-text h1 {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    line-height: 1.2;
                    letter-spacing: -0.5px;
                }

                .header-text p {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }

                .layout-filters {
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .layout-content {
                    padding: 0; 
                    border-radius: 16px; 
                    overflow: hidden;
                    background: white; /* Force white background */
                }
            `}</style>
        </div>
    );
};

export default DataLayout;
