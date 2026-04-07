import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
// @ts-expect-error -- getReactNativePersistence is exported via the "react-native" conditional export in @firebase/auth, which tsc doesn't resolve
import { getReactNativePersistence } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialization in hot reload
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Use platform-appropriate auth persistence
// Web uses browser persistence by default; native needs AsyncStorage
export const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

// Enable offline persistence:
// - Native: persistentLocalCache (SQLite-backed, survives app close)
// - Web: persistentLocalCache with multi-tab support (IndexedDB)
export const db = initializeFirestore(app, {
  localCache:
    Platform.OS === "web"
      ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      : persistentLocalCache(),
});

export default app;
