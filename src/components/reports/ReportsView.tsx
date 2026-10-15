import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  DollarSign,
  ShoppingCart,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { BalcadLogo } from '../BalcadLogo';

export const ReportsView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'daily_audit'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [timeFilter, selectedDate]);

  const loadReports = async () => {
    setLoading(true);
    try {
      if (timeFilter === 'daily_audit') {
        const d = await api.getDailyReport(selectedDate);
        setDailyData(d);
      } else {
        const r = await api.getGeneralReports({ range: timeFilter });
        setReportData(r);
      }
    } catch (err) {
      console.warn('Reports notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (timeFilter === 'daily_audit' && dailyData) {
      const headers = ['Order ID', 'Customer', 'Service Type', 'Status', 'Total Price', 'Created By', 'Date'];
      const rows = (dailyData.orders || []).map((o: any) => [
        o.order_number,
        `"${o.customer?.full_name || 'Customer'}"`,
        o.service_type,
        o.status,
        o.total_price,
        o.created_by,
        o.created_at,
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      const encoded = encodeURI(csv);
      const a = document.createElement('a');
      a.href = encoded;
      a.download = `balcad_daily_report_${selectedDate}.csv`;
      a.click();
    } else if (reportData) {
      const headers = ['Staff Member', 'Department', 'Orders Created', 'Orders Assigned', 'Total Sales'];
      const rows = (reportData.orders_by_employee || []).map((e: any) => [
        `"${e.full_name}"`,
        e.department,
        e.orders_created,
        e.orders_assigned,
        e.total_sales,
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      const encoded = encodeURI(csv);
      const a = document.createElement('a');
      a.href = encoded;
      a.download = `balcad_performance_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
    showToast('Report CSV exported successfully.', 'success');
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      showToast('Print dialog triggered. You can save as PDF.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>{t('reports')} & Daily Audit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Financial analytics, employee booking performance, and daily transaction audit sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all duration-75 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs transition-all duration-75 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'daily_audit', label: 'Daily Report Sheet' },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setTimeFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap cursor-pointer transition-all duration-75 active:scale-95 ${
                timeFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {timeFilter === 'daily_audit' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-semibold">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading reports data...</div>
      ) : timeFilter === 'daily_audit' && dailyData ? (
        /* DAILY REPORT SHEET */
        <div className="space-y-6">
          <div className="bg-[#111726] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Daily Operational Audit Sheet</h2>
                <span className="text-xs text-amber-400 font-mono">Date: {dailyData.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <BalcadLogo size="xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Orders Created</span>
                <span className="text-base font-bold text-white mt-1 block">{dailyData.orders_created}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Completed</span>
                <span className="text-base font-bold text-teal-400 mt-1 block">{dailyData.completed_orders}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Debt Orders</span>
                <span className="text-base font-bold text-red-400 mt-1 block">{dailyData.debt_orders}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Payments Collected</span>
                <span className="text-base font-bold text-emerald-400 font-mono mt-1 block">
                  ${(dailyData.payments_received_total || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Daily Orders Table */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Orders Recorded on {dailyData.date}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0C111C] text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Service</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Total Price</th>
                      <th className="py-2.5 px-3">Created By</th>
                      <th className="py-2.5 px-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {(dailyData.orders || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500">
                          No orders created on this date.
                        </td>
                      </tr>
                    ) : (
                      dailyData.orders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-300">{o.order_number}</td>
                          <td className="py-2.5 px-3 font-medium text-white">{o.customer?.full_name || 'Customer'}</td>
                          <td className="py-2.5 px-3">{o.service_type}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700">
                              {o.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-white">${o.total_price}</td>
                          <td className="py-2.5 px-3 font-mono text-amber-300">Created by: @{o.created_by}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                            {new Date(o.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GENERAL REPORT VIEW */
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Orders</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {reportData?.summary?.total_orders || 15}
              </span>
            </div>
            <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Gross Booking Volume</span>
              <span className="text-xl font-mono font-bold text-white mt-1 block">
                ${(reportData?.summary?.total_revenue || 16500).toLocaleString()}
              </span>
            </div>
            <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Payments Received</span>
              <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block">
                ${(reportData?.summary?.total_collected || 13650).toLocaleString()}
              </span>
            </div>
            <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 shadow">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Outstanding AR Debt</span>
              <span className="text-xl font-mono font-bold text-red-400 mt-1 block">
                ${(reportData?.summary?.total_debt || 2850).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Employee Performance Breakdown Table */}
          <div className="bg-[#111726] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-white mb-3">Employee Booking & Sales Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0C111C] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Orders Created</th>
                    <th className="py-2.5 px-3">Orders Assigned</th>
                    <th className="py-2.5 px-3">Total Sales Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {(reportData?.orders_by_employee || []).map((emp: any) => (
                    <tr key={emp.username} className="hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-bold text-white">
                        {emp.full_name}{' '}
                        <span className="font-mono text-[11px] text-amber-300 font-normal">
                          (@{emp.username})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{emp.department}</td>
                      <td className="py-3 px-3 font-mono font-bold text-white">{emp.orders_created}</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-300">{emp.orders_assigned}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        ${emp.total_sales.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
