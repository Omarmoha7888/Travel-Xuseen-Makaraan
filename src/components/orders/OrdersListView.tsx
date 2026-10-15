import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  PlusCircle,
  Search,
  Trash2,
  Eye,
  RefreshCw,
  Users,
  Image as ImageIcon,
  X,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { api } from '../../services/api';
import { Order, OrderStatus } from '../../types';

interface OrdersListViewProps {
  onSelectOrder: (id: string) => void;
  onNewOrder: () => void;
  initialFilter?: string;
  initialServiceFilter?: string;
}

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  onSelectOrder,
  onNewOrder,
  initialFilter = 'All',
  initialServiceFilter = 'All',
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter);
  const [selectedService, setSelectedService] = useState<string>(initialServiceFilter);
  const [selectedStaff, setSelectedStaff] = useState<string>('All');
  const [previewPassportOrder, setPreviewPassportOrder] = useState<Order | null>(null);

  // Available staff for filtering
  const availableStaff = useMemo(() => {
    const set = new Set<string>();
    allOrders.forEach((o) => {
      if (o.created_by) set.add(o.created_by);
      if (o.assigned_staff && o.assigned_staff !== 'Unassigned') set.add(o.assigned_staff);
    });
    if (user?.username) set.add(user.username);
    set.add('blc00001');
    set.add('blc00002');
    return Array.from(set).sort();
  }, [allOrders, user]);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; orderNumber: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sync if initialFilter or initialServiceFilter changes from navigation
  useEffect(() => {
    setSelectedStatus(initialFilter || 'All');
  }, [initialFilter]);

  useEffect(() => {
    setSelectedService(initialServiceFilter || 'All');
  }, [initialServiceFilter]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await api.getOrders(undefined, forceRefresh);
      setAllOrders(data);
    } catch (err: any) {
      console.warn('Orders load notification:', err);
      showToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      await api.deleteOrder(orderToDelete.id);
      setAllOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id && o.order_number !== orderToDelete.id));
      showToast(`Order ${orderToDelete.orderNumber} deleted successfully.`, 'success');
      setDeleteModalOpen(false);
      setOrderToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete order.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Instant in-memory filtering for zero lag
  const filteredOrders = useMemo(() => {
    return allOrders.filter((ord) => {
      // Status filter
      if (selectedStatus !== 'All' && ord.status !== selectedStatus) {
        return false;
      }
      // Service filter
      if (selectedService !== 'All' && ord.service_type !== selectedService) {
        return false;
      }
      // Staff filter
      if (selectedStaff !== 'All') {
        const qStaff = selectedStaff.toLowerCase();
        if (
          ord.created_by.toLowerCase() !== qStaff &&
          (!ord.assigned_staff || ord.assigned_staff.toLowerCase() !== qStaff)
        ) {
          return false;
        }
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          ord.order_number.toLowerCase().includes(q) ||
          (ord.customer?.full_name && ord.customer.full_name.toLowerCase().includes(q)) ||
          (ord.customer?.phone && ord.customer.phone.includes(q)) ||
          ord.service_type.toLowerCase().includes(q) ||
          ord.created_by.toLowerCase().includes(q) ||
          (ord.assigned_staff && ord.assigned_staff.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [allOrders, selectedStatus, selectedService, search]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Completed':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Pending':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'In Progress':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Waiting for Documents':
      case 'Waiting for Customer':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'Available':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Debt':
        return 'bg-red-500/15 text-red-400 border-red-500/30 font-bold';
      case 'Rejected':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'Cancelled':
        return 'bg-slate-700/40 text-slate-400 border-slate-600/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const statuses = [
    'All',
    'New',
    'Pending',
    'In Progress',
    'Waiting for Documents',
    'Available',
    'Confirmed',
    'Completed',
    'Debt',
    'Rejected',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>{t('orders')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono font-semibold">
              {filteredOrders.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage customer travel orders, ticket bookings, visas, hotels, and debt status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadOrders(true)}
            disabled={loading}
            title="Refresh Orders"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 duration-75 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onNewOrder}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 duration-75 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('new_order')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Card */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        {/* Quick Status Tabs - Instant Clicks */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer active:scale-95 duration-75 ${
                selectedStatus === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search & Service & Staff Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID (BAL-2026-...), Customer name, Phone, or Staff..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">All Service Types</option>
              <option value="Flight Ticket">Flight Ticket</option>
              <option value="Visa Service">Visa Service</option>
              <option value="Hotel">Hotel</option>
              <option value="Travel Package">Travel Package</option>
              <option value="Airport Transfer">Airport Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
            >
              <option value="All">Dhamaan Shaqaalaha (All)</option>
              {availableStaff.map((st) => (
                <option key={st} value={st}>
                  @{st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C111C] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-3.5">{t('order_id')}</th>
                <th className="py-3 px-3.5">{t('customer')}</th>
                <th className="py-3 px-3.5">{t('service')}</th>
                <th className="py-3 px-3.5">{t('status')}</th>
                <th className="py-3 px-3.5">{t('payment_type')}</th>
                <th className="py-3 px-3.5">{t('total_price')}</th>
                <th className="py-3 px-3.5">{t('outstanding_balance')}</th>
                <th className="py-3 px-3.5">{t('created_by')}</th>
                <th className="py-3 px-3.5">{t('assigned_to')}</th>
                <th className="py-3 px-3.5">{t('date')}</th>
                <th className="py-3 px-3.5 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-300">No travel orders found matching your search.</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting the status filter or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    <td
                      onClick={() => onSelectOrder(ord.id)}
                      className="py-3.5 px-3.5 font-mono font-bold text-amber-300 cursor-pointer hover:underline"
                    >
                      {ord.order_number}
                    </td>
                    <td
                      onClick={() => onSelectOrder(ord.id)}
                      className="py-3.5 px-3.5 font-medium text-white cursor-pointer hover:text-amber-300"
                    >
                      <div className="flex items-center gap-2">
                        <span>{ord.customer?.full_name || 'N/A'}</span>
                        {(ord.passport_image || ord.customer?.passport_image) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPassportOrder(ord);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold shrink-0 transition cursor-pointer shadow-sm active:scale-95"
                            title="Eeg sawirka baasaboorka macmiilkan (View Passport)"
                          >
                            <ImageIcon className="w-3 h-3 text-amber-400" />
                            <span>Passport</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-slate-300">{ord.service_type}</td>
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          ord.status
                        )}`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          ord.payment_type === 'Debt'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {ord.payment_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-white">
                      ${ord.total_price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3.5 font-mono font-bold">
                      {ord.outstanding_debt > 0 ? (
                        <span className="text-red-400">${ord.outstanding_debt.toLocaleString()}</span>
                      ) : (
                        <span className="text-emerald-400 font-normal">$0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 font-mono text-slate-400">@{ord.created_by}</td>
                    <td className="py-3.5 px-3.5 font-mono text-slate-300">
                      {ord.assigned_staff ? `@${ord.assigned_staff}` : <span className="text-slate-500 italic">None</span>}
                    </td>
                    <td className="py-3.5 px-3.5 font-mono text-slate-500 text-[11px]">
                      {ord.created_at.split('T')[0]}
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectOrder(ord.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[11px] font-semibold transition active:scale-95 duration-75 cursor-pointer"
                        >
                          {t('view')}
                        </button>

                        {/* Super Admin ONLY can delete orders */}
                        {user?.role === 'super_admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToDelete({ id: ord.id, orderNumber: ord.order_number });
                              setDeleteModalOpen(true);
                            }}
                            title="Delete Order (Super Admin Only)"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition active:scale-95 duration-75 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Confirmation Modal instead of browser window.confirm */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Travel Order"
        message={`Are you sure you want to permanently delete order ${orderToDelete?.orderNumber}? This action cannot be undone.`}
        confirmText="Delete Order"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setOrderToDelete(null);
        }}
      />

      {/* INSTANT PASSPORT PREVIEW MODAL */}
      {previewPassportOrder && (previewPassportOrder.passport_image || previewPassportOrder.customer?.passport_image) && (
        <div
          onClick={() => setPreviewPassportOrder(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121826] border border-amber-500/40 rounded-2xl max-w-2xl w-full p-5 shadow-2xl relative text-white"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Sawirka Baasaboorka: {previewPassportOrder.customer?.full_name || previewPassportOrder.order_number}
                  </h3>
                  <span className="text-[11px] text-amber-400 font-mono">
                    Dalabka: {previewPassportOrder.order_number} • {previewPassportOrder.service_type}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPassportOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img
                src={previewPassportOrder.passport_image || previewPassportOrder.customer?.passport_image}
                alt="Customer Passport"
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const id = previewPassportOrder.id;
                  setPreviewPassportOrder(null);
                  onSelectOrder(id);
                }}
                className="text-xs text-amber-300 hover:text-amber-200 font-bold underline"
              >
                Eeg Faahfaahinta Dalabka Buuxa (View Full Order)
              </button>
              <a
                href={previewPassportOrder.passport_image || previewPassportOrder.customer?.passport_image}
                download={`passport_${(previewPassportOrder.customer?.full_name || previewPassportOrder.order_number).replace(/\s+/g, '_')}.jpg`}
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
