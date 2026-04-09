import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

async function inspect() {
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);

  const folders = ["categories/belleza", "categories/automotriz", "categories/salud"];
  
  for (const f of folders) {
    console.log(`Checking ${f}...`);
    try {
      const res = await listAll(ref(storage, f));
      console.log(`  Items in ${f}:`, res.items.map(i => i.name));
    } catch (e) {
      console.log(`  Error in ${f}:`, e.message);
    }
  }
  process.exit(0);
}

inspect();
