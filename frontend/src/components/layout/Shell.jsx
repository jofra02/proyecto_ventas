import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  FileText,
  Users,
  CreditCard,
  LogOut,
  Store, // For Sale Mode
  Settings,
  Truck
} from 'lucide-react';
import Footer from './Footer';

import { hasAccess, PERMISSIONS } from '../../utils/rbac';
import { useLanguage } from '../../i18n/LanguageContext';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
  >
    <Icon size={18} />
    <span>{label}</span>
  </NavLink>
);

const AppShell = ({ children }) => {
  console.log("AppShell Rendering");
  const { logout, user } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  // Navigation Configuration
  const NAV_SECTIONS = [
    {
      title: t('Overview'),
      items: [
        { to: '/', icon: LayoutDashboard, label: t('Dashboard'), perm: PERMISSIONS.VIEW_DASHBOARD, module: 'iam' } // Core module?
      ]
    },
    {
      title: t('Operations'),
      items: [
        { to: '/catalog', icon: Package, label: t('Products'), perm: PERMISSIONS.MANAGE_CATALOG, module: 'catalog' },
        { to: '/inventory', icon: Warehouse, label: t('Inventory'), perm: PERMISSIONS.MANAGE_INVENTORY, module: 'inventory' },
        { to: '/suppliers', icon: Truck, label: t('Providers'), perm: PERMISSIONS.MANAGE_CATALOG, module: 'suppliers' },
        { to: '/sales', icon: ShoppingCart, label: t('Sales'), perm: PERMISSIONS.VIEW_SALES, module: 'sales' },
        { to: '/invoicing', icon: FileText, label: t('Invoices'), perm: null, module: 'invoicing' }
      ]
    },
    {
      title: t('CRM & Finance'),
      items: [
        { to: '/customers', icon: Users, label: t('Customers'), perm: PERMISSIONS.MANAGE_CUSTOMERS, module: 'customers' },
        { to: '/payments', icon: CreditCard, label: t('Payments'), perm: PERMISSIONS.VIEW_PAYMENTS, module: 'payments' }
      ]
    }
  ];

  // Admin section appended if user is admin (assumed core/admin module)
  if (user?.role === 'ADMIN') {
    NAV_SECTIONS.push({
      title: t('Admin'),
      items: [
        { to: '/users', icon: Users, label: t('Staff'), perm: null, module: 'iam' },
        { to: '/admin/settings', icon: Settings, label: t('Settings'), perm: null } // Core component
      ]
    });
  }

  const [activeModules, setActiveModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);

  useEffect(() => {
    // Fetch active modules from backend
    // Assuming GET /admin/modules returns ["catalog", "inventory", ...]
    api.get('/admin/modules')
      .then(res => setActiveModules(res.data))
      .catch(err => {
        console.error("Failed to load modules config", err);
        // Fallback: Enable all if fetch fails? Or empty?
        // Let's fallback to assuming all defined in frontend are available in dev, 
        // but for prod logic we should be strict.
        // For now, let's auto-enable common ones or EVERYTHING for safety if API fails?
        // Or better, just show partial.
        // Let's assume everything is active if API fails to avoid locking out.
        setActiveModules(['catalog', 'inventory', 'suppliers', 'sales', 'invoicing', 'customers', 'payments', 'iam', 'admin']);
      })
      .finally(() => setLoadingModules(false));
  }, []);

  return (
    <div className="erp-layout">
      {/* Dark Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <h3>{import.meta.env.VITE_APP_NAME}</h3>
        </div>

        <div className="nav-scroll">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx} className="nav-section">
              {section.title && <p className="section-title">{section.title}</p>}
              {section.items.map(item => {
                // Check backend module existence
                // activeModules is now list of objects {name, display_name}
                // or strings (fallback)
                // Let's normalize activeModules to lookup map for easier access?
                // Or find in array.

                let remoteModule = null;
                if (item.module) {
                  remoteModule = activeModules.find(m => (m.name || m) === item.module);
                  if (!remoteModule && !loadingModules) return null;
                }

                // Check permission if defined
                if (item.perm && !hasAccess(user, item.perm)) return null;

                // Use the frontend defined label (already translated)
                let label = item.label;

                return (
                  <SidebarItem key={item.to} to={item.to} icon={item.icon} label={label} />
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            <LogOut size={16} /> {t('Logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="content-wrapper">
        {/* Top Header */}
        <header className="top-bar">
          <div className="breadcrumbs">
            {/* Simple dynamic breadcrumb based on path */}
            <span className="capitalize">{location.pathname === '/' ? t('Dashboard') : t(location.pathname.split('/')[1]) || location.pathname.split('/')[1]}</span>
          </div>
          <div className="top-actions">
            <span className="user-greeting">{t('Hi, ')}{user?.username}</span>
            <button className="primary-btn sale-mode-btn" onClick={() => navigate('/pos')}>
              <Store size={16} />
              {t('POS')}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content" style={{ padding: isDashboard ? 0 : '2rem' }}>
          {children}
        </main>

        <Footer />
      </div>

      <style>{`
        /* ... existing styles ... */
        .erp-layout {
          display: flex;
          height: 100vh;
          background: var(--bg-body);
        }

        /* Sidebar Styling */
        .sidebar {
          width: 240px;
          background: var(--bg-sidebar);
          color: var(--text-sidebar);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .brand {
          height: 60px;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .nav-scroll {
          flex: 1;
          padding: 1.5rem 0;
          overflow-y: auto;
        }

        .nav-section {
          margin-bottom: 1.5rem;
        }

        .section-title {
          padding: 0 1.5rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-sidebar-muted);
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 1.5rem;
          color: var(--text-sidebar-muted);
          font-size: 0.9rem;
          transition: 0.2s;
        }

        .sidebar-item:hover, .sidebar-item.active {
          color: white;
          background: var(--primary);
        }
        
        .sidebar-item.active {
          border-left: 3px solid white; 
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .logout-btn {
          background: transparent;
          border: none; /* remove default border */
          cursor: pointer;
          color: var(--text-sidebar-muted);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          padding: 0;
        }
        .logout-btn:hover { color: white; }

        /* Content Styling */
        .content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0; /* Prevent overflow */
        }

        .top-bar {
          height: 60px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          border-bottom: 1px solid var(--border);
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .sale-mode-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #10b981; /* Green for Sales */
        }
        .sale-mode-btn:hover { background: #059669; }

        .page-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        /* Custom Scrollbar for Sidebar */
        .nav-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .nav-scroll::-webkit-scrollbar-track {
          background: transparent; 
        }
        .nav-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15); 
          border-radius: 4px;
        }
        .nav-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25); 
        }
      `}</style>
    </div>
  );
};

export default AppShell;
