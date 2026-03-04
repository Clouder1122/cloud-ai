import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACNQ8AKxyy80oc7UUtFd80eqtl8LIwIIE",
  authDomain: "cloud-ai-by-rehan.firebaseapp.com",
  projectId: "cloud-ai-by-rehan",
  storageBucket: "cloud-ai-by-rehan.firebasestorage.app",
  messagingSenderId: "876216815559",
  appId: "1:876216815559:web:4ed3cf25233714c36e53e2",
  measurementId: "G-P9X1Z15XFW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
