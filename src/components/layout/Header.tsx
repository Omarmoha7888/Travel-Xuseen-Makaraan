import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Moon,
  Sun,
  Bell,
  Globe,
  Menu,
  CheckCheck,
  Calendar,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Shield,
  Briefcase,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Language } from '../../types';
import { api } from '../../services/api';
import { BalcadLogo } from '../BalcadLogo';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onGlobalSearch: (q: string) => void;
  searchQuery: string;
  onNavigateTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onGlobalSearch,
  searchQuery,
  onNavigateTab,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    api.getNotifications()
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch(() => {
        // Fallback gracefully without throwing
      });
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isFinance =
    user?.profile?.department?.toLowerCase().includes('finance') ||
    user?.profile?.department?.toLowerCase().includes('account');

  const visibleNotifications = notifications.filter((n) => {
    if (n.type === 'cash_closure') {
      return isSuperAdmin || isFinance;
    }
    return true;
  });

  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Close popovers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentDateFormatted = new Date().toLocaleDateString(
    language === 'ar' ? 'ar-SA' : language === 'so' ? 'so-SO' : 'en-US',
    { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
  );

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[#0B0F19]/90 dark:bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer active:scale-95 duration-75 shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden shrink-0 flex items-center">
          <BalcadLogo size="xs" />
        </div>

        <div className="relative w-full">
          <Search
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${
              isRTL ? 'right-3' : 'left-3'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onGlobalSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className={`w-full py-2 bg-slate-900/80 dark:bg-[#121826] border border-slate-700/60 dark:border-slate-800 rounded-xl text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition ${
              isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
            }`}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date Display */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentDateFormatted}</span>
        </div>

        {/* Theme Switch */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? t('theme_light') : t('theme_dark')}
          className="p-2 rounded-xl text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 transition active:scale-95 duration-75 cursor-pointer border border-transparent hover:border-slate-700"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>

        {/* Language Selector */}
        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 transition active:scale-95 duration-75 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase">{language}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLangMenu && (
            <div
              className={`absolute top-full mt-2 w-36 py-1 bg-[#121826] border border-amber-500/20 rounded-xl shadow-xl z-50 text-xs ${
                isRTL ? 'left-0' : 'right-0'
              }`}
            >
              {[
                { code: 'en', label: 'English' },
                { code: 'so', label: 'Af-Soomaali' },
                { code: 'ar', label: 'العربية (RTL)' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLanguage(item.code as Language);
                    setShowLangMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left rtl:text-right hover:bg-amber-500/10 flex items-center justify-between cursor-pointer active:bg-amber-500/20 ${
                    language === item.code ? 'text-amber-400 font-bold bg-amber-500/5' : 'text-slate-300'
                  }`}
                >
                  <span>{item.label}</span>
                  {language === item.code && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition active:scale-95 duration-75 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className={`absolute top-full mt-2 w-80 sm:w-96 bg-[#121826] border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden ${
                isRTL ? 'left-0' : 'right-0'
              }`}
            >
              <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-[#0B0F19]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white uppercase tracking-wider">{t('notifications')}</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer active:scale-95 duration-75"
                  >
                    <CheckCheck className="w-3 h-3" />
                    {t('mark_all_read')}
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                {visibleNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">{t('no_notifications')}</div>
                ) : (
                  visibleNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition ${
                        !n.read ? 'bg-amber-500/5 border-l-2 border-amber-400' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-white">{n.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition active:scale-95 duration-75 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-[1.5px]">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-300 font-bold text-xs uppercase">
                {user?.profile?.full_name ? user.profile.full_name[0] : user?.username[0]}
              </div>
            </div>
            <div className="hidden md:flex flex-col text-left rtl:text-right">
              <span className="text-xs font-bold text-white leading-tight">
                {user?.profile?.full_name || user?.username}
              </span>
              <span className="text-[10px] text-amber-400/90 leading-tight">
                {user?.role === 'super_admin' ? t('super_admin') : t('staff')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div
              className={`absolute top-full mt-2 w-56 py-2 bg-[#121826] border border-slate-700/80 rounded-2xl shadow-2xl z-50 text-xs ${
                isRTL ? 'left-0' : 'right-0'
              }`}
            >
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="font-bold text-white text-xs">{user?.profile?.full_name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">@{user?.username}</p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                  {user?.role === 'super_admin' ? <Shield className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                  <span>{user?.role === 'super_admin' ? 'Super Admin' : user?.profile?.department}</span>
                </div>
              </div>

              <div className="pt-1">
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigateTab('settings');
                    }}
                    className="w-full px-4 py-2 text-left rtl:text-right text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer transition active:scale-95 duration-75"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bedel Password-ka</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left rtl:text-right text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer transition active:scale-95 duration-75"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
