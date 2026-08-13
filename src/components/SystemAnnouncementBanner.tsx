import React, { useState } from 'react';
import { Megaphone, X, Mail, Phone } from 'lucide-react';
import { SystemConfig } from '../types';

interface SystemAnnouncementBannerProps {
  systemConfig: SystemConfig | null;
}

export const SystemAnnouncementBanner: React.FC<SystemAnnouncementBannerProps> = ({ systemConfig }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!systemConfig) return null;

  const announcementText = (
    systemConfig.systemAnnouncement !== undefined 
      ? systemConfig.systemAnnouncement 
      : (systemConfig.announcement || '')
  ).trim();

  // Rules: If systemAnnouncement has no content -> DO NOT show banner
  if (!announcementText || dismissed) {
    return null;
  }

  const rawEmail = (systemConfig.supportEmail || systemConfig.contactEmail || '').trim();
  const supportEmail = (!rawEmail || rawEmail.includes('truongtieuhoc.edu.vn') || rawEmail === 'admin@truongtieuhoc.edu.vn')
    ? 'hongbichtram13@gmail.com'
    : rawEmail;

  const rawPhone = (systemConfig.supportPhone || systemConfig.contactPhone || '').trim();
  const supportPhone = (!rawPhone || rawPhone === '0901234567')
    ? '0973474027'
    : rawPhone;

  return (
    <div className="mb-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/35 p-3.5 sm:p-4 shadow-xl text-slate-100 relative overflow-hidden animate-fadeIn">
      {/* Ambient Accent Glow Effects */}
      <div className="absolute top-0 right-0 w-64 h-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-full bg-blue-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between space-x-3">
        
        {/* Icon & Main Content */}
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5 shadow-sm">
            <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider drop-shadow-sm">
                THÔNG BÁO TỪ QUẢN TRỊ HỆ THỐNG
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium break-words">
              {announcementText}
            </p>

            {(supportEmail || supportPhone) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-[11px] text-slate-300">
                {supportEmail && (
                  <span className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>
                      Hỗ trợ:{' '}
                      <a href={`mailto:${supportEmail}`} className="text-indigo-300 hover:text-indigo-200 font-semibold hover:underline">
                        {supportEmail}
                      </a>
                    </span>
                  </span>
                )}
                {supportPhone && (
                  <span className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Hotline:{' '}
                      <a href={`tel:${supportPhone}`} className="text-emerald-300 hover:text-emerald-200 font-semibold hover:underline">
                        {supportPhone}
                      </a>
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors shrink-0 cursor-pointer"
          title="Ẩn thông báo"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};

