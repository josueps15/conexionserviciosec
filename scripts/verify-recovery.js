import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

async function verify() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const ids = ["belleza", "construccion", "salud", "automotriz"];
  
  for (const id of ids) {
    const snap = await getDoc(doc(db, "categories", id));
    if (snap.exists()) {
      console.log(`📄 [${id}] data:`, JSON.stringify(snap.data(), null, 2));
    } else {
      console.log(`❌ [${id}] NO existe en Firestore.`);
    }
  }
  process.exit(0);
}

verify();
