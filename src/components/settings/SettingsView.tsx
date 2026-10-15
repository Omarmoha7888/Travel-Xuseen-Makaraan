import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Globe,
  Building,
  Shield,
  Image,
  Upload,
  Link,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { BalcadLogo } from '../BalcadLogo';
import { Language } from '../../types';
import { api } from '../../services/api';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!newPassword || !confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Fadlan geli password-ka cusub iyo xaqiijintiisa.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Password-yada cusub isuma dhigmaan. Hubi xaqiijinta.' });
      return;
    }

    if (newPassword.length < 5) {
      setPasswordStatus({ type: 'error', message: 'Password-ku waa inuu ka koobnaadaa ugu yaraan 5 xaraf.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changeMyPassword(newPassword, confirmPassword, currentPassword || undefined);
      setPasswordStatus({ type: 'success', message: res.message || 'Password-kaaga si guul leh ayaa loo cusbooneysiiyay!' });
      showToast('Password-kaaga si guul leh ayaa loo badalay!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Khalad ayaa dhacay markii password-ka la badalayay.' });
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-amber-400" />
          <span>{t('settings')} & Preferences</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Maamul amniga akoonkaaga, luuqadda, muuqaalka, logada shirkadda, iyo xogta rasmiga ah.
        </p>
      </div>

      {/* 1. Amniga & Bedelka Password-ka (Security & Password Change) */}
      <div className="bg-[#111726] border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Bedelka Password-ka (Change Password)
              </h3>
              <p className="text-xs text-slate-400">
                Waxaad mar walbo si sahlan oo toos ah u badali kartaa password-ka akoonkaaga.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold uppercase tracking-wider">
            {user?.role === 'super_admin' ? 'Super Admin' : 'Staff'}
          </span>
        </div>

        {/* Current user summary */}
        <div className="mb-5 p-3.5 rounded-2xl bg-[#090D16] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Username</span>
            <span className="font-bold text-amber-400 font-mono text-sm">{user?.username}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Full Name</span>
            <span className="font-bold text-white text-sm">{user?.profile?.full_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-mono">OTP Verification Email</span>
            <span className="font-bold text-amber-400 font-mono text-sm">{user?.profile?.email || 'xuseen0250@gmail.com'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Role</span>
            <span className="font-semibold text-emerald-400 capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>

        {passwordStatus && (
          <div
            className={`mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs ${
              passwordStatus.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {passwordStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{passwordStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password-kii Hore (Current Password)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#141C30] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password-ka Cusub (New Password) *
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Geli password cusub"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#141C30] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Xaqiiji Password-ka (Confirm) *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ku celi password-ka"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#141C30] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>Badal Password-ka (Update Password)</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Theme and Interface */}
      <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <Sun className="w-4 h-4" />
          <span>Appearance & Color Scheme</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border cursor-pointer text-left transition-all duration-75 active:scale-95 flex items-center gap-3.5 ${
              theme === 'dark'
                ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">Dark Mode (Gold & Black)</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Premium dark luxury travel agency identity
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border cursor-pointer text-left transition-all duration-75 active:scale-95 flex items-center gap-3.5 ${
              theme === 'light'
                ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-amber-500 shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">Light Mode (Clean White)</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Crisp high-contrast daytime interface
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Language and Localization */}
      <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span>Multilingual Localization</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { code: 'en', title: 'English', desc: 'Default international language' },
            { code: 'so', title: 'Af-Soomaali', desc: 'Afka rasmiga ah ee Soomaaliya' },
            { code: 'ar', title: 'العربية (RTL)', desc: 'دعم كامل للكتابة والواجهة من اليمين لليسار' },
          ].map((item) => (
            <button
              type="button"
              key={item.code}
              onClick={() => setLanguage(item.code as Language)}
              className={`p-4 rounded-2xl border cursor-pointer text-left transition-all duration-75 active:scale-95 ${
                language === item.code
                  ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-white">{item.title}</span>
                {language === item.code && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
                )}
              </div>
              <span className="text-[11px] text-slate-400">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Original Logo & Branding Asset */}
      <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <Image className="w-4 h-4" />
          <span>Brand Identity & Original Logo Asset</span>
        </h3>

        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BalcadLogo size="lg" showUploadTrigger={true} />
            <div>
              <span className="font-bold text-sm text-white block">Balcad Travel Agency Logo</span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Exact original asset preservation with original aspect ratio.
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const input = document.getElementById('logo-upload');
              if (input) input.click();
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Original Logo</span>
          </button>
        </div>
      </div>

      {/* 5. Business & Contact Information */}
      <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <Building className="w-4 h-4" />
          <span>Balcad Travel Agency Registered Info</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Company Name</span>
            <span className="font-bold text-white text-sm mt-0.5 block">Balcad Travel Agency</span>
          </div>

          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Official Email</span>
            <span className="font-mono text-amber-300 mt-0.5 block">balcadtravel@gmail.com</span>
          </div>

          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Phone Contacts</span>
            <span className="font-mono text-white mt-0.5 block">612483838 • 612141414</span>
          </div>
        </div>
      </div>

      {/* 6. Separate Public Website API Integration */}
      <div className="bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Link className="w-4 h-4" />
            <span>Public Customer Website Integration Status</span>
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
            API Ready
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The public customer-facing travel agency website is a separate application. Secure API endpoint{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-amber-300">
            POST /api/customer-requests
          </code>{' '}
          is live and ready to receive customer flight & visa booking requests into this CRM without exposing private internal CRM data.
        </p>
      </div>
    </div>
  );
};
