import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDP4fRYPNnM4Lj13yaqcN3AHzGZk8ORP18",
  authDomain: "keuangan-67d3f.firebaseapp.com",
  projectId: "keuangan-67d3f",
  storageBucket: "keuangan-67d3f.firebasestorage.com",
  messagingSenderId: "554418188831",
  appId: "1:554418188831:web:0214b1b09f7e4ee140db2a",
  measurementId: "G-74039MT3GE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
