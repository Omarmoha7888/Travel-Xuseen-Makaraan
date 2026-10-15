import React, { useState, useRef } from 'react';
import { X, Upload, DollarSign, UserCheck, Phone, User, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface CloseCashCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSuccess: () => void;
  targetStaffUsername?: string;
}

export const CloseCashCounterModal: React.FC<CloseCashCounterModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onSuccess,
  targetStaffUsername,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isOtherStaff =
    !!targetStaffUsername &&
    targetStaffUsername !== 'All' &&
    targetStaffUsername.toLowerCase() !== (user?.username || '').toLowerCase();

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('blc00001');
  const [notes, setNotes] = useState('');
  const [proofImage, setProofImage] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Fadlan soo dooro sawir kaliya (PNG, JPG, JPEG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Cabbirka sawirku waa inuusan ka badnaan 8MB.');
      return;
    }

    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isOtherStaff) {
      setError('laguu ma ogola howshan xaq Uma lihid inaad xerto xisaab shaqaale kale leyahay');
      return;
    }

    if (currentBalance <= 0) {
      setError('Sanduuqaagu wax lacag ah kuma jirto ($0.00). Uma baahnid xisaab xir xilligan.');
      return;
    }

    if (!recipientName.trim()) {
      setError('Fadlan geli magaca buuxa ee qofka aad lacagta u dhiibtay (Full Name).');
      return;
    }

    if (!recipientPhone.trim()) {
      setError('Fadlan geli lambarka taleefanka ee qofka aad lacagta u dhiibtay.');
      return;
    }

    if (!recipientUsername.trim()) {
      setError('Fadlan geli username-ka qofka aad lacagta u dhiibtay.');
      return;
    }

    if (!proofImage) {
      setError('Fadlan soo upload-gareey sawir caddaynaya in lacagta loo diray qofkaas (Receipt/Screenshot).');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.closeCashCounter({
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        recipient_username: recipientUsername.trim(),
        proof_image_url: proofImage,
        notes: notes.trim(),
      });

      showToast(
        `Xisaabta sanduuqa ($${currentBalance.toLocaleString()}) si guul leh ayaa loo xiray! Balance-kaagu hadda waa $0.`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xisaab xirka waa lagu guuldareystay. Fadlan isku day markale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#162036]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Xisaab Xirka Sanduuqa (Close Cash Counter)
              </h2>
              <p className="text-[11px] text-slate-400">
                Shaqaale: <strong className="text-amber-300">@{user?.username}</strong> ({user?.profile?.full_name || 'Staff'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Current Balance Notice */}
          {isOtherStaff ? (
            <div className="p-4 bg-red-500/20 border-2 border-red-500 rounded-xl text-red-200 text-xs font-bold flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-black text-red-300">
                  laguu ma ogola howshan xaq Uma lihid inaad xerto xisaab shaqaale kale leyahay
                </p>
                <p className="text-[11px] text-red-200/80 mt-1 font-normal">
                  Waxaad kormeereysaa sanduuqa @{targetStaffUsername}. Xisaabtan kaliya waxaa xiri kara shaqaalaha iska leh sanduuqa.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-blue-500/10 border border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-mono font-semibold text-amber-400 tracking-wider block">
                  Cadadka Sanduuqaaga ee La Xirayo
                </span>
                <span className="text-2xl font-black text-white font-mono">
                  ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Diyaar u ah Xisaab Xir
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Marka la xiro balance-kaagu wuxuu noqonayaa <strong className="text-amber-300">$0.00</strong>
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Recipient Details */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-400" />
              1. Qofka Lacagta Loo Dhiibay (Recipient Details)
            </h3>

            {/* Quick Fill Preset Buttons */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="text-slate-400 self-center mr-1">Doorasho degdeg ah:</span>
              <button
                type="button"
                onClick={() => {
                  setRecipientName('Hussein Mohamud Ali');
                  setRecipientPhone('612483838');
                  setRecipientUsername('blc00001');
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 transition"
              >
                @blc00001 (Admin Hussein)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecipientName('Finance & Accounts Office');
                  setRecipientPhone('612000000');
                  setRecipientUsername('finance');
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 transition"
              >
                Finance & Accounts
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Magaca Buuxa ee Qofka Lacagta Loo Dhiibay *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="tusaale: Hussein Mohamud Ali"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Number-ka Taleefanka *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="tusaale: 612483838"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Username-ka Qofka *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientUsername}
                    onChange={(e) => setRecipientUsername(e.target.value)}
                    placeholder="tusaale: blc00001"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Proof Image Upload */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                2. Sawirka Caddaynta Lacag-Dirista *
              </span>
              <span className="text-[10px] text-amber-400 lowercase font-mono">
                receipt / screenshot
              </span>
            </h3>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            {!proofImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/80 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/60 group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center mx-auto mb-2 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-white font-medium">Soo upload-gareey sawirka caddaynta</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Guji halkan si aad sawirka (screenshot ama rasiid) uga soo xulato qalabkaaga
                </p>
                <span className="inline-block mt-2 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-mono">
                  PNG, JPG, JPEG (Max 8MB)
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative border border-slate-700 rounded-xl overflow-hidden bg-slate-950 max-h-48 flex items-center justify-center">
                  <img
                    src={proofImage}
                    alt="Proof Receipt"
                    className="max-h-48 w-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProofImage('');
                      setFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-600/90 text-white rounded-lg hover:bg-red-700 transition shadow"
                    title="Ka saar sawirka"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span className="truncate max-w-[200px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {fileName || 'Sawirka waa diyaar'}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-amber-400 hover:underline"
                  >
                    Beddel sawirka
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium">
              Qoraal / Faahfaahin Dheeraad ah (Ikhtiyaari)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qor wax kasta oo muhiim ah oo ku saabsan xisaab xirkan..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
            >
              Ka Noqo (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting || currentBalance <= 0 || !proofImage || isOtherStaff}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Xiritaanka xisaabta...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xir Xisaabta Sanduuqa ($0 Balance)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
