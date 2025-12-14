// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwVqW7d9oJbbXMp2i0UYuCjaDX2v7b6gQ",
  authDomain: "exam-portal-3a4ac.firebaseapp.com",
  projectId: "exam-portal-3a4ac",
  storageBucket: "exam-portal-3a4ac.firebasestorage.app",
  messagingSenderId: "855152409116",
  appId: "1:855152409116:web:740b34f17c4620aa1bbdd9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
