
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Service, Category } from '../types';
import { PROVINCES } from '../constants';
import * as Icons from 'lucide-react';
import { db, storage } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import {
  Plus, LogOut, Trash2, Edit2,
  ArrowLeft, Search, X, ChevronRight, MapPin,
  ShieldCheck, Globe, PlusCircle,
  Film, Info, Link as LinkIcon, Type, MessageCircle,
  ImageIcon, Zap, Map as MapIcon,
  Eye, EyeOff, PauseCircle, PlayCircle, Filter,
  Layers, CheckCircle2, CheckCircle, XCircle, AlertCircle, BarChart3, ListFilter,
  ChevronDown, Check, Upload, Image as ImageIconLucide, Video,
  Smartphone, AlertTriangle, Navigation, Loader2, Minimize2, Copy, Link2, CloudLightning, Settings as SettingsIcon, Save,
  Hash, MoreVertical, Pause, Play
} from 'lucide-react';

// Helper para limpiar nombres de archivo y carpetas
const sanitize = (text: string) => {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9]/g, "_"); // Reemplazar caracteres especiales con _
};

interface Props {
  categories: Category[];
  services: Service[];
  onAddService: (s: Service) => Promise<any>;
  onUpdateService: (s: Service) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  onLogout: () => void;
  onBackToUserView: () => void;
  initialEditingService?: Service | null;
  onToggleTheme: () => void;
  onRegisterBackHandler?: (handler: (() => void) | null) => void;
  t: any;
  language: string;
  onOpenAdvanced: () => void;
}

