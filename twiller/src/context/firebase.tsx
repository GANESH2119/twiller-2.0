import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDXbpV27Z8gYQbudaxW6J-hM3cvQE5VzM8",
  authDomain: "twiller-f36f7.firebaseapp.com",
  projectId: "twiller-f36f7",
  storageBucket: "twiller-f36f7.firebasestorage.app",
  messagingSenderId: "763254489256",
  appId: "1:763254489256:web:8533ae0ac8d18d2388c29d",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;