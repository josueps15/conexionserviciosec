import React, { useState, useEffect, useRef } from 'react';
import {
    Bell, MapPin, Save, ChevronRight, ArrowLeft,
    Plus, Send, Upload, Trash2, Layers, Settings, Loader2,
    Edit2, Clock, Globe, CheckCircle, XCircle,
    Image, Eye, ToggleLeft, ToggleRight, AlertCircle, RefreshCw,
    Star, Zap, Heart, Tag, Megaphone, Info, Shield,
    Gift, Truck, MessageCircle, Mountain, Sun
} from 'lucide-react';

const PRESET_ICONS: { name: string; label: string; Icon: any }[] = [
    { name: 'Bell', label: 'Campana', Icon: Bell },
    { name: 'Star', label: 'Estrella', Icon: Star },
    { name: 'Zap', label: 'Rayo', Icon: Zap },
    { name: 'Heart', label: 'Corazón', Icon: Heart },
    { name: 'Tag', label: 'Etiqueta', Icon: Tag },
    { name: 'Megaphone', label: 'Anuncio', Icon: Megaphone },
    { name: 'Info', label: 'Info', Icon: Info },
    { name: 'Shield', label: 'Escudo', Icon: Shield },
    { name: 'Gift', label: 'Regalo', Icon: Gift },
    { name: 'Truck', label: 'Envío', Icon: Truck },
    { name: 'MessageCircle', label: 'Mensaje', Icon: MessageCircle },
    { name: 'Settings', label: 'Config', Icon: Settings },
];
import { db, storage } from '../firebase';
import {
    collection, query, setDoc, doc, deleteDoc, updateDoc,
    onSnapshot, orderBy, getDoc, getDocs
} from 'firebase/firestore';
import {
    ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll
} from 'firebase/storage';

interface AdminAdvancedProps {
    onBack?: () => void;
    t?: any;
    categories?: any[];
    isDarkMode?: boolean;
}

// ─── ImgBB API Key predefinida ────────────────────────────────
const IMGBB_DEFAULT_KEY = '0df9ed35df3f0a0417e5f49ee5f7f2a1';

