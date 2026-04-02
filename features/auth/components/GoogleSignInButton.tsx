import { useState, useCallback } from "react";
import { Platform, View, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { CartoonButton } from "@/core_ui/components";
import { signInWithGooglePopup } from "../services";
import { auth } from "@/lib/firebase";

// Complete the auth session on native so the browser dismisses properly
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;

function getProxyRedirectUri(): string {
  const slug = Constants.expoConfig?.slug ?? "thribing";
  const owner = Constants.expoConfig?.owner ?? "kobinggg";
  return `https://auth.expo.io/@${owner}/${slug}`;
}

/** Simple nonce generator for the implicit id_token flow. */
function generateNonce(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

/**
 * Parse the id_token from the URL the proxy returns.
 * The proxy forwards fragment params as query params on the returnUrl.
 */
function parseIdToken(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Check query params first (proxy may forward them here)
    const fromQuery = parsed.searchParams.get("id_token");
    if (fromQuery) return fromQuery;
    // Fallback: check hash fragment
    const hash = parsed.hash.replace(/^#/, "");
    return new URLSearchParams(hash).get("id_token");
  } catch {
    return null;
  }
}

/**
 * Google Sign-In for Android in Expo Go using the Expo auth proxy.
 *
 * Flow:
 *  1. Build a Google OAuth URL with redirect_uri = Expo proxy URL (https://).
 *  2. Wrap it through the proxy's /start endpoint, passing returnUrl = exp:// URL.
 *  3. openAuthSessionAsync watches for the exp:// URL via Linking events.
 *  4. The proxy receives Google's redirect, then redirects back to exp://?id_token=...
 *  5. We parse the id_token and sign in to Firebase.
 */
async function signInWithGoogleNative(): Promise<void> {
  const proxyRedirectUri = getProxyRedirectUri();

  // The exp:// URL that Expo Go will receive when the proxy redirects back
  const returnUrl = Linking.createURL("expo-auth-session");

  // Build Google's implicit id_token OAuth URL
  const nonce = generateNonce();
  const authParams = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: proxyRedirectUri,
    response_type: "id_token",
    scope: "openid profile email",
    nonce,
    prompt: "select_account",
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams}`;

  // Wrap through the Expo auth proxy
  const startUrl =
    `${proxyRedirectUri}/start?` +
    `authUrl=${encodeURIComponent(authUrl)}&returnUrl=${encodeURIComponent(returnUrl)}`;

  // Open Chrome Custom Tab; the polyfill will detect the exp:// Linking event
  const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);

  if (result.type !== "success") {
    if (result.type === "dismiss" || result.type === "cancel") {
      throw Object.assign(new Error("Sign-in cancelled"), {
        code: "auth/cancelled",
      });
    }
    throw new Error("Google sign-in failed");
  }

  const idToken = parseIdToken(result.url);
  if (!idToken) {
    throw new Error(
      "Google sign-in failed: no ID token in response. URL: " + result.url
    );
  }

  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
}

/**
 * Google Sign-In button.
 * - Web: uses Firebase signInWithPopup
 * - Native (Expo Go): uses Expo auth proxy → id_token → Firebase credential
 */
export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (Platform.OS === "web") {
        await signInWithGooglePopup();
      } else {
        await signInWithGoogleNative();
      }
    } catch (err: any) {
      const message =
        err?.code === "auth/cancelled" || err?.code === "auth/popup-closed-by-user"
          ? "Sign-in cancelled"
          : err?.code === "auth/cancelled-popup-request"
            ? "Sign-in cancelled"
            : err?.message || "Google sign-in failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View className="gap-2">
      <CartoonButton
        title={loading ? "Signing in..." : "Continue with Google"}
        variant="violet"
        size="lg"
        onPress={handleGoogleSignIn}
        disabled={loading}
      />
      {error && (
        <Text
          className="text-red-400 text-xs text-center"
          style={{ fontFamily: "Nunito_600SemiBold" }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
