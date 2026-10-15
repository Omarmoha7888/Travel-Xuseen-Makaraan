import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserPlus,
  KeyRound,
  Shield,
  Briefcase,
  Phone,
  Mail,
  Lock,
  Unlock,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Activity,
  History,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { api } from '../../services/api';
import { ActivityLog } from '../../types';

export const EmployeeManagementView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullname, setNewFullname] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Ticketing & Flights');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Edit Modal
  const [editingEmp, setEditingEmp] = useState<any | null>(null);
  const [editFullname, setEditFullname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState('');

  // Change Password Modal
  const [pwEmp, setPwEmp] = useState<any | null>(null);
  const [changePw1, setChangePw1] = useState('');
  const [changePw2, setChangePw2] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // Activity Modal
  const [activityEmp, setActivityEmp] = useState<any | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Disable Modal State (with mandatory reason)
  const [disableModalEmp, setDisableModalEmp] = useState<any | null>(null);
  const [disableReason, setDisableReason] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // Unlock Modal State (shows reason, including "DIS USER IS DISABLED PY WRONG PASSWORD")
  const [unlockModalEmp, setUnlockModalEmp] = useState<any | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);

  // Confirm Modal (for Delete)
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDestructive: true,
    action: async () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err: any) {
      console.warn('Employees loading note:', err);
      showToast(err.message || 'Failed to load employees', 'error');
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);

    try {
      await api.addEmployee({
        full_name: newFullname,
        phone: newPhone,
        email: newEmail,
        department: newDept,
        username: newUsername,
        password: newPassword,
      });
      try {
        const empCh = new BroadcastChannel('balcad_employees');
        empCh.postMessage({ type: 'EMPLOYEE_ADDED', username: newUsername });
        empCh.close();
      } catch {}
      showToast(`Employee @${newUsername} registered successfully!`, 'success');
      setShowAddModal(false);
      setNewFullname('');
      setNewPhone('');
      setNewEmail('');
      setNewUsername('');
      setNewPassword('');
      await loadEmployees();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add employee');
      showToast(err.message || 'Failed to add employee', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    try {
      await api.updateEmployee(editingEmp.id, {
        full_name: editFullname,
        phone: editPhone,
        email: editEmail,
        department: editDept,
      });
      showToast(`Employee @${editingEmp.username} updated successfully!`, 'success');
      setEditingEmp(null);
      await loadEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to update employee', 'error');
    }
  };

  const handleOpenDisableModal = (emp: any) => {
    setDisableModalEmp(emp);
    setDisableReason('');
    setDisableError(null);
  };

  const handleOpenUnlockModal = (emp: any) => {
    setUnlockModalEmp(emp);
  };

  const handleConfirmDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableModalEmp) return;
    const cleanReason = disableReason.trim();
    if (!cleanReason) {
      setDisableError('Fadlan qor faahfaahinta sababta aad u xirayso user-ka (Reason is required).');
      return;
    }

    setDisableLoading(true);
    setDisableError(null);
    try {
      await api.updateEmployee(disableModalEmp.id, {
        status: 'disabled',
        disabled_reason: cleanReason,
      });

      try {
        const ch = new BroadcastChannel('balcad_auth');
        ch.postMessage({ type: 'USER_DISABLED', userId: disableModalEmp.id, username: disableModalEmp.username });
        ch.close();
      } catch {}

      showToast(`User-ka @${disableModalEmp.username} waa la xiray.`, 'success');
      setDisableModalEmp(null);
      setDisableReason('');
      await loadEmployees();
    } catch (err: any) {
      setDisableError(err.message || 'Failed to disable employee');
      showToast(err.message || 'Failed to disable employee', 'error');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleConfirmUnlock = async () => {
    if (!unlockModalEmp) return;
    setUnlockLoading(true);
    try {
      await api.updateEmployee(unlockModalEmp.id, {
        status: 'active',
      });

      showToast(`User-ka @${unlockModalEmp.username} si guul leh ayaa loo furay.`, 'success');
      setUnlockModalEmp(null);
      await loadEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to unlock employee', 'error');
    } finally {
      setUnlockLoading(false);
    }
  };

  const promptRemoveEmployee = (emp: any) => {
    setConfirmModalData({
      isOpen: true,
      title: 'Remove Employee Account',
      message: `Are you sure you want to completely remove ${emp.profile?.full_name || emp.username} (@${emp.username})? This action cannot be undone.`,
      confirmText: 'Remove Employee',
      isDestructive: true,
      action: async () => {
        setConfirmLoading(true);
        try {
          await api.deleteEmployee(emp.id);
          try {
            const ch = new BroadcastChannel('balcad_auth');
            ch.postMessage({ type: 'USER_DISABLED', userId: emp.id, username: emp.username });
            ch.close();
          } catch {}
          try {
            const empCh = new BroadcastChannel('balcad_employees');
            empCh.postMessage({ type: 'EMPLOYEE_REMOVED', username: emp.username });
            empCh.close();
          } catch {}
          showToast(`Employee @${emp.username} removed.`, 'success');
          await loadEmployees();
        } catch (err: any) {
          showToast(err.message || 'Failed to remove employee', 'error');
        } finally {
          setConfirmLoading(false);
          setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwEmp) return;
    setPwError(null);
    setPwSuccess(null);

    if (changePw1 !== changePw2) {
      setPwError('Passwords do not match.');
      return;
    }
    if (changePw1.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }

    try {
      await api.changeEmployeePassword(pwEmp.id, changePw1, changePw2);
      setPwSuccess('Employee password has been successfully changed.');
      showToast(`Password changed for @${pwEmp.username}`, 'success');
      setTimeout(() => {
        setPwEmp(null);
        setChangePw1('');
        setChangePw2('');
        setPwSuccess(null);
      }, 1200);
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password');
    }
  };

  const handleViewActivity = async (emp: any) => {
    setActivityEmp(emp);
    setActivityLoading(true);
    try {
      const logs = await api.getEmployeeActivity(emp.id);
      setActivityLogs(logs);
    } catch (err) {
      console.warn('Activity loading note:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      emp.username.toLowerCase().includes(q) ||
      emp.profile?.full_name.toLowerCase().includes(q) ||
      emp.profile?.phone.includes(q) ||
      emp.profile?.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-amber-400" />
              <span>{t('employee_management')}</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold uppercase">
              Super Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Register, manage, enable/disable staff accounts, change passwords, and monitor staff activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 duration-75 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('add_employee')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-3 shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by username, name, phone, or department..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const isSA = emp.role === 'super_admin';
          const isDisabled = emp.status === 'disabled';

          return (
            <div
              key={emp.id}
              className={`bg-[#111726] border rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between ${
                isDisabled
                  ? 'border-red-500/30 bg-red-950/10 opacity-75'
                  : isSA
                  ? 'border-amber-500/40 bg-gradient-to-br from-[#121A2C] to-[#0E1422]'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 text-base shadow">
                      {emp.profile?.full_name ? emp.profile.full_name[0] : emp.username[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {emp.profile?.full_name}
                      </h3>
                      <span className="font-mono text-xs text-amber-300 block">@{emp.username}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isDisabled
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : isSA
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {isDisabled ? 'Disabled' : isSA ? 'Super Admin' : 'Active'}
                  </span>
                </div>

                {/* Reason Disabled Notice on Card */}
                {isDisabled && (
                  <div className="my-2.5 p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-2">
                    <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-xs flex-1">
                      <span className="text-[10px] uppercase font-bold text-red-400 block tracking-wider">
                        Sababta loo xiray (Reason):
                      </span>
                      <span className="text-white font-mono font-bold text-[11px] break-words">
                        {emp.disabled_reason || 'DIS USER IS DISABLED PY WRONG PASSWORD'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-300 py-3 border-y border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{emp.profile?.department || 'Operations'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-mono">{emp.profile?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{emp.profile?.email}</span>
                  </div>
                </div>

                {/* Performance stats */}
                <div className="grid grid-cols-2 gap-2 my-3 text-center">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{t('orders_created')}</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {emp.orders_created_count || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{t('orders_assigned')}</span>
                    <span className="text-sm font-bold text-amber-300 font-mono">
                      {emp.orders_assigned_count || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Super Admin */}
              <div className="pt-2 flex items-center justify-between gap-1 border-t border-slate-800/60 text-xs">
                <button
                  type="button"
                  onClick={() => handleViewActivity(emp)}
                  title="View Activity Log"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition active:scale-95 duration-75 cursor-pointer"
                >
                  <History className="w-4 h-4" />
                </button>

                {!isSA && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEmp(emp);
                        setEditFullname(emp.profile.full_name);
                        setEditPhone(emp.profile.phone);
                        setEditEmail(emp.profile.email);
                        setEditDept(emp.profile.department);
                      }}
                      title={t('edit_employee')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95 duration-75 cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPwEmp(emp);
                        setChangePw1('');
                        setChangePw2('');
                        setPwError(null);
                        setPwSuccess(null);
                      }}
                      title={t('change_password')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition flex items-center gap-1 text-[11px] active:scale-95 duration-75 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Password</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => (isDisabled ? handleOpenUnlockModal(emp) : handleOpenDisableModal(emp))}
                      title={isDisabled ? 'Fur User-ka (Unlock)' : 'Xir User-ka (Disable)'}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer active:scale-95 duration-75 flex items-center gap-1 ${
                        isDisabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      }`}
                    >
                      {isDisabled ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Fur</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Xir</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => promptRemoveEmployee(emp)}
                      title={t('remove_employee')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition active:scale-95 duration-75 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalData.isOpen}
        title={confirmModalData.title}
        message={confirmModalData.message}
        confirmText={confirmModalData.confirmText}
        isDestructive={confirmModalData.isDestructive}
        loading={confirmLoading}
        onConfirm={confirmModalData.action}
        onCancel={() => setConfirmModalData((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* MODAL: Add Employee */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Register New Employee
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddEmployee} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newFullname}
                    onChange={(e) => setNewFullname(e.target.value)}
                    placeholder="e.g. Hassan Mohamed Warsame"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Department *</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Ticketing & Flights">Ticketing & Flights</option>
                    <option value="Visa Operations">Visa Operations</option>
                    <option value="Customer Support & Transfers">Customer Support & Transfers</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. 612998877"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. hassan@balcadtravel.so"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Username (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. hassan"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition active:scale-95 duration-75 cursor-pointer disabled:opacity-50"
                >
                  {addLoading ? 'Registering...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Change Password (Super Admin Only) */}
      {pwEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Change Password for @{pwEmp.username}
              </h3>
              <button
                type="button"
                onClick={() => setPwEmp(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Existing passwords are encrypted and never shown. Enter a new password for this employee.
            </p>

            {pwError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {pwSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">{t('new_password')} *</label>
                <input
                  type="password"
                  required
                  value={changePw1}
                  onChange={(e) => setChangePw1(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">{t('confirm_new_password')} *</label>
                <input
                  type="password"
                  required
                  value={changePw2}
                  onChange={(e) => setChangePw2(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPwEmp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition active:scale-95 duration-75 cursor-pointer"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Profile */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Employee Profile (@{editingEmp.username})
              </h3>
              <button
                type="button"
                onClick={() => setEditingEmp(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullname}
                  onChange={(e) => setEditFullname(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Department</label>
                <input
                  type="text"
                  required
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition active:scale-95 duration-75 cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Employee Activity Logs */}
      {activityEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#121826] border border-amber-500/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity Log for @{activityEmp.username} ({activityEmp.profile?.full_name})
              </h3>
              <button
                type="button"
                onClick={() => setActivityEmp(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 pr-1">
              {activityLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading activity...</div>
              ) : activityLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No activity recorded for this employee.
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-300">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-1">{log.details}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActivityEmp(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Disable Employee Account (Admin must provide reason) */}
      {disableModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#121826] border border-red-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-red-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  Xiritaanka User-ka Shaqaalaha
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDisableModalEmp(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDisable} className="mt-4 space-y-4">
              <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-xs text-red-200">
                Waxaad xiraysaa account-ka shaqaalaha{' '}
                <strong className="text-white font-mono">
                  @{disableModalEmp.username}
                </strong>{' '}
                ({disableModalEmp.profile?.full_name || disableModalEmp.username}). Marka la xiro, user-kani ma awoodi doono inuu nidaamka galo.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Faahfaahinta Sababta loo xirayo (Reason for Disabling) <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={disableReason}
                  onChange={(e) => {
                    setDisableReason(e.target.value);
                    if (disableError) setDisableError(null);
                  }}
                  placeholder="Fadlan qor faahfaahinta sababta loo xirayo user-ka shaqaalahan..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition resize-none"
                />
                {disableError && (
                  <p className="text-red-400 text-xs mt-1.5 font-medium">{disableError}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setDisableModalEmp(null)}
                  disabled={disableLoading}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Ka noqo
                </button>
                <button
                  type="submit"
                  disabled={disableLoading}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition active:scale-95 duration-75 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {disableLoading ? 'Fulinaya...' : 'Xir User-ka (Disable)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Unlock & Enable Employee Account (Shows Reason why it was disabled) */}
      {unlockModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#121826] border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <Unlock className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  Furitaanka User-ka Shaqaalaha
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUnlockModalEmp(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-400">Shaqaalaha:</span>
                  <span className="font-bold text-white">
                    {unlockModalEmp.profile?.full_name || unlockModalEmp.username}
                  </span>
                  <span className="font-mono text-amber-300">@{unlockModalEmp.username}</span>
                </div>
              </div>

              {/* Faahfaahinta Sababta loo xiray */}
              <div className="p-4 rounded-xl border bg-red-950/30 border-red-500/40">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-red-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">
                    Faahfaahinta / Sababta Loo Xiray (Reason Disabled):
                  </span>
                </div>
                <div className="p-3 bg-black/60 rounded-xl border border-red-500/30 text-white font-mono font-bold text-sm tracking-wide break-words">
                  {unlockModalEmp.disabled_reason || 'DIS USER IS DISABLED PY WRONG PASSWORD'}
                </div>

                {unlockModalEmp.disabled_at && (
                  <p className="text-[11px] text-slate-400 mt-2.5">
                    Xilliga la xiray: {new Date(unlockModalEmp.disabled_at).toLocaleString()}
                  </p>
                )}
                {unlockModalEmp.disabled_by && (
                  <p className="text-[11px] text-slate-400">
                    Cidda xirtay: {unlockModalEmp.disabled_by === 'SYSTEM_WRONG_PASSWORD' ? 'Nidaamka (Wrong password > 3 times)' : unlockModalEmp.disabled_by}
                  </p>
                )}
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-200">
                Ma hubtaa inaad rabto inaad furto user-ka shaqaalahan? Gelitaanka nidaamka ayaa dib loogu fasaxi doonaa, waxaana la nadiifin doonaa tirada isku dayada khaldan.
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUnlockModalEmp(null)}
                  disabled={unlockLoading}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Ka noqo
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnlock}
                  disabled={unlockLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition active:scale-95 duration-75 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  {unlockLoading ? 'Fulinaya...' : 'Fur User-ka (Unlock & Activate)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
