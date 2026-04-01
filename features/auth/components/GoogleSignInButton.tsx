import { useState } from "react";
import { Platform, ActivityIndicator, View, Text } from "react-native";
import { CartoonButton } from "@/core_ui/components";
import {
  signInWithGooglePopup,
  signInWithGoogleCredential,
} from "../services";

/**
 * Google Sign-In button.
 * - Web: uses Firebase signInWithPopup directly
 * - Native: uses expo-auth-session (requires Google Client IDs in env)
 */
export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      if (Platform.OS === "web") {
        await signInWithGooglePopup();
      } else {
        // For native, we'd use expo-auth-session.
        // For now, show a message since Google Client IDs need to be configured.
        setError("Native Google Sign-In requires additional setup. Use Email sign-in for now.");
        setLoading(false);
        return;
      }
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      const message =
        err?.code === "auth/popup-closed-by-user"
          ? "Sign-in cancelled"
          : err?.message || "Google sign-in failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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
