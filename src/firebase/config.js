// Inicializa Firebase y exporta db (RTDB)
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0iYSMU7tuWyMw-q5h4VKSgCq5LTZJoM4",
  authDomain: "lenovo-experiences.firebaseapp.com",
  projectId: "lenovo-experiences",
  storageBucket: "lenovo-experiences.firebasestorage.app",
  messagingSenderId: "472633703949",
  appId: "1:472633703949:web:c424fcf34b2f983c779f44",
  measurementId: "G-HTNB9NGC2R",
  databaseURL: "https://lenovo-experiences-default-rtdb.firebaseio.com",
};

const fbApp = initializeApp(firebaseConfig);
export const db = getDatabase(fbApp);
