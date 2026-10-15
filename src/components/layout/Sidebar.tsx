import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Users,
  UserCheck,
  MessageSquare,
  DollarSign,
  Receipt,
  BarChart3,
  History,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Briefcase,
} from 'lucide-react';
import { BalcadLogo } from '../BalcadLogo';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  unreadMessagesCount?: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  unreadMessagesCount = 3,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();

  const isSuperAdmin = user?.role === 'super_admin';

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'new_order', label: t('new_order'), icon: PlusCircle },
    { id: 'orders', label: t('orders'), icon: FileText },
    { id: 'customers', label: t('customers'), icon: Users },
    ...(isSuperAdmin
      ? [{ id: 'employees', label: t('employee_management'), icon: UserCheck, adminOnly: true }]
      : []),
    {
      id: 'messages',
      label: t('messages'),
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    { id: 'ar_report', label: t('ar_report'), icon: DollarSign },
    { id: 'transactions', label: t('recent_transactions'), icon: Receipt },
    { id: 'reports', label: t('reports'), icon: BarChart3 },
    { id: 'activity', label: t('activity_log'), icon: History },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 z-50 flex flex-col w-72 bg-[#090D16] text-slate-300 border-r border-[#1B2333] transition-all duration-300 ease-in-out ${
          isRTL ? 'right-0 border-l border-r-0' : 'left-0'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : isRTL
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1B2333]/80 bg-gradient-to-b from-[#111726]/60 to-transparent flex items-center justify-center">
          <BalcadLogo size="md" showUploadTrigger={true} />
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-100 group relative cursor-pointer active:scale-[0.98] select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 font-semibold border-l-4 border-amber-500 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-red-500 text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  {item.adminOnly && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ADMIN
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className={`w-3.5 h-3.5 text-amber-400 ${isRTL ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Flight Visual Art Card (from reference mockup) */}
        <div className="px-3 pb-3">
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-[#131B2E] to-[#0A0E18] p-3 text-center shadow-lg group">
            <div className="relative h-24 w-full overflow-hidden rounded-xl mb-2">
              <img
                src="/src/assets/images/sidebar_flight_art_1790674751761.jpg"
                alt="Balcad Flight"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
            <p className="font-serif italic text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300">
              "Your Journey, Our Priority"
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Balcad Travel Agency</p>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#1B2333] bg-[#070A11]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                {user?.profile?.full_name ? user.profile.full_name[0] : 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.profile?.full_name || user?.username}
                </span>
                <span className="text-[10px] text-amber-400/90 flex items-center gap-1">
                  {user?.role === 'super_admin' ? (
                    <>
                      <Shield className="w-2.5 h-2.5" /> Super Admin
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-2.5 h-2.5" /> Staff ({user?.profile?.department || 'Operations'})
                    </>
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => logout()}
              title={t('logout')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer active:scale-95 duration-75 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
