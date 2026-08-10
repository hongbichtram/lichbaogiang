import React, { useState } from 'react';
import { Megaphone, X, Building2, Mail, Phone } from 'lucide-react';
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

  const supportEmail = systemConfig.supportEmail || systemConfig.contactEmail;
  const supportPhone = systemConfig.supportPhone || systemConfig.contactPhone;

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-purple-500/15 border border-amber-500/30 p-4 shadow-lg text-slate-100 relative overflow-hidden animate-fadeIn">
      <div className="flex items-start justify-between space-x-3">
        
        {/* Icon & Title */}
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
            <Megaphone className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                THÔNG BÁO TỪ QUẢN TRỊ HỆ THỐNG
              </span>
              {systemConfig.schoolName && (
                <span className="inline-flex items-center space-x-1 text-[11px] text-indigo-300 font-medium px-2 py-0.5 bg-indigo-500/20 rounded-md border border-indigo-500/30">
                  <Building2 className="w-3 h-3" />
                  <span>{systemConfig.schoolName}</span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {announcementText}
            </p>

            {(supportEmail || supportPhone) && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                {supportEmail && (
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-purple-400" />
                    <span>Hỗ trợ: <a href={`mailto:${supportEmail}`} className="text-indigo-300 hover:underline">{supportEmail}</a></span>
                  </span>
                )}
                {supportPhone && (
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-cyan-400" />
                    <span>Hotline: <a href={`tel:${supportPhone}`} className="text-indigo-300 hover:underline">{supportPhone}</a></span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
          title="Ẩn thông báo"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
