import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, RotateCcw } from 'lucide-react';
import defaultLogoAsset from '../assets/images/balcad_wide_brand_logo_1791711428914.jpg';

interface BalcadLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showUploadTrigger?: boolean;
}

export const BalcadLogo: React.FC<BalcadLogoProps> = ({
  className = '',
  size = 'md',
  showUploadTrigger = false,
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    return localStorage.getItem('balcad_custom_logo') || defaultLogoAsset || '/balcad-logo.png';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('balcad_custom_logo');
    if (stored) {
      setLogoSrc(stored);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        localStorage.setItem('balcad_custom_logo', result);
        setLogoSrc(result);
        setIsModalOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefault = () => {
    localStorage.removeItem('balcad_custom_logo');
    setLogoSrc(defaultLogoAsset || '/balcad-logo.png');
    setIsModalOpen(false);
  };

  const heights = {
    xs: 'h-6 sm:h-7',
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24 md:h-28',
  };

  return (
    <div className={`relative flex items-center select-none ${className}`}>
      <div className="relative group flex items-center">
        <img
          src={logoSrc}
          alt="Balcad Travel Agency Official Logo"
          className={`${heights[size]} w-auto max-w-full object-contain drop-shadow-md transition-transform duration-200`}
          referrerPolicy="no-referrer"
        />
        {showUploadTrigger && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Upload or update original logo asset"
            className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-full text-xs shadow-lg transition-all duration-75 cursor-pointer active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Asset Upload & Preservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
          <div className="bg-[#121722] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Original Logo Asset
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Balcad Travel Agency official logo asset preservation. You can upload an updated original logo file anytime, or keep the original official gold & black brand logo.
            </p>

            <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center">
              <img
                src={logoSrc}
                alt="Current Logo Preview"
                className="h-16 max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="mt-4 border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-xl p-5 text-center bg-amber-500/5 transition">
              <input
                type="file"
                id="logo-upload"
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-amber-300">
                  Click to choose new original logo file
                </span>
                <span className="text-[11px] text-slate-400">
                  PNG, SVG, or JPG (Preserves original aspect ratio)
                </span>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition active:scale-95 duration-75 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 duration-75 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
