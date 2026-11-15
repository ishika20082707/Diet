import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { PlansPage } from './pages/PlansPage';
import { SaladBuilderPage } from './pages/SaladBuilderPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginRegisterPage } from './pages/LoginRegisterPage';
import { MemberDashboardPage } from './pages/MemberDashboardPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { MySubscriptionPage } from './pages/MySubscriptionPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ManageMembersPage } from './pages/ManageMembersPage';
import { ManageOrdersPage } from './pages/ManageOrdersPage';
import { ManageMenuPage } from './pages/ManageMenuPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col bg-[#F9FAF8] text-[#14261C]">
            <Navbar />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/builder" element={<SaladBuilderPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<LoginRegisterPage />} />

                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['member', 'admin']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />

                {/* Member Routes */}
                <Route
                  path="/member"
                  element={
                    <ProtectedRoute allowedRoles={['member', 'admin']}>
                      <MemberDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/member/orders"
                  element={
                    <ProtectedRoute allowedRoles={['member', 'admin']}>
                      <MyOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/member/subscription"
                  element={
                    <ProtectedRoute allowedRoles={['member', 'admin']}>
                      <MySubscriptionPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/members"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageMembersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/menu"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageMenuPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
