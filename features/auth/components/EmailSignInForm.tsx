import { useState } from "react";
import { View, Text } from "react-native";
import { CartoonButton } from "@/core_ui/components";
import { CartoonInput } from "@/core_ui/components";
import { sendEmailSignInLink } from "../services";

type FormState = "idle" | "sending" | "sent" | "error";

/**
 * Email passwordless sign-in form.
 * Sends a magic link to the user's email via Firebase.
 */
export function EmailSignInForm() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendLink = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setErrorMsg("Please enter a valid email address");
      setFormState("error");
      return;
    }

    setFormState("sending");
    setErrorMsg("");

    try {
      await sendEmailSignInLink(trimmed);
      setFormState("sent");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to send sign-in link");
      setFormState("error");
    }
  };

  if (formState === "sent") {
    return (
      <View className="gap-3">
        <View className="bg-green-500 border-4 border-gray-900 rounded-3xl p-4">
          <Text
            className="text-white text-center text-base"
            style={{ fontFamily: "Nunito_700Bold" }}
          >
            ✉️ Magic link sent!
          </Text>
          <Text
            className="text-white text-center text-sm mt-1"
            style={{ fontFamily: "Nunito_400Regular" }}
          >
            Check your inbox for {email.trim()} and click the link to sign in.
          </Text>
        </View>
        <CartoonButton
          title="Send again"
          variant="white"
          size="sm"
          onPress={() => setFormState("idle")}
        />
      </View>
    );
  }

  return (
    <View className="gap-3">
      <CartoonInput
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={formState !== "sending"}
      />
      <CartoonButton
        title={formState === "sending" ? "Sending..." : "Send Magic Link"}
        variant="cyan"
        size="lg"
        onPress={handleSendLink}
        disabled={formState === "sending"}
      />
      {formState === "error" && errorMsg ? (
        <Text
          className="text-red-400 text-xs text-center"
          style={{ fontFamily: "Nunito_600SemiBold" }}
        >
          {errorMsg}
        </Text>
      ) : null}
    </View>
  );
}
