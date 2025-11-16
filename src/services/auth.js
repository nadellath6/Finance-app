import { auth, db } from "../firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export async function register(email, password, username) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  // Set displayName on Firebase Auth profile if username provided
  if (username) {
    try {
      await updateProfile(user, { displayName: username });
    } catch (e) {
      // no-op: updating profile is best-effort
      console.warn("updateProfile failed:", e);
    }
  }
  const uid = user.uid;
  
  // Tentukan role berdasarkan email
  const role = email === 'admin1@gmail.com' ? 'admin' : 'user';
  
  await setDoc(doc(db, "users", uid), {
    email,
    username: username || null,
    displayName: username || email.split('@')[0],
    role: role,
    createdAt: new Date().toISOString()
  });
  return user;
}

// Fungsi login
export async function login(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}
