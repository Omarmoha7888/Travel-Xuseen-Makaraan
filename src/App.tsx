import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { OrdersListView } from './components/orders/OrdersListView';
import { OrderDetailView } from './components/orders/OrderDetailView';
import { NewOrderForm } from './components/orders/NewOrderForm';
import { ARReportView } from './components/ar/ARReportView';
import { EmployeeManagementView } from './components/employees/EmployeeManagementView';
import { InternalMessagingView } from './components/messaging/InternalMessagingView';
import { RecentTransactionsView } from './components/transactions/RecentTransactionsView';
import { CustomerManagementView } from './components/customers/CustomerManagementView';
import { ReportsView } from './components/reports/ReportsView';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { SettingsView } from './components/settings/SettingsView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const { isRTL } = useLanguage();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [ordersFilter, setOrdersFilter] = useState<string>('All');
  const [ordersServiceFilter, setOrdersServiceFilter] = useState<string>('All');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A11] flex items-center justify-center text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest font-mono text-slate-300">
            Balcad Travel Agency • Admin & CRM
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentTab('orders');
  };

  const handleBackFromDetail = () => {
    setSelectedOrderId(null);
    setCurrentTab('orders');
  };

  const handleNavigateTab = (tab: string, filter?: string, serviceFilter?: string) => {
    setSelectedOrderId(null);
    setOrdersFilter(filter || 'All');
    setOrdersServiceFilter(serviceFilter || 'All');
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  };

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-[#070A11] text-slate-100' : 'bg-[#F4F6F9] text-slate-900'
      } flex transition-colors`}
    >
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleNavigateTab}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        unreadMessagesCount={3}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isRTL ? 'lg:mr-72' : 'lg:ml-72'
        }`}
      >
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onGlobalSearch={(q) => {
            setGlobalSearch(q);
            if (q.trim() && currentTab !== 'orders') {
              setCurrentTab('orders');
            }
          }}
          searchQuery={globalSearch}
          onNavigateTab={handleNavigateTab}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            {selectedOrderId ? (
              <OrderDetailView
                orderId={selectedOrderId}
                onBack={handleBackFromDetail}
                onOrderUpdated={() => {}}
              />
            ) : currentTab === 'dashboard' ? (
              <DashboardView
                onNavigateTab={handleNavigateTab}
                onSelectOrder={handleSelectOrder}
              />
            ) : currentTab === 'new_order' ? (
              <NewOrderForm
                onBack={() => handleNavigateTab('orders')}
                onOrderCreated={(newId) => {
                  setSelectedOrderId(newId);
                  setCurrentTab('orders');
                }}
              />
            ) : currentTab === 'orders' ? (
              <OrdersListView
                onSelectOrder={handleSelectOrder}
                onNewOrder={() => setCurrentTab('new_order')}
                initialFilter={ordersFilter}
                initialServiceFilter={ordersServiceFilter}
              />
            ) : currentTab === 'customers' ? (
              <CustomerManagementView onSelectOrder={handleSelectOrder} />
            ) : currentTab === 'employees' ? (
              user.role === 'super_admin' ? (
                <EmployeeManagementView />
              ) : (
                <div className="p-8 text-center text-xs text-red-400">
                  You do not have permission to access Employee Management.
                </div>
              )
            ) : currentTab === 'messages' ? (
              <InternalMessagingView />
            ) : currentTab === 'ar_report' ? (
              <ARReportView onSelectOrder={handleSelectOrder} />
            ) : currentTab === 'transactions' ? (
              <RecentTransactionsView />
            ) : currentTab === 'reports' ? (
              <ReportsView />
            ) : currentTab === 'activity' ? (
              <ActivityLogView />
            ) : currentTab === 'settings' ? (
              <SettingsView />
            ) : (
              <DashboardView
                onNavigateTab={handleNavigateTab}
                onSelectOrder={handleSelectOrder}
              />
            )}
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-slate-800/60 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Balcad Travel Agency. All rights reserved.</span>
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span>balcadtravel@gmail.com</span>
            <span>•</span>
            <span>Tel: 612483838 / 612141414</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">Internal CRM Portal</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <MainLayout />
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
