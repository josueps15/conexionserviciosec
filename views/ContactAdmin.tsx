
import React from 'react';
import { ArrowLeft, MessageCircle, ShieldCheck, Zap, Briefcase, Rocket, Star, CheckCircle } from 'lucide-react';
import { WHATSAPP_CONFIG } from '../constants';

interface Props {
   direction?: 'forward' | 'backward';
   isDarkMode: boolean;
   onBack: () => void;
   t: any;
}

const ContactAdmin: React.FC<Props> = ({ direction = 'forward', isDarkMode, onBack, t }) => {
   const theme = {
      bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F8FAFC]',
      headerBg: isDarkMode
         ? 'bg-gradient-to-br from-[#FFB800] via-[#FFD152] to-[#FFB800]'
         : 'bg-gradient-to-br from-[#FFB800] via-[#FFE5A0] to-[#FFB800]',
      text: isDarkMode ? 'text-white' : 'text-[#0F172A]',
      subtext: isDarkMode ? 'text-white/60' : 'text-[#475569]',
      card: isDarkMode ? 'bg-white/5 border-white/10 shadow-xl' : 'bg-white border-slate-200 shadow-sm',
      shadowPrimary: isDarkMode ? 'dark-shadow-secondary' : 'light-shadow-secondary'
   };

   const handleWhatsAppClick = () => {
      window.open(`https://wa.me/${WHATSAPP_CONFIG.number}?text=${encodeURIComponent(WHATSAPP_CONFIG.defaultMessage)}`, '_blank');
   };

   const animClass = direction === 'forward' ? 'animate-page-in' : 'animate-page-back';

   return (
      <div className={`flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar transition-all duration-500 ${theme.bg} ${animClass} relative`}>

         {/* CABECERA */}
         <div className={`relative ${theme.headerBg} pt-14 pb-14 rounded-b-[60px] ${theme.shadowPrimary} border-b ${isDarkMode ? 'border-white/20' : 'border-white/40'} shrink-0`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
            <header className="px-8 flex flex-col relative z-10">
               <div className="flex items-center justify-between mb-8">
                  <button onClick={onBack} className={`rounded-2xl flex items-center justify-center transition-all active:scale-90 border w-12 h-12 shadow-md ${isDarkMode ? 'bg-white/90 border-white text-slate-900' : 'bg-white border-white/50 text-slate-900'}`}>
                     <ArrowLeft size={20} strokeWidth={3} />
                  </button>
                  <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-md border border-slate-100">
                     <Zap size={12} className="text-[#FFB800] fill-[#FFB800]" />
                     <span className="font-[1000] uppercase tracking-[2px] text-[#0F172A] text-[9px]">{t.contact_label}</span>
                  </div>
               </div>

               <div className="flex flex-col items-center px-2">
                  <div className="flex items-center gap-2 mb-3 opacity-70">
                     <Rocket size={12} className="text-slate-900" strokeWidth={3} />
                     <span className="text-[10px] font-black uppercase tracking-[3px] text-slate-900">{t.contact_boost}</span>
                  </div>
                  <h2 className="font-[1000] uppercase tracking-tighter text-slate-900 drop-shadow-md leading-none text-[40px] text-center">{t.contact_title}</h2>

                  {/* HERO IMAGE PROFESIONALES */}
                  <div className="w-full relative mt-6 -mb-20 z-20 flex justify-center pointer-events-none">
                     <img
                        src="/professionals.png"
                        alt="Profesionales Expertos"
                        className="w-full max-w-[320px] object-contain drop-shadow-2xl animate-pop-in cursor-pointer hover:scale-105 transition-transform duration-500 rounded-[40px]"
                     />
                  </div>
               </div>
            </header>
         </div>

         <div className="px-6 pb-12 pt-16 space-y-8 relative">

            {/* INFO CARD */}
            <div className={`p-8 rounded-[40px] border relative overflow-hidden animate-slide-up ${theme.card}`}>
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FFB800]/20 rounded-full blur-[40px] opacity-40"></div>
               <p className={`relative z-10 text-sm font-medium leading-relaxed text-center ${theme.text}`} dangerouslySetInnerHTML={{ __html: t.contact_info_desc }} />
            </div>

            {/* TARJETA DE CONTACTO ADMIN (TIPO CATEGORÍA) */}
            <div className="relative animate-slide-up" style={{ animationDelay: '0.1s' }}>
               <div className="w-full p-8 rounded-[45px] bg-[#0A0F1C] border border-white/5 flex flex-col items-center justify-center gap-6 relative overflow-hidden shadow-2xl">

                  {/* Fondo con gradiente oscuro en movimiento (Deep Amber/Dark Orange) */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#451a03] via-[#b45309] to-[#451a03] opacity-90 animate-gradient-x"></div>

                  {/* Capa oscura superior para contraste extra */}
                  <div className="absolute inset-0 bg-black/40"></div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FFB800]/10 blur-[80px] rounded-full pointer-events-none"></div>

                  <div className="relative">
                     <div className="w-24 h-24 rounded-[30px] bg-[#FFB800] flex items-center justify-center text-[#0F172A] shadow-[0_15px_40px_rgba(255,184,0,0.4)] relative z-10 border-4 border-[#FFB800]/20">
                        <Briefcase size={40} strokeWidth={2} />
                     </div>
                     <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-xl p-2 border-2 border-[#0A0F1C] z-20 shadow-lg">
                        <MessageCircle size={14} fill="white" className="text-white" />
                     </div>
                  </div>

                  <div className="text-center relative z-10">
                     <h3 className="text-2xl font-[1000] uppercase tracking-tighter leading-none mb-2 text-white">{WHATSAPP_CONFIG.adminName}</h3>
                     <div className="flex items-center justify-center gap-2 opacity-80">
                        <ShieldCheck size={12} className="text-white" />
                        <p className="text-[10px] font-black uppercase tracking-[3px] text-white">{t.contact_admin_support}</p>
                     </div>
                  </div>

                  <button
                     onClick={handleWhatsAppClick}
                     className="w-full h-16 bg-[#25D366] text-white rounded-full font-black text-[13px] tracking-[3px] uppercase flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,211,102,0.3)] active:scale-95 transition-all mt-2 relative z-10"
                  >
                     <MessageCircle size={20} fill="white" /> {t.contact_btn}
                  </button>
               </div>
            </div>

            {/* STEPS GRID */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
               <div className="flex items-center gap-3 mb-4 px-2">
                  <Star size={14} className="text-[#FFB800] fill-[#FFB800]" />
                  <span className={`text-[10px] font-black uppercase tracking-[4px] ${theme.subtext}`}>{t.contact_steps_title}</span>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  <div className={`h-24 px-6 rounded-[30px] border flex items-center gap-5 ${theme.card}`}>
                     <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800] shrink-0">
                        <span className="font-[1000] text-lg">1</span>
                     </div>
                     <div>
                        <h4 className={`text-xs font-[1000] uppercase tracking-wider mb-0.5 ${theme.text}`}>{t.contact_step_1_title}</h4>
                        <p className={`text-[10px] font-medium opacity-60 ${theme.text}`}>{t.contact_step_1_desc}</p>
                     </div>
                  </div>

                  <div className={`h-24 px-6 rounded-[30px] border flex items-center gap-5 ${theme.card}`}>
                     <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800] shrink-0">
                        <span className="font-[1000] text-lg">2</span>
                     </div>
                     <div>
                        <h4 className={`text-xs font-[1000] uppercase tracking-wider mb-0.5 ${theme.text}`}>{t.contact_step_2_title}</h4>
                        <p className={`text-[10px] font-medium opacity-60 ${theme.text}`}>{t.contact_step_2_desc}</p>
                     </div>
                  </div>

                  <div className={`h-24 px-6 rounded-[30px] border flex items-center gap-5 ${theme.card}`}>
                     <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-[#FFB800] shrink-0">
                        <span className="font-[1000] text-lg">3</span>
                     </div>
                     <div>
                        <h4 className={`text-xs font-[1000] uppercase tracking-wider mb-0.5 ${theme.text}`}>{t.contact_step_3_title}</h4>
                        <p className={`text-[10px] font-medium opacity-60 ${theme.text}`}>{t.contact_step_3_desc}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* FOOTER GARANTÍA */}
            <div className="flex flex-col items-center gap-2 pt-4 opacity-50 animate-slide-up" style={{ animationDelay: '0.3s' }}>
               <CheckCircle size={16} className={theme.text} />
               <p className={`text-[9px] font-black uppercase tracking-[4px] ${theme.text}`}>{t.welcome_guaranteed}</p>
            </div>

         </div>
      </div>
   );
};

export default ContactAdmin;
