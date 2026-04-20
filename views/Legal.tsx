
import React from 'react';
import { ArrowLeft, ShieldCheck, Scale, FileText } from 'lucide-react';

const Section = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div>
    <h4 className="text-[#59CBC8] text-xs font-black uppercase tracking-[2px] mb-3">{title}</h4>
    <div className="text-sm font-medium leading-relaxed opacity-80">
      {children}
    </div>
  </div>
);

interface Props {
  direction?: 'forward' | 'backward';
  isDarkMode: boolean;
  type: 'terms' | 'privacy';
  onBack: () => void;
  t: any;
}

const Legal: React.FC<Props> = ({ direction = 'forward', isDarkMode, type, onBack, t }) => {
  const animClass = direction === 'forward' ? 'animate-page-in' : 'animate-page-back';

  const theme = {
    bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]',
    headerBg: isDarkMode
      ? 'bg-gradient-to-br from-[#59CBC8] via-[#2DD4BF] to-[#59CBC8]'
      : 'bg-gradient-to-br from-[#59CBC8] via-[#00D1FF] to-[#59CBC8]',
    text: isDarkMode ? 'text-white' : 'text-[#0F172A]',
    subtext: isDarkMode ? 'text-white/60' : 'text-slate-500',
    card: isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200',
    shadowPrimary: isDarkMode ? 'dark-shadow-primary' : 'light-shadow-primary'
  };

  const title = type === 'terms' ? t.legal_title_terms : t.legal_title_privacy;
  const icon = type === 'terms' ? <Scale size={20} className="text-[#0F172A]" /> : <ShieldCheck size={20} className="text-[#0F172A]" />;

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar transition-all duration-500 ${theme.bg} ${animClass} relative`}>

      {/* CABECERA */}
      <div className={`relative ${theme.headerBg} pt-14 pb-14 rounded-b-[60px] ${theme.shadowPrimary} border-b ${isDarkMode ? 'border-white/20' : 'border-white/40'} shrink-0`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
        <header className="px-8 flex flex-col relative z-10">
          <div className="flex items-center justify-between mb-8">
            <button onClick={onBack} className={`rounded-2xl flex items-center justify-center transition-all active:scale-90 border w-12 h-12 ${isDarkMode ? 'border-white/50 bg-white shadow-lg' : 'border-white/60 bg-white shadow-xl'}`}>
              <ArrowLeft size={20} className="text-slate-900" strokeWidth={3} />
            </button>
            <div className="rounded-full border flex items-center gap-3 bg-white/90 border-white shadow-md px-5 py-2.5">
              {icon}
              <span className="font-black uppercase tracking-[3px] text-[#0F172A] text-[10px]">{t.legal_label}</span>
            </div>
          </div>

          <h2 className="font-[1000] uppercase tracking-tighter text-slate-900 drop-shadow-md leading-[0.9] text-[32px] text-center w-full">
            {type === 'terms' ? t.legal_title_usage.split(' ')[0] : t.legal_title_protection.split(' ')[0]} <br />
            {type === 'terms' ? t.legal_title_usage.split(' ').slice(1).join(' ') : t.legal_title_protection.split(' ').slice(1).join(' ')}
          </h2>
        </header>
      </div>

      <div className="px-6 py-10 relative">
        <div className={`p-8 rounded-[40px] border ${theme.card} space-y-8 text-left animate-slide-up`}>

          {type === 'privacy' ? (
            <>
              <Section title={t.legal_privacy_1_title}>
                {t.legal_privacy_1_desc}
              </Section>
              <Section title={t.legal_privacy_2_title}>
                {t.legal_privacy_2_desc}
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>{t.legal_privacy_2_item_1}</li>
                  <li>{t.legal_privacy_2_item_2}</li>
                  <li>{t.legal_privacy_2_item_3}</li>
                  <li>{t.legal_privacy_2_item_4}</li>
                </ul>
              </Section>
              <Section title={t.legal_privacy_3_title}>
                {t.legal_privacy_3_desc}
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>{t.legal_privacy_3_item_1}</li>
                  <li>{t.legal_privacy_3_item_2}</li>
                  <li>{t.legal_privacy_3_item_3}</li>
                  <li>{t.legal_privacy_3_item_4}</li>
                </ul>
              </Section>
              <Section title={t.legal_privacy_4_title}>
                {t.legal_privacy_4_desc}
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>{t.legal_privacy_4_item_1}</li>
                  <li>{t.legal_privacy_4_item_2}</li>
                  <li>{t.legal_privacy_4_item_3}</li>
                </ul>
              </Section>
              <Section title={t.legal_privacy_5_title}>
                {t.legal_privacy_5_desc}
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>{t.legal_privacy_5_item_1}</li>
                  <li>{t.legal_privacy_5_item_2}</li>
                  <li>{t.legal_privacy_5_item_3}</li>
                  <li>{t.legal_privacy_5_item_4}</li>
                </ul>
                <p className="mt-2">{t.legal_privacy_5_contact}</p>
              </Section>
              <Section title={t.legal_privacy_6_title}>
                {t.legal_privacy_6_desc}
              </Section>
              <Section title={t.legal_privacy_7_title}>
                {t.legal_privacy_7_desc}
              </Section>
              <Section title={t.legal_privacy_8_title}>
                {t.legal_privacy_8_desc}
              </Section>
              <Section title={t.legal_privacy_9_title}>
                {t.legal_privacy_9_desc}
              </Section>
              <Section title={t.legal_privacy_10_title}>
                {t.legal_privacy_10_desc}
              </Section>
            </>
          ) : (
            <>
              <Section title={t.legal_terms_1_title}>
                {t.legal_terms_1_desc}
              </Section>
              <Section title={t.legal_terms_2_title}>
                {t.legal_terms_2_desc}
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>{t.legal_terms_2_sub_1}</li>
                  <li>{t.legal_terms_2_sub_2}</li>
                </ul>
              </Section>
              <Section title={t.legal_terms_3_title}>
                {t.legal_terms_3_desc}
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>{t.legal_terms_3_sub_1}</li>
                  <li>{t.legal_terms_3_sub_2}</li>
                </ul>
              </Section>
              <Section title={t.legal_terms_4_title}>
                {t.legal_terms_4_desc}
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>{t.legal_terms_4_sub_1}</li>
                </ul>
              </Section>
              <Section title={t.legal_terms_5_title}>
                {t.legal_terms_5_desc}
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>{t.legal_terms_5_item_1}</li>
                  <li>{t.legal_terms_5_item_2}</li>
                  <li>{t.legal_terms_5_item_3}</li>
                  <li>{t.legal_terms_5_item_4}</li>
                </ul>
              </Section>
              <Section title={t.legal_terms_6_title}>
                {t.legal_terms_6_desc}
              </Section>
              <Section title={t.legal_terms_7_title}>
                {t.legal_terms_7_desc}
              </Section>
              <Section title={t.legal_terms_8_title}>
                {t.legal_terms_8_desc}
              </Section>
              <Section title={t.legal_terms_9_title}>
                {t.legal_terms_9_desc}
              </Section>
              <Section title={t.legal_terms_10_title}>
                {t.legal_terms_10_desc}
              </Section>
              <Section title={t.legal_terms_11_title}>
                {t.legal_terms_11_desc}
              </Section>
            </>
          )}

          <div className="pt-8 border-t border-dashed border-white/20 text-center">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.subtext}`}>{t.legal_last_update}</p>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.subtext} mt-1`}>{t.legal_location}</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Legal;
