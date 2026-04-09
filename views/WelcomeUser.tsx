import React from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { User } from '../types';

interface Props {
    direction?: 'forward' | 'backward';
    user: User;
    onContinue: () => void;
    isDarkMode: boolean;
    t: any;
}

const WelcomeUser: React.FC<Props> = ({ direction = 'forward', user, onContinue, t }) => {
    const animClass = direction === 'forward' ? 'animate-page-in' : 'animate-page-back';

    // Always use "Dark Mode" styling for text on top of image
    const primaryBgClass = 'bg-[#59CBC8]';

    // Extract first name and determine gender greeting (heuristic)
    const firstName = user.name?.split(' ')[0] || 'Usuario';
    const greeting = firstName.trim().toLowerCase().endsWith('a') ? t.welcome_user_greeting_fem : t.welcome_user_greeting_masc;

    return (
        <div className={`flex-1 flex flex-col relative overflow-hidden w-full h-full bg-[#020617] ${animClass}`}>

            {/* FULL SCREEN BACKGROUND IMAGE */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/professionals.png"
                    alt="Fondo Profesionales"
                    className="w-full h-full object-cover opacity-100" // Increased opacity
                />
                {/* Lighter gradient to show more image */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent"></div>
                {/* Reduced radial overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_transparent_0%,_#020617_80%)] opacity-30"></div>
            </div>

            {/* Content Container - Bottom Aligned to show faces */}
            <div className="flex-1 flex flex-col items-center justify-end gap-6 px-6 py-12 relative z-10 w-full max-w-md mx-auto h-full">

                {/* Main Welcome Text */}
                <div className="w-full text-center space-y-4 animate-slide-up stagger-1">
                    <div className="space-y-1">
                        <h1 className="text-[12px] font-black uppercase tracking-[4px] text-white/90 drop-shadow-md">
                            ¡{greeting}!
                        </h1>
                        <h2 className="text-[48px] md:text-[56px] font-[1000] tracking-tighter leading-[0.9] uppercase text-white drop-shadow-2xl">
                            {firstName}
                        </h2>
                        <div className={`h-1.5 w-16 ${primaryBgClass} rounded-full mx-auto mt-3 shadow-[0_0_20px_rgba(89,203,200,0.8)]`}></div>
                    </div>

                    <p className="text-[13px] font-bold text-white max-w-[280px] mx-auto leading-relaxed drop-shadow-lg filter">
                        {t.welcome_user_desc}
                    </p>

                    {/* RED PROFESIONAL Badge */}
                    <div className="flex justify-center pt-2">
                        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full shadow-lg">
                            <Sparkles size={12} className="text-[#59CBC8]" />
                            <span className="text-[9px] font-black uppercase tracking-[2px] text-white">{t.welcome_user_badge}</span>
                        </div>
                    </div>
                </div>

                {/* CTA Button Section */}
                <div className="w-full space-y-4 animate-slide-up stagger-2">
                    <button
                        onClick={onContinue}
                        className={`
                            w-full h-20 rounded-[28px] 
                            bg-white/95 text-[#020617]
                            border-2 border-white/20
                            active:scale-[0.98] transition-all duration-300
                            flex items-center justify-center relative px-4
                            overflow-hidden group
                            shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                            backdrop-blur-sm
                        `}
                    >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                        <div className="flex flex-col items-center relative z-10 mr-8"> {/* Added margin right to visually balance the center against the arrow */}
                            <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#020617]/60">
                                {t.welcome_user_continue_top}
                            </span>
                            <span className="text-[20px] font-[1000] uppercase tracking-[1px] leading-tight">
                                {t.welcome_user_continue_bottom}
                            </span>
                        </div>

                        {/* Attractive Arrow Circle - Absolute Positioned */}
                        <div className={`absolute right-4 w-12 h-12 rounded-full ${primaryBgClass} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#020617"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="ml-0.5" // Optical centering
                            >
                                <path d="M5 12h14" />
                                <path d="M12 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>

                    <p className="text-center text-[9px] font-bold uppercase tracking-[2px] text-white/60 drop-shadow-md">
                        Conexión Servicios
                    </p>
                </div>
            </div>

            <style>{`
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
      `}</style>
        </div>
    );
};

export default WelcomeUser;
