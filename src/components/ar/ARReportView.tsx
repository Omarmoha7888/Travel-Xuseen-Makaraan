import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  AlertCircle,
  PlusCircle,
  History,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit,
  Download,
  Users,
  Briefcase,
  Calendar,
  X,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  FileText,
  Eye,
  ExternalLink,
  Sparkles,
  TrendingUp,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Order, Payment } from '../../types';

interface ARReportViewProps {
  onSelectOrder?: (orderId: string) => void;
  initialView?: 'review' | 'table';
}

export const ARReportView: React.FC<ARReportViewProps> = ({
  onSelectOrder,
  initialView = 'review',
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<'review' | 'table'>(initialView);
  const [auditActionFilter, setAuditActionFilter] = useState<'All' | 'payment_received' | 'financial_adjustment' | 'creation' | 'status_change'>('All');

  useEffect(() => {
    if (initialView) {
      setViewMode(initialView);
    }
  }, [initialView]);

  const [arData, setArData] = useState<{ summary: any; orders: any[] }>({
    summary: {},
    orders: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Recent' | 'Older' | 'Modified' | 'HighDebt'>('All');
  const [selectedStaff, setSelectedStaff] = useState<string>('All');
  const [selectedOrderForAudit, setSelectedOrderForAudit] = useState<any | null>(null);

  // Modals
  const [selectedOrderForPay, setSelectedOrderForPay] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNote, setPayNote] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  // Financial Adjustment Modal (Super Admin only)
  const [selectedOrderForAdj, setSelectedOrderForAdj] = useState<any | null>(null);
  const [adjReason, setAdjReason] = useState('');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjLoading, setAdjLoading] = useState(false);

  useEffect(() => {
    loadAR();
  }, []);

  const loadAR = async () => {
    setLoading(true);
    try {
      const res = await api.getARReport();
      const rawOrders = Array.isArray(res?.orders)
        ? res.orders
        : Array.isArray((res as any)?.debtOrders)
        ? (res as any).debtOrders
        : [];

      const rawSummary = res?.summary || {
        total_debt_customers: new Set(rawOrders.map((o: any) => o.customer_id || o.customer_name)).size,
        total_debt_orders: rawOrders.length,
        total_amount_owed: rawOrders.reduce((sum: number, o: any) => sum + (Number(o.total_price) || 0), 0),
        total_amount_paid: rawOrders.reduce((sum: number, o: any) => sum + (Number(o.total_paid || o.amount_paid) || 0), 0),
        total_outstanding_debt: rawOrders.reduce((sum: number, o: any) => sum + (Number(o.outstanding_debt) || 0), 0),
      };

      setArData({
        summary: rawSummary,
        orders: rawOrders,
      });
    } catch (err) {
      console.warn('Notice loading AR report:', err);
      setArData({ summary: {}, orders: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPay) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setPayError('Please enter a valid payment amount.');
      return;
    }
    if (amount > selectedOrderForPay.outstanding_debt) {
      setPayError('Payment cannot be greater than the outstanding balance.');
      return;
    }

    setPayLoading(true);
    setPayError(null);
    try {
      await api.addPayment(selectedOrderForPay.internal_id, {
        amount,
        payment_method: payMethod,
        payment_note: payNote,
      });
      setSelectedOrderForPay(null);
      setPayAmount('');
      setPayNote('');
      await loadAR();
    } catch (err: any) {
      setPayError(err.message || 'Failed to record payment.');
    } finally {
      setPayLoading(false);
    }
  };

  const handleFinancialAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForAdj) return;
    if (!adjReason.trim()) return;

    setAdjLoading(true);
    try {
      await api.adjustFinancial(selectedOrderForAdj.internal_id, {
        reason: adjReason,
        adjustment_amount: Number(adjAmount) || 0,
      });
      showToast('Financial adjustment applied and audited successfully.', 'success');
      setSelectedOrderForAdj(null);
      setAdjReason('');
      setAdjAmount('');
      await loadAR();
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust financial record.', 'error');
    } finally {
      setAdjLoading(false);
    }
  };

  const filteredOrders = (arData.orders || []).filter((ord) => {
    if (!ord) return false;
    const orderId = String(ord.order_id || ord.order_number || '');
    const custName = String(ord.customer_name || ord.customer?.full_name || '');
    const custPhone = String(ord.customer_phone || ord.customer?.phone || '');
    const createdBy = String(ord.created_by || '');
    const assignedEmp = String(ord.assigned_employee || ord.assigned_staff || '');
    const svcType = String(ord.service_type || '');
    const debtStatus = ord.debt_status || (Number(ord.outstanding_debt || 0) > 0 ? (Number(ord.total_paid || ord.amount_paid || 0) > 0 ? 'Partially Paid' : 'Unpaid') : 'Paid');
    const daysOutstanding = Number(ord.days_outstanding ?? 0);

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        orderId.toLowerCase().includes(q) ||
        custName.toLowerCase().includes(q) ||
        custPhone.includes(q) ||
        createdBy.toLowerCase().includes(q) ||
        assignedEmp.toLowerCase().includes(q) ||
        svcType.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Quick filter
    if (selectedStaff !== 'All') {
      const qStaff = selectedStaff.toLowerCase();
      const hasTouched =
        createdBy.toLowerCase() === qStaff ||
        assignedEmp.toLowerCase() === qStaff ||
        (ord.modifications_history && ord.modifications_history.some((m: any) => m.staff_username?.toLowerCase() === qStaff)) ||
        (ord.payments && ord.payments.some((p: any) => p.received_by?.toLowerCase() === qStaff));
      if (!hasTouched) {
        return false;
      }
    }

    if (statusFilter === 'Unpaid') return debtStatus === 'Unpaid';
    if (statusFilter === 'Partially Paid') return debtStatus === 'Partially Paid';
    if (statusFilter === 'Paid') return debtStatus === 'Paid';
    if (statusFilter === 'Recent') return daysOutstanding <= 14;
    if (statusFilter === 'Older') return daysOutstanding > 14;
    if (statusFilter === 'Modified') return (ord.modifications_history?.length || 0) > 0;
    if (statusFilter === 'HighDebt') return Number(ord.outstanding_debt || 0) >= 1000;

    return true;
  });

  const summary = arData.summary || {};

  const availableStaff = useMemo(() => {
    const set = new Set<string>();
    arData.orders.forEach((o: any) => {
      if (o.created_by) set.add(o.created_by);
      if (o.assigned_employee && o.assigned_employee !== 'Unassigned') set.add(o.assigned_employee);
      if (o.assigned_staff && o.assigned_staff !== 'Unassigned') set.add(o.assigned_staff);
      o.modifications_history?.forEach((m: any) => {
        if (m.staff_username) set.add(m.staff_username);
      });
      o.payments?.forEach((p: any) => {
        if (p.received_by) set.add(p.received_by);
      });
    });
    if (user?.username) set.add(user.username);
    set.add('blc00001');
    set.add('blc00002');
    return Array.from(set).sort();
  }, [arData.orders, user]);

  const staffStats = useMemo(() => {
    const map: Record<
      string,
      {
        username: string;
        ordersCount: number;
        totalDebt: number;
        totalPaid: number;
        modificationsCount: number;
      }
    > = {};

    availableStaff.forEach((st) => {
      map[st] = {
        username: st,
        ordersCount: 0,
        totalDebt: 0,
        totalPaid: 0,
        modificationsCount: 0,
      };
    });

    (arData.orders || []).forEach((ord: any) => {
      const touched = new Set<string>();
      if (ord.created_by) touched.add(ord.created_by);
      if (ord.assigned_employee && ord.assigned_employee !== 'Unassigned') touched.add(ord.assigned_employee);
      if (ord.assigned_staff && ord.assigned_staff !== 'Unassigned') touched.add(ord.assigned_staff);
      ord.modifications_history?.forEach((m: any) => {
        if (m.staff_username) touched.add(m.staff_username);
      });
      ord.payments?.forEach((p: any) => {
        if (p.received_by) touched.add(p.received_by);
      });

      touched.forEach((st) => {
        if (!map[st]) {
          map[st] = { username: st, ordersCount: 0, totalDebt: 0, totalPaid: 0, modificationsCount: 0 };
        }
        map[st].ordersCount += 1;
        map[st].totalDebt += Number(ord.outstanding_debt || 0);
        map[st].totalPaid += Number(ord.total_paid || ord.amount_paid || 0);
      });

      ord.modifications_history?.forEach((m: any) => {
        if (m.staff_username && map[m.staff_username]) {
          map[m.staff_username].modificationsCount += 1;
        }
      });
    });

    return Object.values(map).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [arData.orders, availableStaff]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#0E1526] via-[#111A30] to-[#0A0F1D] border border-amber-500/20 shadow-xl">
        <div>
          {viewMode === 'review' ? (
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>Qeybta Review-ga Shaqaalaha & Hubinta Deynta</span>
                  </h1>
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" /> Staff Debt Audit & Modification Review
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Halkan waxaad ku hubin kartaa shaqaale kasta inta dalab oo deyn ah uu qabtay, inta lacag oo uu qaaday, inta deyn ah oo ku hartay, iyo taariikhda wax-ka-beddelka (Audit History).
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>{t('ar_report_title')}</span>
                  </h1>
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 mt-0.5">
                    Accounts Receivable Full Data Table
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Warbixinta guud ee deymaha shirkadda Balcad Travel Agency. Dhammaan dalabaadka deynta ku leh ayaa halkan ku qoran si faahfaahsan.
              </p>
            </div>
          )}
        </div>

        {/* View Mode Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#070B14] border border-slate-700/80 rounded-2xl shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('review')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 duration-75 select-none ${
              viewMode === 'review'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/25 font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Qeybta Review-ga</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono uppercase font-extrabold ${
              viewMode === 'review' ? 'bg-black/25 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              Audit Cards
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 duration-75 select-none ${
              viewMode === 'table'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Table View</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono uppercase font-extrabold ${
              viewMode === 'table' ? 'bg-black/25 text-slate-950' : 'bg-amber-500/20 text-amber-300'
            }`}>
              A/R
            </span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards - Clickable Interactive Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('All')}
          className="bg-[#111726] border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 shadow text-center cursor-pointer active:scale-95 duration-75 select-none transition"
        >
          <span className="text-[10px] text-slate-400 font-semibold block">{t('total_debt_customers')}</span>
          <span className="text-base font-bold text-white mt-1 block">{summary.total_debt_customers || 0}</span>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('All')}
          className="bg-[#111726] border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 shadow text-center cursor-pointer active:scale-95 duration-75 select-none transition"
        >
          <span className="text-[10px] text-slate-400 font-semibold block">{t('total_debt_orders')}</span>
          <span className="text-base font-bold text-white mt-1 block">{summary.total_debt_orders || 0}</span>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('All')}
          className="bg-[#111726] border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 shadow text-center cursor-pointer active:scale-95 duration-75 select-none transition"
        >
          <span className="text-[10px] text-slate-400 font-semibold block">{t('total_amount_owed')}</span>
          <span className="text-base font-mono font-bold text-slate-200 mt-1 block">
            ${(summary.total_amount_owed || 0).toLocaleString()}
          </span>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('Paid')}
          className="bg-[#111726] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3 shadow text-center cursor-pointer active:scale-95 duration-75 select-none transition"
        >
          <span className="text-[10px] text-slate-400 font-semibold block">{t('total_amount_paid')}</span>
          <span className="text-base font-mono font-bold text-emerald-400 mt-1 block">
            ${(summary.total_amount_paid || 0).toLocaleString()}
          </span>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('All')}
          className="bg-[#161F33] border border-amber-500/40 hover:border-amber-400 rounded-xl p-3 shadow text-center cursor-pointer active:scale-95 duration-75 select-none transition"
        >
          <span className="text-[10px] text-amber-300 font-bold block">{t('total_outstanding_debt')}</span>
          <span className="text-base font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-100 mt-1 block">
            ${(summary.total_outstanding_debt || 0).toLocaleString()}
          </span>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('Unpaid')}
          className="bg-[#111726] border border-slate-800 hover:border-red-500/40 rounded-xl p-3 shadow text-center cursor-pointer active:scale-95 duration-75 select-none transition"
        >
          <span className="text-[10px] text-red-400 font-semibold block">Unpaid Orders</span>
          <span className="text-base font-bold text-red-400 mt-1 block">{summary.unpaid_orders || 0}</span>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('Partially Paid')}
          className="bg-[#111726] border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 shadow text-center cursor-pointer active:scale-95 duration-75 select-none transition"
        >
          <span className="text-[10px] text-amber-400 font-semibold block">Partially Paid</span>
          <span className="text-base font-bold text-amber-400 mt-1 block">{summary.partially_paid_orders || 0}</span>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('Paid')}
          className="bg-[#111726] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3 shadow text-center cursor-pointer active:scale-95 duration-75 select-none transition"
        >
          <span className="text-[10px] text-emerald-400 font-semibold block">Fully Paid</span>
          <span className="text-base font-bold text-emerald-400 mt-1 block">{summary.fully_paid_orders || 0}</span>
        </div>
      </div>

      {/* Staff Debt Responsibility Cards (Review Mode) */}
      {viewMode === 'review' && (
        <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                Masuuliyadda Deynta & Xisaab-Hubinta Shaqaalaha (Staff Debt Responsibility)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Riix shaqaale kasta si aad u aragto dalabyada uu qabtay ama wax ka beddelay
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {staffStats.slice(0, 8).map((st) => {
              const isSelected = selectedStaff.toLowerCase() === st.username.toLowerCase();
              return (
                <div
                  key={st.username}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedStaff(isSelected ? 'All' : st.username)}
                  className={`p-3 rounded-xl border transition cursor-pointer select-none relative group ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xs">
                        {st.username.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-mono font-bold text-xs text-white block">
                          @{st.username}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {st.ordersCount} dalab oo deyn ah
                        </span>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                        Active
                      </span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono pt-2 border-t border-slate-800/80">
                    <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/60">
                      <span className="text-[9px] text-slate-400 uppercase block">Deyn Dhiman</span>
                      <span className="font-bold text-amber-300">
                        ${st.totalDebt.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/60">
                      <span className="text-[9px] text-slate-400 uppercase block">Wax-ka-beddel</span>
                      <span className="font-bold text-emerald-400">
                        {st.modificationsCount} dhacdo
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedStaff !== 'All' && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Hadda waxaad eegaysaa dalabaadka iyo wax-ka-beddelka: <strong>@{selectedStaff}</strong></span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedStaff('All')}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition cursor-pointer"
              >
                Muuji Dhammaan (Clear)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold mr-1 text-[11px] uppercase tracking-wider">
              {t('quick_filters')}:
            </span>
            {[
              { id: 'All', label: 'Dhammaan' },
              { id: 'Modified', label: 'Wax Ka Beddel Leh (Modified)' },
              { id: 'HighDebt', label: 'Deyn Sare (≥ $1,000)' },
              { id: 'Unpaid', label: 'Unpaid' },
              { id: 'Partially Paid', label: 'Partially Paid' },
              { id: 'Paid', label: 'Paid' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer active:scale-95 duration-75 ${
                  statusFilter === f.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Staff Filter Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Shaqaale:</span>
            </span>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono cursor-pointer"
            >
              <option value="All">Dhamaan Shaqaalaha (All Staff)</option>
              {availableStaff.map((st) => (
                <option key={st} value={st}>
                  @{st}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Order, Client, Phone..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content: Review Cards Mode vs Classic Table Mode */}
      {viewMode === 'review' ? (
        /* DEDICATED REVIEW CARDS GRID */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold text-slate-400">
                Dalabaadka Loo Hayo Review-ga ({filteredOrders.length})
              </span>
              {statusFilter !== 'All' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Shaandho: {statusFilter}
                </span>
              )}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-[#111726] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">Ma jiraan dalabaad deyn ah oo ku habboon shaandhadaada.</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Waxaad beddeli kartaa shaandhada sare ama raadinta si aad u aragto dhammaan dalabaadka deynta ku leh.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setSelectedStaff('All');
                  setSearch('');
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Dib u celi dhammaan shaandhooyinka
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((ord) => {
                const internalId = ord.internal_id || ord.id || ord.order_number;
                const orderId = ord.order_id || ord.order_number || ord.id;
                const custName = ord.customer_name || ord.customer?.full_name || 'N/A';
                const custPhone = ord.customer_phone || ord.customer?.phone || 'N/A';
                const svc = ord.service_type || 'Travel Service';
                const totalPrice = Number(ord.total_price || 0);
                const totalPaid = Number(ord.total_paid ?? ord.amount_paid ?? 0);
                const debt = Number(ord.outstanding_debt ?? Math.max(0, totalPrice - totalPaid));
                const debtStatus = ord.debt_status || (debt === 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Unpaid');
                const createdBy = ord.created_by || 'Staff';
                const assignedEmp = ord.assigned_employee || ord.assigned_staff || 'Unassigned';
                const daysOut = Number(ord.days_outstanding ?? 0);

                const staffSet = new Set<string>();
                if (ord.created_by) staffSet.add(ord.created_by);
                if (ord.assigned_employee && ord.assigned_employee !== 'Unassigned') staffSet.add(ord.assigned_employee);
                ord.modifications_history?.forEach((m: any) => {
                  if (m.staff_username) staffSet.add(m.staff_username);
                });
                ord.payments?.forEach((p: any) => {
                  if (p.received_by) staffSet.add(p.received_by);
                });
                const staffArr = Array.from(staffSet);
                const mods = ord.modifications_history || [];
                const lastMod = mods.length > 0 ? mods[mods.length - 1] : null;
                const percentPaid = totalPrice > 0 ? Math.min(100, Math.round((totalPaid / totalPrice) * 100)) : 0;

                return (
                  <div
                    key={internalId}
                    className="bg-[#111726] border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all duration-150 hover:shadow-xl group"
                  >
                    <div>
                      {/* Card Top */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-300 text-sm">
                              {orderId}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                              {svc}
                            </span>
                          </div>
                          <h4 className="text-white font-bold text-sm mt-1 truncate max-w-[200px]" title={custName}>
                            {custName}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-400">
                            {custPhone}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                            debtStatus === 'Paid'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : debtStatus === 'Partially Paid'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-red-500/15 text-red-400 border-red-500/30'
                          }`}
                        >
                          {debtStatus}
                        </span>
                      </div>

                      {/* Financial Progress Bar */}
                      <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Deynta Dhiman (Outstanding):</span>
                          <span className="font-mono font-extrabold text-sm text-red-400">
                            ${debt.toLocaleString()} USD
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              percentPaid === 100
                                ? 'bg-emerald-500'
                                : percentPaid > 0
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
                          <span>Wadarta: <strong className="text-slate-200">${totalPrice.toLocaleString()}</strong></span>
                          <span>La Bixiyay: <strong className="text-emerald-400">${totalPaid.toLocaleString()} ({percentPaid}%)</strong></span>
                        </div>
                      </div>

                      {/* Staff Involved Badges */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          <span>Shaqaalaha:</span>
                        </span>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[190px]">
                          {staffArr.map((st) => (
                            <span
                              key={st}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStaff(st);
                              }}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 rounded text-[10px] font-mono text-slate-300 border border-slate-700/80 cursor-pointer transition"
                              title={`Shaqaale ku lug yeeshay: @${st} (Click to filter)`}
                            >
                              @{st}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Recent Modification Audit Snippet */}
                      <div className="mt-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-bold uppercase font-mono text-[9px] flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            <span>Audit Trail ({mods.length} Dhacdo)</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {daysOut} days ago
                          </span>
                        </div>
                        {lastMod ? (
                          <p className="text-slate-300 truncate text-[10px] font-mono">
                            Last: <strong className="text-amber-300">@{lastMod.staff_username}</strong> • {lastMod.action_type || 'Updated'} (
                            <span className={Number(lastMod.amount_changed) < 0 ? 'text-emerald-400' : 'text-amber-400'}>
                              {lastMod.amount_changed !== undefined ? `${lastMod.amount_changed > 0 ? `+${lastMod.amount_changed}` : lastMod.amount_changed} USD` : `bal: $${lastMod.debt_balance_after || debt}`}
                            </span>)
                          </p>
                        ) : (
                          <p className="text-slate-500 text-[10px] italic">
                            Diiwaangelin bilow ah: @{createdBy}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForAudit(ord)}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Eeg Audit-ka</span>
                      </button>

                      {debt > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForPay({
                              ...ord,
                              internal_id: internalId,
                              order_id: orderId,
                              customer_name: custName,
                              total_price: totalPrice,
                              total_paid: totalPaid,
                              outstanding_debt: debt,
                            });
                            setPayAmount(debt.toString());
                            setPayError(null);
                          }}
                          title="Qabo Lacag (Payment)"
                          className="py-2 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Qabo</span>
                        </button>
                      )}

                      {onSelectOrder && (
                        <button
                          type="button"
                          onClick={() => onSelectOrder(internalId)}
                          title="Fur Bogga Dalabka Buuxa"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* AR MAIN TABLE */
        <div className="bg-[#111726] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0C111C] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">{t('order_id')}</th>
                  <th className="py-3 px-3.5">{t('customer')}</th>
                  <th className="py-3 px-3.5">{t('phone')}</th>
                  <th className="py-3 px-3.5">{t('service')}</th>
                  <th className="py-3 px-3.5">{t('total_price')}</th>
                  <th className="py-3 px-3.5">{t('amount_paid')}</th>
                  <th className="py-3 px-3.5">{t('outstanding_balance')}</th>
                  <th className="py-3 px-3.5">Debt Status</th>
                  <th className="py-3 px-3.5">Shaqaalaha Wax Ka Beddelay</th>
                  <th className="py-3 px-3.5">{t('created_by')}</th>
                  <th className="py-3 px-3.5">{t('assigned_to')}</th>
                  <th className="py-3 px-3.5">{t('days_outstanding')}</th>
                  <th className="py-3 px-3.5 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400">
                      No debt orders found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const internalId = ord.internal_id || ord.id || ord.order_number;
                    const orderId = ord.order_id || ord.order_number || ord.id;
                    const custName = ord.customer_name || ord.customer?.full_name || 'N/A';
                    const custPhone = ord.customer_phone || ord.customer?.phone || 'N/A';
                    const svc = ord.service_type || 'Travel Service';
                    const totalPrice = Number(ord.total_price || 0);
                    const totalPaid = Number(ord.total_paid ?? ord.amount_paid ?? 0);
                    const debt = Number(ord.outstanding_debt ?? Math.max(0, totalPrice - totalPaid));
                    const debtStatus = ord.debt_status || (debt === 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Unpaid');
                    const createdBy = ord.created_by || 'Staff';
                    const assignedEmp = ord.assigned_employee || ord.assigned_staff || 'Unassigned';
                    const daysOut = Number(ord.days_outstanding ?? 0);

                    return (
                      <tr key={internalId} className="hover:bg-slate-800/40 transition">
                        <td
                          onClick={() => onSelectOrder && onSelectOrder(internalId)}
                          className="py-3 px-3.5 font-mono font-bold text-amber-300 cursor-pointer hover:underline"
                        >
                          {orderId}
                        </td>
                        <td className="py-3 px-3.5 font-medium text-white">{custName}</td>
                        <td className="py-3 px-3.5 font-mono text-slate-400">{custPhone}</td>
                        <td className="py-3 px-3.5 text-slate-400">{svc}</td>
                        <td className="py-3 px-3.5 font-mono font-bold text-white">
                          ${totalPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-emerald-400 font-semibold">
                          ${totalPaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-extrabold text-red-400">
                          ${debt.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              debtStatus === 'Paid'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : debtStatus === 'Partially Paid'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-red-500/15 text-red-400 border-red-500/30'
                            }`}
                          >
                            {debtStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          {(() => {
                            const staffSet = new Set<string>();
                            if (ord.created_by) staffSet.add(ord.created_by);
                            if (ord.assigned_employee && ord.assigned_employee !== 'Unassigned') staffSet.add(ord.assigned_employee);
                            ord.modifications_history?.forEach((m: any) => {
                              if (m.staff_username) staffSet.add(m.staff_username);
                            });
                            ord.payments?.forEach((p: any) => {
                              if (p.received_by) staffSet.add(p.received_by);
                            });
                            const count = ord.modifying_staff_count || staffSet.size || 1;
                            const staffArr = Array.from(staffSet);
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 w-fit">
                                  <Users className="w-3 h-3 text-amber-400" />
                                  {count} Shaqaale
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]" title={staffArr.map(s => `@${s}`).join(', ')}>
                                  {staffArr.slice(0, 2).map(s => `@${s}`).join(', ')}{staffArr.length > 2 ? '...' : ''}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-400">{createdBy}</td>
                        <td className="py-3 px-3.5 font-mono text-slate-300">{assignedEmp}</td>
                        <td className="py-3 px-3.5 font-mono text-slate-400">{daysOut} days</td>
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedOrderForAudit(ord)}
                              title="Eeg Taariikhda Wax-ka-beddelka & Deyn Harka"
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shadow transition flex items-center gap-1 cursor-pointer"
                            >
                              <History className="w-3 h-3" />
                              <span>View / Eeg Deyn</span>
                            </button>

                            {debt > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForPay({
                                    ...ord,
                                    internal_id: internalId,
                                    order_id: orderId,
                                    customer_name: custName,
                                    total_price: totalPrice,
                                    total_paid: totalPaid,
                                    outstanding_debt: debt,
                                  });
                                  setPayAmount(debt.toString());
                                  setPayError(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3 h-3" />
                                <span>{t('add_payment')}</span>
                              </button>
                            )}

                            {user?.role === 'super_admin' && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForAdj({
                                    ...ord,
                                    internal_id: internalId,
                                    order_id: orderId,
                                  });
                                  setAdjAmount('0');
                                  setAdjReason('');
                                }}
                                title="Super Admin Financial Adjustment"
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {selectedOrderForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Record Debt Payment
              </h3>
              <button
                onClick={() => setSelectedOrderForPay(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Number:</span>
                <span className="font-mono font-bold text-amber-300">{selectedOrderForPay.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-medium text-white">{selectedOrderForPay.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Price:</span>
                <span className="font-mono text-slate-300">${selectedOrderForPay.total_price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Already Paid:</span>
                <span className="font-mono text-emerald-400">${selectedOrderForPay.total_paid}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-slate-800 pt-1.5 mt-1">
                <span className="text-amber-400">Remaining Debt:</span>
                <span className="font-mono text-red-400">${selectedOrderForPay.outstanding_debt}</span>
              </div>
            </div>

            {payError && (
              <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg">
                {payError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Amount ($ USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedOrderForPay.outstanding_debt}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Payment Destination (Meesha Lacagtu U Dhacayso)</span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">Kaliya Cash Counter</span>
                </label>
                <div className="w-full px-3.5 py-2.5 bg-slate-900 border border-amber-500/50 rounded-xl text-white flex items-center justify-between shadow-inner">
                  <span className="font-bold text-amber-300 flex items-center gap-2 text-xs">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Cash Counter (Sanduuqa Lacagta)
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono font-bold">
                    Automatic
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Lacagtani si toos ah oo automatic ah ayay ugu dhacaysaa sanduuqaaga (Cash Counter), wax doorasho kale ah lama bixinayo.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Reference / Note
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Receipt #4492, EVC TXN ID"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForPay(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg transition"
                >
                  {payLoading ? 'Recording...' : t('save_payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Financial Adjustment Modal (Super Admin Only) */}
      {selectedOrderForAdj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Super Admin Financial Adjustment
              </h3>
              <button
                onClick={() => setSelectedOrderForAdj(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Any adjustment is strictly logged into the financial audit history with your username (
              <span className="font-mono text-amber-300">{user?.username}</span>).
            </p>

            <form onSubmit={handleFinancialAdjustment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Authorized discount, fee waiver, price correction"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adjustment Amount ($ USD) (+/- to total price)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  placeholder="e.g. -50 to reduce total or +50 to increase"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForAdj(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={adjLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg transition"
                >
                  {adjLoading ? 'Saving...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Audit & Debt Modifications History Modal */}
      {selectedOrderForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-amber-500/30 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative text-white max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Audit: {selectedOrderForAudit.order_id || selectedOrderForAudit.order_number}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      Deyn: ${(selectedOrderForAudit.outstanding_debt || 0).toLocaleString()} USD
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Macmiilka: <strong className="text-slate-200">{selectedOrderForAudit.customer_name || 'Customer'}</strong> • {selectedOrderForAudit.service_type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForAudit(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-5 pr-1 text-xs">
              {/* Sida loo create gareeyay */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-2">
                <span className="text-[11px] uppercase font-mono text-amber-400 font-bold tracking-wider block">
                  1. Sida Dalabkan Loo Diiwaangeliyay (Creation Details)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-center">
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Diiwaangeliyay</span>
                    <span className="text-xs font-mono font-bold text-amber-300 mt-0.5 block">
                      @{selectedOrderForAudit.created_by || 'Staff'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Waqtiga</span>
                    <span className="text-[11px] font-mono text-white mt-0.5 block font-medium">
                      {selectedOrderForAudit.created_at ? new Date(selectedOrderForAudit.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Qiimaha Guud</span>
                    <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                      ${(selectedOrderForAudit.total_price || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Deyn Bilowgii</span>
                    <span className="text-xs font-mono font-bold text-red-400 mt-0.5 block">
                      ${(selectedOrderForAudit.outstanding_debt || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shaqaalaha Wax ka Beddelay */}
              {(() => {
                const staffList = new Set<string>();
                if (selectedOrderForAudit.created_by) staffList.add(selectedOrderForAudit.created_by);
                if (selectedOrderForAudit.assigned_employee && selectedOrderForAudit.assigned_employee !== 'Unassigned') {
                  staffList.add(selectedOrderForAudit.assigned_employee);
                }
                selectedOrderForAudit.modifications_history?.forEach((m: any) => {
                  if (m.staff_username) staffList.add(m.staff_username);
                });
                selectedOrderForAudit.payments?.forEach((p: any) => {
                  if (p.received_by) staffList.add(p.received_by);
                });
                const staffArr = Array.from(staffList);

                return (
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="font-bold text-white block">
                        Tirada Shaqaalaha Wax ka Beddelay: {staffArr.length} Shaqaale
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Shaqaalaha ku lug yeeshay dalabkan
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {staffArr.map((st) => (
                        <span key={st} className="px-2 py-0.5 bg-slate-800 rounded-md text-[11px] font-mono text-amber-300 border border-slate-700">
                          @{st}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Modifications Timeline with Remaining Debt Balance */}
              <div className="space-y-2.5">
                <span className="text-[11px] uppercase font-mono text-amber-400 font-bold tracking-wider block">
                  2. Taariikhda Wax-ka-beddelka & Inta Deyn ee ku Hartay
                </span>

                {(!selectedOrderForAudit.modifications_history || selectedOrderForAudit.modifications_history.length === 0) ? (
                  <div className="p-4 bg-slate-900/40 rounded-xl text-center text-slate-400">
                    Weli wax isbeddel dheeraad ah laguma samayn dalabkan.
                  </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Username-ka Shaqaalaha</th>
                          <th className="py-2.5 px-3">Balance Hore ee Deynta</th>
                          <th className="py-2.5 px-3">Inta Uu Ka Beddelay</th>
                          <th className="py-2.5 px-3">Balance-ga Cusub</th>
                          <th className="py-2.5 px-3">Waqtiga</th>
                          <th className="py-2.5 px-3">Falka & Faahfaahinta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-300">
                        {selectedOrderForAudit.modifications_history.map((mod: any, idx: number) => {
                          const amtChanged =
                            mod.amount_changed !== undefined
                              ? mod.amount_changed
                              : mod.action_type === 'creation'
                              ? mod.debt_balance_after
                              : mod.action_type === 'payment_received'
                              ? -(Number(mod.previous_debt || 0) - Number(mod.debt_balance_after || 0))
                              : Number(mod.debt_balance_after || 0) - Number(mod.previous_debt || 0);

                          return (
                            <tr key={mod.id || idx} className="hover:bg-slate-900/30">
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                                @{mod.staff_username}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-300 font-semibold">
                                ${(mod.previous_debt ?? 0).toLocaleString()} USD
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] ${
                                    amtChanged < 0
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                      : amtChanged > 0
                                      ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {amtChanged > 0 ? `+${amtChanged.toLocaleString()}` : amtChanged.toLocaleString()} USD
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                                ${(mod.debt_balance_after ?? 0).toLocaleString()} USD
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-400 text-[10px]">
                                {new Date(mod.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                              <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                                {mod.description || mod.reason || mod.action_type?.replace(/_/g, ' ')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  const id = selectedOrderForAudit.internal_id || selectedOrderForAudit.id || selectedOrderForAudit.order_number;
                  setSelectedOrderForAudit(null);
                  if (onSelectOrder) {
                    onSelectOrder(id);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Fur Bogga Dalabka (Open Full Order)
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderForAudit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Xir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
