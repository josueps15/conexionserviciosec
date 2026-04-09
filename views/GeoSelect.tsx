import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { PROVINCES } from '../constants';
import {
  MapPin, Check, ArrowLeft, Navigation,
  ChevronRight, Globe, MousePointer2, ChevronDown,
  Mountain, Sun, TreePine, Anchor, LayoutDashboard
} from 'lucide-react';
import { User, RegionConfig } from '../types';

interface Props {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  user: User | null;
  onSelect: (province: string, canton: string) => void;
  onAdmin?: () => void;
  t: any;
  language: 'es' | 'en';
  regionConfig?: RegionConfig;
  onRegisterBackHandler?: (handler: (() => void) | null) => void;
}

// Metadata will be accessed via t in the component

const GeoSelect: React.FC<Props> = ({ isDarkMode, onBack, onSelect, user, onAdmin, t, language, regionConfig, onRegisterBackHandler }) => {
  const regionsMeta = useMemo(() => {
    const defaults: any = {
      'Sierra': {
        id: 'Sierra',
        icon: Mountain,
        headerBgColor: '#1565C0',
        headerTextColor: '#FFFFFF',
        accentColor: '#FFFFFF',
        navButtonBgColor: 'rgba(255,255,255,0.1)',
        navButtonIconColor: '#FFFFFF',
        arrowColor: '#FFFFFF',
        cardGradientStart: '#F9A825',
        cardGradientEnd: '#F9A825',
        cardTextColor: '#FFFFFF',
        cardIconColor: '#1565C0',
        cardIconBgColor: '#FFFFFF',
        label: t.geo_region_sierra,
        desc: t.geo_region_sierra_desc,
        themeBg: '#E3F2FD',
        defaultImg: "https://i.ibb.co/sdxSQT2c/pexels-luisdalvan-1684166.jpg"
      },
      'Costa': {
        id: 'Costa',
        icon: Sun,
        headerBgColor: '#FFB800',
        headerTextColor: '#0f172a',
        accentColor: '#0f172a',
        navButtonBgColor: 'rgba(0,0,0,0.1)',
        navButtonIconColor: '#0f172a',
        arrowColor: '#ffffff',
        cardGradientStart: '#00E7DB',
        cardGradientEnd: '#009688',
        cardTextColor: '#0f172a',
        cardIconColor: '#FFB800',
        cardIconBgColor: '#FFFFFF',
        label: t.geo_region_costa,
        desc: t.geo_region_costa_desc,
        themeBg: '#FFFFFF',
        defaultImg: "https://i.ibb.co/vx5KD9z4/costa-5.jpg"
      },
      'Oriente': {
        id: 'Oriente',
        icon: TreePine,
        headerBgColor: '#2B1117',
        headerTextColor: '#FFFFFF',
        accentColor: '#59DC04',
        navButtonBgColor: 'rgba(255,255,255,0.1)',
        navButtonIconColor: '#FFFFFF',
        arrowColor: '#59DC04',
        cardGradientStart: '#59DC04',
        cardGradientEnd: '#59DC04',
        cardTextColor: '#FFFFFF',
        cardIconColor: '#2B1117',
        cardIconBgColor: '#FFFFFF',
        label: t.geo_region_oriente,
        desc: t.geo_region_oriente_desc,
        themeBg: '#E5F4B5',
        defaultImg: "https://i.ibb.co/Y7HRtMBv/amazonia-3.jpg"
      },
      'Insular': {
        id: 'Insular',
        icon: Anchor,
        headerBgColor: '#006064',
        headerTextColor: '#FFFFFF',
        accentColor: '#00BCD4',
        navButtonBgColor: 'rgba(255,255,255,0.1)',
        navButtonIconColor: '#FFFFFF',
        arrowColor: '#00BCD4',
        cardGradientStart: '#00BCD4',
        cardGradientEnd: '#00BCD4',
        cardTextColor: '#FFFFFF',
        cardIconColor: '#006064',
        cardIconBgColor: '#FFFFFF',
        label: t.geo_region_insular,
        desc: t.geo_region_insular_desc,
        themeBg: '#E0F7FA',
        defaultImg: "https://i.ibb.co/DfpQWqth/galapagos-2.jpg"
      },
    };

    // Merge with Config
    const merged: any = {};
    Object.keys(defaults).forEach(key => {
      const def = defaults[key];
      const cfg = regionConfig?.[key];
      merged[key] = {
        ...def,
        ...cfg,
        imageUrl: cfg?.imageUrl || def.defaultImg,
      };
    });
    return merged;
  }, [t, regionConfig]);

  const [mode, setMode] = useState<'region' | 'province' | 'canton'>('region');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedProv, setSelectedProv] = useState<typeof PROVINCES[0] | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const currentTheme = (selectedRegion && mode !== 'region') ? (regionsMeta as any)[selectedRegion] : null;
  const baseBgHex = currentTheme ? currentTheme.themeBg : (isDarkMode ? '#020617' : '#F1F5F9');

  // Scroll Reset Logic
  const containerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [mode, selectedRegion, selectedProv]);

  const processedProvinces = useMemo(() => {
    if (mode !== 'province') return [];
    return selectedRegion ? PROVINCES.filter(p => p.region === selectedRegion) : [];
  }, [mode, selectedRegion]);

  const processedCantons = useMemo(() => {
    if (mode !== 'canton') return [];
    return selectedProv?.cantons || [];
  }, [mode, selectedProv]);

  const handleNavigate = (newMode: 'region' | 'province' | 'canton', region: string | null = null, prov: typeof PROVINCES[0] | null = null) => {
    setDirection(newMode === 'region' ? 'backward' : 'forward');
    if (region) setSelectedRegion(region);
    if (prov) setSelectedProv(prov);
    setMode(newMode);
  };

  const goBack = useCallback(() => {
    if (mode === 'canton') {
      setDirection('backward');
      setMode('province');
    }
    else if (mode === 'province') {
      setDirection('backward');
      setMode('region');
      setSelectedRegion(null);
    }
    else {
      onBack();
    }
  }, [mode, onBack]);

  // Back Handler Registration
  useEffect(() => {
    if (onRegisterBackHandler) {
      if (mode !== 'region') {
        onRegisterBackHandler(goBack);
      } else {
        onRegisterBackHandler(null);
      }
    }
    return () => {
      if (onRegisterBackHandler) onRegisterBackHandler(null);
    };
  }, [mode, onRegisterBackHandler, goBack]);

  const getStyleForText = (text: string) => {
    return 'text-[13px] xs:text-[15px] md:text-[18px] font-black uppercase tracking-tight leading-none text-center px-1 break-words w-full min-h-[2.5em] flex items-center justify-center';
  };

  const animClass = direction === 'forward' ? 'animate-page-in' : 'animate-page-back';

  // Determine dynamic location text for the "ESTÁS EN" badge
  const getLocationContext = () => {
    if (mode === 'region') return 'ECUADOR';
    if (mode === 'province') return selectedRegion?.toUpperCase() || 'ECUADOR';
    if (mode === 'canton') return selectedProv?.name || '';
    return 'ECUADOR';
  };

  const getTitle = () => {
    if (mode === 'region') return t.geo_title_region;
    if (mode === 'province') return t.geo_title_province;
    return t.geo_title_city;
  };

  // Removed RegionBackground component as we now use dynamic images

  return (
    <div
      className="flex-1 flex flex-col h-full w-full relative overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: currentTheme ? currentTheme.themeBg : (isDarkMode ? '#020617' : '#F8FAFC') }}
    >

      {/* FIXED BACKGROUND LAYER */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${currentTheme ? 'opacity-30' : 'opacity-0'}`}>
        {currentTheme && (
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom right, ${currentTheme.cardGradientStart}, ${currentTheme.cardGradientEnd})`, filter: 'blur(100px)', opacity: 0.4 }}></div>
        )}
      </div>

      {/* SCROLLABLE CONTAINER (Header + Content) */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto hide-scrollbar relative z-10 w-full h-full flex flex-col"
      >

        {/* HEADER */}
        <div className="relative w-full pt-12 pb-6 px-8 rounded-b-[50px] z-30 shadow-2xl border-b border-white/20 shrink-0"
          style={{
            background: mode === 'region'
              ? (isDarkMode ? 'linear-gradient(to bottom right, #1e293b, #0f172a)' : 'linear-gradient(to bottom right, #334155, #1e293b)')
              : (currentTheme ? currentTheme.headerBgColor : 'linear-gradient(to bottom right, #1e293b, #0f172a)')
          }}
        >
          <div className="absolute inset-0 rounded-b-[50px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-6">
              {/* BACK BUTTON LOGIC: 
                  - Show if user is guest (!user)
                  - Show if navigating deep (mode !== 'region') 
                  - Hide if user is logged in AND at top level (region)
              */}
              {(!user || mode !== 'region') ? (
                <button
                  onClick={goBack}
                  className="w-12 h-12 rounded-2xl border border-white/20 flex items-center justify-center active:scale-90 transition-all backdrop-blur-md shadow-lg"
                  style={{ backgroundColor: currentTheme?.navButtonBgColor || 'rgba(255,255,255,0.1)' }}
                >
                  <ArrowLeft size={22} strokeWidth={3} style={{ color: currentTheme?.navButtonIconColor || 'white' }} />
                </button>
              ) : (
                <div className="w-12"></div> // Spacer to keep title centered
              )}

              <div className="flex items-center justify-center flex-1">
                <span className="text-[10px] font-[1000] uppercase tracking-[4px]" style={{ color: currentTheme?.headerTextColor || 'white' }}>ECUADOR 2025</span>
              </div>

              {/* ADMIN BUTTON */}
              {user?.role === 'admin' && onAdmin ? (
                <button
                  onClick={onAdmin}
                  className="w-12 h-12 rounded-2xl border border-white/20 flex items-center justify-center active:scale-90 transition-all shadow-lg"
                  style={{ backgroundColor: (currentTheme?.accentColor && selectedRegion === 'Costa') ? currentTheme.headerTextColor : '#59CBC8' }}
                >
                  <LayoutDashboard size={20} strokeWidth={2.5} style={{ color: (selectedRegion === 'Costa' && currentTheme) ? currentTheme.headerBgColor : '#0f172a' }} />
                </button>
              ) : (
                <div className="w-12"></div>
              )}
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 backdrop-blur-md border border-white/10 shadow-sm bg-black/10">
              <MapPin size={12} strokeWidth={3} style={{ color: currentTheme?.accentColor || '#00E7DB' }} />
              <span className="text-[10px] font-black uppercase tracking-[2px]" style={{ color: currentTheme?.headerTextColor || 'white' }}>
                {t.geo_location_label} <span style={{ color: currentTheme?.accentColor || '#00E7DB' }}>{getLocationContext()}</span>
              </span>
            </div>

            <h2 className="text-[42px] font-[1000] uppercase tracking-tighter leading-[0.9] drop-shadow-lg text-center mb-2" style={{ color: currentTheme?.headerTextColor || 'white' }}>
              {t.geo_choose_your}<br />
              <span style={{ color: currentTheme?.accentColor || '#59CBC8' }}>
                {getTitle()}
              </span>
            </h2>
            <div className="flex justify-center mt-3 mb-1 animate-bounce">
              <ChevronDown size={28} strokeWidth={4} style={{ color: currentTheme?.arrowColor || '#00E7DB' }} />
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="px-6 pb-12 pt-8 space-y-4 w-full max-w-4xl mx-auto">

          {/* REGIONS GRID */}
          {mode === 'region' && (
            <div className="space-y-6">
              {Object.values(regionsMeta).map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => handleNavigate('province', r.id, null)}
                  className="relative w-full h-[220px] rounded-[45px] overflow-hidden group active:scale-[0.98] transition-all duration-500 border border-white/10 shadow-2xl animate-slide-up"
                >
                  <img src={r.imageUrl} alt={r.id} className="absolute inset-0 w-full h-full object-cover" loading="eager" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                  <div className="absolute top-6 left-6 w-16 h-16 bg-white/10 backdrop-blur-md rounded-[24px] border border-white/20 flex items-center justify-center shadow-lg group-hover:bg-white/20 transition-colors">
                    <r.icon size={28} className="text-white drop-shadow-md" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center">
                    <h4 className="text-[38px] font-[1000] text-white uppercase tracking-tighter leading-none drop-shadow-2xl text-center">
                      {r.label}
                    </h4>
                    <p className="text-[10px] font-[1000] text-white/70 uppercase tracking-[3px] mt-2">
                      {r.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* PROVINCES LIST */}
          {mode === 'province' && (
            <div className="space-y-4">
              {processedProvinces.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => handleNavigate('canton', selectedRegion, p)}
                  className="relative w-full h-28 rounded-[35px] overflow-hidden group active:scale-[0.96] transition-all duration-500 shadow-lg animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="absolute inset-0 opacity-90" style={{ background: `linear-gradient(to right, ${currentTheme?.cardGradientStart || '#000'}, ${currentTheme?.cardGradientEnd || '#000'})` }}></div>
                  <div className="absolute inset-0 flex items-center px-6">
                    <div className="w-12 h-12 backdrop-blur-md rounded-[16px] shadow-lg flex items-center justify-center shrink-0 relative"
                      style={{ backgroundColor: 'white' }}>
                      <MapPin
                        size={24}
                        className="relative z-10 [&_circle]:fill-white [&_circle]:stroke-white"
                        style={{ color: currentTheme?.cardIconColor }}
                        fill="currentColor"
                        strokeWidth={2}
                      />
                    </div>
                    <div className="flex-1 flex items-center justify-center px-2">
                      <h4 className="text-[13px] xs:text-[15px] md:text-[18px] font-black uppercase tracking-tight leading-none text-center px-1 break-words w-full" style={{ color: currentTheme?.cardTextColor }}>
                        {p.name}
                      </h4>
                    </div>
                    <ChevronRight size={20} style={{ color: currentTheme?.cardTextColor }} strokeWidth={4} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* CANTONS LIST */}
          {mode === 'canton' && (
            <div className="space-y-4">
              {processedCantons.map((c, i) => (
                <button
                  key={c}
                  onClick={() => onSelect(selectedProv?.name || '', c)}
                  className="relative w-full h-24 rounded-[30px] overflow-hidden group active:scale-[0.96] transition-all duration-500 shadow-lg animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="absolute inset-0 opacity-90" style={{ background: `linear-gradient(to right, ${currentTheme?.cardGradientStart || '#000'}, ${currentTheme?.cardGradientEnd || '#000'})` }}></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
                  <div className="absolute inset-0 flex items-center px-5">
                    <div className="w-10 h-10 backdrop-blur-md rounded-[14px] flex items-center justify-center shadow-lg shrink-0"
                      style={{ backgroundColor: 'white' }}>
                      <MousePointer2
                        size={18}
                        style={{ color: currentTheme?.cardIconColor }}
                        fill="currentColor"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="flex-1 flex items-center justify-center px-2">
                      <h4 className="text-[13px] xs:text-[15px] md:text-[18px] font-black uppercase tracking-tight leading-none text-center px-1 break-words w-full" style={{ color: currentTheme?.cardTextColor }}>
                        {c}
                      </h4>
                    </div>
                    <div className="w-8 flex justify-end shrink-0 transition-opacity">
                      <ChevronRight size={20} style={{ color: currentTheme?.cardTextColor }} strokeWidth={4} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="h-12 w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default GeoSelect;
