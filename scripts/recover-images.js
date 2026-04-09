import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, updateDoc, collection, getDocs, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

async function recoverImages() {
  console.log("🛠 Iniciando proceso de RE-VINCULACIÓN de imágenes con IDs LIMPIOS...");
  
  try {
    const querySnapshot = await getDocs(collection(db, "categories"));
    console.log(`📊 Procesando ${querySnapshot.size} categorías desde Firestore...`);

    for (const docSnap of querySnapshot.docs) {
      const catId = docSnap.id;
      const catData = docSnap.data();

      console.log(`🔍 Buscando imagen para: ${catData.name} (ID: ${catId})...`);
      
      // Intentamos en la carpeta categories/[catId]
      const catRef = ref(storage, `categories/${catId}`);
      
      try {
        const res = await listAll(catRef);
        if (res.items.length > 0) {
          // Tomamos el primer archivo como portada
          const firstItem = res.items[0];
          const url = await getDownloadURL(firstItem);
          
          console.log(`   ✅ ENCONTRADA: ${firstItem.name}. Actualizando 'imageUrl'...`);
          
          await updateDoc(doc(db, "categories", catId), {
            imageUrl: url,
            imageCover: url // Por si acaso
          });
          
          console.log(`   ✨ Vinculado con éxito.`);
        } else {
          console.log(`   🟡 Carpeta vacía o sin imágenes.`);
        }
      } catch (e) {
        // Carpeta no existe o error de lectura
        // console.log(`   ⚪ Sin carpeta específica.`);
      }
    }

    console.log("\n🏁 RECUPERACIÓN TERMINADA. Por favor, reinicia la app.");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR DURANTE LA RECUPERACIÓN:", error);
    process.exit(1);
  }
}

recoverImages();
