
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, Send, Sparkles, User, Loader2, Zap } from 'lucide-react';
import { Service, User as UserType } from '../types';

interface Props {
  isDarkMode: boolean;
  onBack: () => void;
  services: Service[];
  user: UserType | null;
  province: string;
  canton: string;
  t: any;
  language: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  time: string;
}

const AIChat: React.FC<Props> = ({ isDarkMode, onBack, province, canton, t, services, language }) => {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: `¡Hola! 👋 Soy ServicesBot, tu asistente inteligente. Conozco los mejores servicios profesionales en **${canton}**. ¿En qué puedo ayudarte hoy?`, time: now }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // We only track focus for UI styling changes (like making the header compact)
  // We do NOT use this for layout positioning, Android adjustResize does that automatically!
  useEffect(() => {
    const onFocus = () => setIsKeyboardOpen(true);
    const onBlur = () => setIsKeyboardOpen(false);
    
    const textarea = inputRef.current;
    if (textarea) {
      textarea.addEventListener('focus', onFocus);
      textarea.addEventListener('blur', onBlur);
    }
    return () => {
      if (textarea) {
        textarea.removeEventListener('focus', onFocus);
        textarea.removeEventListener('blur', onBlur);
      }
    }
  }, []);

  // Smooth scroll to bottom on new messages or when keyboard opens
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesScrollRef.current) {
        messagesScrollRef.current.scrollTo({
          top: messagesScrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    };
    
    const t1 = setTimeout(scrollToBottom, 80);
    // Extra scroll for slow android keyboards
    const t2 = setTimeout(scrollToBottom, 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [messages, isLoading, isKeyboardOpen]);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
  }, []);

  const knowledgeContext = useMemo(() => {
    try {
      const safeServices = services || [];
      const cantonClean = canton || '';
      const localServices = safeServices.filter(s => s?.canton === cantonClean && s?.status === 'active');
      const categoriesCount = safeServices.reduce((acc, s) => {
        if (s?.canton === cantonClean && s?.category) acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topCats = Object.entries(categoriesCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, c]) => `${n}:${c}`).join('|');
      return `APP:ConexiónServicios|LOC:${cantonClean},Ecuador|SvcActivos:${localServices.length}|TopCats:${topCats || 'Varios'}|Registro:WhatsApp +593 98 724 6441 (Admin Matriz).`;
    } catch { return "Experto Local Conexión Servicios."; }
  }, [services, canton]);

  const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userInput = input.trim();
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userInput, time: ts }]);
    setInput('');
    setIsLoading(true);
    if (inputRef.current) inputRef.current.style.height = 'auto';
    
    // Maintain focus so keyboard doesn't close on send
    setTimeout(() => inputRef.current?.focus(), 10);

    let retryCount = 0;
    const maxRetries = 2;
    const backoffTimes = [1000, 3000];

    while (retryCount <= maxRetries) {
      try {
        const recentMessages = messages.slice(-6);
        const groqMessages = [
          { role: 'system', content: `Eres "ServicesBot", experto en ${canton}, Ecuador. ${knowledgeContext}\nInstrucciones: Se breve, amable y profesional. Si preguntan por registro, dar el WhatsApp de admin. Si un servicio no está en el catálogo, sugiere buscar por categoría en el inicio.` },
          ...recentMessages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
          { role: 'user', content: userInput }
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
          body: JSON.stringify({ messages: groqMessages, model: 'llama-3.1-8b-instant', temperature: 0.7, max_tokens: 1024 })
        });

        const data = await response.json();
        if (response.status === 429) {
          if (retryCount < maxRetries) { await wait(backoffTimes[retryCount]); retryCount++; continue; }
          else { setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: '⏳ Muchas solicitudes. Intenta de nuevo en un momento.', time: ts }]); break; }
        }
        const botContent = data.choices?.[0]?.message?.content || 'No pude procesar esa consulta.';
        const botTs = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: botContent, time: botTs }]);
        break;
      } catch (error) {
        console.error(error);
        if (retryCount === maxRetries) setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: 'Error de conexión. 😔', time: ts }]);
        await wait(1000); retryCount++;
      }
    }
    setIsLoading(false);
  };

  const quickSuggestions = language === 'es'
    ? ['🔧 Mecánicos', '🏥 Doctores', '🍔 Restaurantes', '⚡ Electricistas']
    : ['🔧 Mechanics', '🏥 Doctors', '🍔 Restaurants', '⚡ Electricians'];

  const handleSuggestionClick = (s: string) => {
    setInput(s.replace(/^[\p{Emoji}\s]+/u, '').trim());
    inputRef.current?.focus();
  };

  const fmt = (text: string) => text.split(/(\*\*.*?\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i} className="font-[900]">{p.slice(2, -2)}</strong> : p
  );

  const showSuggestions = messages.length <= 1 && !isLoading;

  return (
    <div
      className="flex flex-col animate-slide-up"
      style={{
        position: 'absolute',    // THE MAGIC RULE 1
        top: 0,                  // THE MAGIC RULE 2
        bottom: 0,               // THE MAGIC RULE 3 - Webview will automatically raise this line!
        left: 0,
        right: 0,
        backgroundColor: isDarkMode ? '#0B1120' : '#F0F4F8',
      }}
    >
      {/* HEADER */}
      <div
        className="shrink-0 relative overflow-hidden z-10"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          paddingTop: isKeyboardOpen ? '6px' : 'max(env(safe-area-inset-top, 8px), 36px)',
          paddingBottom: isKeyboardOpen ? '6px' : '12px',
          transition: 'all 0.2s ease',
        }}
      >
        {!isKeyboardOpen && (
          <>
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/5 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
          </>
        )}

        <div className="relative z-10 flex items-center px-4 gap-3">
          <button
            onClick={onBack}
            className={`${isKeyboardOpen ? 'w-8 h-8 rounded-xl' : 'w-9 h-9 rounded-2xl'} flex items-center justify-center bg-white/15 border border-white/20 active:scale-90 transition-all`}
          >
            <ArrowLeft size={isKeyboardOpen ? 15 : 18} className="text-white" strokeWidth={2.5} />
          </button>

          <div className="relative">
            <div className={`${isKeyboardOpen ? 'w-8 h-8 rounded-xl' : 'w-9 h-9 rounded-2xl'} bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 transition-all`}>
              <Sparkles size={isKeyboardOpen ? 13 : 16} className="text-white" strokeWidth={2.5} />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 ${isKeyboardOpen ? 'w-2 h-2' : 'w-3 h-3'} bg-emerald-400 rounded-full border-2 border-[#16213e]`} />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className={`text-white ${isKeyboardOpen ? 'text-[12px]' : 'text-[14px]'} font-[800] tracking-tight leading-none transition-all`}>
              ServicesBot
            </h1>
            {!isKeyboardOpen && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/50 text-[9px] font-bold tracking-wide">
                  {t.ai_status_online?.replace('{canton}', canton) || `Online • ${canton}`}
                </span>
              </div>
            )}
          </div>

          {!isKeyboardOpen && (
            <div className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">
              <span className="text-[8px] font-[900] text-amber-300 uppercase tracking-[2px]">AI</span>
            </div>
          )}
        </div>
      </div>

      {/* MESSAGES */}
      <div
        ref={messagesScrollRef}
        className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar relative"
        style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}
      >
        <div className="px-3 py-3 space-y-2.5 pb-2">

          {!isKeyboardOpen && (
            <div className="flex justify-center py-1 mb-2">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full ${isDarkMode ? 'text-white/20 bg-white/5' : 'text-slate-400 bg-slate-200/60'}`}>
                {new Date().toLocaleDateString(language === 'es' ? 'es-EC' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
              {msg.role === 'model' && (
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 mb-0.5">
                  <Sparkles size={10} className="text-white" strokeWidth={3} />
                </div>
              )}

              <div className={`max-w-[80%] px-3 py-2
                ${msg.role === 'user'
                  ? `${isDarkMode ? 'bg-gradient-to-br from-[#4F46E5] to-[#6366F1]' : 'bg-gradient-to-br from-[#6366F1] to-[#818CF8]'} text-white rounded-[16px] rounded-br-[4px] shadow-md shadow-indigo-500/15`
                  : `${isDarkMode ? 'bg-[#1E293B] border border-white/5 text-white/90' : 'bg-white border border-slate-100 text-slate-800 shadow-sm'} rounded-[16px] rounded-bl-[4px]`
                }`}>
                <p className="text-[13px] leading-[1.5] font-medium whitespace-pre-wrap break-words">{fmt(msg.content)}</p>
                <div className={`flex justify-end mt-0.5 ${msg.role === 'user' ? 'text-white/35' : (isDarkMode ? 'text-white/15' : 'text-slate-300')}`}>
                  <span className="text-[8px] font-bold">{msg.time}</span>
                </div>
              </div>

              {msg.role === 'user' && (
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mb-0.5 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                  <User size={10} className={isDarkMode ? 'text-white/50' : 'text-slate-500'} strokeWidth={3} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-end gap-1.5 animate-fade-in">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 mb-0.5">
                <Sparkles size={10} className="text-white" strokeWidth={3} />
              </div>
              <div className={`px-4 py-3 rounded-[16px] rounded-bl-[4px] ${isDarkMode ? 'bg-[#1E293B] border border-white/5' : 'bg-white border border-slate-100 shadow-sm'}`}>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-amber-400' : 'bg-indigo-400'} animate-bounce`} style={{ animationDelay: '0ms' }} />
                  <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-amber-400' : 'bg-indigo-400'} animate-bounce`} style={{ animationDelay: '150ms' }} />
                  <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-amber-400' : 'bg-indigo-400'} animate-bounce`} style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {showSuggestions && (
            <div className="pt-1 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Zap size={10} className={isDarkMode ? 'text-amber-400' : 'text-indigo-500'} />
                <span className={`text-[8px] font-[800] uppercase tracking-[2px] ${isDarkMode ? 'text-white/25' : 'text-slate-400'}`}>
                  {language === 'es' ? 'Sugerencias' : 'Suggestions'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickSuggestions.map((s, i) => (
                  <button key={i} onClick={() => handleSuggestionClick(s)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold active:scale-95 transition-all border
                      ${isDarkMode ? 'bg-white/5 border-white/8 text-white/60' : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-0.5" />
        </div>
      </div>

      {/* INPUT BAR */}
      <div 
        className="shrink-0 w-full px-3 py-1.5 z-20"
        style={{
          background: isDarkMode ? '#0B1120' : '#F0F4F8',
          // ONLY add padding for standard iPhone notches, Android WebView adjustResize covers the rest
          paddingBottom: 'env(safe-area-inset-bottom, 4px)'
        }}
      >
        <div className={`flex items-end gap-2 rounded-[18px] border px-3 py-1.5 transition-colors
          ${isDarkMode ? 'bg-[#1E293B] border-white/10' : 'bg-white border-slate-200 shadow-sm'}
          ${isKeyboardOpen ? (isDarkMode ? 'border-amber-500/40' : 'border-indigo-400/50') : ''}`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => { 
              if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                handleSend(); 
              } 
            }}
            placeholder={t.ai_placeholder || 'Escribe tu consulta...'}
            rows={1}
            className={`flex-1 bg-transparent border-none outline-none resize-none
              ${isDarkMode ? 'text-white' : 'text-slate-900'}
              font-semibold placeholder:opacity-40 min-w-0
              text-[14px] leading-[1.4] py-1`}
            style={{ 
              maxHeight: '96px', 
              fontFamily: 'system-ui, sans-serif'
            }}
            autoComplete="off" autoCorrect="on" autoCapitalize="sentences" spellCheck={true}
          />
          <button
            onPointerDown={(e) => e.preventDefault()} // Prevents textarea from losing focus
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`w-8 h-8 shrink-0 rounded-[12px] flex items-center justify-center transition-all active:scale-90
              ${input.trim()
                ? (isDarkMode ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30' : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30')
                : (isDarkMode ? 'bg-white/5' : 'bg-slate-100')} disabled:opacity-30`}>
            {isLoading
              ? <Loader2 size={15} className="animate-spin text-white" />
              : <Send size={15} strokeWidth={2.5} className={`${input.trim() ? 'text-white' : (isDarkMode ? 'text-white/20' : 'text-slate-300')} ml-0.5`} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
