import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AppShell from './components/layout/Shell'
import ProductList from './features/catalog/ProductList'
import Login from './features/iam/Login'
import Dashboard from './features/dashboard/Dashboard'
import POS from './features/sales/POS'
import RequireRole from './components/auth/RequireRole'
import StockList from './features/inventory/StockList'
import SalesHistory from './features/sales/SalesHistory'
import CustomerList from './features/crm/CustomerList'
import CustomerAccount from './features/crm/CustomerAccount'
import InvoiceList from './features/invoicing/InvoiceList'
import PaymentList from './features/payments/PaymentList'
import UserList from './features/iam/UserList'
import SettingsView from './features/admin/views/SettingsView'

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  console.log("Protected Route:", { user, loading });
  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading Application...</div>;
  if (!user) console.warn("Redirecting to login");
  return user ? children : <Navigate to="/login" />;
};

// ...

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* POS: Accessible by everyone including Employees */}
      <Route path="/pos" element={
        <Protected>
          <RequireRole roles={['ADMIN', 'SUPERVISOR', 'EMPLOYEE']}>
            <POS />
          </RequireRole>
        </Protected>
      } />

      {/* Dashboard & Modules: Only Admin/Supervisor */}
      <Route path="/*" element={
        <Protected>
          <RequireRole roles={['ADMIN', 'SUPERVISOR']}>
            <AppShell>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="users" element={<UserList />} />
                <Route path="admin/settings" element={<SettingsView />} />
                <Route path="catalog" element={<ProductList />} />
                <Route path="inventory" element={<StockList />} />
                <Route path="sales" element={<SalesHistory />} />
                <Route path="customers" element={<CustomerList />} />
                <Route path="customers/:id/account" element={<CustomerAccount />} />
                <Route path="invoicing" element={<InvoiceList />} />
                <Route path="payments" element={<PaymentList />} />
                {/* ... other feature routes ... */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AppShell>
          </RequireRole>
        </Protected>
      } />
    </Routes>
  )
}

export default App
