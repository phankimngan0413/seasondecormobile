import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";

// 📌 **Key lưu trữ token**
const TOKEN_KEY = "user_token";

// ✅ **Lấy token từ AsyncStorage**
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      console.warn("🔴 Token không tồn tại.");
    }
    return token || null;
  } catch (error) {
    console.error("🔴 Lỗi khi lấy token:", error);
    return null;
  }
};

// ✅ **Lưu token khi đăng nhập thành công**
export const setToken = async (token: string): Promise<void> => {
  try {
    if (!token) throw new Error("Token không hợp lệ!");
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log("✅ Token đã được lưu:", token);
  } catch (error) {
    console.error("🔴 Lỗi khi lưu token:", error);
  }
};

// ✅ **Xóa token khi đăng xuất**
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    console.log("✅ Token đã bị xóa (Đăng xuất)");
  } catch (error) {
    console.error("🔴 Lỗi khi xóa token:", error);
  }
};

// ✅ **Lấy User ID từ token**
export const getUserIdFromToken = async (): Promise<number | null> => {
  try {
    const token = await getToken();
    if (!token) {
      console.warn("No token found, unable to extract user ID.");
      return null;
    }

    // 🔥 Giải mã token để lấy ID
    const decoded: any = jwtDecode(token);
    console.log("🔵 Decoded Token:", decoded);

    // ⚠️ Kiểm tra ID có nằm trong "nameid" không
    const userId = decoded?.nameid ? parseInt(decoded.nameid, 10) : null;

    if (!userId) {
      console.warn("⚠️ Không tìm thấy ID trong token.");
      return null;
    }

    console.log("✅ User ID lấy từ token:", userId);
    return userId;
  } catch (error) {
    console.error("🔴 Lỗi giải mã token:", error);
    return null;
  }
};

// ✅ **Xử lý khi phiên đăng nhập hết hạn**
export const handleSessionExpired = async (): Promise<void> => {
  try {
    console.warn("⚠️ Token hết hạn, đăng xuất...");
    await removeToken();

    // Hiển thị cảnh báo & chuyển hướng về login
    Alert.alert("Session Expired", "Your session has expired. Please log in again.", [
      { text: "OK", onPress: () => redirectToLogin() },
    ]);
  } catch (error) {
    console.error("🔴 Lỗi khi xử lý phiên hết hạn:", error);
  }
};

// ✅ **Chuyển hướng về màn hình login**
const redirectToLogin = () => {
  console.log("🔵 Chuyển hướng về trang đăng nhập...");
  router.replace("/(auth)/login"); // Make sure to replace with your actual login page path
};
