import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User,
  ArrowUpDown,
  Download,
  ShieldCheck,
  CreditCard,
  Eye,
  Lock,
  X,
  Phone,
  UserCheck,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Transaction, TransactionType } from '../../types';

export const RecentTransactionsView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [staffFilter, setStaffFilter] = useState<string>('All');
  const [selectedHandover, setSelectedHandover] = useState<Transaction | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';
  const isFinance =
    user?.profile?.department?.toLowerCase().includes('finance') ||
    user?.profile?.department?.toLowerCase().includes('account');

  useEffect(() => {
    loadTransactions();
  }, [typeFilter, staffFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (typeFilter !== 'All') params.type = typeFilter;
      if (staffFilter !== 'All') params.staff = staffFilter;
      if (search) params.search = search;

      const data = await api.getTransactions(params);
      setTransactions(data);
    } catch (err) {
      console.warn('Transactions notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Order ID',
      'Customer',
      'Transaction Type',
      'Prev Balance',
      'Payment Amount',
      'New Balance',
      'Currency',
      'Changed By',
      'Timestamp',
      'Notes',
    ];
    const rows = transactions.map((t) => [
      t.id,
      t.order_id,
      `"${t.customer_name}"`,
      t.transaction_type,
      t.previous_balance,
      t.payment_amount,
      t.new_balance,
      t.currency,
      t.changed_by,
      t.created_at,
      `"${t.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `balcad_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions exported to CSV successfully.', 'success');
  };

  const getBadgeStyle = (type: TransactionType) => {
    switch (type) {
      case 'Cash Counter Handover':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
      case 'Payment Received':
      case 'Debt Fully Paid':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold';
      case 'Partial Payment':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Debt Updated':
        return 'bg-red-500/15 text-red-300 border-red-500/30 font-bold';
      case 'Price Updated':
      case 'Financial Adjustment':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Order Created':
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
  };

  const transactionTypes = [
    'All',
    'Cash Counter Handover',
    'Payment Received',
    'Partial Payment',
    'Debt Updated',
    'Debt Fully Paid',
    'Order Created',
    'Price Updated',
    'Financial Adjustment',
  ];

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.order_id.toLowerCase().includes(q) ||
      t.customer_name.toLowerCase().includes(q) ||
      t.changed_by.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-6 h-6 text-amber-400" />
              <span>{t('recent_transactions')}</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Immutable Audit
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete financial audit trail of all orders, payments, debt updates, and financial adjustments.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold text-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV / Excel</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        {/* Quick Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {transactionTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
                typeFilter === type
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Transaction ID (TRX-...), Order ID, Customer name, or Changed By..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {user?.role === 'super_admin' ? (
            <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
              <span className="text-[11px] text-slate-400 font-mono">Shaqaale:</span>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono cursor-pointer w-full sm:w-auto"
              >
                <option value="All">Dhamaan Shaqaalaha (All Staff)</option>
                <option value="blc00001">@blc00001 (Super Admin)</option>
                <option value="blc00002">@blc00002 (Cumar Taakuur)</option>
                <option value="mohamed">@mohamed (Mohamed)</option>
                <option value="sarah">@sarah (Sarah)</option>
                <option value="ali">@ali (Ali)</option>
              </select>
            </div>
          ) : (
            <div className="shrink-0 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
              Dhaqdhaqaaqaaga Gaarka ah: @{user?.username}
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C111C] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Transaction ID</th>
                <th className="py-3 px-3.5">{t('order_id')}</th>
                <th className="py-3 px-3.5">{t('customer')}</th>
                <th className="py-3 px-3.5">{t('type')}</th>
                <th className="py-3 px-3.5">Prev Balance</th>
                <th className="py-3 px-3.5">Payment</th>
                <th className="py-3 px-3.5">New Balance</th>
                <th className="py-3 px-3.5">Changed By</th>
                <th className="py-3 px-3.5">{t('date')}</th>
                <th className="py-3 px-3.5">Notes</th>
                <th className="py-3 px-3.5 text-center">Faahfaahin / Caddayn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No financial transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map((trx) => {
                  const isHandover =
                    trx.transaction_type === 'Cash Counter Handover' || Boolean(trx.closure_details);
                  const canViewForm =
                    isSuperAdmin ||
                    isFinance ||
                    user?.username.toLowerCase() === trx.changed_by.toLowerCase();

                  return (
                    <tr
                      key={trx.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isHandover ? 'bg-amber-500/[0.02]' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-400">{trx.id}</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-amber-300">
                        {isHandover ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                            Xisaab Xir
                          </span>
                        ) : (
                          trx.order_id
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-medium text-white">{trx.customer_name}</td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] border ${getBadgeStyle(
                            trx.transaction_type
                          )}`}
                        >
                          {trx.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-400">
                        ${trx.previous_balance.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-emerald-400">
                        ${trx.payment_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-white">
                        ${trx.new_balance.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-amber-300">
                        Changed by: @{trx.changed_by}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-500 text-[11px]">
                        {new Date(trx.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td
                        className="py-3 px-3.5 text-slate-400 truncate max-w-[180px]"
                        title={trx.notes}
                      >
                        {trx.notes || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {isHandover ? (
                          canViewForm ? (
                            <button
                              onClick={() => setSelectedHandover(trx)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition cursor-pointer active:scale-95 shadow-sm"
                              title="Eeg macluumaadka buuxa ee qofka lacagta loo dhiibay iyo sawirka caddaynta"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>Faahfaahin & Caddayn</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/60 text-slate-500 text-[10px] font-mono">
                              <Lock className="w-3 h-3 text-slate-500" /> Admin/Finance Only
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600 font-mono text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Handover Details Modal */}
      {selectedHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-xs">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#162036]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Faahfaahinta Xisaab Xirka Sanduuqa</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                      Handover Form
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Transaction ID: <span className="font-mono text-slate-300">{selectedHandover.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHandover(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Handover Amount Card */}
              <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/10 to-blue-500/10 border border-amber-500/40 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-wider block">
                    Cadadka Lacagta La Dhiibay (Handover Amount)
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    ${selectedHandover.payment_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Xisaabtu Waa Xirantahay
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Balance-ka Sanduuqa: <strong className="text-amber-300 font-mono">$0.00</strong>
                  </p>
                </div>
              </div>

              {/* Staff Who Closed Details */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider block">
                  Shaqaalaha Xisaabta Xiray (Staff Member)
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Username:</span>
                    <span className="font-mono font-bold text-amber-300">
                      @{selectedHandover.closure_details?.employee_username || selectedHandover.changed_by}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Magaca:</span>
                    <span className="font-semibold text-white">
                      {selectedHandover.closure_details?.employee_name || selectedHandover.changed_by}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <span className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Qofka Lacagta Loo Dhiibay (Recipient Details)
                </span>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400">Magaca Buuxa (Full Name):</span>
                    <span className="font-bold text-white">
                      {selectedHandover.closure_details?.recipient_name ||
                        selectedHandover.customer_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400">Lambarka Taleefanka:</span>
                    <span className="font-mono font-bold text-cyan-300 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedHandover.closure_details?.recipient_phone || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400">Username-ka:</span>
                    <span className="font-mono font-bold text-amber-300">
                      @{selectedHandover.closure_details?.recipient_username || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-400">Waqtiga & Taariikhda:</span>
                    <span className="font-mono text-slate-300">
                      {new Date(selectedHandover.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(selectedHandover.closure_details?.notes || selectedHandover.notes) && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider block">
                    Qoraal / Notes
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedHandover.closure_details?.notes || selectedHandover.notes}
                  </p>
                </div>
              )}

              {/* Proof Image Preview */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Sawirka Caddaynta Lacag-Dirista (Proof Receipt)
                  </span>
                  <span className="text-slate-400 font-normal">Guji si aad u waynayso</span>
                </span>

                {selectedHandover.closure_details?.proof_image_url ? (
                  <div
                    onClick={() =>
                      setZoomedImage(selectedHandover.closure_details!.proof_image_url)
                    }
                    className="relative border border-slate-700/80 rounded-xl overflow-hidden bg-slate-950 max-h-56 flex items-center justify-center cursor-pointer group hover:border-amber-500/50 transition"
                  >
                    <img
                      src={selectedHandover.closure_details.proof_image_url}
                      alt="Caddaynta Lacagta"
                      className="max-h-56 w-auto object-contain transition duration-150 group-hover:scale-102"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-medium text-xs gap-1.5">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>Guji si aad u waynayso (Full Screen)</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-400">
                    Sawir caddayn ah lama helin.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#162036] border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Xogtan waxaa kaliya oo arki kara Admin & Finance.
              </span>
              <button
                type="button"
                onClick={() => setSelectedHandover(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition cursor-pointer"
              >
                Xir (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Zoomed Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white transition z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomedImage}
            alt="Proof Zoom"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-slate-700"
          />
        </div>
      )}
    </div>
  );
};