const AdminAdvanced: React.FC<AdminAdvancedProps> = ({ onBack, t, categories, isDarkMode }) => {

    // ── Tabs ──────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('notifications');

    // ── Toast ─────────────────────────────────────────────────────
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 3500);
    };

    // ═══════════════════════════════════════════════════════════════
    // TAB: NOTIFICACIONES
    // ═══════════════════════════════════════════════════════════════
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isEditingNotif, setIsEditingNotif] = useState(false);
    const [showNotifForm, setShowNotifForm] = useState(false);
    const [notifForm, setNotifForm] = useState({
        id: '', title: '', detail: '', target: 'all',
        targetProvince: '', targetCanton: '', active: true,
        scheduled: false, scheduledDate: '', scheduledTime: '',
        iconName: 'Bell', iconColor: '#59CBC8', iconBgColor: '#1E293B'
    });
    const [savingNotif, setSavingNotif] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'notifications'), orderBy('createdAt', 'desc')),
            (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        return unsub;
    }, []);

    const resetNotifForm = () => {
        setNotifForm({ id: '', title: '', detail: '', target: 'all', targetProvince: '', targetCanton: '', active: true, scheduled: false, scheduledDate: '', scheduledTime: '', iconName: 'Bell', iconColor: '#59CBC8', iconBgColor: '#1E293B' });
        setIsEditingNotif(false);
        setShowNotifForm(false);
    };

    const handleSaveNotif = async () => {
        if (!notifForm.title.trim() || !notifForm.detail.trim()) return showToast('Completa título y detalle', 'error');
        setSavingNotif(true);
        try {
            const data = {
                title: notifForm.title,
                detail: notifForm.detail,
                target: notifForm.target,
                targetProvince: notifForm.targetProvince,
                targetCanton: notifForm.targetCanton,
                active: notifForm.active,
                scheduled: notifForm.scheduled,
                scheduledDate: notifForm.scheduledDate,
                scheduledTime: notifForm.scheduledTime,
                createdAt: new Date().toISOString(),
            };
            if (isEditingNotif && notifForm.id) {
                await updateDoc(doc(db, 'notifications', notifForm.id), data);
                showToast('Notificación actualizada ✓', 'success');
            } else {
                const newRef = doc(collection(db, 'notifications'));
                await setDoc(newRef, { ...data, id: newRef.id });
                showToast('Notificación enviada ✓', 'success');
            }
            resetNotifForm();
        } catch { showToast('Error al guardar', 'error'); }
        setSavingNotif(false);
    };

    const handleEditNotif = (n: any) => {
        setNotifForm({
            id: n.id, title: n.title, detail: n.detail, target: n.target || 'all',
            targetProvince: n.targetProvince || '', targetCanton: n.targetCanton || '',
            active: n.active ?? true, scheduled: n.scheduled || false,
            scheduledDate: n.scheduledDate || '', scheduledTime: n.scheduledTime || '',
            iconName: n.iconName || 'Bell', iconColor: n.iconColor || '#59CBC8', iconBgColor: n.iconBgColor || '#1E293B'
        });
        setIsEditingNotif(true);
        setShowNotifForm(true);
    };

    const handleDeleteNotif = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'notifications', id));
            showToast('Eliminada', 'success');
        } catch { showToast('Error al eliminar', 'error'); }
    };

    const handleToggleNotif = async (n: any) => {
        await updateDoc(doc(db, 'notifications', n.id), { active: !n.active });
    };

    // ═══════════════════════════════════════════════════════════════
    // TAB: REGIONES
    // ═══════════════════════════════════════════════════════════════
    const [selectedRegionId, setSelectedRegionId] = useState('Sierra');
    const [currentTheme, setCurrentTheme] = useState<any>({
        // Header
        headerBgColor: '#1565C0', headerTextColor: '#FFFFFF', accentColor: '#FFFFFF', arrowColor: '#FFFFFF',
        // Nav buttons
        navButtonBgColor: 'rgba(255,255,255,0.1)', navButtonIconColor: '#FFFFFF',
        // Tarjetas provincia/ciudad
        cardGradientStart: '#F9A825', cardGradientEnd: '#E65100',
        cardTextColor: '#FFFFFF', cardIconColor: '#1565C0', cardIconBgColor: '#FFFFFF',
        // Fondo app
        themeBg: '#E3F2FD',
        // Admin extras
        cardBg: '#1E293B', buttonColor: '#59CBC8', textSecondary: '#94A3B8', borderColor: '#1E293B'
    });
    const [regionCoverUrl, setRegionCoverUrl] = useState('');
    const [isSavingRegion, setIsSavingRegion] = useState(false);
    const [uploadingRegionCover, setUploadingRegionCover] = useState(false);
    const [regionUploadProgress, setRegionUploadProgress] = useState(0);
    const regionCoverInputRef = useRef<HTMLInputElement>(null);

    const REGIONS = ['Sierra', 'Costa', 'Oriente', 'Insular'];

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'themes', selectedRegionId), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setCurrentTheme(data);
                setRegionCoverUrl(data.coverImageUrl || '');
            }
        });
        return unsub;
    }, [selectedRegionId]);

    const handleSaveRegion = async () => {
        setIsSavingRegion(true);
        try {
            await setDoc(doc(db, 'themes', selectedRegionId), {
                ...currentTheme, coverImageUrl: regionCoverUrl, updatedAt: new Date().toISOString()
            });
            showToast('Tema guardado ✓', 'success');
        } catch { showToast('Error al guardar', 'error'); }
        setIsSavingRegion(false);
    };

    const handleRegionCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingRegionCover(true);
        const storageRef = ref(storage, `themes/${selectedRegionId}/cover`);
        const task = uploadBytesResumable(storageRef, file);
        task.on('state_changed',
            (snap) => setRegionUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
            () => { showToast('Error al subir imagen', 'error'); setUploadingRegionCover(false); },
            async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                setRegionCoverUrl(url);
                setUploadingRegionCover(false);
                showToast('Imagen subida ✓', 'success');
            }
        );
    };

    const ColorInput = ({ label, field }: { label: string; field: string }) => (
        <div className="space-y-1">
            <p className={`text-[9px] font-black uppercase ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>{label}</p>
            <div className="flex gap-2 items-center">
                <input
                    type="text"
                    value={currentTheme[field] || '#FFFFFF'}
                    onChange={(e) => setCurrentTheme({ ...currentTheme, [field]: e.target.value })}
                    className={`flex-1 bg-white/5 border ${isDarkMode ? 'border-white/10' : 'border-slate-200'} rounded-lg px-2 py-2 text-[10px] font-mono`}
                />
                <input
                    type="color"
                    value={currentTheme[field] || '#FFFFFF'}
                    onChange={(e) => setCurrentTheme({ ...currentTheme, [field]: e.target.value })}
                    className="w-9 h-9 rounded-xl bg-transparent border-2 border-white/10 cursor-pointer p-0.5"
                />
            </div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════
    // TAB: CATEGORÍAS
    // ═══════════════════════════════════════════════════════════════
    const [cats, setCats] = useState<any[]>([]);
    const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
    const [catUploadingField, setCatUploadingField] = useState<string | null>(null);
    const [catUploadProgress, setCatUploadProgress] = useState(0);
    const [showCatForm, setShowCatForm] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', icon: 'Layers', id: '' });
    const [editingCat, setEditingCat] = useState(false);
    const [newSubcategory, setNewSubcategory] = useState('');
    const [editingSubIdx, setEditingSubIdx] = useState<number | null>(null);
    const [editingSubValue, setEditingSubValue] = useState('');
    const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'ok' | 'error'>('checking');

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
            setCats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setFirebaseStatus('ok');
        }, () => setFirebaseStatus('error'));
        return unsub;
    }, []);

    const selectedCat = cats.find(c => c.id === selectedCatId);

    const handleCatCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedCatId) return;
        setCatUploadingField('cover');
        const storageRef = ref(storage, `categories/${selectedCatId}/cover`);
        const task = uploadBytesResumable(storageRef, file);
        task.on('state_changed',
            (snap) => setCatUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
            () => { showToast('Error al subir', 'error'); setCatUploadingField(null); },
            async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                await updateDoc(doc(db, 'categories', selectedCatId), { imageUrl: url });
                setCatUploadingField(null);
                showToast('Portada actualizada ✓', 'success');
            }
        );
    };

    const handleSubBgUpload = async (e: React.ChangeEvent<HTMLInputElement>, sub: string) => {
        const file = e.target.files?.[0];
        if (!file || !selectedCatId) return;
        setCatUploadingField(sub);
        const storageRef = ref(storage, `categories/${selectedCatId}/sub_${sub.replace(/\s/g, '_')}`);
        const task = uploadBytesResumable(storageRef, file);
        task.on('state_changed',
            (snap) => setCatUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
            () => { showToast('Error', 'error'); setCatUploadingField(null); },
            async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                const current = selectedCat?.subcategoryConfig || {};
                await updateDoc(doc(db, 'categories', selectedCatId), {
                    subcategoryConfig: { ...current, [sub]: { bgImage: url, bgOpacity: 0.6, bgPosition: 'center' } }
                });
                setCatUploadingField(null);
                showToast('Fondo de especialidad listo ✓', 'success');
            }
        );
    };

    const handleCreateCat = async () => {
        if (!catForm.name.trim()) return showToast('Ingresa un nombre', 'error');
        const id = catForm.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        try {
            await setDoc(doc(db, 'categories', id), { id, name: catForm.name, icon: catForm.icon, subcategories: [], createdAt: new Date().toISOString() });
            showToast('Categoría creada ✓', 'success');
            setShowCatForm(false);
            setCatForm({ name: '', icon: 'Layers', id: '' });
        } catch { showToast('Error al crear', 'error'); }
    };

    const handleUpdateCatName = async () => {
        if (!selectedCatId || !catForm.name.trim()) return;
        await updateDoc(doc(db, 'categories', selectedCatId), { name: catForm.name, icon: catForm.icon });
        setEditingCat(false);
        showToast('Categoría actualizada ✓', 'success');
    };

    const handleDeleteCat = async (catId: string) => {
        if (!window.confirm('¿Eliminar esta categoría?')) return;
        try {
            // Eliminar imágenes del storage
            try {
                const listRef = ref(storage, `categories/${catId}`);
                const list = await listAll(listRef);
                await Promise.all(list.items.map(item => deleteObject(item)));
            } catch { /* sin imágenes, ok */ }
            await deleteDoc(doc(db, 'categories', catId));
            if (selectedCatId === catId) setSelectedCatId(null);
            showToast('Categoría eliminada ✓', 'success');
        } catch { showToast('Error al eliminar', 'error'); }
    };

    const handleAddSubcategory = async () => {
        if (!newSubcategory.trim() || !selectedCatId) return;
        const subs = [...(selectedCat?.subcategories || []), newSubcategory.trim()];
        await updateDoc(doc(db, 'categories', selectedCatId), { subcategories: subs });
        setNewSubcategory('');
        showToast('Especialidad añadida ✓', 'success');
    };

    const handleDeleteSubcategory = async (sub: string) => {
        if (!selectedCatId) return;
        const subs = (selectedCat?.subcategories || []).filter((s: string) => s !== sub);
        await updateDoc(doc(db, 'categories', selectedCatId), { subcategories: subs });
        showToast('Especialidad eliminada', 'success');
    };

    const handleEditSubcategory = async (oldSub: string, idx: number) => {
        if (!selectedCatId || !editingSubValue.trim()) return;
        const subs = [...(selectedCat?.subcategories || [])];
        subs[idx] = editingSubValue.trim();
        await updateDoc(doc(db, 'categories', selectedCatId), { subcategories: subs });
        setEditingSubIdx(null);
        setEditingSubValue('');
        showToast('Especialidad actualizada ✓', 'success');
    };

    // ═══════════════════════════════════════════════════════════════
    // TAB: AJUSTES
    // ═══════════════════════════════════════════════════════════════
    const [imgbbApiKey, setImgbbApiKey] = useState(IMGBB_DEFAULT_KEY);
    const [showKey, setShowKey] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [storageStats, setStorageStats] = useState<{ cats: number; themes: number } | null>(null);

    useEffect(() => {
        // Cargar API key guardada
        getDoc(doc(db, 'config', 'general')).then(snap => {
            if (snap.exists() && snap.data().imgbbApiKey) {
                setImgbbApiKey(snap.data().imgbbApiKey);
            }
        });
    }, []);

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await setDoc(doc(db, 'config', 'general'), { imgbbApiKey, updatedAt: new Date().toISOString() }, { merge: true });
            showToast('Ajustes guardados ✓', 'success');
        } catch { showToast('Error al guardar', 'error'); }
        setSavingSettings(false);
    };

    const handleVerifyFirebase = async () => {
        setFirebaseStatus('checking');
        try {
            await getDocs(collection(db, 'categories'));
            await getDocs(collection(db, 'notifications'));
            setFirebaseStatus('ok');
            showToast('Firebase conectado ✓', 'success');
        } catch {
            setFirebaseStatus('error');
            showToast('Error de conexión', 'error');
        }
    };

    // ── Tema visual ───────────────────────────────────────────────
    const dark = isDarkMode;
    const cardCls = `border ${dark ? 'bg-slate-900/60 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-sm'}`;
    const inputCls = `w-full border ${dark ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} rounded-xl px-4 py-3 text-xs`;

    // Color picker compacto
    const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
        <div className={`rounded-xl p-2.5 border ${dark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-[7px] font-black uppercase tracking-widest mb-2 ${dark ? 'text-white/40' : 'text-slate-400'}`}>{label}</p>
            <div className="flex items-center gap-2">
                <label className="relative cursor-pointer flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg border border-white/20 shadow-sm" style={{ background: value || '#000' }} />
                    <input type="color" value={value.match(/^#[0-9a-fA-F]{3,6}$/) ? value : '#000000'} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </label>
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={`flex-1 min-w-0 h-8 rounded-lg px-2 font-mono border ${dark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'} outline-none`}
                    style={{ fontSize: '9px', fontWeight: 700 }}
                    placeholder="#000000"
                />
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col h-screen ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} font-inter overflow-hidden`}>

            {/* ── HEADER ── */}
            <div className={`px-5 pt-10 pb-4 flex items-center gap-4 ${dark ? 'bg-slate-950/80' : 'bg-white shadow-sm'} backdrop-blur-md`}>
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-[1000] uppercase tracking-tighter">Admin <span style={{ color: '#59CBC8' }}>ADVANCED</span></h1>
                    <p className="text-[8px] font-bold opacity-30 tracking-[3px] uppercase">Ecuador Servicios • 2025</p>
                </div>
                {/* Firebase status badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase ${firebaseStatus === 'ok' ? 'bg-green-500/10 text-green-400' : firebaseStatus === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {firebaseStatus === 'ok' ? <CheckCircle size={10} /> : firebaseStatus === 'error' ? <XCircle size={10} /> : <Loader2 size={10} className="animate-spin" />}
                    {firebaseStatus === 'ok' ? 'Conectado' : firebaseStatus === 'error' ? 'Error' : '...'}
                </div>
            </div>

            {/* ── TABS ── */}
            <div className={`px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar border-b ${dark ? 'border-white/5' : 'border-slate-200'}`}>
                {[
                    { id: 'notifications', label: 'Notifs', icon: Bell, color: '#59CBC8' },
                    { id: 'regions', label: 'Regiones', icon: MapPin, color: '#59CBC8' },
                    { id: 'categories', label: 'Categ.', icon: Layers, color: '#FFB800' },
                    { id: 'settings', label: 'Ajustes', icon: Settings, color: dark ? '#FFF' : '#334155' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white/10 scale-105' : 'opacity-40 hover:opacity-60'}`}
                    >
                        <tab.icon size={13} style={{ color: activeTab === tab.id ? tab.color : undefined }} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── CONTENT ── */}
            <div className="flex-1 overflow-y-auto px-5 py-5 pb-24 space-y-5 hide-scrollbar">

                {/* ═══ NOTIFICACIONES ═══ */}
                {activeTab === 'notifications' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Formulario Nueva/Editar */}
                        {showNotifForm ? (
                            <div className={`p-5 rounded-[24px] ${cardCls} space-y-4`}>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase flex items-center gap-2">
                                        <Send size={13} style={{ color: '#59CBC8' }} />
                                        {isEditingNotif ? 'Editar Notificación' : 'Nueva Notificación'}
                                    </h3>
                                    <button onClick={resetNotifForm} className="p-1.5 hover:bg-white/10 rounded-full">
                                        <XCircle size={16} className="opacity-40" />
                                    </button>
                                </div>
                                <input
                                    placeholder="TÍTULO *"
                                    value={notifForm.title}
                                    onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                                    className={inputCls + ' font-bold'}
                                />
                                <textarea
                                    placeholder="DETALLE *"
                                    value={notifForm.detail}
                                    onChange={e => setNotifForm({ ...notifForm, detail: e.target.value })}
                                    className={inputCls + ' min-h-[80px] resize-none font-medium'}
                                />
                                {/* Target */}
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase opacity-40">Destinatarios</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { val: 'all', label: 'Todos', icon: Globe },
                                            { val: 'province', label: 'Provincia', icon: MapPin },
                                            { val: 'canton', label: 'Cantón', icon: MapPin },
                                        ].map(opt => (
                                            <button
                                                key={opt.val}
                                                onClick={() => setNotifForm({ ...notifForm, target: opt.val })}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-bold uppercase transition-all ${notifForm.target === opt.val ? 'bg-[#59CBC8] text-slate-900' : 'bg-white/5 border border-white/10'}`}
                                            >
                                                <opt.icon size={10} />{opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {notifForm.target === 'province' && (
                                        <input placeholder="Nombre de provincia" value={notifForm.targetProvince} onChange={e => setNotifForm({ ...notifForm, targetProvince: e.target.value })} className={inputCls} />
                                    )}
                                    {notifForm.target === 'canton' && (
                                        <input placeholder="Nombre de cantón" value={notifForm.targetCanton} onChange={e => setNotifForm({ ...notifForm, targetCanton: e.target.value })} className={inputCls} />
                                    )}
                                </div>
                                {/* Icono de notificación */}
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase opacity-40">Icono</p>
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_ICONS.map(({ name, label, Icon }) => (
                                            <button
                                                key={name}
                                                onClick={() => setNotifForm({ ...notifForm, iconName: name })}
                                                title={label}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                                                    notifForm.iconName === name
                                                        ? 'border-[#59CBC8] scale-110'
                                                        : 'border-white/10 opacity-50 hover:opacity-100'
                                                }`}
                                                style={{ background: notifForm.iconName === name ? notifForm.iconBgColor : undefined }}
                                            >
                                                <Icon size={17} style={{ color: notifForm.iconName === name ? notifForm.iconColor : undefined }} />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-3 mt-2">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-[8px] uppercase opacity-30 font-bold">Color Icono</p>
                                            <div className="flex gap-2 items-center">
                                                <input type="text" value={notifForm.iconColor} onChange={e => setNotifForm({ ...notifForm, iconColor: e.target.value })} className={`flex-1 ${inputCls} py-1.5 font-mono text-[10px]`} />
                                                <input type="color" value={notifForm.iconColor} onChange={e => setNotifForm({ ...notifForm, iconColor: e.target.value })} className="w-9 h-9 rounded-xl bg-transparent border-2 border-white/10 cursor-pointer p-0.5" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-[8px] uppercase opacity-30 font-bold">Fondo Recuadro</p>
                                            <div className="flex gap-2 items-center">
                                                <input type="text" value={notifForm.iconBgColor} onChange={e => setNotifForm({ ...notifForm, iconBgColor: e.target.value })} className={`flex-1 ${inputCls} py-1.5 font-mono text-[10px]`} />
                                                <input type="color" value={notifForm.iconBgColor} onChange={e => setNotifForm({ ...notifForm, iconBgColor: e.target.value })} className="w-9 h-9 rounded-xl bg-transparent border-2 border-white/10 cursor-pointer p-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Vista previa del icono */}
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: notifForm.iconBgColor }}>
                                            {(() => { const found = PRESET_ICONS.find(i => i.name === notifForm.iconName); return found ? <found.Icon size={22} style={{ color: notifForm.iconColor }} /> : <Bell size={22} style={{ color: notifForm.iconColor }} />; })()}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase">{notifForm.title || 'Título notificación'}</p>
                                            <p className="text-[9px] opacity-40">{notifForm.detail || 'Detalle del mensaje...'}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Programar */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setNotifForm({ ...notifForm, scheduled: !notifForm.scheduled })}
                                        className="flex items-center gap-2 text-[9px] font-bold uppercase opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                        <Clock size={12} />
                                        {notifForm.scheduled ? 'Cancelar programación' : 'Programar envío'}
                                        {notifForm.scheduled ? <ToggleRight size={16} style={{ color: '#59CBC8' }} /> : <ToggleLeft size={16} />}
                                    </button>
                                    {notifForm.scheduled && (
                                        <div className="flex gap-2">
                                            <input type="date" value={notifForm.scheduledDate} onChange={e => setNotifForm({ ...notifForm, scheduledDate: e.target.value })} className={inputCls + ' flex-1'} />
                                            <input type="time" value={notifForm.scheduledTime} onChange={e => setNotifForm({ ...notifForm, scheduledTime: e.target.value })} className={inputCls + ' flex-1'} />
                                        </div>
                                    )}
                                </div>
                                {/* Estado activo */}
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-[9px] font-black uppercase opacity-40">Estado</span>
                                    <button
                                        onClick={() => setNotifForm({ ...notifForm, active: !notifForm.active })}
                                        className={`flex items-center gap-2 text-[9px] font-bold uppercase ${notifForm.active ? 'text-green-400' : 'text-red-400'}`}
                                    >
                                        {notifForm.active ? <><CheckCircle size={12} /> Activa</> : <><XCircle size={12} /> Inactiva</>}
                                    </button>
                                </div>
                                <button
                                    onClick={handleSaveNotif}
                                    disabled={savingNotif}
                                    className="w-full py-4 bg-[#59CBC8] text-slate-900 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    {savingNotif ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    {isEditingNotif ? 'Actualizar' : 'Enviar Ahora'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setShowNotifForm(true); setIsEditingNotif(false); }}
                                className="w-full py-4 border-2 border-dashed border-[#59CBC8]/30 rounded-[20px] flex items-center justify-center gap-2 text-[10px] font-black uppercase text-[#59CBC8]/60 hover:border-[#59CBC8]/60 hover:text-[#59CBC8] transition-all"
                            >
                                <Plus size={16} /> Nueva Notificación
                            </button>
                        )}

                        {/* Lista de notificaciones */}
                        <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase opacity-30 px-1">{notifications.length} notificaciones</p>
                            {notifications.map(n => (
                                <div key={n.id} className={`p-4 rounded-2xl ${cardCls} `}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-[11px] font-black uppercase truncate">{n.title}</p>
                                                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${n.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {n.active ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] opacity-50 line-clamp-2">{n.detail}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[8px] opacity-30 flex items-center gap-1">
                                                    <Globe size={8} />
                                                    {n.target === 'all' ? 'Todos' : n.target === 'province' ? n.targetProvince : n.targetCanton}
                                                </span>
                                                {n.scheduled && (
                                                    <span className="text-[8px] opacity-30 flex items-center gap-1">
                                                        <Clock size={8} /> {n.scheduledDate} {n.scheduledTime}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => handleToggleNotif(n)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                                {n.active ? <ToggleRight size={15} style={{ color: '#59CBC8' }} /> : <ToggleLeft size={15} className="opacity-30" />}
                                            </button>
                                            <button onClick={() => handleEditNotif(n)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                                <Edit2 size={14} className="opacity-40 hover:opacity-100" />
                                            </button>
                                            <button onClick={() => handleDeleteNotif(n.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-all">
                                                <Trash2 size={14} className="text-red-400/50 hover:text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {notifications.length === 0 && (
                                <div className="text-center py-10 opacity-20">
                                    <Bell size={40} className="mx-auto mb-3" />
                                    <p className="text-xs font-bold uppercase">Sin notificaciones</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ REGIONES ═══ */}
                {activeTab === 'regions' && (
                    <div className="space-y-5 animate-fade-in">
                        {/* Selector de región */}
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                            {REGIONS.map(r => (
                                <button
                                    key={r}
                                    onClick={() => setSelectedRegionId(r)}
                                    className={`px-5 py-2 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition-all ${selectedRegionId === r ? 'bg-white text-slate-900 scale-105' : 'border border-white/10 opacity-50 hover:opacity-80'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        {/* Cover Image */}
                        <div className={`p-5 rounded-[24px] ${cardCls} space-y-4`}>
                            <h3 className="text-xs font-black uppercase flex items-center gap-2">
                                <Image size={13} style={{ color: '#59CBC8' }} /> Imagen de Portada
                            </h3>
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                                {regionCoverUrl
                                    ? <img src={regionCoverUrl} className="w-full h-full object-cover" alt="cover" />
                                    : <div className="flex flex-col items-center justify-center h-full gap-2 opacity-20">
                                        <Image size={32} /><p className="text-[9px] font-bold uppercase">Sin imagen</p>
                                      </div>
                                }
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => regionCoverInputRef.current?.click()}>
                                    <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase">
                                        <Upload size={16} /> Cambiar Imagen
                                    </div>
                                </div>
                                {uploadingRegionCover && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                                        <Loader2 size={24} className="animate-spin text-[#59CBC8]" />
                                        <p className="text-[9px] font-bold text-white">{Math.round(regionUploadProgress)}%</p>
                                    </div>
                                )}
                                <input ref={regionCoverInputRef} type="file" accept="image/*" className="hidden" onChange={handleRegionCoverUpload} />
                            </div>
                            <button onClick={() => regionCoverInputRef.current?.click()} className="w-full py-3 border border-white/10 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                                <Upload size={12} /> Subir Imagen
                            </button>
                        </div>

                        {/* Preview en vivo — muestra cómo se ve la pantalla de elegir provincia */}
                        <div className={`p-5 rounded-[24px] ${cardCls} space-y-4`}>
                            <h3 className="text-xs font-black uppercase flex items-center gap-2">
                                <Eye size={13} style={{ color: '#59CBC8' }} /> Vista Previa — Elegir Provincia
                            </h3>
                            <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: currentTheme.themeBg || '#F8FAFC' }}>
                                {/* Header */}
                                <div className="px-4 pt-5 pb-5 rounded-b-[20px] flex flex-col items-center gap-2" style={{ background: currentTheme.headerBgColor || '#1565C0' }}>
                                    <div className="flex items-center justify-between w-full">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: currentTheme.navButtonBgColor || 'rgba(255,255,255,0.1)' }}>
                                            <ArrowLeft size={14} style={{ color: currentTheme.navButtonIconColor || '#FFF' }} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: currentTheme.headerTextColor || '#FFF' }}>ECUADOR 2025</span>
                                        <div className="w-8 h-8 rounded-xl" style={{ background: currentTheme.accentColor || '#59CBC8', opacity: 0.2 }} />
                                    </div>
                                    <span className="text-[18px] font-[1000] uppercase" style={{ color: currentTheme.headerTextColor || '#FFF' }}>
                                        Elige tu <span style={{ color: currentTheme.accentColor || '#59CBC8' }}>PROVINCIA</span>
                                    </span>
                                    <div style={{ color: currentTheme.arrowColor || '#FFF', fontSize: 18 }}>↓</div>
                                </div>
                                {/* Cover */}
                                {regionCoverUrl && <img src={regionCoverUrl} className="w-full h-14 object-cover opacity-70" alt="" />}
                                {/* Province cards preview */}
                                <div className="p-3 space-y-2">
                                    {['Cuenca', 'Guayaquil', 'Quito'].map(city => (
                                        <div key={city} className="h-12 rounded-xl overflow-hidden flex items-center px-3 gap-3"
                                            style={{ background: `linear-gradient(to right, ${currentTheme.cardGradientStart || '#F9A825'}, ${currentTheme.cardGradientEnd || '#E65100'})` }}>
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: currentTheme.cardIconBgColor || '#FFF' }}>
                                                <MapPin size={14} style={{ color: currentTheme.cardIconColor || '#1565C0' }} fill="currentColor" />
                                            </div>
                                            <span className="flex-1 text-[11px] font-black uppercase text-center" style={{ color: currentTheme.cardTextColor || '#FFF' }}>{city}</span>
                                            <ChevronRight size={14} style={{ color: currentTheme.cardTextColor || '#FFF' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Colores agrupados por sección - usando ColorField mejorado */}
                        <div className={`p-5 rounded-[24px] ${cardCls} space-y-6`}>
                            {/* CABECERA */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase flex items-center gap-2" style={{ color: '#59CBC8' }}>● Cabecera</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <ColorField label="Fondo Header" value={currentTheme.headerBgColor || '#1565C0'} onChange={v => setCurrentTheme((p: any) => ({ ...p, headerBgColor: v }))} />
                                    <ColorField label="Texto Header" value={currentTheme.headerTextColor || '#FFFFFF'} onChange={v => setCurrentTheme((p: any) => ({ ...p, headerTextColor: v }))} />
                                    <ColorField label="Color Acento" value={currentTheme.accentColor || '#FFFFFF'} onChange={v => setCurrentTheme((p: any) => ({ ...p, accentColor: v }))} />
                                    <ColorField label="Color Flecha" value={currentTheme.arrowColor || '#FFFFFF'} onChange={v => setCurrentTheme((p: any) => ({ ...p, arrowColor: v }))} />
                                </div>
                            </div>
                            <div className="h-px bg-white/5" />
                            {/* BOTONES NAV */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase flex items-center gap-2" style={{ color: '#FFB800' }}>● Botones Navegación</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <ColorField label="Fondo Botón" value={currentTheme.navButtonBgColor || 'rgba(255,255,255,0.1)'} onChange={v => setCurrentTheme((p: any) => ({ ...p, navButtonBgColor: v }))} />
                                    <ColorField label="Icono Botón" value={currentTheme.navButtonIconColor || '#FFFFFF'} onChange={v => setCurrentTheme((p: any) => ({ ...p, navButtonIconColor: v }))} />
                                </div>
                            </div>
                            <div className="h-px bg-white/5" />
                            {/* TARJETAS */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase flex items-center gap-2" style={{ color: '#A78BFA' }}>● Tarjetas Provincia / Ciudad</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <ColorField label="Gradiente Inicio" value={currentTheme.cardGradientStart || '#F9A825'} onChange={v => setCurrentTheme((p: any) => ({ ...p, cardGradientStart: v }))} />
                                    <ColorField label="Gradiente Fin" value={currentTheme.cardGradientEnd || '#E65100'} onChange={v => setCurrentTheme((p: any) => ({ ...p, cardGradientEnd: v }))} />
                                    <ColorField label="Texto Tarjeta" value={currentTheme.cardTextColor || '#FFFFFF'} onChange={v => setCurrentTheme((p: any) => ({ ...p, cardTextColor: v }))} />
                                    <ColorField label="Fondo del Icono" value={currentTheme.cardIconBgColor || '#FFFFFF'} onChange={v => setCurrentTheme((p: any) => ({ ...p, cardIconBgColor: v }))} />
                                    <ColorField label="Color Icono Pin" value={currentTheme.cardIconColor || '#1565C0'} onChange={v => setCurrentTheme((p: any) => ({ ...p, cardIconColor: v }))} />
                                    <ColorField label="Circulito Pin" value={currentTheme.pinDotColor || '#1565C0'} onChange={v => setCurrentTheme((p: any) => ({ ...p, pinDotColor: v }))} />
                                </div>
                            </div>
                            <div className="h-px bg-white/5" />
                            {/* FONDO APP */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase flex items-center gap-2" style={{ color: '#34D399' }}>● Fondo Aplicación</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <ColorField label="Fondo App" value={currentTheme.themeBg || '#E3F2FD'} onChange={v => setCurrentTheme((p: any) => ({ ...p, themeBg: v }))} />
                                </div>
                            </div>
                            <button
                                onClick={handleSaveRegion}
                                disabled={isSavingRegion}
                                className="w-full py-4 bg-[#59CBC8] text-slate-900 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                {isSavingRegion ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══ CATEGORÍAS ═══ */}
                {activeTab === 'categories' && (
                    <div className="space-y-4 animate-fade-in">
                        {!selectedCatId ? (
                            <>
                                {/* Botón nueva categoría */}
                                {showCatForm ? (
                                    <div className={`p-5 rounded-[24px] ${cardCls} space-y-4`}>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-black uppercase flex items-center gap-2"><Plus size={13} style={{ color: '#FFB800' }} /> Nueva Categoría</h3>
                                            <button onClick={() => setShowCatForm(false)}><XCircle size={16} className="opacity-40" /></button>
                                        </div>
                                        <input
                                            placeholder="Nombre de la categoría"
                                            value={catForm.name}
                                            onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                                            className={inputCls}
                                        />
                                        <button
                                            onClick={handleCreateCat}
                                            className="w-full py-4 bg-[#FFB800] text-slate-900 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14} /> Crear Categoría
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowCatForm(true)}
                                        className="w-full py-4 border-2 border-dashed border-[#FFB800]/30 rounded-[20px] flex items-center justify-center gap-2 text-[10px] font-black uppercase text-[#FFB800]/60 hover:border-[#FFB800]/60 hover:text-[#FFB800] transition-all"
                                    >
                                        <Plus size={16} /> Nueva Categoría
                                    </button>
                                )}

                                <p className="text-[9px] font-black uppercase opacity-30 px-1">{cats.length} categorías — arrastra para reordenar</p>

                                {/* Lista con reordenamiento */}
                                <div className="space-y-2">
                                    {[...cats].sort((a, b) => ((a.order ?? 999) - (b.order ?? 999)) || (a.name || '').localeCompare(b.name || '')).map((cat, idx, arr) => (
                                        <div key={cat.id} className={`p-4 rounded-2xl ${cardCls} flex items-center justify-between group`}>
                                            <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => setSelectedCatId(cat.id)}>
                                                <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                                                    {cat.imageUrl
                                                        ? <img src={cat.imageUrl} className="w-full h-full object-cover" alt="" />
                                                        : <Layers size={18} style={{ color: '#FFB800' }} />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black uppercase truncate">{cat.name}</p>
                                                    <p className="text-[9px] opacity-40">{(cat.subcategories || []).length} especialidades • Pos {(cat.order ?? idx) + 1}</p>
                                                </div>
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {/* Botones de reorden */}
                                                <div className="flex flex-col gap-0.5">
                                                    <button
                                                        disabled={idx === 0}
                                                        onClick={async () => {
                                                            const sorted = [...arr];
                                                            const prev = sorted[idx - 1];
                                                            await updateDoc(doc(db, 'categories', cat.id), { order: idx - 1 });
                                                            await updateDoc(doc(db, 'categories', prev.id), { order: idx });
                                                            showToast('Orden actualizado', 'success');
                                                        }}
                                                        className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${ idx === 0 ? 'opacity-10 pointer-events-none' : 'hover:bg-white/10 active:scale-90' }`}
                                                    >↑</button>
                                                    <button
                                                        disabled={idx === arr.length - 1}
                                                        onClick={async () => {
                                                            const sorted = [...arr];
                                                            const next = sorted[idx + 1];
                                                            await updateDoc(doc(db, 'categories', cat.id), { order: idx + 1 });
                                                            await updateDoc(doc(db, 'categories', next.id), { order: idx });
                                                            showToast('Orden actualizado', 'success');
                                                        }}
                                                        className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${ idx === arr.length - 1 ? 'opacity-10 pointer-events-none' : 'hover:bg-white/10 active:scale-90' }`}
                                                    >↓</button>
                                                </div>
                                                <button onClick={() => setSelectedCatId(cat.id)} className="p-2 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <ChevronRight size={15} />
                                                </button>
                                                <button onClick={() => handleDeleteCat(cat.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={14} className="text-red-400/70" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            /* ── Vista de categoría seleccionada ── */
                            <div className="space-y-4">
                                <button onClick={() => { setSelectedCatId(null); setEditingCat(false); }} className="flex items-center gap-2 text-[10px] font-bold uppercase opacity-50 hover:opacity-100 transition-opacity">
                                    <ArrowLeft size={14} /> Volver a Categorías
                                </button>

                                {/* Info + edición */}
                                <div className={`p-5 rounded-[24px] ${cardCls} space-y-4`}>
                                    {editingCat ? (
                                        <>
                                            <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className={inputCls + ' font-black text-sm'} />
                                            <div className="flex gap-2">
                                                <button onClick={handleUpdateCatName} className="flex-1 py-3 bg-[#FFB800] text-slate-900 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                                                    <Save size={13} /> Guardar
                                                </button>
                                                <button onClick={() => setEditingCat(false)} className="px-4 py-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase">Cancelar</button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-[1000] uppercase">{selectedCat?.name}</h2>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingCat(true); setCatForm({ name: selectedCat?.name || '', icon: selectedCat?.icon || '', id: selectedCatId || '' }); }} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                                    <Edit2 size={15} className="opacity-50" />
                                                </button>
                                                <button onClick={() => handleDeleteCat(selectedCatId!)} className="p-2 hover:bg-red-500/10 rounded-lg transition-all">
                                                    <Trash2 size={15} className="text-red-400/60" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Imagen portada */}
                                <div className={`p-5 rounded-[24px] ${cardCls} space-y-3`}>
                                    <h3 className="text-[10px] font-black uppercase flex items-center gap-2">
                                        <Image size={12} style={{ color: '#FFB800' }} /> Imagen de Portada
                                    </h3>
                                    <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                                        {selectedCat?.imageUrl
                                            ? <img src={selectedCat.imageUrl} className="w-full h-full object-cover" alt="" />
                                            : <div className="flex items-center justify-center h-full opacity-20"><Image size={32} /></div>
                                        }
                                        {catUploadingField === 'cover' && (
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                                                <Loader2 size={24} className="animate-spin text-[#FFB800]" />
                                                <p className="text-[9px] font-bold text-white">{Math.round(catUploadProgress)}%</p>
                                            </div>
                                        )}
                                        <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                                            <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase"><Upload size={16} /> Cambiar</div>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleCatCoverUpload} />
                                        </label>
                                    </div>
                                </div>

                                {/* Especialidades */}
                                <div className={`p-5 rounded-[24px] ${cardCls} space-y-4`}>
                                    <h3 className="text-[10px] font-black uppercase flex items-center gap-2">
                                        <Layers size={12} style={{ color: '#FFB800' }} /> Especialidades ({(selectedCat?.subcategories || []).length})
                                    </h3>

                                    {/* Añadir nueva especialidad */}
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="Nueva especialidad..."
                                            value={newSubcategory}
                                            onChange={e => setNewSubcategory(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddSubcategory()}
                                            className={inputCls + ' flex-1'}
                                        />
                                        <button onClick={handleAddSubcategory} className="px-4 py-3 bg-[#FFB800] text-slate-900 rounded-xl font-black text-[10px] flex items-center gap-1 whitespace-nowrap">
                                            <Plus size={13} />
                                        </button>
                                    </div>

                                    {/* Lista especialidades */}
                                    <div className="space-y-2">
                                        {(selectedCat?.subcategories || []).map((sub: string, idx: number) => (
                                            <div key={idx} className={`p-3 rounded-xl bg-white/5 border ${dark ? 'border-white/5' : 'border-slate-100'}`}>
                                                {editingSubIdx === idx ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={editingSubValue}
                                                            onChange={e => setEditingSubValue(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleEditSubcategory(sub, idx)}
                                                            className={inputCls + ' flex-1 py-1.5'}
                                                            autoFocus
                                                        />
                                                        <button onClick={() => handleEditSubcategory(sub, idx)} className="px-3 py-1.5 bg-[#FFB800] text-slate-900 rounded-lg font-black text-[9px]">OK</button>
                                                        <button onClick={() => setEditingSubIdx(null)} className="px-3 py-1.5 border border-white/10 rounded-lg text-[9px] font-bold">✕</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase flex-1">{sub}</span>
                                                        <div className="flex items-center gap-1">
                                                            {/* Subir fondo de especialidad */}
                                                            <label className="p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-all">
                                                                {catUploadingField === sub
                                                                    ? <Loader2 size={13} className="animate-spin text-[#FFB800]" />
                                                                    : <Upload size={13} className="opacity-40 hover:opacity-100 hover:text-[#FFB800]" />
                                                                }
                                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleSubBgUpload(e, sub)} />
                                                            </label>
                                                            <button onClick={() => { setEditingSubIdx(idx); setEditingSubValue(sub); }} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                                                <Edit2 size={13} className="opacity-40 hover:opacity-100" />
                                                            </button>
                                                            <button onClick={() => handleDeleteSubcategory(sub)} className="p-2 hover:bg-red-500/10 rounded-lg transition-all">
                                                                <Trash2 size={13} className="text-red-400/40 hover:text-red-400" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Indicador de fondo */}
                                                {selectedCat?.subcategoryConfig?.[sub]?.bgImage && (
                                                    <p className="text-[8px] text-[#FFB800] mt-1 flex items-center gap-1"><Image size={8} /> Fondo personalizado</p>
                                                )}
                                            </div>
                                        ))}
                                        {(selectedCat?.subcategories || []).length === 0 && (
                                            <p className="text-[9px] opacity-30 text-center py-4 uppercase font-bold">Sin especialidades</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ AJUSTES ═══ */}
                {activeTab === 'settings' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* ImgBB */}
                        <div className={`p-5 rounded-[24px] ${cardCls} space-y-4`}>
                            <h3 className="text-xs font-black uppercase flex items-center gap-2">
                                <Settings size={14} style={{ color: '#59CBC8' }} /> Configuración General
                            </h3>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase opacity-40 block">ImgBB API Key</label>
                                <div className="relative">
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        value={imgbbApiKey}
                                        onChange={e => setImgbbApiKey(e.target.value)}
                                        className={inputCls + ' pr-12 font-mono text-[11px]'}
                                        placeholder="Tu API key de ImgBB"
                                    />
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                                    >
                                        <Eye size={15} />
                                    </button>
                                </div>
                                <p className="text-[8px] opacity-30 px-1">
                                    Usada para subir imágenes vía ImgBB y generar URLs públicas permanentes.
                                </p>
                            </div>
                            <button
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                                className="w-full py-4 bg-[#59CBC8] text-slate-900 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Guardar Ajustes
                            </button>
                        </div>

                        {/* Firebase Status */}
                        <div className={`p-5 rounded-[24px] ${cardCls} space-y-4`}>
                            <h3 className="text-xs font-black uppercase flex items-center gap-2">
                                <AlertCircle size={14} style={{ color: '#59CBC8' }} /> Estado de Firebase
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Firestore DB', desc: 'Base de datos en tiempo real', status: firebaseStatus },
                                    { label: 'Firebase Storage', desc: 'Almacenamiento de imágenes', status: firebaseStatus },
                                    { label: 'Firebase Auth', desc: 'Autenticación de usuarios', status: firebaseStatus },
                                ].map(item => (
                                    <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl ${dark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                        <div>
                                            <p className="text-[10px] font-black uppercase">{item.label}</p>
                                            <p className="text-[8px] opacity-40">{item.desc}</p>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[8px] font-bold uppercase ${item.status === 'ok' ? 'bg-green-500/10 text-green-400' : item.status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            {item.status === 'ok' ? <CheckCircle size={9} /> : item.status === 'error' ? <XCircle size={9} /> : <Loader2 size={9} className="animate-spin" />}
                                            {item.status === 'ok' ? 'OK' : item.status === 'error' ? 'Error' : '...'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleVerifyFirebase}
                                className="w-full py-4 border border-white/10 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-white/5 transition-all active:scale-95"
                            >
                                <RefreshCw size={14} /> Verificar Conexiones
                            </button>
                        </div>

                        {/* Info versión */}
                        <div className={`p-5 rounded-[24px] ${cardCls}`}>
                            <div className="text-center space-y-1 opacity-30">
                                <p className="text-[10px] font-black uppercase tracking-widest">Admin Advanced</p>
                                <p className="text-[8px] uppercase tracking-widest">Ecuador Servicios • 2025</p>
                                <p className="text-[8px]">Firebase: services-17abe</p>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* ── TOAST ── */}
            {toast.visible && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl shadow-2xl z-[100] animate-bounce-subtle flex items-center gap-2 ${toast.type === 'success' ? 'bg-[#59CBC8]' : toast.type === 'error' ? 'bg-red-500' : 'bg-slate-700'}`}>
                    {toast.type === 'success' ? <CheckCircle size={14} className="text-slate-900" /> : toast.type === 'error' ? <XCircle size={14} className="text-white" /> : <AlertCircle size={14} className="text-white" />}
                    <span className={`text-[10px] font-black uppercase tracking-widest ${toast.type === 'success' ? 'text-slate-900' : 'text-white'}`}>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default AdminAdvanced;
