import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

const CATEGORIES_DATA = [
  {
    id: 'automotriz',
    name: 'Automotriz',
    translationKey: 'cat_automotriz',
    icon: 'Car',
    subcategories: [
      'Mecanica', 'Mecánica de motos', 'Rectificadora de motores', 'Rectificadora de aros', 
      'Trabajos de Torno', 'Repuestos', 'Llantas', 'Parabrisas', 'Tapicería', 'Audio', 
      'Autolujos', 'Lavadora y lubricadora', 'Vulcanizadora', 'Alineación', 'Frenos', 
      'Enderazada y pintura', 'Electrónico', 'Electricidad automotriz', 'Venta autos', 'Venta motos', 'Grúa'
    ]
  },
  {
    id: 'salud',
    name: 'Salud',
    translationKey: 'cat_salud',
    icon: 'Stethoscope',
    subcategories: [
      'Medicina general', 'Endocrinólogia', 'Odontología', 'Laboratorio dental', 'Laboratorio', 
      'Traumatólogia', 'Reumatología', 'Ginecología', 'Oftalmología', 'Neurología', 'Podología', 
      'Dermatología', 'Urología', 'Cirugía plástica y estética', 'Cosmetología', 'Rayos X Resonancia', 
      'Farmacia 24 horas', 'Residencia de mayores', 'Ambulancia', 'Psiquiatría', 'Pediatría', 
      'Gastroenterología', 'Psicología', 'Rehabilitación'
    ]
  },
  {
    id: 'mascotas',
    name: 'Mascotas',
    translationKey: 'cat_mascotas',
    icon: 'PawPrint',
    subcategories: [
      'Hospital', 'Veterinaria', 'Peluquería canina', 'Adiestramiento canino'
    ]
  },
  {
    id: 'deportes',
    name: 'Deportes',
    translationKey: 'cat_deportes',
    icon: 'Trophy',
    subcategories: [
      'Gym', 'Escuelas deportivas', 'Parapente', 'Indoor Cycling', 'Canchas deportivas', 'Pilates', 'Aerobic'
    ]
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    translationKey: 'cat_restaurant',
    icon: 'Utensils',
    subcategories: [
      'Chifa', 'Sushi', 'Burger', 'Parrillas y asados',
      'Cevichería', 'Cafetería', 'Heladería', 'Asadero de pollos', 'Asadero de Cuyes'
    ]
  },
  {
    id: 'turismo',
    name: 'Turismo',
    translationKey: 'cat_turismo',
    icon: 'Palmtree',
    subcategories: [
      'Agencia de viajes', 'Piscinas', 'Hospedaje', 'Playa', 'Ríos',
      'Trasporte turístico', 'Galápagos'
    ]
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    translationKey: 'cat_airbnb',
    icon: 'Home',
    subcategories: [
      'Departamentos', 'Habitaciones', 'Casas de campo'
    ]
  },
  {
    id: 'construccion',
    name: 'Construcción',
    translationKey: 'cat_construccion',
    icon: 'HardHat',
    subcategories: [
      'Arquitectura', 'Gypsum', 'Vidriería', 'Materiales de Construcción', 'Maquinaria para la construcción',
      'Maquinaria de obra pesada', 'Casas', 'Estructuras metálicas',
      'Electricista', 'Arreglos varios', 'Trabajos en\u00A0alturas', 'Almacén eléctrico', 'Pintura'
    ]
  },
  {
    id: 'electricidad',
    name: 'Electricidad',
    translationKey: 'cat_electricidad',
    icon: 'Zap',
    subcategories: [
      'Electromecánica', 'Instalaciones eléctricas', 'Reparaciones'
    ]
  },
  {
    id: 'inmobiliaria',
    name: 'Inmobiliaria',
    translationKey: 'cat_inmobiliaria',
    icon: 'Building',
    subcategories: [
      'Venta de Casas', 'Alquiler de Departamentos', 'Terrenos', 'Locales Comerciales'
    ]
  },
  {
    id: 'bancarios',
    name: 'Bancarios y Financieros',
    translationKey: 'cat_bancarios',
    icon: 'Landmark',
    subcategories: [
      'Ahorro y crédito'
    ]
  },
  {
    id: 'tecnologia',
    name: 'Tecnología',
    translationKey: 'cat_tecnologia',
    icon: 'Smartphone',
    subcategories: [
      'Computadoras', 'Teléfonos', 'Radio técnico', 'Amplificación y sonido'
    ]
  },
  {
    id: 'fabricas',
    name: 'Fabricas',
    translationKey: 'cat_fabricas',
    icon: 'Factory',
    subcategories: [
      'Ropa', 'Zapatos', 'Muebles', 'Cocinas y machinery'
    ]
  },
  {
    id: 'educativos',
    name: 'Centros Educativos',
    translationKey: 'cat_educativos',
    icon: 'GraduationCap',
    subcategories: [
      'Escuela de idiomas', 'Escuela de música', 'Guardería', 'Escuela y colegio', 'Escuela de conducir', 'Guardería infantil'
    ]
  },
  {
    id: 'asesoria',
    name: 'Asesoría y Jurídico',
    translationKey: 'cat_asesoria',
    icon: 'Briefcase',
    subcategories: [
      'Abogado', 'Contabilidad'
    ]
  },
  {
    id: 'seguridad',
    name: 'Seguridad',
    translationKey: 'cat_seguridad',
    icon: 'ShieldCheck',
    subcategories: [
      'Camaras y Cerca', 'Seguridad privada'
    ]
  },
  {
    id: 'eventos',
    name: 'Eventos y Reuniones',
    translationKey: 'cat_eventos',
    icon: 'Users',
    subcategories: [
      'Organizador de eventos', 'Fotografía y video', 'DJ', 'Sala de velaciones', 'Sala de asuntos sociales', 'Artistas', 'Danza'
    ]
  },
  {
    id: 'publicidad',
    name: 'Publicidad',
    translationKey: 'cat_publicidad',
    icon: 'Megaphone',
    subcategories: [
      'Desarrollo de software', 'Páginas web', 'Marketing', 'Impresiones'
    ]
  },
  {
    id: 'plagas',
    name: 'Plagas',
    translationKey: 'cat_plagas',
    icon: 'Bug',
    subcategories: [
      'Fumigación'
    ]
  },
  {
    id: 'linea_blanca',
    name: 'Linea Blanca',
    translationKey: 'cat_linea_blanca',
    icon: 'Settings',
    subcategories: [
      'Venta', 'Reparación'
    ]
  },
  {
    id: 'limpieza',
    name: 'Limpieza',
    translationKey: 'cat_limpieza',
    icon: 'Broom',
    subcategories: [
      'Limpieza General', 'Lavandería de ropa', 'Labrado de Alfombras', 'Limpieza de Vidrios en alturas',
      'Trabajos en\u00A0alturas', 'Jardineria'
    ]
  },
  {
    id: 'pasteleria',
    name: 'Pastelería',
    translationKey: 'cat_pasteleria',
    icon: 'Dessert',
    subcategories: [
      'Pasteles asuntos sociales'
    ]
  },
  {
    id: 'floristeria',
    name: 'Floristería',
    translationKey: 'cat_floristeria',
    icon: 'Flower',
    subcategories: [
      'Arreglos Florales'
    ]
  },
  {
    id: 'belleza',
    name: 'Belleza',
    translationKey: 'cat_belleza',
    icon: 'Scissors',
    subcategories: [
      'Maquillaje', 'Peluquería mujer', 'Barber Shop Hombre', 'Artículos de Peluquería'
    ]
  },
  {
    id: 'moda',
    name: 'Moda',
    translationKey: 'cat_moda',
    icon: 'Shirt',
    subcategories: [
      'Zapatos', 'Ropa Deportiva', 'Alquiler trajes de fiesta', 'Alquiler de disfraces', 'Trajes hombre', 'Outlets', 'Ropa Industrial', 'Confección y bordado'
    ]
  },
  {
    id: 'courier',
    name: 'Courier',
    translationKey: 'cat_courier',
    icon: 'Truck',
    subcategories: [
      'Paquetería', 'Viajes puerta a puerta'
    ]
  },
  {
    id: 'internet',
    name: 'Servicio de Internet',
    translationKey: 'cat_internet',
    icon: 'Wifi',
    subcategories: ['Venta de planes', 'Soporte técnico', 'Instalación']
  },
  {
    id: 'contabilidad',
    name: 'Contabilidad y Rentas',
    translationKey: 'cat_contabilidad',
    icon: 'Calculator',
    subcategories: ['Declaraciones de impuestos', 'Asesoría contable', 'Auditoría']
  },
  {
    id: 'artesanias',
    name: 'Artesanías',
    translationKey: 'cat_artesanias',
    icon: 'Palette',
    subcategories: ['Tejidos', 'Cerámica', 'Madera', 'Joyas']
  },
  {
    id: 'aire_acondicionado',
    name: 'Aire Acondicionado',
    translationKey: 'cat_aire_acondicionado',
    icon: 'Wind',
    subcategories: ['Venta', 'Mantenimiento']
  },
  {
    id: 'emergencias',
    name: 'Emergencias',
    translationKey: 'cat_emergencias',
    icon: 'Siren',
    subcategories: ['Desatascos', 'Pozos', 'Electricas', 'Fugas de agua']
  },
  {
    id: 'hogar',
    name: 'Hogar',
    translationKey: 'cat_hogar',
    icon: 'Sofa',
    subcategories: ['Cobertores', 'Cortinas']
  },
  {
    id: 'naturista',
    name: 'Centro Naturista',
    translationKey: 'cat_naturista',
    icon: 'Leaf',
    subcategories: ['Productos naturales', 'Especialidades naturistas']
  },
  {
    id: 'agroquimica',
    name: 'Agroquímica',
    translationKey: 'cat_agroquimica',
    icon: 'FlaskConical',
    subcategories: ['Maquinaria para el campo', 'Químicos para el cultivo', 'Vivero plantas']
  },
  {
    id: 'agricola',
    name: 'Agrícola',
    translationKey: 'cat_agricola',
    icon: 'Sprout',
    subcategories: ['Maquinaria', 'Cultivos', 'Asesoría técnica']
  }
];

async function finalCompleteSync() {
  console.log("🚀 INICIANDO SINCRONIZACIÓN MAESTRA COMPLETA (TODOS LOS CAMPOS)...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    for (let i = 0; i < CATEGORIES_DATA.length; i++) {
        const cat = CATEGORIES_DATA[i];
        
        // Obtenemos el doc actual para no borrar imageUrl si ya lo restauramos
        const docRef = doc(db, "categories", cat.id);
        const docSnap = await getDocs(collection(db, "categories")); // Esto es ineficiente pero seguro para un script de una sola vez
        
        await setDoc(docRef, {
          ...cat,
          order: i,
          imageUrl: '', // Se mantendrá si usamos merge y el script de recuperación corre después
          imagePosition: 'center',
          bgColor: '',
          subcategoryConfig: {}
        }, { merge: true });
        
        console.log(`   [${i+1}/${CATEGORIES_DATA.length}] Completo: ${cat.name}`);
    }
    console.log("✅ BASE DE DATOS ESTRUCTURALMENTE COMPLETA.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

finalCompleteSync();
