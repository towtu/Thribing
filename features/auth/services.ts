import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  isSignInWithEmailLink,
  onAuthStateChanged,
  signOut,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_PLAYER_STATS } from "@/core_ui/theme";
import type { AppUser } from "./types";

const EMAIL_STORAGE_KEY = "thribing_email_for_signin";

/**
 * Convert Firebase User to our AppUser type
 */
export function toAppUser(user: User): AppUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

/**
 * Google Sign-In for Web — uses Firebase popup directly.
 * For native, we use expo-auth-session (handled in the component).
 */
export async function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Google Sign-In with an ID token (from expo-auth-session on native).
 */
export async function signInWithGoogleCredential(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

/**
 * Send a passwordless email sign-in link.
 */
export async function sendEmailSignInLink(email: string) {
  const actionCodeSettings = {
    url: Platform.OS === "web"
      ? window.location.origin + "/(auth)/login"
      : "https://thribing.page.link/login",
    handleCodeInApp: true,
  };

  await sendSignInLinkToEmail(auth, email, actionCodeSettings);

  // Store email so we can complete sign-in when user clicks the link
  await AsyncStorage.setItem(EMAIL_STORAGE_KEY, email);
}

/**
 * Complete email link sign-in. Call this when the app opens from the email link.
 */
export async function completeEmailSignIn(emailLink: string) {
  if (!isSignInWithEmailLink(auth, emailLink)) {
    throw new Error("Invalid sign-in link");
  }

  let email = await AsyncStorage.getItem(EMAIL_STORAGE_KEY);
  if (!email) {
    // If email is missing (e.g. different device), caller must prompt for it
    throw new Error("EMAIL_REQUIRED");
  }

  const result = await signInWithEmailLink(auth, email, emailLink);
  await AsyncStorage.removeItem(EMAIL_STORAGE_KEY);
  return result.user;
}

/**
 * Check if a URL is a Firebase email sign-in link.
 */
export function isEmailSignInLink(url: string): boolean {
  return isSignInWithEmailLink(auth, url);
}

/**
 * Sign out the current user.
 */
export async function signOutUser() {
  await signOut(auth);
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthChange(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/**
 * Ensure a Firestore user document exists with default player stats.
 * Called after successful authentication.
 */
export async function ensureUserDocument(user: User) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      ...DEFAULT_PLAYER_STATS,
      created_at: serverTimestamp(),
    });
  }
}
