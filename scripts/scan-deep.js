import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

async function scanDeep() {
  console.log("📂 Profundizando escaneo en 'categories'...");
  
  try {
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);

    const listRef = ref(storage, "categories");
    const res = await listAll(listRef);
    
    console.log(`✅ Se encontraron ${res.items.length} imágenes en '/categories/':`);
    
    for (const itemRef of res.items) {
      const url = await getDownloadURL(itemRef);
      console.log(`   - ID PROBABLE: ${itemRef.name.split('.')[0]} | ARCHIVO: ${itemRef.name} | URL: ${url.substring(0, 80)}...`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR AL ESCANEAR CATEGORIES:", error);
    process.exit(1);
  }
}

scanDeep();
