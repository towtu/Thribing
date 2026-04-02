import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { CartoonButton } from "@/core_ui/components";
import { CartoonInput } from "@/core_ui/components";
import { CartoonCard } from "@/core_ui/components";
import {
  registerWithEmail,
  loginWithEmail,
  resendVerificationEmail,
} from "../services";

type Mode = "login" | "register" | "verify";

export function EmailSignInForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(false);

  const switchTo = (next: "login" | "register") => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (mode === "register" && !displayName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        await registerWithEmail(trimmedEmail, password, displayName.trim());
        // Registration succeeded — show verification screen
        setMode("verify");
      } else {
        await loginWithEmail(trimmedEmail, password);
        // onAuthStateChanged will handle the redirect
      }
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/email-not-verified") {
        // User tried to log in but hasn't verified yet
        setMode("verify");
      } else if (code === "auth/email-already-in-use") {
        setError(
          "An account with this email already exists. Try signing in."
        );
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password.");
      } else {
        setError(err?.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown) return;
    setLoading(true);
    setError("");

    try {
      await resendVerificationEmail(email.trim(), password);
      setResendCooldown(true);
      setTimeout(() => setResendCooldown(false), 30_000);
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  // ─── Verification screen ──────────────────────────────────────
  if (mode === "verify") {
    return (
      <View className="gap-3">
        <CartoonCard variant="cyan">
          <View className="items-center gap-2 py-2">
            <Text className="text-3xl">✉️</Text>
            <Text
              className="text-base text-gray-900 text-center"
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              Verify your email
            </Text>
            <Text
              className="text-sm text-gray-700 text-center"
              style={{ fontFamily: "Nunito_400Regular" }}
            >
              We sent a verification link to{"\n"}
              <Text style={{ fontFamily: "Nunito_700Bold" }}>
                {email.trim()}
              </Text>
              {"\n"}Click the link, then come back and sign in.
            </Text>
          </View>
        </CartoonCard>

        <CartoonButton
          title={
            resendCooldown
              ? "Link sent! Check your inbox"
              : loading
                ? "Sending..."
                : "Resend verification email"
          }
          variant="white"
          size="md"
          onPress={handleResend}
          disabled={loading || resendCooldown}
        />

        {error ? (
          <Text
            className="text-red-400 text-xs text-center"
            style={{ fontFamily: "Nunito_600SemiBold" }}
          >
            {error}
          </Text>
        ) : null}

        <CartoonButton
          title="Back to Sign In"
          variant="violet"
          size="md"
          onPress={() => switchTo("login")}
        />
      </View>
    );
  }

  // ─── Login / Register form ────────────────────────────────────
  return (
    <View className="gap-3">
      {mode === "register" && (
        <CartoonInput
          placeholder="Your name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          editable={!loading}
        />
      )}

      <CartoonInput
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!loading}
      />

      <CartoonInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!loading}
      />

      <CartoonButton
        title={
          loading
            ? mode === "register"
              ? "Creating account..."
              : "Signing in..."
            : mode === "register"
              ? "Create Account"
              : "Sign In"
        }
        variant="cyan"
        size="lg"
        onPress={handleSubmit}
        disabled={loading}
      />

      {error ? (
        <Text
          className="text-red-400 text-xs text-center"
          style={{ fontFamily: "Nunito_600SemiBold" }}
        >
          {error}
        </Text>
      ) : null}

      <Pressable
        onPress={() => switchTo(mode === "login" ? "register" : "login")}
        disabled={loading}
      >
        <Text
          className="text-violet-electric text-sm text-center"
          style={{ fontFamily: "Nunito_600SemiBold" }}
        >
          {mode === "login"
            ? "Don't have an account? Sign Up"
            : "Already have an account? Sign In"}
        </Text>
      </Pressable>
    </View>
  );
}
