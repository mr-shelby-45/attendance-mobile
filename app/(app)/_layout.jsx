import { Stack, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";

export default function AppLayout() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) {
          setTimeout(() => {
            router.replace("/(auth)/login");
          }, 100);
        }
      } catch (err) {
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 100);
      }
    };
    checkAuth();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="checkin" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}