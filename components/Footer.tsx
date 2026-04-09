
import React from 'react';
import { Home, Compass, Zap, Heart, User as UserIcon, Search, Bot } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface FooterProps {
    isDarkMode: boolean;
    user: any;
    onOpenSearch: () => void;
    onChangeLocation?: () => void;
    onOpenAI: () => void;
    onGoToFavorites: () => void;
    onOpenProfile: () => void;
    theme: any;
    onGoToHome?: () => void;
    t: any;
}

const Footer: React.FC<FooterProps> = ({
    isDarkMode,
    user,
    onOpenSearch,
    onChangeLocation,
    onOpenAI,
    onGoToFavorites,
    onOpenProfile,
    theme,
    onGoToHome,
    t
}) => {
    return (
        <div className="fixed left-0 right-0 bottom-0 z-50 pointer-events-none ios-floating-footer">
            {/* Background with rounded top and decreased vertical padding */}
            <div className={`pointer-events-auto h-[54px] rounded-t-[24px] ${isDarkMode ? 'bg-[#0f172a]/95' : 'bg-[#0f172a]/95'} backdrop-blur-md border-t border-white/5 flex items-center justify-between px-2 py-0 relative shadow-[0_-5px_15px_rgba(0,0,0,0.3)]`}>
                
                {/* INICIO */}
                <button
                    onClick={onGoToHome}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 group active:scale-90 transition-all"
                >
                    <Home size={18} className={`${isDarkMode ? 'text-slate-400' : 'text-slate-400'} group-hover:text-white transition-colors`} strokeWidth={2} />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">{t.footer_home}</span>
                </button>

                {/* Separator */}
                <div className="h-5 w-[1px] bg-white/10 self-center opacity-30 rounded-full"></div>

                {/* ASISTENTE AI (Robot) */}
                <button
                    onClick={onOpenAI}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 group active:scale-90 transition-all"
                >
                    <Bot size={18} className={`${isDarkMode ? 'text-slate-400' : 'text-slate-400'} group-hover:text-white transition-colors`} strokeWidth={2} />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">{t.footer_ai}</span>
                </button>

                {/* EXPLORAR (Centrado verticalmente) */}
                <div className="w-14 h-full flex items-center justify-center">
                    <button
                        onClick={() => { if (onOpenSearch) onOpenSearch(); else if (onChangeLocation) onChangeLocation(); }}
                        className={`
                            w-11 h-11 rounded-xl flex items-center justify-center 
                            ${isDarkMode ? 'bg-[#59CBC8] shadow-[0_0_15px_rgba(89,203,200,0.3)]' : 'bg-[#00D1FF] shadow-[0_0_15px_rgba(0,209,255,0.3)]'} 
                            text-[#0f172a] 
                            active:scale-95 transition-all duration-300
                            z-20 -translate-y-0.5
                        `}
                    >
                        <Search size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* FAVORITOS */}
                <button
                    onClick={onGoToFavorites}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 group active:scale-90 transition-all"
                >
                    <Heart size={18} className={`${isDarkMode ? 'text-slate-400' : 'text-slate-400'} group-hover:text-white transition-colors`} strokeWidth={2} />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">{t.footer_favorites}</span>
                </button>

                {/* Separator */}
                <div className="h-5 w-[1px] bg-white/10 self-center opacity-30 rounded-full"></div>

                {/* PERFIL */}
                <button
                    onClick={onOpenProfile}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 group active:scale-90 transition-all"
                >
                    <UserIcon size={18} className={`${isDarkMode ? 'text-slate-400' : 'text-slate-400'} group-hover:text-white transition-colors`} strokeWidth={2} />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">{t.footer_profile}</span>
                </button>

            </div>
        </div>
    );
};

export default Footer;