const AdminDashboard: React.FC<Props> = ({
  categories,
  services,
  onAddService,
  onUpdateService,
  onDeleteService,
  onLogout,
  onBackToUserView,
  initialEditingService,
  onToggleTheme,
  onRegisterBackHandler,
  t,
  language,
  onOpenAdvanced
}) => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>(initialEditingService ? 'edit' : 'list');

  // Register back handler logic
  useEffect(() => {
    if (!onRegisterBackHandler) return;

    if (view === 'create' || view === 'edit') {
      onRegisterBackHandler(() => {
        if (window.confirm(t.admin_confirm_exit)) {
          setView('list');
          setEditingId(null);
          setFormData({
            title: '', description: '', category: '', subcategories: [], province: 'Azuay', canton: 'Cuenca',
            contactName: '', whatsappNumber: '', whatsappMessage: 'Hola, vi tu servicio...',
            imageUrl: '', gallery: [], promoVideoUrl: '', mapsUrl: '', socialUrl: '', highlights: [], status: 'active', location: { lat: 0, lng: 0, address: '' }
          });
        }
      });
    } else {
      onRegisterBackHandler(null);
    }

    return () => {
      onRegisterBackHandler(null);
    };
  }, [view, onRegisterBackHandler]);
  const [editingId, setEditingId] = useState<string | null>(initialEditingService?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // Estado para la subida directa en formulario
  const [uploadingTarget, setUploadingTarget] = useState<'cover' | 'gallery' | 'video' | null>(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [saveError, setSaveError] = useState('');
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number | null>(null);
  const [replacingGalleryIdx, setReplacingGalleryIdx] = useState<number | null>(null);

  // ImgBB Logic
  const [imgbbApiKey, setImgbbApiKey] = useState('');
  const [isImgbbUploading, setIsImgbbUploading] = useState(false);
  const [imgbbResultUrl, setImgbbResultUrl] = useState('');
  const [imgbbProgress, setImgbbProgress] = useState(0);

  useEffect(() => {
    // Load ImgBB API Key
    getDoc(doc(db, 'config', 'imgbb')).then(docSnap => {
      if (docSnap.exists()) {
        setImgbbApiKey((docSnap.data().apiKey || '').trim());
      }
    });
  }, []);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info', visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  };

  const handleImgbbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imgbbApiKey) {
      if (!imgbbApiKey) showToast("Configura tu API Key de ImgBB en Ajustes Avanzados", "info");
      return;
    }

    setIsImgbbUploading(true);
    setImgbbProgress(0);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('image', compressedFile);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey.trim()}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setImgbbResultUrl(data.data.url);
        setGalleryUrlInput(data.data.url); // Suggest it for gallery
      } else {
        throw new Error(data.error?.message || "Error al subir a ImgBB");
      }
    } catch (error: any) {
      showToast("Error ImgBB: " + error.message, "error");
    } finally {
      setIsImgbbUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast("Copiado al portapapeles", "success");
      }).catch(err => {
        console.error("Clipboard error:", err);
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast("Copiado al portapapeles", "success");
    } catch (err) {
      console.error('Fallback copy failed', err);
      showToast("Error al copiar. Por favor selecciona el texto manualmente.", "error");
    }
    document.body.removeChild(textArea);
  };

  const isUploading = uploadingTarget !== null;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Keyboard Detection
  useEffect(() => {
    const handleResize = () => {
      // Si la altura disminuye significativamente, es probable que el teclado esté abierto
      const isVisible = window.innerHeight < 500;
      setIsKeyboardVisible(isVisible);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // --- ESTADOS DE FILTROS ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');

  // Filtros Avanzados
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState<string>('');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('');
  const [selectedCantonFilter, setSelectedCantonFilter] = useState<string>('');

  // Custom Picker State (Reutilizable para Filtros y Formulario)
  const [pickerConfig, setPickerConfig] = useState<{
    isOpen: boolean,
    title: string,
    options: { label: string, value: string, icon?: string }[],
    onSelect: (val: string) => void,
    currentValue: string | string[],
    multiSelect?: boolean
  }>({
    isOpen: false,
    title: '',
    options: [],
    onSelect: () => { },
    currentValue: '',
    multiSelect: false
  });

  // Estado para menú contextual de servicios
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [formData, setFormData] = useState<Partial<Service>>(initialEditingService || {
    title: '',
    description: '',
    category: '',
    subcategories: [],
    province: 'Azuay',
    canton: 'Cuenca',
    contactName: '',
    whatsappNumber: '',
    whatsappMessage: t.detail_wa_message,
    imageUrl: '',
    promoVideoUrl: '',
    mapsUrl: '',
    socialUrl: '',
    socialUrls: {
      instagram: '',
      tiktok: '',
      facebook: ''
    },
    gallery: [],
    highlights: [],
    status: 'active',
    location: { lat: 0, lng: 0, address: '' },
    id: Math.random().toString(36).substr(2, 9)
  });

  useEffect(() => {
    if (initialEditingService) {
      const data = { ...initialEditingService };
      if (!data.subcategories && data.subcategory) {
        data.subcategories = [data.subcategory];
      } else if (!data.subcategories) {
        data.subcategories = [];
      }
      setFormData(data);
      setEditingId(initialEditingService.id);
      setView('edit');
    }
  }, [initialEditingService]);



  // --- LÓGICA DE FILTRADO COMPLETA ---
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      // 1. Filtro de Texto (Título o Subcategoría)
      const subMatch = (s.subcategories || []).some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.subcategory && s.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSearch = !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || subMatch;

      // 2. Filtro de Estado (Activo/Suspendido)
      const matchStatus = filterStatus === 'all' || s.status === filterStatus;

      // 3. Filtro de Categoría
      const matchCategory = !selectedCategoryFilter || s.category === selectedCategoryFilter;

      // 4. Filtro de Subcategoría (Especialidad)
      const matchSubcategory = !selectedSubcategoryFilter ||
        (s.subcategories && s.subcategories.includes(selectedSubcategoryFilter)) ||
        s.subcategory === selectedSubcategoryFilter;

      // 5. Filtro de Provincia
      const matchProvince = !selectedProvinceFilter || s.province === selectedProvinceFilter;

      // 6. Filtro de Cantón
      const matchCanton = !selectedCantonFilter || s.canton === selectedCantonFilter;

      return matchSearch && matchStatus && matchCategory && matchSubcategory && matchProvince && matchCanton;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [services, searchQuery, filterStatus, selectedCategoryFilter, selectedSubcategoryFilter, selectedProvinceFilter, selectedCantonFilter]);

  const stats = useMemo(() => ({
    total: services.length,
    active: services.filter(s => s.status === 'active').length,
    suspended: services.filter(s => s.status === 'suspended').length
  }), [services]);

  const getLucideIcon = (name: string, size = 18, className = "") => {
    const LucideIcon = (Icons as any)[name];
    return LucideIcon ? <LucideIcon size={size} className={className} /> : <Icons.HelpCircle size={size} className={className} />;
  };

  const compressImage = async (imageFile: File): Promise<File> => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/webp' };
    try {
      setUploadStatus(t.admin_optimizing);
      return await imageCompression(imageFile, options);
    } catch (error) {
      console.warn("Error al comprimir imagen", error);
      return imageFile;
    }
  };



  const deleteFromStorage = async (url: string) => {
    if (!url || !url.includes('firebasestorage')) return;
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn("Error deleting from storage:", error);
    }
  };

  const uploadToStorage = async (file: File, folder: string, type: 'portada' | 'galeria' | 'videos'): Promise<string> => {
    setUploadStatus(t.admin_uploading.replace('{type}', type));
    setUploadProgress(0);
    setShowSuccess(false);

    const provinceData = PROVINCES.find(p => p.name === formData.province);
    const region = sanitize(provinceData?.region || 'sin_region');
    const province = sanitize(formData.province || 'sin_provincia');
    const city = sanitize(formData.canton || 'sin_ciudad');
    const category = sanitize(formData.category || 'sin_categoria');
    const subcategory = sanitize(formData.subcategories?.[0] || formData.subcategory || 'sin_especialidad');
    const serviceName = sanitize(formData.title || 'sin_nombre');
    const serviceId = formData.id || 'temp';

    const fullPath = `${region}/${province}/${city}/${category}/${subcategory}/${serviceName}_${serviceId}/${type}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, fullPath);

    try {
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Monitoring progress
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Upload Error:", error);
            let msg = t.admin_upload_error;
            if (error.code === 'storage/retry-limit-exceeded') msg = t.admin_timeout;
            if (error.code === 'storage/unauthorized') msg = t.admin_no_perms;
            showToast(msg + " (" + error.code + ")", "error");
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            resolve(downloadURL);
          }
        );
      });
    } catch (err: any) {
      console.error("Critical Upload Error:", err);
      showToast("Error crítico: " + err.message, "error");
      throw err;
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 50 * 1024 * 1024) {
      showToast(t.admin_video_large, "info");
      return;
    }
    setUploadingTarget('video'); setSaveError('');
    try {
      // Borrar video anterior si existe
      if (formData.promoVideoUrl) await deleteFromStorage(formData.promoVideoUrl);

      const url = await uploadToStorage(file, 'videos', 'videos');
      setFormData(prev => ({ ...prev, promoVideoUrl: url }));
    } catch (err: any) {
      showToast("Error subiendo: " + err.message, "error");
      setSaveError(err.message);
    } finally {
      setUploadingTarget(null); setUploadStatus('');
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setReplacingGalleryIdx(null);
      return;
    }

    setUploadingTarget(isGallery ? 'gallery' : 'cover');
    setSaveError('');

    // Safety timeout to dismiss overlay if anything hangs (60 seconds)
    const safetyTimeout = setTimeout(() => {
      if (uploadingTarget !== null) {
        console.warn("Upload safety timeout reached - force closing overlay");
        setUploadingTarget(null);
        setUploadStatus('');
      }
    }, 60000);

    try {
      if (isGallery) {
        if (replacingGalleryIdx !== null) {
          // Caso: Reemplazar una sola imagen de la galería
          let fileToUpload = files[0];
          try {
            fileToUpload = await compressImage(files[0]);
          } catch (e) { console.warn("Compression failed, using original", e); }

          const url = await uploadToStorage(fileToUpload, 'gallery', 'galeria');

          setFormData(prev => {
            const newGallery = [...(prev.gallery || [])];
            if (newGallery[replacingGalleryIdx]) deleteFromStorage(newGallery[replacingGalleryIdx]).catch(console.error);
            newGallery[replacingGalleryIdx] = url;
            return { ...prev, gallery: newGallery };
          });
          setReplacingGalleryIdx(null);
        } else {
          // Caso: Añadir nuevas imágenes
          const newUrls: string[] = [];
          const total = files.length;

          for (let i = 0; i < total; i++) {
            try {
              setUploadStatus(`Subiendo ${i + 1}/${total}...`);
              let fileToUpload = files[i];
              try {
                fileToUpload = await compressImage(files[i]);
              } catch (e) { console.warn("Compression failed", e); }

              const url = await uploadToStorage(fileToUpload, 'gallery', 'galeria');
              newUrls.push(url);
            } catch (err) {
              console.error(`Error uploading file ${i}:`, err);
              showToast(`Error con archivo ${i + 1}`, "error");
            }
          }
          if (newUrls.length > 0) {
            setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), ...newUrls] }));
          }
        }
      } else {
        // Caso: Portada
        if (formData.imageUrl) deleteFromStorage(formData.imageUrl).catch(console.error);

        let fileToUpload = files[0];
        try {
          fileToUpload = await compressImage(files[0]);
        } catch (e) { console.warn("Compression failed", e); }

        const url = await uploadToStorage(fileToUpload, 'images', 'portada');
        setFormData(prev => ({ ...prev, imageUrl: url }));
      }
    } catch (err: any) {
      console.error("Critical Upload Flow Error:", err);
      showToast("Error: " + (err.message || String(err)), "error");
    } finally {
      clearTimeout(safetyTimeout);
      setUploadingTarget(null);
      setUploadStatus('');
      setReplacingGalleryIdx(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmText('');
  };

  const confirmDelete = async () => {
    if (deleteConfirmText.toLowerCase() === t.admin_delete_keyword.toLowerCase() && deleteConfirmId) {
      try {
        const serviceToDelete = services.find(s => s.id === deleteConfirmId);
        if (serviceToDelete) {
          // 1. Borrar Portada
          if (serviceToDelete.imageUrl) await deleteFromStorage(serviceToDelete.imageUrl);

          // 2. Borrar Galería
          if (serviceToDelete.gallery && serviceToDelete.gallery.length > 0) {
            for (const imgUrl of serviceToDelete.gallery) {
              await deleteFromStorage(imgUrl);
            }
          }

          // 3. Borrar Video
          if (serviceToDelete.promoVideoUrl) await deleteFromStorage(serviceToDelete.promoVideoUrl);
        }

        await onDeleteService(deleteConfirmId);
        setDeleteConfirmId(null);
        setDeleteConfirmText('');
        setOpenMenuId(null);
      } catch (e) {
        showToast("Error al eliminar.", "error");
      }
    }
  };

  const toggleStatus = async (service: Service) => {
    const newStatus = service.status === 'active' ? 'suspended' : 'active';
    try {
      await onUpdateService({ ...service, status: newStatus });
      setOpenMenuId(null);
    } catch (e) {
      showToast("Error al cambiar estado.", "error");
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.category || !formData.imageUrl) {
      showToast(t.admin_err_required, "info"); return;
    }
    if (!formData.subcategories || formData.subcategories.length === 0) {
      showToast(t.admin_err_specialty, "info"); return;
    }
    setIsSaving(true); setSaveError('');
    try {
      const serviceData = {
        ...formData as Service,
        highlights: formData.highlights || [],
        gallery: formData.gallery || [],
        status: formData.status || 'active',
        createdAt: formData.createdAt || new Date().toISOString(),
        subcategory: formData.subcategories[0],
        contactName: formData.contactName || '', // Ensure legacy field is present even if empty
      };
      if (view === 'edit' && editingId) {
        await onUpdateService({ ...serviceData, id: editingId });
      } else {
        const newService: Service = {
          ...serviceData,
          id: formData.id || Math.random().toString(36).substr(2, 9),
          rating: 5.0, reviewsCount: 0, reviews: []
        };
        await onAddService(newService);
      }
      setView('list'); setEditingId(null);
    } catch (error: any) {
      setSaveError(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- OPEN PICKERS FUNCTIONS (Reused for both Filter and Form) ---

  // 1. FILTER PICKERS
  const openFilterCategoryPicker = () => {
    setPickerConfig({
      isOpen: true,
      title: t.admin_filter_category,
      options: [{ label: t?.admin_filter_all_cats || 'Todas las Categorías', value: '', icon: 'Layers' }, ...(categories || []).map(c => ({ label: c.name, value: c.name, icon: c.icon }))],
      currentValue: selectedCategoryFilter,
      onSelect: (val) => {
        setSelectedCategoryFilter(val);
        setSelectedSubcategoryFilter(''); // Reset subcategory when category changes
        setPickerConfig(p => ({ ...p, isOpen: false }));
      }
    });
  };

  const openFilterSubcategoryPicker = () => {
    const cat = (categories || []).find(c => c.name === selectedCategoryFilter);
    if (!cat) return;
    setPickerConfig({
      isOpen: true,
      title: t?.admin_filter_specialty || 'Filtrar por Especialidad',
      options: [{ label: t?.admin_filter_all || 'Todos', value: '', icon: 'Hash' }, ...(cat?.subcategories || []).map(s => ({ label: s, value: s, icon: 'Hash' }))],
      currentValue: selectedSubcategoryFilter,
      onSelect: (val) => {
        setSelectedSubcategoryFilter(val);
        setPickerConfig(p => ({ ...p, isOpen: false }));
      }
    });
  };

  const openFilterProvincePicker = () => {
    setPickerConfig({
      isOpen: true,
      title: t.admin_filter_province,
      options: [{ label: t.admin_filter_all_country, value: '', icon: 'Globe' }, ...PROVINCES.map(p => ({ label: p.name, value: p.name, icon: 'MapPin' }))],
      currentValue: selectedProvinceFilter,
      onSelect: (val) => {
        setSelectedProvinceFilter(val);
        setSelectedCantonFilter(''); // Reset canton when province changes
        setPickerConfig(p => ({ ...p, isOpen: false }));
      }
    });
  };

  const openFilterCantonPicker = () => {
    const prov = (PROVINCES || []).find(p => p.name === selectedProvinceFilter);
    if (!prov) return;
    setPickerConfig({
      isOpen: true,
      title: t?.admin_filter_canton || 'Filtrar por Cantón',
      options: [{ label: t?.admin_filter_all || 'Todos', value: '', icon: 'Navigation' }, ...(prov?.cantons || []).map(c => ({ label: c, value: c, icon: 'Navigation' }))],
      currentValue: selectedCantonFilter,
      onSelect: (val) => {
        setSelectedCantonFilter(val);
        setPickerConfig(p => ({ ...p, isOpen: false }));
      }
    });
  };


  // 2. FORM PICKERS (Existing logic)
  const openFormCategoryPicker = () => {
    setPickerConfig({
      isOpen: true,
      title: 'SELECCIONAR CATEGORÍA',
      options: (categories || []).map(c => ({ label: c.name, value: c.name, icon: c.icon })),
      currentValue: formData.category || '',
      onSelect: (val) => {
        setFormData(prev => ({ ...prev, category: val, subcategories: [] }));
        setPickerConfig(p => ({ ...p, isOpen: false }));
      }
    });
  };

  const openFormSubcategoryPicker = () => {
    const cat = (categories || []).find(c => c.name === formData.category);
    if (!cat) return;
    setPickerConfig({
      isOpen: true,
      title: t?.admin_select_specialties || 'Seleccionar Especialidades',
      options: (cat?.subcategories || []).map(s => ({ label: s, value: s })),
      currentValue: formData.subcategories || [],
      multiSelect: true,
      onSelect: (val) => {
        setFormData(prev => {
          const current = prev.subcategories || [];
          let newSubcategories;
          if (current.includes(val)) newSubcategories = current.filter(s => s !== val);
          else newSubcategories = [...current, val];
          setPickerConfig(prevConfig => ({ ...prevConfig, currentValue: newSubcategories }));
          return { ...prev, subcategories: newSubcategories };
        });
      }
    });
  };

  const openFormProvincePicker = () => {
    setPickerConfig({
      isOpen: true,
      title: 'SELECCIONAR PROVINCIA',
      options: PROVINCES.map(p => ({ label: p.name, value: p.name, icon: 'MapPin' })),
      currentValue: formData.province || '',
      onSelect: (val) => {
        setFormData(prev => ({ ...prev, province: val, canton: '' }));
        setPickerConfig(p => ({ ...p, isOpen: false }));
      }
    });
  };

  const openFormCantonPicker = () => {
    const prov = (PROVINCES || []).find(p => p.name === formData.province);
    if (!prov) return;
    setPickerConfig({
      isOpen: true,
      title: t?.admin_select_canton || 'Seleccionar Cantón',
      options: (prov?.cantons || []).map(c => ({ label: c, value: c, icon: 'Navigation' })),
      currentValue: formData.canton || '',
      onSelect: (val) => {
        setFormData(prev => ({ ...prev, canton: val }));
        setPickerConfig(p => ({ ...p, isOpen: false }));
      }
    });
  };

  const inputStyle = "w-full bg-white/5 border border-white/10 rounded-[22px] px-6 py-4 text-[13px] font-bold text-white outline-none focus:bg-white/10 focus:border-[#59CBC8]/50 transition-all placeholder:text-white/40";
  const labelStyle = "text-[9px] font-[1000] text-[#59CBC8] uppercase tracking-[2px] mb-2 block truncate h-4";

  // Custom Render for Filter Buttons to look "Natural"
  const FilterButton = ({ label, value, onClick, disabled = false, icon: IconComponent }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 h-14 rounded-[20px] px-4 flex items-center justify-center transition-all active:scale-[0.98] border relative overflow-hidden ${disabled ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/5' : value ? 'bg-[#59CBC8]/10 border-[#59CBC8]/50 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
    >
      <div className="absolute left-4 w-6 h-6 flex items-center justify-center shrink-0">
        {IconComponent && <IconComponent size={14} className={value ? "text-[#59CBC8]" : "opacity-40"} />}
      </div>
      <div className="flex flex-col items-center truncate px-8">
        <span className="text-[7px] font-black uppercase tracking-wider opacity-40">{label}</span>
        <span className={`text-[10px] font-black uppercase truncate max-w-[100px] xs:max-w-[130px] ${value ? 'text-white' : 'text-white/40'}`}>{value || 'Todos'}</span>
      </div>
      <div className="absolute right-4 w-4 flex items-center justify-center shrink-0">
        <ChevronDown size={14} className={value ? "text-[#59CBC8]" : "opacity-20"} />
      </div>
    </button>
  );

  const CustomSelect = ({ label, value, onClick, disabled = false, iconName, isMulti = false }: any) => {
    let displayValue = t.admin_choose;
    if (isMulti) {
      if (Array.isArray(value) && value.length > 0) displayValue = `${value.length} ${t.admin_selected}`;
    } else {
      if (value) displayValue = value;
    }

    return (
      <div className={`flex-1 flex flex-col ${disabled ? 'opacity-40' : ''}`}>
        <label className={labelStyle}>{label}</label>
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className="w-full h-16 bg-white/5 border border-white/10 rounded-[25px] px-6 flex items-center justify-between active:scale-[0.98] transition-all group relative text-white overflow-hidden"
        >
          <div className="flex-1 flex items-center justify-center min-w-0 overflow-x-auto hide-scrollbar">
            <span className="text-[11px] sm:text-[12px] font-[1000] uppercase tracking-tighter whitespace-nowrap text-center">
              {displayValue}
            </span>
          </div>

          {/* Chevron a la derecha */}
          <div className="w-6 h-6 flex items-center justify-center shrink-0 ml-2">
            <ChevronDown size={16} className="text-[#59CBC8]/40 group-hover:text-[#59CBC8] transition-colors" />
          </div>
        </button>
        {isMulti && Array.isArray(value) && value.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {value.map((v: string) => (
              <span key={v} className="text-[9px] bg-[#59CBC8]/10 text-[#59CBC8] px-2 py-1 rounded-md font-bold uppercase border border-[#59CBC8]/20">{v}</span>
            ))}
          </div>
        )}
        {/* TOAST SYSTEM */}
        {toast.visible && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-toast-in">
            <div className={`
              px-8 py-5 rounded-[24px] shadow-3xl border flex flex-col items-center gap-4 min-w-[280px] backdrop-blur-xl text-center
              ${toast.type === 'success' ? 'bg-[#0f172a]/95 border-[#10B981]/30 text-[#10B981]' :
                toast.type === 'error' ? 'bg-[#0f172a]/95 border-[#EF4444]/30 text-[#EF4444]' :
                  'bg-[#0f172a]/95 border-[#3B82F6]/30 text-[#3B82F6]'}
            `}>
              <div className={`p-3 rounded-full ${toast.type === 'success' ? 'bg-[#10B981]/20' : toast.type === 'error' ? 'bg-[#EF4444]/20' : 'bg-[#3B82F6]/20'}`}>
                {toast.type === 'success' && <CheckCircle2 size={24} className="animate-bounce-subtle" />}
                {toast.type === 'error' && <XCircle size={24} />}
                {toast.type === 'info' && <Info size={24} />}
              </div>
              <span className="text-sm font-black uppercase tracking-[0.1em] text-white">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#020617] relative w-full h-full min-h-0 overflow-x-hidden overflow-y-hidden" style={{ overscrollBehavior: 'none' }}>
      {/* Background radial Glow - Fixed position */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,_rgba(89,203,200,0.1)_0%,_transparent_60%)] opacity-30 pointer-events-none z-0"></div>

      <header className="w-full px-6 pt-8 pb-4 relative z-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <button onClick={onOpenAdvanced} className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-[#59CBC8] rounded-[16px] sm:rounded-[17px] md:rounded-[18px] flex items-center justify-center text-slate-900 shadow-[0_0_30px_rgba(89,203,200,0.4)] active:scale-95 transition-all cursor-pointer">
            <ShieldCheck size={18} className="sm:hidden" strokeWidth={2.5} />
            <ShieldCheck size={20} className="hidden sm:block md:hidden" strokeWidth={2.5} />
            <ShieldCheck size={22} className="hidden md:block" strokeWidth={2.5} />
          </button>
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-[1000] text-white tracking-tighter leading-none uppercase">{t.admin_central}</h2>
            <p className="text-[7px] sm:text-[8px] font-black text-[#59CBC8] uppercase tracking-[2px] mt-0.5 sm:mt-1">Conexión Servicios</p>
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2">



          <button onClick={onBackToUserView} className="p-2.5 sm:p-3 md:p-3.5 bg-white/5 text-[#59CBC8] rounded-[13px] sm:rounded-[14px] md:rounded-[15px] border border-white/10 active:scale-90 transition-all flex items-center justify-center relative group" title="Ver como Usuario">
            <Globe size={16} className="sm:hidden" />
            <Globe size={17} className="hidden sm:block md:hidden" />
            <Globe size={18} className="hidden md:block" />

            {/* Tooltip for desktop only if needed, or just rely on title attribute */}
          </button>
          <button onClick={onLogout} className="p-2.5 sm:p-3 md:p-3.5 bg-red-500/10 text-red-500 rounded-[13px] sm:rounded-[14px] md:rounded-[15px] border border-red-500/20 active:scale-90 transition-all">
            <LogOut size={16} className="sm:hidden" />
            <LogOut size={17} className="hidden sm:block md:hidden" />
            <LogOut size={18} className="hidden md:block" />
          </button>
        </div>
      </header>

      {view === 'list' ? (
        <div className="flex-1 flex flex-col overflow-hidden animate-page-in relative z-10 px-4 sm:px-5 md:px-6">


          {/* Collapsible Stats and Filters Section */}
          <div
            className="transition-all duration-300 ease-out overflow-hidden"
            style={{
              maxHeight: isHeaderCollapsed ? '0px' : '1000px',
              opacity: isHeaderCollapsed ? 0 : 1,
              marginBottom: isHeaderCollapsed ? '0px' : '0px'
            }}
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 mb-4 sm:mb-5 md:mb-6">
              <button onClick={() => setFilterStatus('all')} className={`border rounded-[25px] p-4 text-center active:scale-95 transition-all ${filterStatus === 'all' ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10'}`}>
                <p className="text-[7px] font-black text-white/60 uppercase tracking-widest mb-1">{t.admin_total}</p>
                <p className="text-xl font-[1000] text-white leading-none">{stats.total}</p>
              </button>
              <button onClick={() => setFilterStatus('active')} className={`border rounded-[25px] p-4 text-center active:scale-95 transition-all ${filterStatus === 'active' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <p className="text-[7px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">{t.admin_active}</p>
                <p className="text-xl font-[1000] text-emerald-500 leading-none">{stats.active}</p>
              </button>
              <button onClick={() => setFilterStatus('suspended')} className={`border rounded-[25px] p-4 text-center active:scale-95 transition-all ${filterStatus === 'suspended' ? 'bg-[#D9B061]/20 border-[#D9B061]' : 'bg-[#D9B061]/10 border-[#D9B061]/20'}`}>
                <p className="text-[7px] font-black text-[#D9B061]/60 uppercase tracking-widest mb-1">{t.admin_paused}</p>
                <p className="text-xl font-[1000] text-[#D9B061] leading-none">{stats.suspended}</p>
              </button>
            </div>

            <div className="space-y-3 mb-8 px-2">
              {/* FILTROS AVANZADOS BONITOS Y NATURALES */}
              <div className="grid grid-cols-2 gap-3">
                <FilterButton
                  label={t.search_category.toUpperCase()}
                  value={selectedCategoryFilter}
                  onClick={openFilterCategoryPicker}
                  icon={Layers}
                />
                <FilterButton
                  label={t.search_specialty.toUpperCase()}
                  value={selectedSubcategoryFilter}
                  onClick={openFilterSubcategoryPicker}
                  disabled={!selectedCategoryFilter}
                  icon={Hash}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FilterButton
                  label={t.geo_title_province}
                  value={selectedProvinceFilter}
                  onClick={openFilterProvincePicker}
                  icon={MapPin}
                />
                <FilterButton
                  label={t.geo_title_city}
                  value={selectedCantonFilter}
                  onClick={openFilterCantonPicker}
                  disabled={!selectedProvinceFilter}
                  icon={Navigation}
                />
              </div>

              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60" size={16} />
                <input
                  type="text" placeholder={t.admin_search_placeholder}
                  className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[25px] outline-none text-[11px] sm:text-xs font-bold text-white transition-all placeholder:text-white/40 focus:bg-white/10"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>

              <button
                onClick={() => {
                  setFormData({
                    title: '',
                    description: '',
                    category: '',
                    subcategories: [],
                    province: 'Azuay',
                    canton: 'Cuenca',
                    contactName: '',
                    whatsappNumber: '',
                    whatsappMessage: 'Hola, vi tu servicio en la App Conexión Servicios y me interesa más información.',
                    imageUrl: '',
                    gallery: [],
                    promoVideoUrl: '',
                    mapsUrl: '',
                    socialUrl: '',
                    highlights: [],
                    status: 'active',
                    location: { lat: 0, lng: 0, address: '' },
                    id: Math.random().toString(36).substr(2, 9)
                  });
                  setView('create');
                }}
                className="w-full h-12 sm:h-14 bg-[#59CBC8] text-slate-900 rounded-[20px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
              >
                <Plus size={20} strokeWidth={4} />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider">{t.admin_new_service}</span>
              </button>
            </div>
          </div>

          {/* Toggle Button - Animated Chevron */}
          <div className="w-full flex justify-center mt-0 mb-8 relative z-20">
            <button
              onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
              className="px-6 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-3 active:scale-95 transition-all group hover:bg-white/10"
            >
              <div className={`text-[#59CBC8] group-hover:text-[#59CBC8]/80 transition-colors`}>
                <ChevronDown
                  size={20}
                  className={`transition-all duration-300 ${isHeaderCollapsed ? 'rotate-0' : 'rotate-180'} animate-bounce`}
                  strokeWidth={3}
                />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#59CBC8]">
                {isHeaderCollapsed ? t.admin_show_filters : t.admin_hide_filters}
              </span>
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto pb-28 flex flex-col gap-3 hide-scrollbar"
          >
            {filteredServices.map((s) => (
              <div
                key={s.id}
                className={`bg-white/5 backdrop-blur-md rounded-[35px] p-3 sm:p-4 border border-white/10 flex items-center justify-between group animate-slide-up relative ${s.status === 'suspended' ? 'opacity-50' : 'opacity-100'} ${openMenuId === s.id ? 'z-50' : 'z-0'}`}
              >
                <div
                  className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 cursor-pointer"
                  onClick={() => { setEditingId(s.id); setFormData({ ...s }); setView('edit'); setOpenMenuId(null); }}
                >
                  <img src={s.imageUrl} className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] object-cover border border-white/10 shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <h4 className="text-sm sm:text-md font-black text-white uppercase tracking-tighter leading-tight break-words">{s.title}</h4>
                    <span className="text-[7px] font-black text-[#59CBC8] uppercase tracking-widest truncate block mt-1">
                      {s.subcategories && s.subcategories.length > 0
                        ? s.subcategories.join(', ')
                        : s.subcategory}
                    </span>
                    <div className="flex items-center gap-2 mt-1 opacity-60">
                      <MapPin size={8} className="text-white" />
                      <span className="text-[8px] text-white font-bold uppercase">{s.canton}, {s.province}</span>
                    </div>
                  </div>
                </div>

                {/* Menú de tres puntos */}
                <div className="relative ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === s.id ? null : s.id);
                    }}
                    className="p-2.5 sm:p-3 bg-white/5 text-white/60 hover:text-white rounded-[15px] border border-white/10 active:scale-90 transition-all"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === s.id && (
                    <>
                      {/* Overlay para cerrar */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenMenuId(null)}
                      ></div>

                      {/* Menu */}
                      <div className="absolute right-0 top-12 bg-[#0f172a] border border-white/20 rounded-[20px] p-2 min-w-[200px] shadow-2xl z-50 animate-pop-in">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(s.id);
                            setFormData({ ...s });
                            setView('edit');
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-white/10 rounded-[15px] transition-all group"
                        >
                          <Edit2 size={16} className="text-[#59CBC8]" />
                          <span className="text-sm font-bold uppercase tracking-wide">{t.admin_edit_details}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(s);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-white/10 rounded-[15px] transition-all group"
                        >
                          {s.status === 'active' ? (
                            <>
                              <Pause size={16} className="text-[#D9B061]" />
                              <span className="text-sm font-bold uppercase tracking-wide">{t.admin_pause_service}</span>
                            </>
                          ) : (
                            <>
                              <Play size={16} className="text-emerald-500" />
                              <span className="text-sm font-bold uppercase tracking-wide">{t.admin_activate_service}</span>
                            </>
                          )}
                        </button>

                        <div className="h-px bg-white/10 my-2"></div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(s.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500 hover:bg-red-500/10 rounded-[15px] transition-all group"
                        >
                          <Trash2 size={16} />
                          <span className="text-sm font-bold uppercase tracking-wide">{t.delete}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {filteredServices.length === 0 && (
              <div className="py-10 text-center opacity-40">
                <p className="text-xs font-bold text-white uppercase">{t.admin_no_results}</p>
              </div>
            )}
          </div >
        </div >
      ) : (
        <div className="flex-1 flex flex-col overflow-y-auto px-2.5 sm:px-6 md:px-8 pb-6 sm:pb-7 md:pb-8 animate-page-in hide-scrollbar relative z-10">
          <div className="flex items-center gap-5 mb-8">
            <button onClick={() => setView('list')} className="w-12 h-12 bg-white/5 text-[#59CBC8] rounded-[18px] border border-white/10 active:scale-90 transition-all flex items-center justify-center shrink-0">
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
            <h3 className="text-2xl sm:text-3xl font-[1000] text-white tracking-tighter uppercase leading-tight">
              {view === 'edit' ? t.admin_edit_title : t.admin_create_title}
            </h3>
          </div>

          <div className="mb-12 space-y-6">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#59CBC8]/20 rounded-2xl flex items-center justify-center text-[#59CBC8] border border-[#59CBC8]/30 shadow-[0_0_20px_rgba(89,203,200,0.2)] shrink-0">
                  <Link2 size={26} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base sm:text-lg font-[1000] text-white uppercase tracking-tight leading-tight">Generador de Links (ImgBB)</h4>
                  <p className="text-[10px] sm:text-[11px] font-black text-[#59CBC8] uppercase tracking-widest opacity-80 decoration-[#59CBC8]/30">Galerías externas y links directos</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[30px] p-5 sm:p-6 space-y-5">
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.createElement('input');
                      el.type = 'file';
                      el.accept = 'image/*';
                      el.onchange = (e) => handleImgbbUpload(e as any);
                      el.click();
                    }}
                    disabled={isImgbbUploading}
                    className="w-full py-5 bg-[#59CBC8]/10 border-2 border-[#59CBC8]/30 rounded-[22px] flex flex-col items-center justify-center gap-2 active:scale-95 transition-all text-white hover:bg-[#59CBC8]/20 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      {isImgbbUploading ? <Loader2 className="animate-spin text-[#59CBC8]" size={24} /> : <Upload size={24} className="text-[#59CBC8]" strokeWidth={3} />}
                      <span className="text-xs sm:text-sm font-[1000] uppercase tracking-widest">{isImgbbUploading ? 'Subiendo...' : 'SUBIR IMAGEN'}</span>
                    </div>
                    {!isImgbbUploading && <span className="text-[9px] font-black text-white/40 uppercase tracking-[2px]">Genera el link de tu imagen aquí</span>}
                  </button>

                  {imgbbResultUrl && (
                    <div className="animate-page-in flex flex-col gap-3">
                      <div className="flex items-center bg-slate-900/80 rounded-[22px] p-2 pl-5 border-2 border-emerald-500/40 shadow-xl overflow-hidden group">
                        <input
                          type="text"
                          readOnly
                          value={imgbbResultUrl}
                          className="bg-transparent flex-1 text-[11px] sm:text-xs text-emerald-400 font-mono font-bold outline-none py-2"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(imgbbResultUrl)}
                          className="p-3 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/20 rounded-[15px] transition-all active:scale-90 shrink-0 flex items-center justify-center border border-emerald-500/10"
                        >
                          <Copy size={18} strokeWidth={3} />
                        </button>
                      </div>
                      <p className="text-[10px] font-black text-[#59CBC8] uppercase text-center tracking-widest opacity-80">¡Link generado con éxito!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="h-px bg-white/5 mx-4"></div>
          </div>

          {saveError && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-[25px] flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-red-500 leading-relaxed uppercase">{saveError}</p>
            </div>
          )}



          <form className="space-y-12">
            {/* UPLOAD STATUS & PROGRESS */}
            {(isUploading || showSuccess) && !isKeyboardVisible && (
              <div className="fixed inset-x-0 bottom-10 px-6 z-[100] animate-page-in">
                <div className={`p-6 rounded-[35px] border backdrop-blur-3xl shadow-2xl flex flex-col gap-4 ${showSuccess ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-[#0f172a]/95 border-white/20'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${showSuccess ? 'bg-emerald-500/20 text-emerald-500' : 'bg-[#59CBC8]/20 text-[#59CBC8]'}`}>
                        {showSuccess ? <CheckCircle2 size={24} /> : (uploadingTarget === 'video' ? <Video size={24} /> : <ImageIconLucide size={24} />)}
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-widest ${showSuccess ? 'text-emerald-500' : 'text-[#59CBC8]'}`}>
                          {showSuccess ? t.admin_upload_completed : t.admin_uploading_multimedia}
                        </p>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                          {showSuccess ? t.admin_file_ready : uploadStatus}
                        </p>
                      </div>
                    </div>
                    {showSuccess && <div className="text-emerald-500 font-black text-xs">OK</div>}
                  </div>

                  {!showSuccess && (
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#59CBC8] to-[#00E7DB] transition-all duration-300 shadow-[0_0_15px_rgba(89,203,200,0.5)]"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FOTO DE PORTADA */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <SettingsIcon size={14} className="text-[#59CBC8]" />
                <span className="text-[10px] font-black text-white uppercase tracking-[4px]">{t.admin_pub_status}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'active' })}
                  className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase border transition-all ${formData.status === 'active' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 text-white/40 border-white/10'}`}
                >
                  {t.admin_active}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'suspended' })}
                  className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase border transition-all ${formData.status === 'suspended' ? 'bg-[#D9B061] text-white border-[#D9B061]' : 'bg-white/5 text-white/40 border-white/10'}`}
                >
                  {t.admin_paused}
                </button>
              </div>
            </section>

            {/* SECCIÓN 1: IDENTIFICACIÓN */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Type size={14} className="text-[#59CBC8]" />
                <span className="text-[10px] font-black text-white uppercase tracking-[4px]">{t.admin_prof_id}</span>
              </div>
              <div>
                <label className={labelStyle}>{t.admin_biz_name}</label>
                <input
                  type="text"
                  placeholder={t.admin_biz_placeholder}
                  className={inputStyle}
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  autoComplete="organization"
                  autoCorrect="on"
                  spellCheck="true"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <CustomSelect label={`${t.search_category} *`} value={formData.category} onClick={openFormCategoryPicker} iconName={categories.find(c => c.name === formData.category)?.icon} />
                <CustomSelect
                  label={`${t.admin_select_specialties} *`}
                  value={formData.subcategories}
                  onClick={openFormSubcategoryPicker}
                  disabled={!formData.category}
                  iconName="Layers"
                  isMulti={true}
                />
              </div>
              <div>
                <label className={labelStyle}>{t.admin_desc_detailed}</label>
                <textarea
                  rows={4}
                  className={`${inputStyle} h-40 resize-none`}
                  placeholder={t.admin_desc_placeholder}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  autoComplete="off"
                  autoCorrect="on"
                  spellCheck="true"
                ></textarea>
              </div>
            </section>

            {/* SECCIÓN 2: UBICACIÓN Y MAPAS */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <MapIcon size={14} className="text-[#59CBC8]" />
                <span className="text-[10px] font-black text-white uppercase tracking-[4px]">{t.admin_geo_loc}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <CustomSelect
                    label={`${t.geo_title_province} *`}
                    value={formData.province}
                    onClick={openFormProvincePicker}
                    iconName="MapPin"
                  />
                </div>
                <div>
                  <CustomSelect
                    label={`${t.geo_title_city} *`}
                    value={formData.canton}
                    onClick={openFormCantonPicker}
                    disabled={!formData.province}
                    iconName="Navigation"
                  />
                </div>
              </div>

              <div>
                <label className={labelStyle}>{t.admin_address_exact}</label>
                <input
                  type="text"
                  placeholder={t.admin_address_placeholder}
                  className={inputStyle}
                  value={formData.location?.address}
                  onChange={e => setFormData({ ...formData, location: { ...formData.location, address: e.target.value, lat: 0, lng: 0 } })}
                  autoComplete="street-address"
                  autoCorrect="on"
                  spellCheck="true"
                />
              </div>
              <div>
                <label className={labelStyle}>{t.admin_maps_link}</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="url"
                    placeholder={t.admin_maps_placeholder}
                    className={`${inputStyle} pl-12`}
                    value={formData.mapsUrl}
                    onChange={e => setFormData({ ...formData, mapsUrl: e.target.value })}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: CONTACTO Y MULTIMEDIA */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <ImageIcon size={14} className="text-[#59CBC8]" />
                <span className="text-[10px] font-black text-white uppercase tracking-[4px]">{t.admin_multi_contact}</span>
              </div>

              <div>
                <label className={labelStyle}>{t.admin_cover_image}</label>
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading && uploadingTarget === 'cover'}
                    className={`
                      w-full h-16 rounded-[22px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] relative overflow-hidden
                      ${formData.imageUrl ? 'bg-white/5 border border-white/10' : 'bg-[#59CBC8] text-slate-900 shadow-[0_10px_30px_rgba(89,203,200,0.2)]'}
                      disabled:opacity-50
                    `}
                  >
                    {isUploading && uploadingTarget === 'cover' ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">{uploadStatus}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} strokeWidth={3} />
                        <span className="text-xs font-black uppercase tracking-widest">
                          {formData.imageUrl ? t.admin_change_img : t.admin_upload_img}
                        </span>
                      </>
                    )}
                  </button>

                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />

                  {formData.imageUrl && !isUploading && (
                    <div className="relative group rounded-[30px] overflow-hidden border border-white/10">
                      <div className="relative h-48">
                        <img src={formData.imageUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-xs font-black text-white uppercase tracking-widest border border-white/30 flex items-center gap-2 hover:bg-white/30 transition-all active:scale-95"
                          >
                            <ImageIconLucide size={16} /> {t.admin_change_img}
                          </button>
                        </div>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-[#59CBC8] text-slate-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-xl">{t.admin_current_cover}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">O pega un enlace directo abajo si ya lo tienes</span>
                  </div>
                  <input
                    type="text"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className={inputStyle}
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={labelStyle}>{t.admin_promo_video}</label>
                <div className="flex gap-2 items-center">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{t.admin_opt_upload_video}</span>
                    </div>
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="h-24 rounded-[25px] bg-white/5 border border-white/10 flex items-center justify-center gap-3 cursor-pointer hover:bg-white/10 transition-all text-white/60 hover:text-white"
                    >
                      {isUploading && uploadingTarget === 'video' ? <Loader2 className="animate-spin" /> : <Video size={20} />}
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {formData.promoVideoUrl ? t.admin_change_video : t.admin_select_video}
                      </span>
                    </div>
                    <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{t.admin_opt_paste_link}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="https://ejemplo.com/video.mp4"
                      className={inputStyle}
                      value={formData.promoVideoUrl || ''}
                      onChange={e => setFormData({ ...formData, promoVideoUrl: e.target.value })}
                    />
                    {formData.promoVideoUrl && (
                      <div className="mt-2 text-[10px] text-green-400 flex items-center gap-2">
                        <CheckCircle2 size={12} /> {t.admin_video_linked}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Galería de Trabajos</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {formData.gallery?.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-[15px] overflow-hidden group border transition-all ${selectedGalleryIdx === idx ? 'border-[#59CBC8] scale-95 ring-2 ring-[#59CBC8]/50' : 'border-white/10'}`}
                    >
                      <img
                        src={img}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedGalleryIdx(selectedGalleryIdx === idx ? null : idx)}
                      />

                      {/* Overlays */}
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity pointer-events-none ${selectedGalleryIdx === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {selectedGalleryIdx === idx ? (
                          <div className="bg-[#59CBC8] p-1.5 rounded-full text-slate-900 shadow-lg">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        ) : (
                          <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full text-white shadow-lg">
                            <Eye size={12} />
                          </div>
                        )}
                      </div>

                      {/* Botón de Reemplazar (Editar) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplacingGalleryIdx(idx);
                          galleryInputRef.current?.setAttribute('multiple', 'false');
                          galleryInputRef.current?.click();
                          // Volver a 'multiple' después de un momento
                          setTimeout(() => galleryInputRef.current?.setAttribute('multiple', 'true'), 500);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[#59CBC8] hover:text-slate-900 active:scale-90"
                      >
                        <Icons.Pencil size={12} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isUploading && uploadingTarget === 'gallery'}
                    className="relative aspect-square rounded-[15px] bg-[#59CBC8]/10 border-2 border-dashed border-[#59CBC8]/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#59CBC8]/20 transition-all text-[#59CBC8] active:scale-95 disabled:opacity-50"
                  >
                    {isUploading && uploadingTarget === 'gallery' ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Plus size={20} strokeWidth={3} />
                        <span className="text-[7px] font-black uppercase">{t.admin_add_more}</span>
                      </>
                    )}
                  </button>
                </div>
                <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, true)} />

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder={t.admin_paste_url_extra}
                    className={inputStyle}
                    value={galleryUrlInput}
                    onChange={(e) => setGalleryUrlInput(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={selectedGalleryIdx === null}
                      className={`w-14 h-14 rounded-[18px] flex items-center justify-center transition-all ${selectedGalleryIdx !== null ? 'bg-red-500 text-white shadow-[0_5px_15px_rgba(239,68,68,0.4)] active:scale-90' : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed opacity-40'}`}
                      onClick={async () => {
                        if (selectedGalleryIdx !== null && formData.gallery) {
                          const imgToDelete = formData.gallery[selectedGalleryIdx];
                          // 1. Borrar de Storage
                          await deleteFromStorage(imgToDelete);

                          // 2. Borrar de la UI
                          setFormData(prev => ({
                            ...prev,
                            gallery: prev.gallery?.filter((_, i) => i !== selectedGalleryIdx)
                          }));
                          setSelectedGalleryIdx(null);
                        }
                      }}
                      title={selectedGalleryIdx !== null ? "Eliminar imagen seleccionada" : "Selecciona una imagen para borrar"}
                    >
                      <Trash2 size={20} />
                    </button>
                    <button
                      type="button"
                      className="flex-1 bg-[#59CBC8] text-slate-900 font-black text-xs uppercase tracking-widest px-4 rounded-[18px] hover:bg-[#4ab8b5] transition-all active:scale-95 flex items-center justify-center gap-2"
                      onClick={() => {
                        if (galleryUrlInput) {
                          setFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), galleryUrlInput] }));
                          setGalleryUrlInput('');
                        }
                      }}
                    >
                      <Plus size={18} strokeWidth={3} />
                      {/* {galleryUrlInput ? 'Añadir Link' : ''} */}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelStyle}>{t.admin_wa_auto_msg}</label>
                  <input
                    type="text"
                    placeholder={t.detail_wa_message}
                    className={inputStyle}
                    value={formData.whatsappMessage || ''}
                    onChange={e => setFormData({ ...formData, whatsappMessage: e.target.value })}
                    autoComplete="off"
                    autoCorrect="on"
                    spellCheck="true"
                  />
                </div>
                <div>
                  <label className={labelStyle}>{t.admin_wa_number}</label>
                  <input
                    type="tel"
                    placeholder="593999999999"
                    className={inputStyle}
                    value={formData.whatsappNumber}
                    onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Link2 size={14} className="text-[#59CBC8]" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[4px]">{t.admin_social_opt}</span>
                </div>

                <div>
                  <label className={labelStyle}>Instagram</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/tu_perfil"
                    className={inputStyle}
                    value={formData.socialUrls?.instagram || ''}
                    onChange={e => setFormData({
                      ...formData,
                      socialUrls: { ...formData.socialUrls, instagram: e.target.value }
                    })}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>

                <div>
                  <label className={labelStyle}>TikTok</label>
                  <input
                    type="url"
                    placeholder="https://tiktok.com/@tu_perfil"
                    className={inputStyle}
                    value={formData.socialUrls?.tiktok || ''}
                    onChange={e => setFormData({
                      ...formData,
                      socialUrls: { ...formData.socialUrls, tiktok: e.target.value }
                    })}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>

                <div>
                  <label className={labelStyle}>Facebook</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/tu_perfil"
                    className={inputStyle}
                    value={formData.socialUrls?.facebook || ''}
                    onChange={e => setFormData({
                      ...formData,
                      socialUrls: { ...formData.socialUrls, facebook: e.target.value }
                    })}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
              </div>
            </section>
          </form>

          <div className="pt-8 pb-40 w-full">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-16 bg-[#59CBC8] text-slate-900 rounded-full font-black text-[14px] tracking-[4px] uppercase shadow-[0_10px_40px_rgba(89,203,200,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} strokeWidth={2.5} />}
              {isSaving ? t.admin_saving : (view === 'edit' ? t.admin_save_changes : t.admin_new_service)}
            </button>
          </div>
        </div>
      )
      }



      {/* REUSABLE PICKER MODAL (FOR FILTERS & FORM) */}
      {
        pickerConfig.isOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-[#0f172a] w-full max-w-lg h-[70vh] rounded-t-[40px] sm:rounded-[40px] border border-white/10 flex flex-col animate-slide-up shadow-2xl relative">
              <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                <h3 className="text-white font-[1000] uppercase tracking-wider text-sm">{pickerConfig.title}</h3>
                <button onClick={() => setPickerConfig(p => ({ ...p, isOpen: false }))} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/60 active:scale-90"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 hide-scrollbar">
                {pickerConfig.options.map((opt, i) => {
                  const isSelected = pickerConfig.multiSelect
                    ? Array.isArray(pickerConfig.currentValue) && pickerConfig.currentValue.includes(opt.value)
                    : pickerConfig.currentValue === opt.value;

                  return (
                    <button
                      key={i}
                      onClick={() => pickerConfig.onSelect(opt.value)}
                      className={`w-full p-4 rounded-[20px] border flex items-center justify-between transition-all active:scale-[0.98] ${isSelected ? 'bg-[#59CBC8] border-[#59CBC8] text-slate-900' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-3">
                        {opt.icon && getLucideIcon(opt.icon, 18, isSelected ? "text-slate-900" : "text-white/60")}
                        <span className="text-xs font-black uppercase tracking-wide">{opt.label}</span>
                      </div>
                      {isSelected && <CheckCircle2 size={18} />}
                    </button>
                  );
                })}
              </div>
              {pickerConfig.multiSelect && (
                <div className="p-6 border-t border-white/10 bg-[#0f172a] rounded-b-[40px]">
                  <button onClick={() => setPickerConfig(p => ({ ...p, isOpen: false }))} className="w-full h-14 bg-[#59CBC8] rounded-full text-slate-900 font-black uppercase tracking-[2px] text-xs">{t.admin_done}</button>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {
        deleteConfirmId && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-[#0f172a] border border-red-500/30 w-full max-w-md rounded-[35px] p-6 relative shadow-2xl animate-pop-in">
              <button onClick={() => { setDeleteConfirmId(null); setDeleteConfirmText(''); }} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-white/60 hover:text-white">
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase text-sm tracking-wide">{t.admin_delete_confirm_title}</h3>
                  <p className="text-[10px] text-white/40">{t.admin_delete_confirm_desc}</p>
                </div>
              </div>

              <p className="text-white/60 text-xs mb-4">
                {t.admin_delete_confirm_instruction.replace('{keyword}', t.admin_delete_keyword.toUpperCase())}
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={t.admin_delete_confirm_placeholder.replace('{keyword}', t.admin_delete_keyword)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500/50 mb-4"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  onClick={() => { setDeleteConfirmId(null); setDeleteConfirmText(''); }}
                  className="flex-1 py-3 bg-white/5 text-white rounded-xl text-xs font-black uppercase border border-white/10"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteConfirmText.toLowerCase() !== t.admin_delete_keyword.toLowerCase()}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-black uppercase disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {t.delete}
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
};

export default AdminDashboard;
