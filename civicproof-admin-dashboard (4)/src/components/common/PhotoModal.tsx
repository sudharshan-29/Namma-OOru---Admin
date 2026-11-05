import React from 'react';
import { X, ExternalLink, ShieldCheck, MapPin } from 'lucide-react';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  photoUrl: string;
  subtitle?: string;
  location?: string;
  timestamp?: string;
  isSigned?: boolean;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  title,
  photoUrl,
  subtitle,
  location,
  timestamp,
  isSigned,
}) => {
  if (!isOpen) return null;

  const modalGlassStyle: React.CSSProperties = {
    background:
      /* 1. Top Specular Lens Meniscus Arc */
      'linear-gradient(180deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.25) 25%, rgba(255, 255, 255, 0.05) 55%, transparent 100%), ' +
      /* 2. Prismatic Caustic Dispersion Streak */
      'linear-gradient(125deg, rgba(255, 255, 255, 0.40) 0%, rgba(185, 219, 225, 0.15) 25%, rgba(255, 255, 255, 0.20) 50%, rgba(160, 205, 220, 0.25) 75%, rgba(255, 255, 255, 0.35) 100%), ' +
      /* 3. Pure Glacier Blue Liquid Tint (#B9D8E1 / rgb(185, 219, 225)) */
      'linear-gradient(180deg, rgba(220, 240, 246, 0.96) 0%, rgba(185, 219, 225, 0.94) 50%, rgba(165, 206, 216, 0.97) 100%)',
    backdropFilter: 'blur(36px) saturate(210%) contrast(106%)',
    WebkitBackdropFilter: 'blur(36px) saturate(210%) contrast(106%)',
    border: '1.5px solid rgba(255, 255, 255, 0.85)',
    borderRadius: '26px',
    boxShadow:
      '0 28px 65px -8px rgba(10, 38, 64, 0.30), ' +
      '0 10px 24px -4px rgba(10, 38, 64, 0.18), ' +
      '0 0 1px 1.5px rgba(255, 255, 255, 0.85), ' +
      'inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95), ' +
      'inset 0 -1.5px 2.5px 0 rgba(110, 168, 185, 0.50), ' +
      'inset 0 0 24px 2px rgba(185, 219, 225, 0.40)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[64px] sm:pt-[70px] pb-8 px-4 bg-[#0a1c2e]/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        style={modalGlassStyle}
        className="relative max-w-4xl w-full overflow-hidden my-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/60 bg-white/40 backdrop-blur-md">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#0A2540] text-base truncate">{title}</h3>
              {isSigned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full font-mono shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Authenticated Photo Token
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-[#486581] mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={photoUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-[#486581] hover:text-[#0A2540] hover:bg-white/50 rounded-xl transition"
              title="Open full image in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-[#486581] hover:text-[#0A2540] hover:bg-white/50 rounded-xl transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="bg-[#0b1726] flex items-center justify-center max-h-[70vh] p-3 overflow-hidden">
          <img
            src={photoUrl}
            alt={title}
            className="max-h-[66vh] w-auto max-w-full rounded-xl object-contain shadow-md"
            loading="eager"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/thumb_pothole_1.jpg';
            }}
          />
        </div>

        {/* Footer Meta */}
        <div className="px-6 py-3 bg-white/40 border-t border-white/60 flex flex-wrap items-center justify-between text-xs text-[#1e3a5f] gap-2 font-medium">
          {location && (
            <div className="flex items-center gap-1.5 text-[#0284C7] font-semibold">
              <MapPin className="w-4 h-4 text-[#0284C7]" />
              <span>{location}</span>
            </div>
          )}
          {timestamp && (
            <div className="text-[#486581]">
              Captured / Submitted:{' '}
              <span className="font-bold text-[#0A2540]">
                {new Date(timestamp).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
