import { useState } from "react";
import { View, Text } from "react-native";
import { ScreenContainer } from "@/core_ui/components";
import { CartoonCard, CartoonButton } from "@/core_ui/components";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { EmailSignInForm } from "@/features/auth/components/EmailSignInForm";

export default function LoginScreen() {
  const [showEmail, setShowEmail] = useState(false);

  return (
    <ScreenContainer>
      <View className="flex-1 justify-center items-center gap-6 py-8">
        {/* Logo Area */}
        <View className="items-center mb-4">
          <Text
            className="text-5xl text-center"
            style={{ fontFamily: "Nunito_800ExtraBold" }}
          >
            🎮
          </Text>
          <Text
            className="text-4xl text-white text-center mt-2"
            style={{ fontFamily: "Nunito_800ExtraBold" }}
          >
            ThriBing
          </Text>
          <Text
            className="text-base text-gray-400 text-center mt-1"
            style={{ fontFamily: "Nunito_600SemiBold" }}
          >
            Level up your real life
          </Text>
        </View>

        {/* Auth Card */}
        <CartoonCard variant="default" className="w-full">
          <View className="gap-4">
            <Text
              className="text-xl text-gray-900 text-center"
              style={{ fontFamily: "Nunito_700Bold" }}
            >
              Get Started
            </Text>

            <GoogleSignInButton />

            {showEmail ? (
              <EmailSignInForm />
            ) : (
              <CartoonButton
                title="Continue with Email"
                variant="cyan"
                size="lg"
                onPress={() => setShowEmail(true)}
              />
            )}
          </View>
        </CartoonCard>
      </View>
    </ScreenContainer>
  );
}
