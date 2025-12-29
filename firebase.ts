
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCZjeHk6G5WO3Y_rOSh7V-p-y4YTEvV0as",
  authDomain: "gestor---insanus-educacional.firebaseapp.com",
  projectId: "gestor---insanus-educacional",
  storageBucket: "gestor---insanus-educacional.firebasestorage.app",
  messagingSenderId: "576699967764",
  appId: "1:576699967764:web:cfa769e94ba7ea3608ba01",
  measurementId: "G-FBLKM3Y7SX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
