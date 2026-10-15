import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  User,
  Shield,
  FileText,
  DollarSign,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { ActivityLog } from '../../types';

export const ActivityLogView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');

  useEffect(() => {
    loadLogs();
  }, [entityFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (entityFilter !== 'All') params.entity_type = entityFilter.toLowerCase();
      const data = await api.getActivityLogs(params);
      setLogs(data);
    } catch (err) {
      console.warn('Activity logs notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'payment':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'employee':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'messaging':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'auth':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.username.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-amber-400" />
            <span>{t('activity_log')}</span>
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            Audit Trail
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Chronological audit trail of all staff operations, status changes, debt adjustments, and logins.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {['All', 'Order', 'Payment', 'Employee', 'Messaging', 'Auth'].map((entity) => (
            <button
              type="button"
              key={entity}
              onClick={() => setEntityFilter(entity)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap cursor-pointer transition-all duration-75 active:scale-95 ${
                entityFilter === entity
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {entity} Actions
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity by username, action name, or details..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C111C] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Timestamp</th>
                <th className="py-3 px-3.5">User</th>
                <th className="py-3 px-3.5">Action</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Record ID</th>
                <th className="py-3 px-3.5">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading activity trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-amber-300 whitespace-nowrap">
                      @{log.username}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-white whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getActionBadge(
                          log.entity_type
                        )}`}
                      >
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-400 whitespace-nowrap">
                      {log.entity_id || '-'}
                    </td>
                    <td className="py-3 px-3.5 text-slate-300 text-[11px] leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
