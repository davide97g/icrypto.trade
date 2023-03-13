import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQymUgf3aKt0MVHSrptWf35HY8PjXiTXU",
  authDomain: "crypto-feed-trader.firebaseapp.com",
  databaseURL:
    "https://crypto-feed-trader-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "crypto-feed-trader",
  storageBucket: "crypto-feed-trader.appspot.com",
  messagingSenderId: "501208316900",
  appId: "1:501208316900:web:e14c4e4976589a922ca5f1",
  measurementId: "G-BFMKHXXBSJ",
};

initializeApp(firebaseConfig);

export const db = getFirestore();
export const rtdb = getDatabase();
