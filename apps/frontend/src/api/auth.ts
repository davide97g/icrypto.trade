import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { useUserStore } from "../stores/user";
import { NewsPageName, router } from "../router";
import { setIsLoading } from "../services/utils";

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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

const app = initializeApp(firebaseConfig);
getAnalytics(app);

const provider = new GoogleAuthProvider();
export const auth = getAuth();

export const getIdToken = async () => {
  return await auth.currentUser?.getIdToken();
};

export const checkUserIsLoggedIn = () => {
  return new Promise((resolve, reject) => {
    setIsLoading(true);
    onAuthStateChanged(
      auth,
      async (user) => {
        setIsLoading(false);
        if (user) {
          useUserStore().setUser(user);
          resolve(user);
        } else {
          useUserStore().setUser(null);
          setIsLoading(false);
          reject(false);
        }
      },
      (err) => {
        useUserStore().setUser(null);
        setIsLoading(false);
        reject(err);
      }
    );
  });
};

export const FirebaseAuth = {
  signInWithGoogle: () =>
    signInWithPopup(auth, provider)
      .then((result) => GoogleAuthProvider.credentialFromResult(result))
      .catch(() => {
        useUserStore().setUser(null);
        return null;
      }),

  signOut: () => {
    signOut(auth).then(() => {
      router.push({ name: NewsPageName });
      useUserStore().setUser(null);
    });
  },
};
