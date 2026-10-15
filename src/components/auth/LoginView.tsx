import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  User as UserIcon,
  ShieldAlert,
  Info,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  RotateCw,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { BalcadLogo } from '../BalcadLogo';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const LoginView: React.FC = () => {
  const { login, verifyOtp, resendOtp, error, clearError } = useAuth();
  const { t } = useLanguage();

  // Mode: credentials or otp
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  // Credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // OTP state
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [emailMasked, setEmailMasked] = useState<string>('');
  const [recipientFullName, setRecipientFullName] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [expiresSeconds, setExpiresSeconds] = useState(600); // 10 minutes
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Input refs for 6-digit boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if user was redirected here due to disabled account
  useEffect(() => {
    const disabledMsg = localStorage.getItem('balcad_auth_disabled_msg');
    if (disabledMsg) {
      setLocalError('dis user is disabled please contact the Super admin');
      localStorage.removeItem('balcad_auth_disabled_msg');
    }
  }, []);

  // Cooldown timers for OTP screen
  useEffect(() => {
    if (step !== 'otp') return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setExpiresSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Focus first digit box when switching to OTP
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // 1. Handle credentials submission
  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setLocalError('Fadlan geli username-ka iyo password-ka (Please enter both username and password).');
      return;
    }
    setLocalError(null);
    clearError();
    setLoading(true);

    try {
      const res = await login(cleanUser, cleanPass);
      if (res && res.requiresOtp && res.otpSessionId) {
        setOtpSessionId(res.otpSessionId);
        setEmailMasked(res.emailMasked || res.email || '');
        setRecipientFullName(res.fullName || cleanUser);
        setOtpDigits(['', '', '', '', '', '']);
        setResendCooldown(60);
        setExpiresSeconds(res.expiresInSeconds || 600);
        setStep('otp');
      }
    } catch (err: any) {
      const msg = String(err.message || '');
      if (
        msg.toLowerCase().includes('disabled') ||
        msg.toLowerCase().includes('xanniban') ||
        msg.toLowerCase().includes('administrator') ||
        msg.toLowerCase().includes('super admin') ||
        msg.includes('403') ||
        msg.toLowerCase().includes('forbidden') ||
        msg.includes('<html') ||
        msg.includes('<!doctype')
      ) {
        setLocalError('dis user is disabled please contact the Super admin');
      } else {
        setLocalError(err.message || 'Username-ka ama password-ka ma saxana.');
      }
    } finally {
      setLoading(false);
    }
  };

  const normalizeDigits = (str: string): string => {
    if (!str) return '';
    const arabic = '٠١٢٣٤٥٦٧٨٩';
    const persian = '۰۱۲۳۴۵۶۷۸۹';
    return str
      .replace(/[٠-٩]/g, (d) => arabic.indexOf(d).toString())
      .replace(/[۰-۹]/g, (d) => persian.indexOf(d).toString())
      .replace(/\D/g, '')
      .trim();
  };

  // 2. Handle OTP digit typing & navigation
  const handleDigitChange = (index: number, val: string) => {
    setLocalError(null);
    clearError();
    const cleanVal = normalizeDigits(val);

    // If user typed/pasted multiple digits into a box
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((ch, idx) => {
        if (index + idx < 6) {
          newDigits[index + idx] = ch;
        }
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-advance to next box if digit entered
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    const rawPasted = e.clipboardData.getData('text');
    const pastedData = normalizeDigits(rawPasted).slice(0, 6);
    if (pastedData) {
      const newDigits = ['', '', '', '', '', ''];
      pastedData.split('').forEach((ch, i) => {
        if (i < 6) newDigits[i] = ch;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedData.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  // 3. Handle OTP verify submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = normalizeDigits(otpDigits.join(''));

    if (fullCode.length !== 6) {
      setLocalError('Fadlan geli dhammaan 6-da god ee koodhka OTP (Please enter all 6 digits).');
      return;
    }

    if (!otpSessionId) {
      setLocalError('Fadhiga xaqiijintu ma saxana. Fadlan dib uga soo gal bogga hore.');
      return;
    }

    setLocalError(null);
    clearError();
    setOtpLoading(true);

    try {
      await verifyOtp(otpSessionId, fullCode);
    } catch (err: any) {
      const msg = String(err.message || '');
      setLocalError(msg || 'Koodhka OTP ma saxana.');
    } finally {
      setOtpLoading(false);
    }
  };

  // 4. Handle resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || !otpSessionId || resendLoading) return;

    setResendLoading(true);
    setLocalError(null);
    setResendSuccess(null);

    try {
      const res = await resendOtp(otpSessionId);
      if (res && res.otpSessionId) {
        setOtpSessionId(res.otpSessionId);
      }
      setResendCooldown(60);
      setExpiresSeconds(600);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResendSuccess('Koodh cusub oo OTP ah ayaa si guul leh loogu diray email-kaaga!');
      setTimeout(() => setResendSuccess(null), 5000);
    } catch (err: any) {
      setLocalError(err.message || 'Khalad ayaa dhacay markii koodhka dib loo dirayay.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const rawError = localError || error;
  const isUserDisabledError =
    rawError &&
    (rawError.toLowerCase().includes('disabled') ||
      rawError.toLowerCase().includes('xanniban') ||
      rawError.toLowerCase().includes('administrator') ||
      rawError.toLowerCase().includes('super admin') ||
      rawError.includes('403') ||
      rawError.toLowerCase().includes('forbidden') ||
      rawError.includes('<html') ||
      rawError.includes('<!doctype'));

  const displayedError = isUserDisabledError
    ? 'dis user is disabled please contact the Super admin'
    : rawError;

  return (
    <div className="min-h-screen w-full bg-[#070A11] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Golden Glow and Dark Atmosphere */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-[#0E1422] border border-amber-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="py-2 px-4 rounded-2xl bg-[#080C15]/90 border border-amber-500/20 shadow-xl flex items-center justify-center max-w-full">
              <BalcadLogo size="xl" showUploadTrigger={true} />
            </div>
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[11px] uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Internal Admin & CRM</span>
            </div>
          </div>

          {/* Error Banner */}
          {displayedError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs animate-shake font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{displayedError}</span>
            </div>
          )}

          {/* Success Banner */}
          {resendSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{resendSuccess}</span>
            </div>
          )}

          {/* STEP 1: CREDENTIALS (USERNAME & PASSWORD) */}
          {step === 'credentials' && (
            <div>
              <p className="text-xs text-slate-400 text-center mb-5">
                Sign in with your username and password to receive your security OTP.
              </p>

              <form onSubmit={handleSubmitCredentials} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    {t('username')}
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder=""
                      className="w-full pl-10 pr-4 py-2.5 bg-[#141C30] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder=""
                      className="w-full pl-10 pr-10 py-2.5 bg-[#141C30] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1 cursor-pointer"
                      title={showPassword ? 'Qari Password-ka' : 'Muuji Password-ka'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{t('login_button')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Notice */}
              <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400/80" />
                  <span>{t('login_forgot_notice')}</span>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: TWO-FACTOR EMAIL OTP VERIFICATION */}
          {step === 'otp' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Security Header Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <KeyRound className="w-4 h-4" />
                  <span>Xaqiijinta Koodhka OTP (One-Time Password)</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  ASC, maamule/shaqaale code ka aad soo dirsatay waa One Time Password (OTP) fadlan horay ka geli inta uusan expire noqon:
                </p>
              </div>

              {/* Masked Email destination */}
              <div className="p-3 rounded-xl bg-[#141C30] border border-slate-700/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Email-ka xaqiijinta</span>
                    <span className="font-semibold text-white font-mono">{emailMasked || 'Registered Email'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono font-semibold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatSeconds(expiresSeconds)}</span>
                </div>
              </div>

              {/* 6-Digit OTP Input Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-center text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    Geli Koodhka 6-da God Ah (Enter Passcode)
                  </label>
                  <div className="flex justify-between gap-1.5 sm:gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        onPaste={handleDigitPaste}
                        className="w-11 sm:w-12 h-12 text-center text-xl font-bold font-mono bg-[#141C30] text-amber-400 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 transition shadow-inner"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otpDigits.join('').length !== 6 || expiresSeconds <= 0}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  {otpLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Xaqiiji & Gal Bogga (Verify & Enter)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Resend & Back Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || resendLoading}
                    className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0
                        ? `Dib u dir koodhka (${resendCooldown}s)`
                        : 'Dib u dir koodhka OTP (Resend)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setLocalError(null);
                      clearError();
                    }}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Dib ugu noqo</span>
                  </button>
                </div>

                {/* Friendly sign-off note matching customer's screenshot message */}
                <div className="mt-2 p-2.5 rounded-xl bg-[#090D17] border border-slate-800 text-center">
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    "Maamule waad ku mahadsantahay u adeegista macaamiisha | BALCAD TRAVEL AGENCY ee fadlan sidan oo kale ugu dadaal shaqadaada mahadsanid!"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-4 text-[11px] text-slate-500">
          Balcad Travel Agency • balcadtravel@gmail.com • 612483838 / 612141414
        </div>
      </div>
    </div>
  );
};
