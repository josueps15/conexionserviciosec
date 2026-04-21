
import React, { useState, useRef } from 'react';
import { ADMIN_CREDENTIALS } from '../constants';
import { User, UserRole } from '../types';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

// Firebase
import { auth, db, googleProvider, facebookProvider } from '../firebase'; // Importamos los proveedores ya configurados
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
  OAuthProvider
} from 'firebase/auth';
import { Mail, Lock, User as UserIcon, ArrowLeft, ShieldCheck, ChevronRight, Loader2, Compass, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface Props {
  direction?: 'forward' | 'backward';
  mode: 'login' | 'register';
  onAuthSuccess: (user: User, isNewUser?: boolean) => void;
  onSwitch: () => void;
  onBack: () => void;
  onEnterAsGuest: () => void;
  onViewLegal?: (type: 'terms' | 'privacy') => void;
  isDarkMode: boolean;
  t: any;
}

const Auth: React.FC<Props> = ({ direction = 'forward', mode, onAuthSuccess, onSwitch, onBack, onEnterAsGuest, onViewLegal, isDarkMode, t }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Refs para asegurar lectura directa de los inputs en Android
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);

  // --- PERSISTENCE LOGIC ---
  // Load data on mount
  React.useEffect(() => {
    if (mode === 'register') {
      const saved = localStorage.getItem('register_form_data');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setName(data.name || '');
          setEmail(data.email || '');
          setPassword(data.password || '');
          setConfirmPassword(data.password || '');
          setAcceptedTerms(data.acceptedTerms || false);
        } catch (e) { console.warn("Error loading persisted data", e); }
      }
    }
  }, [mode]);

  // Save data on change
  React.useEffect(() => {
    if (mode === 'register') {
      localStorage.setItem('register_form_data', JSON.stringify({
        name, email, password, acceptedTerms
      }));
    }
  }, [name, email, password, acceptedTerms, mode]);

  const clearPersistence = () => {
    localStorage.removeItem('register_form_data');
  };

  const handleSwitchAction = () => {
    clearPersistence();
    onSwitch();
  };

  const handleBackAction = () => {
    clearPersistence();
    onBack();
  };



  const handleSocialLogin = async (providerType: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    setError('');

    try {
      let user;

      if (providerType === 'apple') {
        // --- NATIVE APPLE SIGN-IN (PLUGIN) ---
        await FirebaseAuthentication.signOut(); // Ensure clean state
        const result = await FirebaseAuthentication.signInWithApple();
        const provider = new OAuthProvider('apple.com');
        const credential = provider.credential({
          idToken: result.credential?.idToken || '',
          rawNonce: result.credential?.nonce || '',
        });
        const userCred = await signInWithCredential(auth, credential);
        user = userCred.user;
      } else if (providerType === 'google') {
        if (Capacitor.isNativePlatform()) {
          // --- NATIVE GOOGLE SIGN-IN (PLUGIN) ---
          const result = await FirebaseAuthentication.signInWithGoogle();
          const credential = GoogleAuthProvider.credential(result.credential?.idToken);
          const userCred = await signInWithCredential(auth, credential);
          user = userCred.user;
        } else {
          // --- WEB GOOGLE SIGN-IN (POPUP) ---
          const result = await signInWithPopup(auth, googleProvider);
          user = result.user;
        }
      } else {
        // Facebook fallback (Classic Popup for now, or extend same logic if Facebook plugin configured)
        const result = await signInWithPopup(auth, facebookProvider);
        user = result.user;
      }

      // Verificar datos en base de datos
      let userRole: UserRole = 'user';
      let fullData: any = {};
      let isNewUser = false;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          fullData = userDoc.data();
          if (fullData.role === 'admin') userRole = 'admin';
          // Actualizar último login
          await setDoc(userDocRef, { lastLogin: new Date().toISOString() }, { merge: true });
        } else {
          // Crear usuario nuevo si no existe en Firestore
          isNewUser = true;
          fullData = {
            name: user.displayName || 'Socio',
            email: user.email,
            role: 'user',
            avatar: user.photoURL, // Usamos avatar para consistencia
            provider: providerType,
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            acceptedTerms: true
          };
          await setDoc(userDocRef, fullData);
        }
      } catch (e) {
        console.warn("Error gestionando usuario en BD", e);
      }

      onAuthSuccess({
        id: user.uid,
        name: fullData.name || user.displayName || 'Socio',
        email: user.email || '',
        role: userRole,
        avatar: fullData.avatar || user.photoURL || undefined,
        dob: fullData.dob || undefined
      } as any, isNewUser);

      clearPersistence();

    } catch (err: any) {
      console.error("Social Login Error:", err);

      // DIAGNÓSTICO PROFESIONAL DE ERRORES
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setError(`DOMINIO NO AUTORIZADO: Agrega "${currentDomain}" en Firebase Console > Authentication > Settings.`);
      } else if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('canceled')) {
        // No mostramos error si el usuario cierra la ventana voluntariamente
        setLoading(false);
        return;
      } else if (err.code === 'auth/popup-blocked') {
        setError(t.auth_err_popup_blocked);
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError(t.auth_err_account_exists);
      } else if (err.message && (err.message.includes("configuration-not-found") || err.message.includes("App ID") || err.message.includes("12500"))) {
        setError(`Error de Configuración Native: Verifica que google-services.json esté en android/app y el SHA-1 en Firebase.`);
      } else {
        setError(`Error de acceso: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };


  const handleResetPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t.auth_err_no_email);
      return;
    }
    setLoading(true);
    setError(''); // Limpiar errores previos
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      alert(t.auth_success_reset);
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      if (err.code === 'auth/user-not-found') {
        setError(t.auth_err_user_not_found);
      } else if (err.code === 'auth/invalid-email') {
        setError(t.auth_err_invalid_email || 'Invalid email format.');
      } else {
        setError('NO PUDIMOS ENVIAR EL CORREO: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    onEnterAsGuest();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Lectura directa del DOM vía Refs para evitar lag de estado en Android
    const rawEmail = emailRef.current?.value || email;
    const rawPassword = passwordRef.current?.value || password;
    
    const cleanEmail = rawEmail.trim().toLowerCase();
    const cleanPassword = rawPassword.trim();

    setLoading(true);
    setError('');

    // Log statement removed for production

    // 1. VALIDACIÓN ACCESO ADMIN MAESTRO (HARDCODED)
    if (mode === 'login' && cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() && cleanPassword === ADMIN_CREDENTIALS.password) {
      try {
        // Intentamos loguear en Firebase para que Storage tenga permisos de Auth
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      } catch (e) {
        console.warn("Admin Matriz entrando vía bypass (Auth Firebase falló o no existe el usuario todavía)");
      }

      setTimeout(() => {
        onAuthSuccess({
          id: 'admin-master',
          name: 'Administrador Matriz',
          email: ADMIN_CREDENTIALS.email,
          role: 'admin'
        }, false);
        setLoading(false);
      }, 800);
      return;
    }

    // VALIDACIONES DE REGISTRO
    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        setLoading(false);
        return;
      }
      if (!acceptedTerms) {
        setError('Debes aceptar los Términos y Políticas de Privacidad para continuar.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError(t.auth_err_weak_pass);
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === 'login') {
        // 2. LOGIN FIREBASE
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);

        // 3. VERIFICAR ROL Y DATOS EN FIRESTORE
        let userRole: UserRole = 'user';
        let fullData: any = {};
        try {
          const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
          if (userDoc.exists()) {
            fullData = userDoc.data();
            if (fullData.role === 'admin') userRole = 'admin';
          }
        } catch (dbError) {
          console.warn("No se pudo leer el perfil de la BD", dbError);
        }

        onAuthSuccess({
          id: userCred.user.uid,
          name: fullData.name || userCred.user.displayName || 'Socio',
          email: userCred.user.email || '',
          role: userRole,
          avatar: fullData.avatar || userCred.user.photoURL || undefined,
          dob: fullData.dob || undefined
        } as any, false);

      } else {
        // 4. REGISTRO NUEVO USUARIO
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });

        // Guardar perfil en DB con rol 'user'
        try {
          await setDoc(doc(db, 'users', userCred.user.uid), {
            name,
            email,
            role: 'user',
            favorites: [],
            createdAt: new Date().toISOString(),
            acceptedTerms: true,
            termsVersion: '1.0',
            provider: 'email'
          });
        } catch (dbErr: any) {
          console.warn("Error guardando perfil en DB:", dbErr);
        }

        clearPersistence();
        onAuthSuccess({ id: userCred.user.uid, name, email, role: 'user', isGuest: false }, true);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError(t.auth_err_invalid);
      } else if (err.code === 'auth/wrong-password') {
        setError(t.auth_err_invalid);
      } else if (err.code === 'auth/email-already-in-use') {
        setError(t.auth_err_email_used);
      } else if (err.code === 'auth/weak-password') {
        setError(t.auth_err_weak_pass);
      } else if (err.code === 'auth/network-request-failed' || err.message?.includes('network')) {
        setError(t.auth_err_network + " [" + err.code + "]");
      } else if (err.code === 'auth/too-many-requests') {
        setError(t.admin_timeout + " [" + err.code + "]");
      } else {
        setError(t.auth_err_generic + " [" + err.code + " (" + (err.message || 'No msg') + ")]");
      }
    } finally {
      setLoading(false);
    }
  };

  const animClass = direction === 'forward' ? 'animate-page-in' : 'animate-page-back';
  const primaryColor = isDarkMode ? '#59CBC8' : '#00D1FF';
  const primaryTextClass = isDarkMode ? 'text-[#59CBC8]' : 'text-[#00D1FF]';
  const primaryBgClass = isDarkMode ? 'bg-[#59CBC8]' : 'bg-[#00D1FF]';
  const primaryBorderClass = isDarkMode ? 'border-[#59CBC8]' : 'border-[#00D1FF]';
  const primaryShadowClass = isDarkMode ? 'shadow-[0_15px_30px_rgba(89,203,200,0.3)]' : 'shadow-[0_15px_30px_rgba(0,209,255,0.3)]';

  return (
    <div 
      className={`fixed inset-0 overflow-x-hidden overflow-y-auto ${isDarkMode ? 'bg-[#060b15]' : 'bg-slate-50'} flex flex-col p-6 pb-4 ios-safe-pt ios-safe-pb`}
      style={{
        isolation: 'isolate'
      }}
    >
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md aspect-square ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_rgba(89,203,200,0.1)_0%,_transparent_60%)]' : 'bg-[radial-gradient(circle_at_center,_rgba(0,209,255,0.1)_0%,_transparent_60%)]'} opacity-40 pointer-events-none select-none`}></div>

      <div className={`flex items-center justify-between mb-4 relative z-20 ${!animationFinished ? 'animate-slide-up' : ''}`}>
        <button
          onClick={handleBackAction}
          className={`w-12 h-12 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-2xl'} ${primaryTextClass} rounded-[18px] border active:scale-90 transition-all flex items-center justify-center`}
        >
          <ArrowLeft size={22} strokeWidth={3} className={isDarkMode ? '' : 'text-slate-900'} />
        </button>
        <div className={`flex items-center gap-3 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-lg'} px-5 py-2.5 rounded-full border backdrop-blur-xl`}>
          <ShieldCheck size={14} className={primaryTextClass} />
          <span className={`text-[10px] font-black uppercase tracking-[4px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.auth_safe}</span>
        </div>
      </div>

      <div className={`mb-4 relative z-20 text-center ${!animationFinished ? 'animate-slide-up stagger-1' : ''}`}>
        <h2 className={`text-[42px] xs:text-[48px] font-[1000] tracking-tighter leading-[0.9] uppercase mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'} whitespace-pre-line transition-all duration-300`}>
          {mode === 'login' ? (
            <>
              {t.auth_title_login.split('\n')[0]}<br />
              <span className={primaryTextClass}>{t.auth_title_login.split('\n')[1]}</span>
            </>
          ) : (
            <>
              {t.auth_title_register.split('\n')[0]}<br />
              <span className={primaryTextClass}>{t.auth_title_register.split('\n')[1]}</span>
            </>
          )}
        </h2>
        <div className={`h-1.5 w-14 ${primaryBgClass} rounded-full mt-3 mx-auto select-none`}></div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-pop-in flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <p className="text-red-500 text-[10px] font-black uppercase tracking-wider leading-relaxed select-text cursor-text">
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`block space-y-3 mb-2 relative z-20 w-full flex-1 flex flex-col justify-center ${!animationFinished ? 'animate-slide-up stagger-2' : ''}`}>
        {mode === 'register' && (
          <div className={`w-full h-14 relative rounded-[26px] border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} focus-within:${primaryBorderClass} focus-within:ring-2 focus-within:ring-${primaryColor}/10`}>
            {/* ICONO IZQUIERDA */}
            <div className="absolute left-0 top-0 w-14 h-full flex items-center justify-center pointer-events-none z-10 opacity-60">
              <UserIcon size={18} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
            </div>
            {/* INPUT CALIBRADO */}
            <input
              type="text" 
              placeholder={t.auth_name}
              className={`w-full h-full bg-transparent outline-none font-bold text-xs ${isDarkMode ? 'text-white' : 'text-slate-900'} placeholder-slate-500 pl-14 pr-6`}
              value={name} 
              onChange={(e) => setName(e.target.value.slice(0, 50))} 
              onSelect={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.selectionStart === 0 && target.selectionEnd === target.value.length) {
                  setTimeout(() => { target.scrollLeft = target.scrollWidth; }, 100);
                }
              }}
              required
              autoComplete="name"
              autoCorrect="off"
              spellCheck={false}
              autoCapitalize="words"
              inputMode="text"
            />
          </div>
        )}

        <div className={`w-full h-14 relative rounded-[26px] border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} focus-within:${primaryBorderClass} focus-within:ring-2 focus-within:ring-${primaryColor}/10`}>
          {/* ICONO IZQUIERDA */}
          <div className="absolute left-0 top-0 w-14 h-full flex items-center justify-center pointer-events-none z-10 opacity-60">
            <Mail size={18} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
          </div>
          
          <input
            ref={emailRef}
            type="text" 
            placeholder={t.auth_email}
            className={`w-full h-full bg-transparent outline-none font-bold text-xs ${isDarkMode ? 'text-white' : 'text-slate-900'} placeholder-slate-500 pl-14 pr-4`}
            value={email} 
            onChange={(e) => setEmail(e.target.value.slice(0, 100))}
            onSelect={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.selectionStart === 0 && target.selectionEnd === target.value.length) {
                setTimeout(() => { target.scrollLeft = target.scrollWidth; }, 100);
              }
            }}
            required
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
          />
        </div>

        <div className={`w-full h-14 relative rounded-[26px] border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} focus-within:${primaryBorderClass} focus-within:ring-2 focus-within:ring-${primaryColor}/10`}>
          {/* ICONO IZQUIERDA */}
          <div className="absolute left-0 top-0 w-14 h-full flex items-center justify-center pointer-events-none z-10 opacity-60">
            <Lock size={18} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
          </div>
          
          <input
            ref={passwordRef}
            type={showPassword ? "text" : "password"} 
            placeholder={t.auth_pass}
            className={`w-full h-full bg-transparent outline-none font-bold text-xs ${isDarkMode ? 'text-white' : 'text-slate-900'} placeholder-slate-500 pl-14 pr-14`}
            value={password} 
            onChange={(e) => setPassword(e.target.value.slice(0, 64))} 
            onSelect={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.selectionStart === 0 && target.selectionEnd === target.value.length) {
                setTimeout(() => { target.scrollLeft = target.scrollWidth; }, 100);
              }
            }}
            required
            autoComplete={mode === 'register' ? "new-password" : "current-password"}
          />
          
          {/* ACCIÓN DERECHA (EL OJITO SE QUEDA AQUÍ) */}
          <div className="absolute right-0 top-0 w-14 h-full flex items-center justify-center z-20">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isDarkMode ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {mode === 'login' && (
          <div className="flex justify-center mt-2 mb-2">
            <button
              type="button"
              onClick={handleResetPassword}
              className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'} transition-colors`}
            >
              {t.auth_forgot}
            </button>
          </div>
        )}

        {mode === 'register' && (
          <>
            <div className={`w-full h-14 relative rounded-[26px] border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} focus-within:${primaryBorderClass} focus-within:ring-2 focus-within:ring-${primaryColor}/10 ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : ''}`}>
              {/* ICONO IZQUIERDA */}
              <div className="absolute left-0 top-0 w-14 h-full flex items-center justify-center pointer-events-none z-10 opacity-60">
                <Lock className={isDarkMode ? 'text-white/60' : 'text-slate-400'} size={18} />
              </div>
              
              <input
                type="password" 
                placeholder={t.auth_confirm_pass}
                className={`w-full h-full bg-transparent outline-none font-bold text-xs ${isDarkMode ? 'text-white' : 'text-slate-900'} placeholder-slate-500 pl-14 pr-6`}
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value.slice(0, 64))}
                onSelect={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.selectionStart === 0 && target.selectionEnd === target.value.length) {
                    setTimeout(() => { target.scrollLeft = target.scrollWidth; }, 100);
                  }
                }}
                required
              />
            </div>

            {/* CHECKBOX LEGAL */}
            <div className="pt-2 px-2 pb-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative pt-0.5">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${acceptedTerms ? `${primaryBgClass} ${primaryBorderClass}` : isDarkMode ? 'border-white/20 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                    {acceptedTerms && <Check size={12} className={isDarkMode ? 'text-slate-900' : 'text-white'} strokeWidth={4} />}
                  </div>
                </div>
                <div className={`flex-1 text-[9px] leading-tight ${isDarkMode ? 'text-white/60' : 'text-slate-500'} font-medium select-none`}>
                  {t.auth_legal_1} <span onClick={(e) => { e.preventDefault(); onViewLegal?.('terms'); }} className={`${primaryTextClass} font-bold uppercase hover:underline cursor-pointer`}>{t.auth_legal_2}</span> {t.auth_legal_3} <span onClick={(e) => { e.preventDefault(); onViewLegal?.('privacy'); }} className={`${primaryTextClass} font-bold uppercase hover:underline cursor-pointer`}>{t.auth_legal_4}</span>{t.auth_legal_5}
                </div>
              </label>
            </div>
          </>
        )}

        {/* BOTÓN DE ACCIÓN PRINCIPAL */}
        <button
          type="submit" disabled={loading}
          className={`w-full h-14 ${primaryBgClass} text-slate-900 font-black rounded-full ${primaryShadowClass} transition-all active:scale-[0.96] text-[14px] tracking-[3px] uppercase flex items-center justify-center gap-4 mt-4`}
        >
          {loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? t.auth_btn_login : t.auth_btn_register)}
          {!loading && <ChevronRight size={20} strokeWidth={4} />}
        </button>

        {/* BOTÓN EXPLORAR - Color NARANJA (#FFB800) */}
        {mode === 'login' && (
          <div className="mt-2">
            <button
              type="button"
              onClick={handleGuestLogin}
              className={`
                w-full h-14 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} border rounded-full px-4
                flex items-center active:scale-[0.98] transition-all group overflow-hidden
                shadow-lg backdrop-blur-sm relative
              `}
            >
              <div className="w-10 h-10 bg-[#FFB800]/20 rounded-full flex items-center justify-center text-[#FFB800] shrink-0 border border-[#FFB800]/30">
                <Compass size={20} strokeWidth={3} />
              </div>

              <div className="flex-1 text-center pr-10">
                <span className={`block text-[12px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-[2px] leading-none`}>
                  {t.auth_explore_1}
                </span>
                <span className="block text-[9px] text-[#FFB800] font-black uppercase tracking-widest leading-none mt-1 opacity-90">
                  {t.auth_explore_2}
                </span>
              </div>

              <div className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/30' : 'text-slate-300'} group-hover:text-[#FFB800] transition-colors`}>
                <ChevronRight size={18} strokeWidth={4} />
              </div>
            </button>
          </div>
        )}

        {/* SOCIAL LOGIN SECTION PROFESIONAL */}
        <div className="pt-2 pb-0 flex flex-col gap-3">
          <div className="flex items-center gap-3 mb-1">
            <div className={`h-[1px] flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
            <span className={`text-[8px] font-black ${isDarkMode ? 'text-white/40' : 'text-slate-400'} uppercase tracking-[4px]`}>{t.auth_social_text}</span>
            <div className={`h-[1px] flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
          </div>

          <div className="w-full flex gap-3 mt-1">
            {/* BOTÓN GOOGLE PROFESIONAL */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialLogin('google')}
              className="flex-1 h-12 bg-white rounded-[20px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg hover:bg-gray-50 disabled:opacity-50 border border-slate-200"
            >
              {loading ? <Loader2 size={18} className="animate-spin text-slate-900" /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.52 12.29C23.52 11.44 23.44 10.62 23.29 9.82H12V14.45H18.46C18.18 15.93 17.33 17.18 16.07 18.02V20.98H19.94C22.2 18.9 23.52 15.83 23.52 12.29Z" fill="#4285F4" />
                  <path d="M12 24C15.24 24 17.96 22.92 19.94 20.98L16.07 18.02C15 18.74 13.62 19.16 12 19.16C8.87 19.16 6.22 17.05 5.27 14.19H1.27V17.29C3.26 21.24 7.34 24 12 24Z" fill="#34A853" />
                  <path d="M5.27 14.19C5.03 13.48 4.89 12.75 4.89 12C4.89 11.25 5.03 10.52 5.27 9.81V6.71H1.27C0.46 8.33 0 10.11 0 12C0 13.89 0.46 15.67 1.27 17.29L5.27 14.19Z" fill="#FBBC05" />
                  <path d="M12 4.84C13.76 4.84 15.34 5.45 16.58 6.64L20.03 3.19C17.96 1.25 15.24 0 12 0C7.34 0 3.26 2.76 1.27 6.71L5.27 9.81C6.22 6.95 8.87 4.84 12 4.84Z" fill="#EA4335" />
                </svg>
              )}
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{t.auth_google || 'Google'}</span>
            </button>

            {/* BOTÓN APPLE PROFESIONAL */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialLogin('apple')}
              className={`flex-1 h-12 rounded-[20px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg disabled:opacity-50 border ${isDarkMode ? 'bg-white text-black border-transparent' : 'bg-black text-white border-transparent'}`}
            >
              {loading ? <Loader2 size={18} className={`animate-spin ${isDarkMode ? 'text-black' : 'text-white'}`} /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.12 3.805 3.052 1.527-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.675-2.935 1.156-1.688 1.636-3.325 1.662-3.415-.026-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.091-3.623-2.324-4.39-2.376-2.04-.156-4.004 1.078-4.622 1.078zM15.549 4.39C16.388 3.376 16.953 1.96 16.8 0 15.111.066 13.566.988 12.656 2.066c-.852.981-1.527 2.42-1.332 3.844 1.864.143 3.33-1.014 4.225-1.52z"/>
                </svg>
              )}
              <span className="text-[11px] font-black uppercase tracking-wider">Apple</span>
            </button>
          </div>
        </div>
      </form>

      <div className="mt-1 text-center pb-2 relative z-20">
        <button onClick={handleSwitchAction} className="group">
          <p className={`text-[9px] font-black uppercase tracking-[4px] mb-2 group-hover:${primaryTextClass} transition-colors ${isDarkMode ? 'text-white/60' : 'text-slate-400'}`}>
            {mode === 'login' ? t.auth_switch_new : t.auth_switch_existing}
          </p>
          <span className={`${primaryTextClass} font-black text-xs uppercase tracking-[4px] border-b-2 ${primaryBorderClass}/40 pb-1 group-hover:${primaryBorderClass} transition-all`}>
            {mode === 'login' ? t.auth_switch_btn_register : t.auth_switch_btn_login}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Auth;
