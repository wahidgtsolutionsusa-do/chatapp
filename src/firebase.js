// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDIfDoWmF2Ui4aOmyQCYSlKidEZzJG93jg",
  authDomain: "formvalidation-f179e.firebaseapp.com",
  projectId: "formvalidation-f179e",
  storageBucket: "formvalidation-f179e.appspot.com",
  messagingSenderId: "284996511228",
  appId: "1:284996511228:web:d4f54b63dc14d1079b3e79",
  measurementId: "G-BZL74SWVL9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
