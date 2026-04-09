
import { Category } from './types';

export const CATEGORIES: Category[] = [
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
      'Ropa', 'Zapatos', 'Muebles', 'Cocinas y maquinaria'
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

export const PROVINCES = [
  { id: 'azuay', name: 'Azuay', region: 'Sierra', cantons: ['Cuenca', 'Gualaceo', 'Paute', 'Sigsig', 'Girón', 'Santa Isabel'] },
  { id: 'bolivar', name: 'Bolívar', region: 'Sierra', cantons: ['Guaranda', 'Chillanes', 'Chimbo', 'Echeandía', 'San Miguel'] },
  { id: 'canar', name: 'Cañar', region: 'Sierra', cantons: ['Azogues', 'Biblián', 'Cañar', 'La Troncal', 'Suscal'] },
  { id: 'carchi', name: 'Carchi', region: 'Sierra', cantons: ['Tulcán', 'Bolívar', 'El Ángel', 'Mira', 'San Gabriel'] },
  { id: 'cotopaxi', name: 'Cotopaxi', region: 'Sierra', cantons: ['Latacunga', 'La Maná', 'El Corazón', 'Pujilí', 'Salcedo', 'Saquisilí'] },
  { id: 'chimborazo', name: 'Chimborazo', region: 'Sierra', cantons: ['Riobamba', 'Alausí', 'Chambo', 'Chunchi', 'Guano', 'Pallatanga'] },
  { id: 'el-oro', name: 'El Oro', region: 'Costa', cantons: ['Machala', 'Arenillas', 'Atahualpa', 'Huaquillas', 'Pasaje', 'Piñas', 'Santa Rosa'] },
  { id: 'esmeraldas', name: 'Esmeraldas', region: 'Costa', cantons: ['Esmeraldas', 'Atacames', 'Eloy Alfaro', 'Muisne', 'Quinindé', 'San Lorenzo', 'Tonsupa', 'Mompiche'] },
  { id: 'guayas', name: 'Guayas', region: 'Costa', cantons: ['Guayaquil', 'Samborondón', 'Duran', 'Milagro', 'Daule', 'Playas', 'Naranjal'] },
  { id: 'imbabura', name: 'Imbabura', region: 'Sierra', cantons: ['Ibarra', 'Otavalo', 'Cotacachi', 'Atuntaqui', 'Pimampiro'] },
  { id: 'loja', name: 'Loja', region: 'Sierra', cantons: ['Loja', 'Catamayo', 'Saraguro', 'Cariamanga', 'Macará', 'Zapotillo'] },
  { id: 'los-rios', name: 'Los Ríos', region: 'Costa', cantons: ['Babahoyo', 'Quevedo', 'Buena Fe', 'Vinces', 'Ventanas'] },
  { id: 'manabi', name: 'Manabí', region: 'Costa', cantons: ['Portoviejo', 'Manta', 'Chone', 'Bahía de Caráquez', 'Jipijapa', 'Pedernales'] },
  { id: 'morona-santiago', name: 'Morona Santiago', region: 'Oriente', cantons: ['Macas', 'Gualaquiza', 'Limón', 'Sucúa'] },
  { id: 'napo', name: 'Napo', region: 'Oriente', cantons: ['Tena', 'Archidona', 'El Chaco', 'Baeza'] },
  { id: 'pastaza', name: 'Pastaza', region: 'Oriente', cantons: ['Puyo', 'Mera', 'Santa Clara', 'Arajuno'] },
  { id: 'pichincha', name: 'Pichincha', region: 'Sierra', cantons: ['Quito', 'Sangolquí', 'Machachi', 'Cayambe', 'Tabacundo', 'Puerto Quito'] },
  { id: 'tungurahua', name: 'Tungurahua', region: 'Sierra', cantons: ['Ambato', 'Baños', 'Pelileo', 'Píllaro', 'Quero'] },
  { id: 'zamora-chinchipe', name: 'Zamora Chinchipe', region: 'Oriente', cantons: ['Zamora', 'Chinchipe', 'Yantzaza', 'Panguintza'] },
  { id: 'galapagos', name: 'Galápagos', region: 'Insular', cantons: ['Santa Cruz', 'San Cristóbal', 'Isabela', 'Floreana', 'Puerto Ayora', 'Puerto Baquerizo Moreno', 'Puerto Villamil', 'Puerto Velasco Ibarra'] },
  { id: 'sucumbios', name: 'Sucumbíos', region: 'Oriente', cantons: ['Nueva Loja', 'Shushufindi', 'Cuyabeno', 'Lago Agrio'] },
  { id: 'orellana', name: 'Orellana', region: 'Oriente', cantons: ['Puerto Francisco de Orellana', 'Aguarico', 'La Joya de los Sachas'] },
  { id: 'santa-elena', name: 'Santa Elena', region: 'Costa', cantons: ['Santa Elena', 'Salinas', 'La Libertad'] },
  { id: 'santo-domingo', name: 'Santo Domingo', region: 'Costa', cantons: ['Santo Domingo', 'La Concordia'] }
];

export const ADMIN_CREDENTIALS = {
  email: 'admin@admin.com',
  password: 'xavier@tdj751234567'
};

export const WHATSAPP_CONFIG = {
  number: '593987246441',
  displayNumber: '+593 98 724 6441',
  adminName: 'Administración Matriz',
  defaultMessage: 'Hola, quisiera ponerme en contacto con la Administración Matriz para publicar mi servicio en la app de Services.'
};
