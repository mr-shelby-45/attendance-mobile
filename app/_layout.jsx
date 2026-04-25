import { Stack, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    const redirect = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        setTimeout(() => {
          if (token) {
            router.replace("/(app)/checkin");
          } else {
            router.replace("/(auth)/login");
          }
        }, 100);
      } catch (err) {
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 100);
      }
    };
    redirect();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}