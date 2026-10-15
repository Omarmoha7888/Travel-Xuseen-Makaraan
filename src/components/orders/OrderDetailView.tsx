import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Upload,
  Download,
  Trash2,
  Edit,
  History,
  Plane,
  CreditCard,
  PlusCircle,
  MessageSquare,
  Shield,
  Briefcase,
  X,
  Printer,
  Users,
  Image as ImageIcon,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Order, OrderStatus, Payment, DocumentFile } from '../../types';
import { BalcadLogo } from '../BalcadLogo';

interface OrderDetailViewProps {
  orderId: string;
  onBack: () => void;
  onOrderUpdated: () => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  orderId,
  onBack,
  onOrderUpdated,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'personal' | 'service' | 'financial' | 'status_timeline' | 'documents' | 'notes' | 'activity' | 'debt_audit'
  >('service');

  // Modals & Forms
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Pending');
  const [statusReason, setStatusReason] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newStaff, setNewStaff] = useState('');
  const [assignReason, setAssignReason] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNote, setPayNote] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  const [docUploadName, setDocUploadName] = useState('');
  const [docUploadFile, setDocUploadFile] = useState<File | null>(null);
  const [previewPassportModal, setPreviewPassportModal] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const data = await api.getOrder(orderId);
      setOrder(data);
      if (data) setNewStatus(data.status);
    } catch (err: any) {
      console.warn('Order detail notice:', err);
      showToast(err.message || 'Failed to load order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      await api.updateOrderStatus(order.id, newStatus, statusReason);
      showToast(`Order status updated to ${newStatus}`, 'success');
      setShowStatusModal(false);
      setStatusReason('');
      await loadOrderDetails();
      onOrderUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      await api.assignOrder(order.id, newStaff || null, assignReason);
      showToast(newStaff ? `Order assigned to @${newStaff}` : 'Order unassigned', 'success');
      setShowAssignModal(false);
      setAssignReason('');
      await loadOrderDetails();
      onOrderUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign staff', 'error');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setPayError('Please enter a valid amount.');
      return;
    }
    if (amount > order.outstanding_debt) {
      setPayError('Payment cannot be greater than the outstanding balance.');
      return;
    }

    try {
      await api.addPayment(order.id, {
        amount,
        payment_method: payMethod,
        payment_note: payNote,
      });
      showToast(`Payment of $${amount} recorded successfully`, 'success');
      setShowPaymentModal(false);
      setPayAmount('');
      setPayNote('');
      setPayError(null);
      await loadOrderDetails();
      onOrderUpdated();
    } catch (err: any) {
      setPayError(err.message || 'Failed to record payment');
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !docUploadName) return;

    try {
      await api.uploadDocument({
        order_id: order.id,
        file_name: docUploadName,
        file_type: 'application/pdf',
        file_size: docUploadFile ? docUploadFile.size : 524288,
        file_url: '/docs/' + docUploadName,
      });
      showToast(`Document "${docUploadName}" uploaded`, 'success');
      setDocUploadName('');
      setDocUploadFile(null);
      await loadOrderDetails();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload document', 'error');
    }
  };

  if (loading || !order) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span>Loading order details...</span>
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Breadcrumb & Status Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-mono">{order.order_number}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  order.status === 'Debt'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : order.status === 'Completed'
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Service: <span className="text-slate-200 font-semibold">{order.service_type}</span> • Created by:{' '}
              <span className="font-mono text-amber-300">@{order.created_by}</span> on{' '}
              {order.created_at.split('T')[0]}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition active:scale-95 duration-75 cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Receipt / Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setShowStatusModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95 duration-75 cursor-pointer flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Update Status</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition active:scale-95 duration-75 cursor-pointer flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Assign Staff</span>
            </button>
          )}

          {(order.passport_image || order.customer?.passport_image) && (
            <button
              type="button"
              onClick={() => setPreviewPassportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition active:scale-95 duration-75 flex items-center gap-1.5 cursor-pointer"
              title="Eeg sawirka baasaboorka macmiilka"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Sawirka Baasaboorka</span>
            </button>
          )}

          {order.outstanding_debt > 0 && (
            <button
              type="button"
              onClick={() => {
                setPayAmount(order.outstanding_debt.toString());
                setShowPaymentModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 duration-75 flex items-center gap-1.5 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{t('add_payment')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation (7 Tabs as specified in Section 8) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
        {[
          { id: 'service', label: 'Service Information' },
          { id: 'personal', label: 'Personal Information' },
          { id: 'financial', label: 'Financial Information' },
          { id: 'status_timeline', label: 'Status Timeline' },
          { id: 'documents', label: `Documents (${order.documents?.length || 0})` },
          { id: 'notes', label: 'Internal Notes' },
          { id: 'activity', label: 'Assignment & History' },
          { id: 'debt_audit', label: 'Debt & Modification Audit' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-t-xl font-bold whitespace-nowrap transition border-b-2 cursor-pointer active:scale-95 duration-75 ${
              activeTab === tab.id
                ? 'bg-amber-500/10 text-amber-300 border-amber-500'
                : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* 1. SERVICE INFORMATION */}
      {activeTab === 'service' && (
        <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Plane className="w-4 h-4" />
            <span>{order.service_type} Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {Object.entries(order.service_details || {}).map(([key, value]) => (
              <div key={key} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-white font-medium mt-0.5 block break-words">
                  {Array.isArray(value) ? value.join(', ') : String(value || 'None')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. PERSONAL INFORMATION */}
      {activeTab === 'personal' && (
        <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Customer Personal Profile</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Full Name</span>
              <span className="text-white font-bold text-sm mt-0.5 block">
                {order.customer?.full_name || 'N/A'}
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Phone Number</span>
              <span className="text-white font-mono mt-0.5 block">
                {order.customer?.phone || 'N/A'}
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Email</span>
              <span className="text-white mt-0.5 block">
                {order.customer?.email || 'None provided'}
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Location</span>
              <span className="text-white mt-0.5 block">
                {order.customer?.city || 'Mogadishu'}, {order.customer?.country || 'Somalia'}
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 sm:col-span-2">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Customer Notes</span>
              <span className="text-slate-300 mt-0.5 block">
                {order.customer?.notes || 'No special notes'}
              </span>
            </div>
          </div>

          {/* Customer Passport Photo Section */}
          {(() => {
            const passportUrl = order.passport_image || order.customer?.passport_image;

            return (
              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Sawirka Baasaboorka Macmiilka (Passport Photo Verification)</span>
                  </h4>
                  {passportUrl && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                      Verified Passport Image
                    </span>
                  )}
                </div>

                {passportUrl ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                    <div
                      onClick={() => setPreviewPassportModal(true)}
                      className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-amber-500/40 hover:border-amber-400 shrink-0 w-40 h-28 bg-slate-900 flex items-center justify-center shadow-lg"
                    >
                      <img
                        src={passportUrl}
                        alt="Customer Passport"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-amber-300 font-bold text-[11px] gap-1">
                        <Search className="w-3.5 h-3.5" />
                        <span>Zoom</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <span className="text-white font-semibold text-xs block">
                        Baasaboorka Macmiilka: {order.customer?.full_name || 'Customer'}
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Sawirkan waxaa la soo geliyay diiwaangelinta dalabkan waxaana loo isticmaalaa xaqiijinta socdaalka, tigidhada, iyo fiisooyinka.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewPassportModal(true)}
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Search className="w-3 h-3" />
                          <span>Eeg Baasaboorka Buuxa (View Full)</span>
                        </button>
                        <a
                          href={passportUrl}
                          download={`passport_${(order.customer?.full_name || order.order_number).replace(/\s+/g, '_')}.jpg`}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 text-center text-slate-500 text-xs">
                    Sawir baasaboor looma lifaaqin dalabkan.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. FINANCIAL INFORMATION & PAYMENTS */}
      {activeTab === 'financial' && (
        <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Financial Summary & Payments</span>
            </h3>

            {order.outstanding_debt > 0 && (
              <button
                onClick={() => {
                  setPayAmount(order.outstanding_debt.toString());
                  setShowPaymentModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t('add_payment')}</span>
              </button>
            )}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">{t('total_price')}</span>
              <span className="text-xl font-mono font-bold text-white mt-1 block">
                ${order.total_price.toLocaleString()} {order.currency}
              </span>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">{t('amount_paid')}</span>
              <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block">
                ${order.amount_paid.toLocaleString()} {order.currency}
              </span>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">{t('outstanding_balance')}</span>
              <span className="text-xl font-mono font-extrabold text-red-400 mt-1 block">
                ${order.outstanding_debt.toLocaleString()} {order.currency}
              </span>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">Price Entered By</span>
              <span className="text-sm font-mono text-amber-300 mt-1 block font-bold">
                @{order.price_entered_by}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {order.price_entered_at ? order.price_entered_at.split('T')[0] : 'N/A'}
              </span>
            </div>
          </div>

          {/* Payment History List */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Payment Transactions ({order.payments?.length || 0})
            </h4>

            {(!order.payments || order.payments.length === 0) ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl">
                No payments have been recorded for this order yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Receipt ID</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Received By</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {order.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{p.id}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                          ${p.amount.toLocaleString()} {p.currency}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-white">{p.payment_method}</td>
                        <td className="py-2.5 px-3 font-mono text-amber-300">@{p.received_by}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{p.payment_date}</td>
                        <td className="py-2.5 px-3 text-slate-400">{p.payment_note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. STATUS TIMELINE */}
      {activeTab === 'status_timeline' && (
        <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Order Status Transitions</span>
            </h3>
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold"
            >
              + Update Status
            </button>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {order.status_history?.map((sh, idx) => (
              <div key={sh.id || idx} className="relative">
                <div className="absolute -left-6 top-0 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-[#111726]" />
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Status: {sh.new_status}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(sh.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Changed by: <span className="font-mono text-amber-300">@{sh.changed_by}</span>
                    {sh.reason && <span> • Reason: {sh.reason}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Customer & Travel Documents</span>
            </h3>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleUploadDocument} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-200 block">Upload Supporting Travel Document</span>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={docUploadName}
                onChange={(e) => setDocUploadName(e.target.value)}
                placeholder="e.g. Passport_Copy.pdf, Turkish_Visa.pdf, Ticket_Voucher.pdf"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>
          </form>

          {/* Document list */}
          <div className="space-y-2">
            {(!order.documents || order.documents.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No documents uploaded yet.
              </div>
            ) : (
              order.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                      PDF
                    </div>
                    <div>
                      <span className="font-semibold text-white block">{doc.file_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Uploaded by @{doc.uploaded_by} on {doc.uploaded_at.split('T')[0]} •{' '}
                        {Math.round(doc.file_size / 1024)} KB
                      </span>
                    </div>
                  </div>

                  <a
                    href={doc.file_url}
                    download={doc.file_name}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium text-[11px] flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. INTERNAL NOTES */}
      {activeTab === 'notes' && (
        <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Internal Agency Notes</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed p-4 bg-slate-900 rounded-xl border border-slate-800 whitespace-pre-wrap">
            {order.notes || 'No internal notes provided for this booking.'}
          </p>
        </div>
      )}

      {/* 7. ASSIGNMENT & ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span>Staff Assignment History</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Currently Assigned To</span>
              <span className="text-white font-bold mt-0.5 block">
                {order.assigned_staff ? `@${order.assigned_staff}` : 'Unassigned'}
              </span>
            </div>

            {order.assignment_history?.map((ah) => (
              <div key={ah.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">
                    Reassigned to: <strong className="text-amber-300">@{ah.new_employee || 'None'}</strong>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(ah.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Changed by @{ah.changed_by} {ah.reason && `• ${ah.reason}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. DEBT & MODIFICATION AUDIT HISTORY */}
      {activeTab === 'debt_audit' && (
        <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>Taariikhda Diiwaangelinta, Wax-ka-beddelka Shaqaalaha & Deyn Harka</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Faahfaahinta sida dalabkan loo abuuray, inta shaqaale ee wax ka beddelay, iyo xisaabta deynta ku hartay markasta.
              </p>
            </div>
            {order.outstanding_debt > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30 self-start sm:self-auto">
                Deyn ku dhiman: ${order.outstanding_debt.toLocaleString()} {order.currency}
              </span>
            )}
          </div>

          {/* 1. Sida Dalabkan Loo Create Gareeyay */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3">
            <span className="text-xs uppercase font-mono text-amber-400 font-bold tracking-wider block">
              1. Sida Dalabka Loo Diiwaangeliyay (Creation Details)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Shaqaalaha Diiwaangeliyay</span>
                <span className="text-sm font-mono font-bold text-amber-300 mt-1 block">
                  @{order.created_by}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Order Creator
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Waqtiga La Diiwaangeliyay</span>
                <span className="text-xs font-mono text-white mt-1 block font-semibold">
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Qiimaha Guud ee Bilowga</span>
                <span className="text-sm font-mono font-bold text-white mt-1 block">
                  ${(order.modifications_history?.[0]?.total_price_after ?? order.total_price).toLocaleString()} {order.currency}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Hormaris: ${(order.modifications_history?.[0]?.total_paid_after ?? order.amount_paid).toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Deyn Bilowgii Jirtay</span>
                <span className="text-sm font-mono font-bold text-red-400 mt-1 block">
                  ${(order.modifications_history?.[0]?.debt_balance_after ?? order.outstanding_debt).toLocaleString()} {order.currency}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Shaqaalaha Wax ka Beddelay Summary */}
          {(() => {
            const staffSet = new Set<string>();
            if (order.created_by) staffSet.add(order.created_by);
            order.modifications_history?.forEach((m) => {
              if (m.staff_username) staffSet.add(m.staff_username);
            });
            order.status_history?.forEach((s) => {
              if (s.changed_by) staffSet.add(s.changed_by);
            });
            order.payments?.forEach((p) => {
              if (p.received_by) staffSet.add(p.received_by);
            });
            const distinctStaff = Array.from(staffSet);

            return (
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      Tirada Shaqaalaha Wax ka Beddelay Dalabkan: {distinctStaff.length} Shaqaale
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Dhammaan shaqaalaha wax ka beddelay ama lacag ka qabtay dalabkan
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {distinctStaff.map((staffName) => (
                    <span
                      key={staffName}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-700 font-medium"
                    >
                      @{staffName}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 3. Diiwaanka Shaqaale Walbo Marka uu Wax ka Beddelay & Inta Balance Debt ku Hartay */}
          <div className="space-y-3">
            <span className="text-xs uppercase font-mono text-amber-400 font-bold tracking-wider block">
              3. Taariikhda Wax-ka-beddelka Shaqaalaha & Inta Deyn ee ku Hartay (Timeline & Debt Balance)
            </span>

            {(!order.modifications_history || order.modifications_history.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl">
                Weli wax isbeddel ah laguma samayn dalabkan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Shaqaalaha</th>
                      <th className="py-2.5 px-3">Waqtiga</th>
                      <th className="py-2.5 px-3">Waxa la qabtay</th>
                      <th className="py-2.5 px-3">Inta Deyn ku hartay</th>
                      <th className="py-2.5 px-3">Faahfaahin / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {order.modifications_history.map((mod, idx) => (
                      <tr key={mod.id || idx} className="hover:bg-slate-900/30">
                        <td className="py-3 px-3 font-mono font-bold text-amber-300">
                          @{mod.staff_username}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                          {new Date(mod.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              mod.action_type === 'payment_received'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : mod.action_type === 'creation'
                                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                : mod.action_type === 'status_change'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {mod.action_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-black">
                          {mod.debt_balance_after > 0 ? (
                            <span className="text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-md border border-red-500/20">
                              ${mod.debt_balance_after.toLocaleString()} {order.currency}
                            </span>
                          ) : (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                              $0 (Paid Off)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {mod.description || mod.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Update Status */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400">Update Order Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="New">New</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting for Customer">Waiting for Customer</option>
                  <option value="Waiting for Documents">Waiting for Documents</option>
                  <option value="Available">Available</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Debt">Debt</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Reason for Status Change</label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Client confirmed itinerary, embassy approved visa"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Staff (Super Admin Only) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400">Assign Staff Member</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignStaff} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Staff</label>
                <select
                  value={newStaff}
                  onChange={(e) => setNewStaff(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Remove Assignment --</option>
                  <option value="mohamed">Mohamed (Ticketing & Flights)</option>
                  <option value="sarah">Sarah (Visa Operations)</option>
                  <option value="ali">Ali (Support & Transfers)</option>
                  <option value="admin">Super Admin (Self)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Assignment Reason</label>
                <input
                  type="text"
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  placeholder="e.g. Workload balancing, visa specialist"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && (
              <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
                {payError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Payment Amount ($ {order.currency}) (Max: ${order.outstanding_debt}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={order.outstanding_debt}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center justify-between">
                  <span>Payment Destination (Meesha Lacagtu U Dhacayso)</span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">Kaliya Cash Counter</span>
                </label>
                <div className="w-full px-3.5 py-2.5 bg-slate-900 border border-amber-500/50 rounded-xl text-white flex items-center justify-between shadow-inner">
                  <span className="font-bold text-amber-300 flex items-center gap-2">
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
                <label className="block text-slate-300 mb-1 font-semibold">Note / Transaction Ref</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Deposit slip #7712"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Branded Receipt / Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0C101A] border border-amber-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-white my-8">
            {/* Modal Header & Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs uppercase font-mono text-amber-400 font-bold tracking-wider">
                Official Agency Invoice & Voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 duration-75 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Invoice Printable Sheet */}
            <div className="mt-6 space-y-6 bg-[#111726] border border-slate-800 rounded-2xl p-6 shadow-inner">
              {/* Agency Logo & Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <BalcadLogo size="lg" />
                  <p className="text-[11px] text-amber-400/90 font-serif italic mt-1.5">
                    "Your Journey, Our Priority"
                  </p>
                </div>
                <div className="text-center sm:text-right text-xs text-slate-300 space-y-0.5">
                  <p className="font-bold text-white text-sm">Balcad Travel Agency</p>
                  <p className="font-mono text-amber-300 text-[11px]">balcadtravel@gmail.com</p>
                  <p className="font-mono text-slate-400 text-[11px]">Tel: 612483838 • 612141414</p>
                  <p className="text-[10px] text-slate-500">Mogadishu, Somalia</p>
                </div>
              </div>

              {/* Order & Customer Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Customer Information</span>
                  <p className="font-bold text-white text-sm">{order.customer?.full_name || 'Valued Customer'}</p>
                  <p className="text-slate-400 font-mono text-[11px]">Phone: {order.customer?.phone || 'N/A'}</p>
                  <p className="text-slate-400 text-[11px]">Email: {order.customer?.email || 'N/A'}</p>
                  <p className="text-slate-400 text-[11px]">{order.customer?.city ? `${order.customer.city}, ${order.customer.country}` : 'Somalia'}</p>
                </div>

                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1 sm:text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Booking Reference</span>
                  <p className="font-mono font-black text-amber-400 text-sm">{order.order_number}</p>
                  <p className="text-slate-400 text-[11px]">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  <p className="text-slate-400 text-[11px]">Service: <span className="font-semibold text-white">{order.service_type}</span></p>
                  <div className="pt-1 sm:flex sm:justify-end">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Status: {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Details Breakdown */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-2">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Service & Itinerary Specifications</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  {order.service_details?.departure_city && (
                    <div>
                      <span className="text-slate-400 block">From:</span>
                      <span className="text-white font-semibold">{order.service_details.departure_city}</span>
                    </div>
                  )}
                  {order.service_details?.destination && (
                    <div>
                      <span className="text-slate-400 block">To:</span>
                      <span className="text-white font-semibold">{order.service_details.destination}</span>
                    </div>
                  )}
                  {order.service_details?.departure_date && (
                    <div>
                      <span className="text-slate-400 block">Departure Date:</span>
                      <span className="text-white font-mono">{order.service_details.departure_date}</span>
                    </div>
                  )}
                  {order.service_details?.visa_type && (
                    <div>
                      <span className="text-slate-400 block">Visa Type:</span>
                      <span className="text-white font-semibold">{order.service_details.visa_type}</span>
                    </div>
                  )}
                  {order.service_details?.preferred_airline && (
                    <div>
                      <span className="text-slate-400 block">Airline / Provider:</span>
                      <span className="text-white font-semibold">{order.service_details.preferred_airline}</span>
                    </div>
                  )}
                  {order.service_details?.passenger_names && order.service_details.passenger_names.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Passengers:</span>
                      <span className="text-white">{order.service_details.passenger_names.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="border-t border-slate-800 pt-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Agreed Price:</span>
                    <span className="font-mono font-bold text-white">${order.total_price.toLocaleString()} {order.currency}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Total Amount Paid:</span>
                    <span className="font-mono font-bold">${order.amount_paid.toLocaleString()} {order.currency}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-800">
                    <span className={order.outstanding_debt > 0 ? 'text-amber-400' : 'text-slate-300'}>
                      Balance / Outstanding Debt:
                    </span>
                    <span className={`font-mono ${order.outstanding_debt > 0 ? 'text-red-400 font-black' : 'text-emerald-400'}`}>
                      ${order.outstanding_debt.toLocaleString()} {order.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Authorized Stamp */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Issued by Balcad Travel Agency Management</span>
                <span>System Verified CRM Document</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SIZE PASSPORT PHOTO MODAL */}
      {previewPassportModal && (order.passport_image || order.customer?.passport_image) && (
        <div
          onClick={() => setPreviewPassportModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121826] border border-amber-500/40 rounded-2xl max-w-2xl w-full p-5 shadow-2xl relative text-white"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>
                  Sawirka Baasaboorka: {order.customer?.full_name || order.order_number}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewPassportModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={order.passport_image || order.customer?.passport_image}
                alt="Passport Full Preview"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-mono">
                Dalabka: <span className="text-amber-300 font-bold">{order.order_number}</span> • {order.service_type}
              </div>
              <a
                href={order.passport_image || order.customer?.passport_image}
                download={`passport_${(order.customer?.full_name || order.order_number).replace(/\s+/g, '_')}.jpg`}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sawirka</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
