export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
