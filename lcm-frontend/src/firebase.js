import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDgd9EqDIxDOapI5RE_Pp0elOIcgAyeShc",
  authDomain: "lms-auth-3dbe0.firebaseapp.com",
  projectId: "lms-auth-3dbe0",
  storageBucket: "lms-auth-3dbe0.firebasestorage.app",
  messagingSenderId: "60037362087",
  appId: "1:60037362087:web:bb14557729237c4cf24682"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
