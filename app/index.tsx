import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for 100ms to ensure RootLayout is mounted before navigation
    const timeout = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isReady) {
      router.replace("/(tabs)/home"); // Navigate to the home page when Expo Router is ready
    }
  }, [isReady]);

  return null;
}
