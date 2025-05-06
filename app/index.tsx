import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { LogBox } from "react-native";


LogBox.ignoreLogs([
  "Comprehensive Error in getDecorServiceBy",
  "Failed to fetch decor services",
  "[404]",
  "Decor service not found for this provider",
  "API Request Error:", // Add this to ignore API Request Error messages
  "{}" ,// Include this if the empty object is appearing as a separate message
  "Received invalid data []",
  "❌ API Error [400]",
  "❌ API Error [400]: {}",
  
]);

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
      router.replace("/(tabs)/home"); 
    }
  }, [isReady]);
  
  return null;
}