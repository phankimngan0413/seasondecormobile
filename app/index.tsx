import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Đợi 100ms để đảm bảo RootLayout đã mount trước khi điều hướng
    const timeout = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isReady) {
      router.replace("/(tabs)/home"); // Điều hướng vào trang Home khi Expo Router sẵn sàng
    }
  }, [isReady]);

  return null;
}
