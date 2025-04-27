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
      return null;
    }
    
    // 🆕 Kiểm tra tính hợp lệ của token
    try {
      const decoded: any = jwtDecode(token);
      const expTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      // Kiểm tra token hết hạn
      if (expTime < currentTime) {
        console.warn("🔴 Token đã hết hạn:", new Date(expTime).toLocaleString());
        handleSessionExpired();
        return null;
      }
      
      // Log thông tin hết hạn
      const timeLeft = Math.floor((expTime - currentTime) / 1000 / 60); // Minutes left
      console.log(`✅ Token hợp lệ, còn ${timeLeft} phút trước khi hết hạn`);
    } catch (decodeError) {
      console.error("🔴 Token không hợp lệ:", decodeError);
      removeToken(); // Xóa token không hợp lệ
      return null;
    }
    
    return token;
  } catch (error) {
    console.error("🔴 Lỗi khi lấy token:", error);
    return null;
  }
};

// ✅ **Lưu token khi đăng nhập thành công**
export const setToken = async (token: string): Promise<void> => {
  try {
    if (!token) throw new Error("Token không hợp lệ!");
    
    // 🆕 Validate token trước khi lưu
    try {
      const decoded = jwtDecode(token);
      console.log("✅ Token hợp lệ, thông tin:", decoded);
    } catch (decodeError) {
      console.error("🔴 Không thể lưu token không hợp lệ:", decodeError);
      throw new Error("Token định dạng không hợp lệ!");
    }
    
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log("✅ Token đã được lưu thành công!");
  } catch (error) {
    console.error("🔴 Lỗi khi lưu token:", error);
    Alert.alert(
      "Lỗi đăng nhập", 
      "Không thể lưu thông tin đăng nhập. Vui lòng thử lại."
    );
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
    const token = await getToken(); // Đã bao gồm kiểm tra hết hạn
    if (!token) {
      console.warn("No token found, unable to extract user ID.");
      return null;
    }
    
    // 🔥 Giải mã token để lấy ID
    const decoded: any = jwtDecode(token);
    
    // ⚠️ Kiểm tra ID có nằm trong "nameid" không
    const userId = decoded?.nameid 
      ? parseInt(decoded.nameid, 10) 
      : (decoded?.sub ? parseInt(decoded.sub, 10) : null); // Thêm kiểm tra trường sub
    
    if (!userId) {
      console.warn("⚠️ Không tìm thấy ID trong token. Token data:", decoded);
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
    Alert.alert(
      "Phiên đăng nhập hết hạn", 
      "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.", 
      [{ text: "OK", onPress: () => redirectToLogin() }]
    );
  } catch (error) {
    console.error("🔴 Lỗi khi xử lý phiên hết hạn:", error);
    // Vẫn cố gắng chuyển hướng ngay cả khi có lỗi
    redirectToLogin();
  }
};

// ✅ **Chuyển hướng về màn hình login**
const redirectToLogin = () => {
  console.log("🔵 Chuyển hướng về trang đăng nhập...");
  router.replace("/(auth)/login");
};

// 🆕 **Kiểm tra trạng thái đăng nhập khi app khởi động**
export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const token = await getToken(); // Đã bao gồm kiểm tra hết hạn
    return !!token; // Trả về true nếu có token hợp lệ
  } catch (error) {
    console.error("🔴 Lỗi kiểm tra trạng thái đăng nhập:", error);
    return false;
  }
};

// 🆕 **Thêm hàm refreshToken nếu API của bạn hỗ trợ**
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const currentToken = await getToken();
    if (!currentToken) return false;
    
    // TODO: Thêm logic gọi API refresh token của bạn ở đây
    // const response = await apiClient.post('/api/auth/refresh', { token: currentToken });
    // if (response.success && response.token) {
    //   await setToken(response.token);
    //   return true;
    // }
    
    console.log("🔄 Chức năng refresh token chưa được triển khai");
    return false;
  } catch (error) {
    console.error("🔴 Lỗi khi refresh token:", error);
    return false;
  }
};