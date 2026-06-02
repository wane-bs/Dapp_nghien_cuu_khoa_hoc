import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from '../pages/login/ui/LoginPage';
import Register from '../pages/register/ui/RegisterPage';
import MainLayout from '../shared/ui/MainLayout';
import Dashboard from '../pages/home/ui/HomePage';
import Account from '../pages/account/ui/AccountPage';
import RentOut from '../pages/rent-out/ui/RentOutPage';
import Wallet from '../pages/wallet/ui/WalletPage';
import OwnerDashboard from '../pages/admin/ui/OwnerDashboard';
import LenderDashboard from '../pages/lender-manage/ui/LenderDashboard';
import Settings from '../pages/settings/ui/SettingsPage';
import BookDetail from '../pages/book-detail/ui/BookDetailPage';
import ExplorerLayout from '../pages/explorer/ui/ExplorerLayout';
import ExplorerHome from '../pages/explorer/ui/ExplorerHome';
import ExplorerEvents from '../pages/explorer/ui/ExplorerEvents';
import BlockDetail from '../pages/explorer/ui/BlockDetail';
import TxDetail from '../pages/explorer/ui/TxDetail';
import AddressDetail from '../pages/explorer/ui/AddressDetail';
import OnChainDataExplorer from '../pages/explorer/ui/OnChainDataExplorer';
// IR-3 FIX: Contract Preview page
import ContractPreviewPage from '../pages/contract-preview/ContractPreviewPage';

import './styles/App.css';

// Simple user context type
type User = {
  username: string;
  email: string;
  address: string;
  role: 'USER' | 'ADMIN' | 'LENDER';
}

function App() {
  // Session State: Cleared on refresh (as requested)
  const [user, setUser] = useState<User | null>(null);

  // Protected Route Wrapper
  const ProtectedRoute = () => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <Outlet context={{ user }} />;
  };

  return (
    <BrowserRouter>
      {/* Toast Notifications Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <Routes>
        {/* Pass user setter to Login/Register */}
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />

        {/* Main Layout Wraps Everything (Public & Protected) */}
        <Route path="/" element={<MainLayout user={user} />}>

          {/* Public Access: Explorer */}
          <Route path="explorer" element={<ExplorerLayout />}>
            <Route index element={<ExplorerHome />} />
            <Route path="events" element={<ExplorerEvents />} />
            <Route path="onchain" element={<OnChainDataExplorer />} />
            <Route path="block/:blockNumber" element={<BlockDetail />} />
            <Route path="tx/:txHash" element={<TxDetail />} />
            <Route path="address/:address" element={<AddressDetail />} />
          </Route>

          {/* Smart Redirect for Root Path */}
          <Route index element={<Navigate to={window.location.port === '3004' ? "/explorer" : "/dashboard"} replace />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="account" element={<Account />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="rent-out" element={<RentOut />} />
            <Route path="owner" element={<OwnerDashboard />} />
            <Route path="lender-manage" element={<LenderDashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="books/:id" element={<BookDetail />} />
            {/* IR-3 FIX: Contract Preview page — user phải login mới xem HĐ được */}
            <Route path="contract-preview/:previewId" element={<ContractPreviewPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
