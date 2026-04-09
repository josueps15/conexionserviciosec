
import React from 'react';
import { ArrowLeft, Sparkles, Zap, ShieldCheck, Bell, Info, AlertTriangle, CheckCircle, Star, Heart, Gift, Tag, Clock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Props {
  direction?: 'forward' | 'backward';
  isDarkMode: boolean;
  onBack: () => void;
  onOpenSearch?: () => void;
  province: string;
  canton: string;
  t: any;
}

import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  detail: string;
  createdAt: string;
  tags?: string[];
  color?: string;
  target?: string;
  targetProvince?: string;
  targetCanton?: string;
  icon?: string;
  iconColor?: string;
  iconBgColor?: string;
  expiresAt?: string;
  scheduledTime?: string;
}

const Notifications: React.FC<Props> = ({ direction = 'forward', isDarkMode, onBack, t, province, canton }) => {
  const animClass = direction === 'forward' ? 'animate-page-in' : 'animate-page-back';
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Mark as read when opening
    localStorage.setItem('last_notif_read', new Date().toISOString());

    const q = query(
      collection(db, 'notifications'),
      where('active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationItem));

        // Filter by location locally
        const filtered = list.filter(n => {
          // 1. Expiration check (Universal)
          if (n.expiresAt && new Date(n.expiresAt).getTime() < now.getTime()) {
            return false;
          }

          // 2. Schedule check (Don't show if scheduled for future)
          if (n.scheduledTime && new Date(n.scheduledTime).getTime() > now.getTime()) {
            return false;
          }

          // 2. target check
          if (n.target === 'location') {
            const matchesProv = n.targetProvince === province;
            const matchesCant = !n.targetCanton || n.targetCanton === canton;
            return matchesProv && matchesCant;
          }

          // Default to true for 'all' or undefined targets
          return true;
        });

        // Sort locally to ensure it works without complex indexes
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setNotifications(filtered);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error("Error processing notifications:", err);
        setLoading(false);
      }
    }, (err) => {
      console.error("Firestore Notification Error:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [province, canton]);

  const theme = {
    bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]',
    headerBg: isDarkMode
      ? 'bg-gradient-to-br from-[#59CBC8] via-[#2DD4BF] to-[#59CBC8]'
      : 'bg-[#00D1FF]',
    card: isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200/60 shadow-sm',
    text: isDarkMode ? 'text-white' : 'text-[#0F172A]',
    subtext: isDarkMode ? 'text-white/60' : 'text-slate-500',
    shadowPrimary: isDarkMode ? 'dark-shadow-primary' : 'shadow-xl shadow-blue-500/10'
  };

  const getTimeAgo = (dateStr: string) => {
    const dates = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - dates.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${diffDays} días`;
  };

  const getIconComponent = (iconName: string | undefined, color: string | undefined) => {
    if (!iconName) return <Sparkles size={24} style={{ color }} />;
    const Icon = (LucideIcons as any)[iconName] || Sparkles;
    return <Icon size={24} style={{ color }} />;
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar transition-all duration-500 ${theme.bg} ${animClass} relative`}>

      {/* CABECERA (NO STICKY) */}
      <div className={`relative ${theme.headerBg} pt-6 pb-6 rounded-b-[40px] ${theme.shadowPrimary} border-b ${isDarkMode ? 'border-white/20' : 'border-white/40'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
        <header className="px-8 flex flex-col relative z-10">
          <div className="flex items-center justify-between mb-8">
            <button onClick={onBack} className={`rounded-2xl flex items-center justify-center transition-all active:scale-90 border w-12 h-12 ${isDarkMode ? 'border-white/50 bg-white shadow-lg' : 'border-white/60 bg-white shadow-xl'}`}>
              <ArrowLeft size={20} className="text-slate-900" strokeWidth={3} />
            </button>
            <div className="rounded-full border flex items-center gap-3 bg-white/90 border-white shadow-md px-5 py-2.5">
              <div className="w-2 h-2 rounded-full bg-[#00E7DB] animate-pulse"></div>
              <span className="font-black uppercase tracking-[3px] text-[#0F172A] text-[10px]">{t.notif_system_active}</span>
            </div>
          </div>

          <div className="flex flex-col items-start px-2 w-full">
            {/* Etiqueta Píldora */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-2 backdrop-blur-sm border border-white/40 bg-white shadow-sm">
              <Bell size={10} className="text-slate-900" strokeWidth={3} />
              <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-900/80">{t.notif_alerts_of}</span>
            </div>

            <h2 className="font-[1000] uppercase tracking-tighter text-slate-900 drop-shadow-md leading-none text-[24px] xs:text-[32px] sm:text-[40px] w-full break-words">
              {t.notif_title}
            </h2>

            <div className="mt-4 flex items-center gap-2 opacity-70">
              <Info size={14} className="text-slate-900" strokeWidth={2.5} />
              <p className="text-slate-900 font-bold text-[10px] uppercase tracking-[3px]">{t.notif_updates}</p>
            </div>
          </div>
        </header>
      </div>

      <div className="px-6 pb-10 space-y-5 relative pt-10">
        {loading && (
          <div className="flex justify-center p-10 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00E7DB]"></div>
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-10 animate-fade-in text-center">
            <div className="w-24 h-24 rounded-full bg-[#00E7DB]/10 flex items-center justify-center mb-6 relative">
              <Bell size={40} className="text-[#00E7DB] opacity-50" />
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00E7DB]/20 animate-spin-slow"></div>
            </div>
            <h3 className={`text-base font-black uppercase tracking-wider mb-2 ${theme.text}`}>
              {t.notif_empty_title}
            </h3>
            <p className={`text-xs font-medium leading-relaxed opacity-60 max-w-[200px] ${theme.subtext}`}>
              {t.notif_empty_desc}
            </p>
          </div>
        )}

        {error && (
          <div className="text-center p-10 opacity-50 text-[10px] font-black uppercase text-red-500">
            Error al cargar: {error}
          </div>
        )}

        {notifications.map((notif, idx) => (
          <div key={notif.id} className={`w-full p-6 rounded-[35px] border backdrop-blur-md flex items-center gap-5 active:scale-[0.98] transition-all animate-slide-up ${theme.card}`} style={{ animationDelay: `${idx * 0.1}s` }}>
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white shadow-[#00E7DB]/10`}
              style={{ backgroundColor: notif.iconBgColor || '#00E7DB' }}
            >
              {getIconComponent(notif.icon, notif.iconColor || '#FFFFFF')}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-black text-[#00E7DB] uppercase tracking-[2px]">
                  {notif.target === 'location' ? 'Local' : 'Global Info'}
                </span>
                <span className={`text-[8px] font-black uppercase ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>{getTimeAgo(notif.createdAt || new Date().toISOString())}</span>
              </div>
              <h4 className={`text-sm font-black uppercase tracking-tight leading-tight mb-2 ${theme.text}`}>{notif.title}</h4>
              <p className={`text-[10px] font-medium leading-relaxed ${theme.subtext}`}>{notif.detail}</p>
              {notif.tags && notif.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {notif.tags.map(tag => (
                    <span key={tag} className="text-[8px] px-2.5 py-1 rounded-full bg-[#00E7DB]/10 text-[#00E7DB] font-bold uppercase tracking-wider border border-[#00E7DB]/10">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
