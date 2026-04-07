import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  signOut,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_PLAYER_STATS } from "@/core_ui/theme";
import type { AppUser } from "./types";
import { ensureUserProfile } from "@/features/friends/services";

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

// ─── Google Auth ────────────────────────────────────────────────

/**
 * Google Sign-In for Web — uses popup.
 * The COOP console warning from Expo's dev server is harmless and
 * does not prevent sign-in from completing.
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

// ─── Email / Password Auth ──────────────────────────────────────

/**
 * Register a new account with email, password, and display name.
 * Sends a verification email and signs the user out so they must
 * verify before accessing the app.
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName.trim()) {
    await updateProfile(result.user, { displayName: displayName.trim() });
  }

  // Send verification email
  await sendEmailVerification(result.user);

  // Sign out — user must verify email before they can use the app
  await signOut(auth);

  return result.user;
}

/**
 * Sign in an existing user with email and password.
 * Throws a custom error if the email is not yet verified.
 */
export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);

  if (!result.user.emailVerified) {
    // Resend verification email in case they need it again
    await sendEmailVerification(result.user);
    // Sign out so the unverified user can't access the app
    await signOut(auth);
    const err: any = new Error(
      "Please verify your email first. A new verification link has been sent."
    );
    err.code = "auth/email-not-verified";
    throw err;
  }

  return result.user;
}

/**
 * Resend the verification email for the currently signed-in user.
 * Useful if the user is on the "check your email" screen.
 */
export async function resendVerificationEmail(email: string, password: string) {
  // We need to sign in briefly to get a User object for sendEmailVerification
  const result = await signInWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  await signOut(auth);
}

// ─── Common ─────────────────────────────────────────────────────

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

  // Always ensure userProfile exists (even if user doc already existed)
  await ensureUserProfile(user.uid, {
    displayName: user.displayName,
    photoURL: user.photoURL,
    level: DEFAULT_PLAYER_STATS.level,
    player_class: DEFAULT_PLAYER_STATS.player_class,
  }).catch(console.error);
}
