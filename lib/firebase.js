import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7ag4Aq_SaeFUz3b7eH76LQIM-hxkm47k",
  authDomain: "sass-dental-reporting.firebaseapp.com",
  projectId: "sass-dental-reporting",
  storageBucket: "sass-dental-reporting.firebasestorage.app",
  messagingSenderId: "774510738665",
  appId: "1:774510738665:web:91120f0f3023517a2b0478",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
