import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Briefcase,
  AlertCircle,
  CheckCircle,
  X,
  ExternalLink,
  Trash2,
  Download,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Customer } from '../../types';

interface CustomerManagementViewProps {
  onSelectOrder: (orderId: string) => void;
  onNewOrderForCustomer?: (customer: Customer) => void;
}

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({
  onSelectOrder,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected Customer Modal / Profile
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [custOrders, setCustOrders] = useState<any[]>([]);
  const [custDocuments, setCustDocuments] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Clear All & Delete Confirm Modals
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('Somalia');
  const [city, setCity] = useState('Mogadishu');
  const [notes, setNotes] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.warn('Customer load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = async (cust: Customer) => {
    setSelectedCust(cust);
    setProfileLoading(true);
    try {
      const data = await api.getCustomer(cust.id);
      setCustOrders(data.orders || []);
      setCustDocuments(data.documents || []);
    } catch (err) {
      console.warn('Customer orders load notice:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleClearAllCustomers = async () => {
    setActionLoading(true);
    try {
      await api.clearAllCustomers();
      showToast('Dhamaan macamiisha (customers) si guul leh ayaa loo wada tirtiray!', 'success');
      setShowClearAllModal(false);
      setSelectedCust(null);
      await loadCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to clear customers', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSingleCustomer = async () => {
    if (!customerToDelete) return;
    setActionLoading(true);
    try {
      await api.deleteCustomer(customerToDelete.id);
      showToast(`Customer "${customerToDelete.full_name}" si guul leh ayaa loo tirtiray!`, 'success');
      setCustomerToDelete(null);
      if (selectedCust?.id === customerToDelete.id) {
        setSelectedCust(null);
      }
      await loadCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete customer', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;
    setAddLoading(true);
    try {
      await api.createCustomer({
        full_name: fullName,
        phone,
        email,
        country,
        city,
        notes,
      });
      showToast(`Customer "${fullName}" added successfully!`, 'success');
      setShowAddModal(false);
      setFullName('');
      setPhone('');
      setEmail('');
      setNotes('');
      await loadCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to create customer', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>{t('customers')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Diiwaanka macaamiisha. Qof kasta oo dalab loo diiwaan galiyo si toos ah (automatically) ayaa loogu daraa halkan, waxana la socda xogtiisa, dukumentiyada, taariikhda adeegyada iyo haraaga deynta.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {customers.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shrink-0"
              title="Delete all registered customers"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All Customers</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-3.5 shadow">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone number, email, or city..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C111C] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Customer Name</th>
                <th className="py-3 px-3.5">{t('phone')}</th>
                <th className="py-3 px-3.5">{t('email')}</th>
                <th className="py-3 px-3.5">Location</th>
                <th className="py-3 px-3.5">Orders</th>
                <th className="py-3 px-3.5">Total Balance Debt</th>
                <th className="py-3 px-3.5">Last Order / Member</th>
                <th className="py-3 px-3.5 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">Macaamiil ma jiraan xilligan</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Marka aad dalab cusub diiwaan galiso (New Order), qofka si toos ah ayaa loogu dari doonaa macaamiisha.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-800/40 transition">
                    <td
                      onClick={() => handleOpenProfile(cust)}
                      className="py-3 px-3.5 font-bold text-white cursor-pointer hover:text-amber-300 flex items-center gap-2"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {cust.full_name[0] || 'C'}
                      </div>
                      <span className="truncate">{cust.full_name}</span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-300">{cust.phone}</td>
                    <td className="py-3 px-3.5 text-slate-400">{cust.email || '-'}</td>
                    <td className="py-3 px-3.5 text-slate-300">
                      {cust.city || 'Mogadishu'}, {cust.country || 'Somalia'}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-amber-300">
                      {cust.orders_count || 1}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold">
                      {(cust.total_debt || 0) > 0 ? (
                        <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                          ${cust.total_debt?.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          $0 (Paid)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-500 text-[11px]">
                      {cust.last_order_date || cust.created_at.split('T')[0]}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenProfile(cust)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[11px] font-semibold transition"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => setCustomerToDelete(cust)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 text-[11px] transition"
                          title="Delete customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Customer Profile View */}
      {selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-amber-500/30 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative text-white max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-lg uppercase shadow-inner">
                  {selectedCust.full_name[0] || 'C'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{selectedCust.full_name}</span>
                    {(selectedCust.total_debt || 0) > 0 ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        DEYN LEH (Debt)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        DHAMMAYSTIRAN (No Debt)
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedCust.phone} • {selectedCust.city}, {selectedCust.country}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCust(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-5 pr-1 text-xs">
              {/* Debt & Orders Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Total Orders</span>
                  <span className="text-lg font-bold text-white mt-1 block">
                    {custOrders.length || selectedCust.orders_count || 0}
                  </span>
                </div>
                <div className="p-3 bg-red-950/20 rounded-2xl border border-red-500/30">
                  <span className="text-[10px] text-red-400 block uppercase font-mono font-bold">Total Balance Debt</span>
                  <span className="text-lg font-mono font-bold text-red-400 mt-1 block">
                    ${(selectedCust.total_debt || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Email Address</span>
                  <span className="text-slate-300 mt-1 block truncate font-medium">
                    {selectedCust.email || 'None'}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Registered Since</span>
                  <span className="text-slate-300 mt-1 block font-mono">
                    {selectedCust.created_at.split('T')[0]}
                  </span>
                </div>
              </div>

              {selectedCust.notes && (
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Customer Notes / Preferences</span>
                  <p className="text-slate-300 mt-0.5">{selectedCust.notes}</p>
                </div>
              )}

              {/* Customer Passport Photo Section */}
              {(() => {
                const passportUrl =
                  selectedCust.passport_image ||
                  custOrders.find((o) => o.passport_image)?.passport_image;

                return (
                  <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <span>Sawirka Baasaboorka Macmiilka (Customer Passport Photo)</span>
                      </h4>
                      {passportUrl && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                          Passport Attached
                        </span>
                      )}
                    </div>

                    {passportUrl ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                        <div
                          onClick={() => setPreviewImageModal(passportUrl)}
                          className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-amber-500/40 hover:border-amber-400 shrink-0 w-36 h-24 bg-slate-900 flex items-center justify-center shadow-lg"
                        >
                          <img
                            src={passportUrl}
                            alt={`${selectedCust.full_name} Passport`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-amber-300 font-bold text-[11px] gap-1">
                            <Search className="w-3.5 h-3.5" />
                            <span>Zoom</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <span className="text-white font-semibold text-xs block">
                            Baasaboorka Rasmiga ah: {selectedCust.full_name}
                          </span>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Sawirka baasaboorku wuxuu toos ugu lifaaqan yahay profile-ka macmiilka iyo diiwaanka dalabyada.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setPreviewImageModal(passportUrl)}
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Search className="w-3 h-3" />
                              <span>Eeg Baasaboorka Buuxa (View Full)</span>
                            </button>
                            <a
                              href={passportUrl}
                              download={`${selectedCust.full_name.replace(/\s+/g, '_')}_passport.jpg`}
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
                        Sawir baasaboor looma soo gelin macmiilkan. Marka dalab cusub loo samaynayo, sawirka baasaboorku waa qasab.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Supporting Documents Section */}
              <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Dukumentiyada Macaamiilka (Travel Documents)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {custDocuments.length} files
                  </span>
                </div>

                {custDocuments.length === 0 ? (
                  <p className="text-slate-500 text-xs py-2 italic text-center">
                    Ma jiraan dukumentiyo (Baasaboor, Fiiso, Tikidh) loo geliyay macmiilkan weli. Waxaad ka soo gelin kartaa bogga dalabkiisa (Order Detail).
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {custDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                            DOC
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white truncate block text-[11px]">
                              {doc.file_name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              @{doc.uploaded_by} • {doc.uploaded_at?.split('T')[0]}
                            </span>
                          </div>
                        </div>

                        <a
                          href={doc.file_url}
                          download={doc.file_name}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold flex items-center gap-1 transition shrink-0 ml-2"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order & Booking History */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Taariikhda Adeegyada & Dalabaadka (Booking History)
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {custOrders.length} dalab
                  </span>
                </div>

                {profileLoading ? (
                  <div className="py-6 text-center text-slate-500">Loading order history...</div>
                ) : custOrders.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-900/40 rounded-xl">
                    No active orders linked to this customer.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {custOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => {
                          setSelectedCust(null);
                          onSelectOrder(ord.id);
                        }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/40 cursor-pointer transition gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-300">{ord.order_number}</span>
                            <span className="text-white font-semibold">{ord.service_type}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-3">
                            <span>Created: {ord.created_at.split('T')[0]}</span>
                            <span>By: @{ord.created_by}</span>
                            {ord.assigned_staff && <span>Assigned: @{ord.assigned_staff}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">Total Price</span>
                            <span className="font-mono font-bold text-white text-xs">
                              ${ord.total_price?.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">Paid</span>
                            <span className="font-mono font-bold text-emerald-400 text-xs">
                              ${(ord.amount_paid || 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">Remaining Debt</span>
                            <span className="font-mono font-bold text-red-400 text-xs">
                              ${(ord.outstanding_debt || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  setCustomerToDelete(selectedCust);
                }}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Customer</span>
              </button>

              <button
                onClick={() => setSelectedCust(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: Clear All Customers */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-red-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="text-base font-bold text-white">Delete All Customers?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ma hubtaa inaad tirtirto dhamaan macaamiisha ku jirta web-ka? Marka aad dalabyo cusub diiwaan galiso, qof kasta si toos ah ayaa loogu dari doonaa macaamiisha.
            </p>
            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleClearAllCustomers}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition"
              >
                {actionLoading ? 'Clearing...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: Delete Single Customer */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-red-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Customer Profile?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ma hubtaa inaad tirtirto macmiilka <strong className="text-white font-bold">{customerToDelete.full_name}</strong> ({customerToDelete.phone})?
            </p>
            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteSingleCustomer}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition"
              >
                {actionLoading ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Customer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Add Customer Profile
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sahra Osman Duale"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 615667788"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sahra@gmail.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Customer Notes / Preferences</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Frequent flyer, family travel"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {addLoading ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SIZE PASSPORT PREVIEW MODAL */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121826] border border-amber-500/40 rounded-2xl max-w-2xl w-full p-5 shadow-2xl relative text-white"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Sawirka Baasaboorka Macmiilka: {selectedCust?.full_name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewImageModal}
                alt="Passport Full Preview"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-mono">
                Balcad Travel Agency • Customer Identity Verification
              </span>
              <a
                href={previewImageModal}
                download="customer_passport.jpg"
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
