
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


const firebaseConfig = {
  apiKey: "AIzaSyBQX0bvkc1B1oLJ2B36uMpT0OzH4oivY4g",
  authDomain: "credit-manager-v2.firebaseapp.com",
  projectId: "credit-manager-v2",
  storageBucket: "credit-manager-v2.firebasestorage.app",
  messagingSenderId: "246380120002",
  appId: "1:246380120002:web:111b49eff5802308f4785b",
  measurementId: "G-K4ME1KD4WC"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
