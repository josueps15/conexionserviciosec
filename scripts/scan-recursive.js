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

async function recursiveList(storage, path, depth = 0) {
  if (depth > 3) return;
  
  const listRef = ref(storage, path);
  try {
    const res = await listAll(listRef);
    
    for (const folderRef of res.prefixes) {
      console.log(`${"  ".repeat(depth)}📁 [DIR] ${folderRef.fullPath}`);
      await recursiveList(storage, folderRef.fullPath, depth + 1);
    }

    for (const itemRef of res.items) {
      const url = await getDownloadURL(itemRef);
      console.log(`${"  ".repeat(depth)}📄 [FILE] ${itemRef.fullPath} | URL: ${url.substring(0, 60)}...`);
    }
  } catch (e) {
    // console.warn(`Error en ${path}:`, e.message);
  }
}

async function start() {
  console.log("🔍 Iniciando escaneo recursivo de Storage...");
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  await recursiveList(storage, "");
  process.exit(0);
}

start();
