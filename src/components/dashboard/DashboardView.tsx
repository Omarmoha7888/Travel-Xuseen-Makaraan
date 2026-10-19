import React, { useState, useEffect, useMemo } from 'react';
import {
  Inbox,
  Clock,
  Settings,
  Calendar,
  CheckCircle2,
  CheckCheck,
  XCircle,
  AlertCircle,
  DollarSign,
  UserPlus,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plane,
  FileCheck,
  Hotel,
  Luggage,
  Car,
  Bell,
  CreditCard,
  Lock,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Order, Transaction, DashboardMetrics, User } from '../../types';
import { CloseCashCounterModal } from './CloseCashCounterModal';
import { BalcadLogo } from '../BalcadLogo';

interface DashboardViewProps {
  onNavigateTab: (tab: string, filter?: string, serviceFilter?: string) => void;
  onSelectOrder: (orderId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onSelectOrder,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const isSuperAdmin = user?.role === 'super_admin';
  const dept = (user?.profile?.department || '').toLowerCase();
  const isFinance =
    dept.includes('finance') ||
    dept.includes('account') ||
    dept.includes('xisaab');
  const canInspectOthers = isSuperAdmin || isFinance;

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [employeeList, setEmployeeList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCloseCounterModalOpen, setIsCloseCounterModalOpen] = useState(false);
  const [selectedStaffCounter, setSelectedStaffCounter] = useState(user?.username || 'All');
  const [customStaffCounterData, setCustomStaffCounterData] = useState<{
    balance: number;
    collections_count: number;
    username: string;
  } | null>(null);

  const fetchStaffCounter = async (staffUsername: string) => {
    try {
      if (staffUsername === 'All' || staffUsername === user?.username) {
        setCustomStaffCounterData(null);
      } else {
        const res = await api.getCashCounter(staffUsername);
        setCustomStaffCounterData(res);
      }
    } catch {}
  };

  const handleStaffCounterChange = (staff: string) => {
    setSelectedStaffCounter(staff);
    fetchStaffCounter(staff);
  };

  const handleOpenCloseModal = () => {
    if (selectedStaffCounter === 'All') {
      showToast('Fadlan soo dooro sanduuqaaga shakhsiga ah si aad u xirto.', 'warning');
      return;
    }
    if (
      selectedStaffCounter &&
      selectedStaffCounter !== 'self' &&
      selectedStaffCounter.toLowerCase() !== (user?.username || '').toLowerCase()
    ) {
      showToast('laguu ma ogola howshan xaq Uma lihid inaad xerto xisaab shaqaale kale leyahay', 'error');
      return;
    }
    setIsCloseCounterModalOpen(true);
  };

  const currentCashCounterBalance =
    customStaffCounterData !== null
      ? customStaffCounterData.balance
      : (metrics?.cash_counter ?? 0);

  const currentCollectionsCount =
    customStaffCounterData !== null
      ? customStaffCounterData.collections_count
      : (metrics?.cash_counter_collections_count ?? 0);

  useEffect(() => {
    loadDashboardData();

    try {
      const ch = new BroadcastChannel('balcad_employees');
      ch.onmessage = () => {
        loadDashboardData();
      };
      return () => ch.close();
    } catch {}
  }, []);

  const loadDashboardData = async () => {
    try {
      const promises: [Promise<any>, Promise<any>, Promise<any>, Promise<any>?] = [
        api.getDashboardMetrics(),
        api.getOrders(),
        api.getTransactions(),
      ];
      if (canInspectOthers) {
        promises.push(api.getEmployees());
      }
      const [m, ords, trxs, emps] = await Promise.all(promises);
      setMetrics(m);
      if (emps && Array.isArray(emps)) {
        const activeEmps = emps.filter((e: User) => e.status !== 'disabled');
        setEmployeeList(activeEmps);
        setSelectedStaffCounter((prev) => {
          if (prev !== 'All' && prev !== user?.username && !activeEmps.some((e: User) => e.username === prev)) {
            return user?.username || 'self';
          }
          return prev;
        });
      }
      const myOrders = isSuperAdmin
        ? ords
        : ords.filter(
            (o: Order) =>
              o.created_by.toLowerCase() === user?.username.toLowerCase() ||
              (o.assigned_staff && o.assigned_staff.toLowerCase() === user?.username.toLowerCase())
          );
      setRecentOrders(myOrders.slice(0, 5));
      setRecentTransactions(trxs.slice(0, 5));
    } catch (err) {
      console.warn('Could not load dashboard data at this time:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Debt':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Rejected':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'Payment Received':
      case 'Debt Fully Paid':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Partial Payment':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Debt Updated':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'Price Updated':
      case 'Financial Adjustment':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
  };

  // 1. Dynamic Chart 1: Orders by Day (Last 7 Days)
  const daysData = useMemo(() => {
    if (metrics?.orders_by_day && metrics.orders_by_day.length > 0) {
      return metrics.orders_by_day;
    }
    const res = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      res.push({ date: `${monthNames[d.getMonth()]} ${d.getDate()}`, count: 0 });
    }
    return res;
  }, [metrics]);

  const maxDayCount = useMemo(() => {
    const counts = daysData.map((d) => d.count);
    return Math.max(5, ...counts);
  }, [daysData]);

  const chartPoints = useMemo(() => {
    const n = daysData.length;
    return daysData.map((d, i) => {
      const x = n > 1 ? 20 + (i / (n - 1)) * 200 : 120;
      const y = 80 - (d.count / maxDayCount) * 55;
      return { x, y, count: d.count, date: d.date };
    });
  }, [daysData, maxDayCount]);

  // 2. Dynamic Chart 2: Orders by Service
  const serviceStats = useMemo(() => {
    const list = metrics?.orders_by_service || [];
    const total = list.reduce((sum, s) => sum + s.count, 0);
    const servicesConfig = [
      { key: 'Flight Ticket', label: 'Flight', color: '#0284c7', dotClass: 'bg-sky-500' },
      { key: 'Visa Service', label: 'Visa', color: '#2563eb', dotClass: 'bg-blue-600' },
      { key: 'Hotel', label: 'Hotel', color: '#f59e0b', dotClass: 'bg-amber-500' },
      { key: 'Travel Package', label: 'Package', color: '#8b5cf6', dotClass: 'bg-purple-500' },
      { key: 'Airport Transfer', label: 'Transfer', color: '#10b981', dotClass: 'bg-emerald-500' },
      { key: 'Other', label: 'Other', color: '#64748b', dotClass: 'bg-slate-500' },
    ];
    let offset = 0;
    const items = servicesConfig.map((sc) => {
      const match = list.find((s) => s.service === sc.key);
      const count = match ? match.count : 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const currentOffset = offset;
      offset += pct;
      return {
        ...sc,
        count,
        pct,
        offset: currentOffset,
      };
    });
    return { total, items };
  }, [metrics]);

  // 3. Dynamic Chart 3: Orders by Status
  const statusStats = useMemo(() => {
    const total = metrics
      ? (metrics.confirmed_orders || 0) +
        (metrics.completed_orders || 0) +
        (metrics.in_progress_orders || 0) +
        (metrics.pending_orders || 0) +
        (metrics.debt_orders || 0) +
        (metrics.rejected_orders || 0) +
        (metrics.new_requests || 0)
      : 0;

    const statusesConfig = [
      { key: 'Confirmed', label: 'Confirmed', color: '#10b981', dotClass: 'bg-emerald-500', count: metrics?.confirmed_orders ?? 0 },
      { key: 'Completed', label: 'Completed', color: '#047857', dotClass: 'bg-emerald-700', count: metrics?.completed_orders ?? 0 },
      { key: 'In Progress', label: 'In Progress', color: '#3b82f6', dotClass: 'bg-blue-500', count: metrics?.in_progress_orders ?? 0 },
      { key: 'Pending', label: 'Pending', color: '#f59e0b', dotClass: 'bg-amber-500', count: metrics?.pending_orders ?? 0 },
      { key: 'Debt', label: 'Debt Orders', color: '#ef4444', dotClass: 'bg-red-500', count: metrics?.debt_orders ?? 0 },
      { key: 'Rejected', label: 'Rejected', color: '#e11d48', dotClass: 'bg-rose-600', count: metrics?.rejected_orders ?? 0 },
    ];

    let offset = 0;
    const items = statusesConfig.map((st) => {
      const pct = total > 0 ? Math.round((st.count / total) * 100) : 0;
      const currentOffset = offset;
      offset += pct;
      return {
        ...st,
        pct,
        offset: currentOffset,
      };
    });
    return { total, items };
  }, [metrics]);

  // 4. Dynamic Chart 4: Payments & Debt by Week
  const weeklyStats = useMemo(() => {
    const weeks = metrics?.payments_and_debt_by_week || [
      { week: 'Week 1', payments: 0, debt: 0 },
      { week: 'Week 2', payments: 0, debt: 0 },
      { week: 'Week 3', payments: 0, debt: 0 },
      { week: 'Week 4', payments: 0, debt: 0 },
    ];
    const maxVal = Math.max(500, ...weeks.map((w) => Math.max(w.payments, w.debt)));
    return { weeks, maxVal };
  }, [metrics]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-[#0C1220] via-[#131B30] to-[#0A0E18] p-6 md:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-2/5 overflow-hidden pointer-events-none opacity-40 md:opacity-75">
          <img
            src="/src/assets/images/dashboard_flight_banner_1790674741043.jpg"
            alt="Balcad Flight"
            className="w-full h-full object-cover object-right mix-blend-screen"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C1220] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="md:hidden">
              <BalcadLogo size="xs" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Plane className="w-3.5 h-3.5" />
              <span>Balcad Travel Agency • Admin CRM</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            {t('welcome_back')},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300">
              {user?.profile?.full_name || user?.username}
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 mt-2 leading-relaxed">
            {t('dashboard_subtitle')}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('new_order')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 duration-75 flex items-center gap-2 cursor-pointer"
            >
              <span>+ {t('new_order')}</span>
            </button>
            <button
              onClick={() => onNavigateTab('debt_review')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/15 to-transparent hover:from-emerald-500/30 hover:to-emerald-500/20 text-emerald-300 font-bold text-xs sm:text-sm border border-emerald-500/40 transition active:scale-95 duration-75 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Qeybta Review-ga Shaqaalaha</span>
            </button>
            <button
              onClick={() => onNavigateTab('ar_report')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-300 font-medium text-xs sm:text-sm border border-amber-500/20 transition active:scale-95 duration-75 flex items-center gap-2 cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>{t('ar_report')}</span>
            </button>
            <button
              onClick={() => onNavigateTab('orders')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-200 font-medium text-xs sm:text-sm border border-slate-700/60 transition active:scale-95 duration-75 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-slate-400" />
              <span>{t('orders')}</span>
            </button>
          </div>
        </div>

        <div className="absolute top-5 right-6 hidden md:flex flex-col items-end gap-1 z-20 bg-slate-950/40 p-2.5 rounded-2xl border border-amber-500/20 backdrop-blur-xs">
          <BalcadLogo size="md" />
          <span className="font-serif italic text-[11px] font-semibold text-amber-300/80 select-none tracking-wide">
            "Your Journey, Our Priority"
          </span>
        </div>
      </div>

      {/* 2. CASH COUNTER CARD - Individual to each employee with Close Counter action */}
      <div className="bg-gradient-to-br from-[#16213b] via-[#101728] to-[#0b101c] border-2 border-amber-500/50 hover:border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-2xl transition duration-150">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-emerald-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-inner">
              <DollarSign className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Cash Counter Card (Sanduuqa Lacagta)</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                  {user?.role === 'super_admin' ? 'Xisaabta Shakhsiga & Shaqaalaha' : `Gaar u ah: @${user?.username}`}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                  {currentCollectionsCount} ururin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Lacagaha dalabaadka cusub iyo deynta la soo celiyay toos ayey halkan ugu dhacayaan. Shaqaale kasta sanduuq gooni ah ayuu leeyahay.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 ml-auto md:ml-0">
            {canInspectOthers && (
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs font-mono">
                <span className="text-slate-400 text-[11px]">Eeg Shaqaale:</span>
                <select
                  value={selectedStaffCounter}
                  onChange={(e) => handleStaffCounterChange(e.target.value)}
                  className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer max-w-[210px]"
                >
                  <option value={user?.username || 'self'} className="bg-slate-900 text-white">
                    @{user?.username} ({user?.profile?.full_name || 'Sanduuqayga'})
                  </option>
                  {employeeList
                    .filter((emp) => emp.username.toLowerCase() !== (user?.username || '').toLowerCase() && emp.status !== 'disabled')
                    .map((emp) => (
                      <option key={emp.id} value={emp.username} className="bg-slate-900 text-white">
                        @{emp.username} ({emp.profile?.full_name || emp.username} - {emp.profile?.department || 'Staff'})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="text-right px-3 py-1 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Balance-ka Hadda</span>
              <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-300 font-mono">
                ${currentCashCounterBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={handleOpenCloseModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              title="Xir xisaabta sanduuqa una celi $0"
            >
              <Lock className="w-4 h-4 text-slate-950" />
              <span>Xisaab Xir (Close Counter)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. KPI Cards Grid - Fully Interactive & Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. New Requests */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('orders', 'New')}
          className="bg-[#111726] border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900/80 rounded-2xl p-4 transition-all duration-100 shadow-md group cursor-pointer active:scale-95 select-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
              <Inbox className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-0.5">
              Live
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium group-hover:text-blue-300 transition-colors">
            {t('new_requests')}
          </span>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {metrics?.new_requests ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Click to view</span>
        </div>

        {/* 2. Pending Orders */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('orders', 'Pending')}
          className="bg-[#111726] border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900/80 rounded-2xl p-4 transition-all duration-100 shadow-md group cursor-pointer active:scale-95 select-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
              Live
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium group-hover:text-amber-300 transition-colors">
            {t('pending_orders')}
          </span>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {metrics?.pending_orders ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Click to view</span>
        </div>

        {/* 3. In Progress */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('orders', 'In Progress')}
          className="bg-[#111726] border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-900/80 rounded-2xl p-4 transition-all duration-100 shadow-md group cursor-pointer active:scale-95 select-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-0.5">
              Live
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium group-hover:text-purple-300 transition-colors">
            {t('in_progress')}
          </span>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {metrics?.in_progress_orders ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Click to view</span>
        </div>

        {/* 4. Available Orders */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('orders', 'Available')}
          className="bg-[#111726] border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/80 rounded-2xl p-4 transition-all duration-100 shadow-md group cursor-pointer active:scale-95 select-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-0.5">
              Live
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium group-hover:text-indigo-300 transition-colors">
            {t('available_orders')}
          </span>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {metrics?.available_orders ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Click to view</span>
        </div>

        {/* 5. Confirmed Orders */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('orders', 'Confirmed')}
          className="bg-[#111726] border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 rounded-2xl p-4 transition-all duration-100 shadow-md group cursor-pointer active:scale-95 select-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
              Live
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium group-hover:text-emerald-300 transition-colors">
            {t('confirmed_orders')}
          </span>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {metrics?.confirmed_orders ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Click to view</span>
        </div>

        {/* 6. Completed Orders */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('orders', 'Completed')}
          className="bg-[#111726] border border-slate-800/80 hover:border-teal-500/50 hover:bg-slate-900/80 rounded-2xl p-4 transition-all duration-100 shadow-md group cursor-pointer active:scale-95 select-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300 group-hover:scale-105 transition">
              <CheckCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-0.5">
              Live
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium group-hover:text-teal-300 transition-colors">
            {t('completed_orders')}
          </span>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {metrics?.completed_orders ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Click to view</span>
        </div>

        {/* 7. Rejected Orders */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('orders', 'Rejected')}
          className="bg-[#111726] border border-slate-800/80 hover:border-red-500/50 hover:bg-slate-900/80 rounded-2xl p-4 transition-all duration-100 shadow-md group cursor-pointer active:scale-95 select-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition">
              <XCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-red-400 font-semibold flex items-center gap-0.5">
              Live
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium group-hover:text-red-300 transition-colors">
            {t('rejected_orders')}
          </span>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {metrics?.rejected_orders ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Click to view</span>
        </div>

        {/* 8. Debt Orders */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('ar_report')}
          className="bg-[#111726] border border-amber-500/40 hover:border-amber-400 hover:bg-slate-900/80 rounded-2xl p-4 transition-all duration-100 shadow-md cursor-pointer active:scale-95 select-none group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
              AR Debt
            </span>
          </div>
          <span className="text-xs text-amber-300 font-medium group-hover:text-amber-200 transition-colors">
            {t('debt_orders')}
          </span>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {metrics?.debt_orders ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Open AR Report</span>
        </div>

        {/* 9. Total Outstanding Debt */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('ar_report')}
          className="bg-gradient-to-br from-[#161F33] to-[#101626] border border-amber-500/50 hover:border-amber-400 hover:from-[#1b253d] rounded-2xl p-4 transition-all duration-100 shadow-lg cursor-pointer active:scale-95 select-none group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
              Receivable
            </span>
          </div>
          <span className="text-xs text-amber-300 font-bold">{t('total_outstanding_debt')}</span>
          <div className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 mt-0.5 font-mono">
            ${(metrics?.total_outstanding_debt ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Open AR Report</span>
        </div>

        {/* 10. Today's Requests */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('orders', 'New')}
          className="bg-[#111726] border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900/80 rounded-2xl p-4 transition-all duration-100 shadow-md group cursor-pointer active:scale-95 select-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-0.5">
              Today
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium group-hover:text-cyan-300 transition-colors">
            {t('todays_requests')}
          </span>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {metrics?.todays_requests ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Click to view</span>
        </div>

        {/* 11. Today's Orders */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('orders', 'All')}
          className="bg-[#111726] border border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-900/80 rounded-2xl p-4 transition-all duration-100 shadow-md group cursor-pointer active:scale-95 select-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-0.5">
              Today
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium group-hover:text-sky-300 transition-colors">
            {t('todays_orders')}
          </span>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {metrics?.todays_orders ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Click to view</span>
        </div>

        {/* 12. Active Employees */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (user?.role === 'super_admin') {
              onNavigateTab('employees');
            } else {
              onNavigateTab('messages');
            }
          }}
          className="bg-[#111726] border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900/80 rounded-2xl p-4 transition-all duration-100 shadow-md group cursor-pointer active:scale-95 select-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Active</span>
          </div>
          <span className="text-xs text-slate-400 font-medium group-hover:text-blue-300 transition-colors">
            {t('active_employees')}
          </span>
          <div className="text-xl font-extrabold text-white mt-0.5">
            {metrics?.active_employees ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {user?.role === 'super_admin' ? 'Manage Staff' : 'View Team'}
          </span>
        </div>
      </div>

      {/* 3. Interactive Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Chart 1: Orders by Day */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-[#111726] border border-slate-800/80 hover:border-amber-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between cursor-pointer transition hover:bg-slate-900/40"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{t('orders_by_day')}</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
              Last 7 Days
            </span>
          </div>

          <div className="h-44 w-full relative flex flex-col justify-end pt-4 px-1">
            <svg className="w-full h-28 overflow-visible" viewBox="0 0 240 100">
              {/* Background horizontal grid line */}
              <line x1="10" y1="80" x2="230" y2="80" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="10" y1="40" x2="230" y2="40" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />

              {/* Dynamic Polyline */}
              {chartPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  points={chartPoints.map((pt) => `${pt.x},${pt.y}`).join(' ')}
                />
              )}

              {/* Interactive Data Points */}
              {chartPoints.map((pt, i) => (
                <g key={i} className="group/dot cursor-pointer">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#FBBF24"
                    stroke="#0B0F19"
                    strokeWidth="2"
                    className="transition group-hover/dot:scale-150"
                  />
                  {pt.count > 0 && (
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      textAnchor="middle"
                      fill="#FDE68A"
                      fontSize="9"
                      fontWeight="bold"
                      className="select-none"
                    >
                      {pt.count}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {/* Date Labels */}
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-2">
              {daysData.map((d, i) => (
                <span key={i} className="truncate text-center" title={`${d.count} orders on ${d.date}`}>
                  {d.date.split(' ')[1] || d.date}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Orders by Service */}
        <div className="bg-[#111726] border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 mb-3">
            <Luggage className="w-4 h-4 text-amber-400" />
            <span>{t('orders_by_service')}</span>
          </h3>

          <div className="flex items-center gap-4">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {serviceStats.total === 0 ? (
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#1E293B" strokeWidth="4.5" />
                ) : (
                  serviceStats.items.map((item, idx) => (
                    item.pct > 0 ? (
                      <circle
                        key={idx}
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="4.5"
                        strokeDasharray={`${item.pct} ${100 - item.pct}`}
                        strokeDashoffset={-item.offset}
                        className="transition-all duration-300"
                      />
                    ) : null
                  ))
                )}
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-sm font-extrabold text-white">{serviceStats.total}</span>
                <span className="text-[8px] text-slate-400">Total</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] flex-1">
              {serviceStats.items.map((svc) => (
                <button
                  key={svc.key}
                  type="button"
                  onClick={() => onNavigateTab('orders', undefined, svc.key)}
                  className="w-full flex items-center justify-between text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${svc.dotClass}`} />
                    <span>{svc.label}</span>
                  </span>
                  <span className="font-bold text-white">
                    {svc.count} ({svc.pct}%)
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Orders by Status */}
        <div className="bg-[#111726] border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{t('orders_by_status')}</span>
          </h3>

          <div className="flex items-center gap-4">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {statusStats.total === 0 ? (
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#1E293B" strokeWidth="4.5" />
                ) : (
                  statusStats.items.map((item, idx) => (
                    item.pct > 0 ? (
                      <circle
                        key={idx}
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="4.5"
                        strokeDasharray={`${item.pct} ${100 - item.pct}`}
                        strokeDashoffset={-item.offset}
                        className="transition-all duration-300"
                      />
                    ) : null
                  ))
                )}
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-sm font-extrabold text-white">{statusStats.total}</span>
                <span className="text-[8px] text-slate-400">Total</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] flex-1">
              {statusStats.items.map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => onNavigateTab(st.key === 'Debt' ? 'ar_report' : 'orders', st.key)}
                  className="w-full flex items-center justify-between text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${st.dotClass}`} />
                    <span>{st.label}</span>
                  </span>
                  <span className={`font-bold ${st.key === 'Debt' ? 'text-red-400' : 'text-white'}`}>
                    {st.count} ({st.pct}%)
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Payments & Debt */}
        <div
          onClick={() => onNavigateTab('ar_report')}
          className="bg-[#111726] border border-slate-800/80 hover:border-amber-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between cursor-pointer transition hover:bg-slate-900/40"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>{t('payments_debt')}</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
              4 Weeks
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Payments
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Outstanding Debt
            </span>
          </div>

          <div className="h-36 flex items-end justify-between gap-3 pt-2">
            {weeklyStats.weeks.map((col, idx) => {
              const pHeight = Math.min(100, Math.max(8, Math.round((col.payments / weeklyStats.maxVal) * 100)));
              const dHeight = Math.min(100, Math.max(8, Math.round((col.debt / weeklyStats.maxVal) * 100)));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-28">
                    <div
                      style={{ height: `${col.payments > 0 ? pHeight : 4}%` }}
                      className={`w-3.5 ${col.payments > 0 ? 'bg-emerald-500' : 'bg-slate-800'} rounded-t-sm hover:opacity-80 transition`}
                      title={`Payments: $${col.payments.toLocaleString()}`}
                    />
                    <div
                      style={{ height: `${col.debt > 0 ? dHeight : 4}%` }}
                      className={`w-3.5 ${col.debt > 0 ? 'bg-amber-500' : 'bg-slate-800'} rounded-t-sm hover:opacity-80 transition`}
                      title={`Debt: $${col.debt.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">{col.week}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Recent Orders & Recent Transactions Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-[#111726] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>{t('recent_orders')}</span>
            </h2>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer active:scale-95 duration-75"
            >
              <span>{t('view_all')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D121F] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">{t('order_id')}</th>
                  <th className="py-2.5 px-3">{t('customer')}</th>
                  <th className="py-2.5 px-3">{t('service')}</th>
                  <th className="py-2.5 px-3">{t('status')}</th>
                  <th className="py-2.5 px-3">{t('total_price')}</th>
                  <th className="py-2.5 px-3">{t('created_by')}</th>
                  <th className="py-2.5 px-3">{t('date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => onSelectOrder(ord.id)}
                    className="hover:bg-slate-800/50 cursor-pointer transition active:bg-slate-800"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">
                      {ord.order_number}
                    </td>
                    <td className="py-3 px-3 font-medium text-white">
                      {ord.customer?.full_name || 'Customer'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{ord.service_type}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          ord.status
                        )}`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      ${ord.total_price.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">@{ord.created_by}</td>
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                      {ord.created_at.split('T')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#111726] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>{t('recent_transactions')}</span>
            </h2>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer active:scale-95 duration-75"
            >
              <span>{t('view_all')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D121F] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">{t('type')}</th>
                  <th className="py-2.5 px-3">{t('order_id')}</th>
                  <th className="py-2.5 px-3">{t('amount')}</th>
                  <th className="py-2.5 px-3">By</th>
                  <th className="py-2.5 px-3">{t('date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentTransactions.map((trx) => (
                  <tr
                    key={trx.id}
                    onClick={() => onNavigateTab('transactions')}
                    className="hover:bg-slate-800/50 cursor-pointer transition active:bg-slate-800"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-400">{trx.id}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTransactionTypeBadge(
                          trx.transaction_type
                        )}`}
                      >
                        {trx.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-300 font-semibold">
                      {trx.order_id}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      ${trx.payment_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">@{trx.changed_by}</td>
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                      {trx.created_at.split('T')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Close Cash Counter Modal */}
      <CloseCashCounterModal
        isOpen={isCloseCounterModalOpen}
        onClose={() => setIsCloseCounterModalOpen(false)}
        currentBalance={currentCashCounterBalance}
        targetStaffUsername={selectedStaffCounter}
        onSuccess={() => {
          loadDashboardData();
          if (selectedStaffCounter !== 'All') {
            fetchStaffCounter(selectedStaffCounter);
          }
        }}
      />
    </div>
  );
};
