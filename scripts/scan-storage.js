import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app", // Usamos el bucket oficial
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

async function listStorageFiles() {
  console.log("📂 Escaneando Firebase Storage para buscar fotos perdidas...");
  
  try {
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);

    // Intentamos listar la raíz y algunas carpetas comunes
    const roots = ["", "categories", "services", "images"];
    
    for (const path of roots) {
      console.log(`\n📁 Revisando carpeta: "${path}"`);
      const listRef = ref(storage, path);
      try {
        const res = await listAll(listRef);
        
        if (res.items.length === 0 && res.prefixes.length === 0) {
          console.log("   (Vacía)");
          continue;
        }

        res.prefixes.forEach((folderRef) => {
          console.log(`   [DIRECTORIO] ${folderRef.fullPath}`);
        });

        for (const itemRef of res.items) {
          const url = await getDownloadURL(itemRef);
          console.log(`   [ARCHIVO] ${itemRef.name} => ${url.substring(0, 50)}...`);
        }
      } catch (e) {
        console.warn(`   ⚠️ No se pudo acceder a "${path}":`, e.message);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR AL ESCANEAR STORAGE:", error);
    process.exit(1);
  }
}

listStorageFiles();
