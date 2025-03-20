import {initApiClient} from "@/config/axiosConfig";
import { LogBox } from "react-native";

// ✅ Ẩn lỗi Axios 400 từ LogBox
LogBox.ignoreLogs(["AxiosError: Request failed with status code 400"]);

interface IBackendRes<T> {
  success?: boolean;
  token?: string;
  errors?: string[];
  requiresTwoFactor?: boolean;
  data?: T;
}

interface ILoginResponse {
  token: string;
  requiresTwoFactor: boolean;
}

export const loginAPI = async (email: string, password: string): Promise<ILoginResponse> => {
  const url = "/api/Auth/login";

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<ILoginResponse> = await apiClient.post(url, {
      email: email,
      password: password,
    });

    console.log("🟢 Full API Response:", response);

    // ✅ Kiểm tra nếu API không phản hồi đúng định dạng
    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    // ✅ Kiểm tra nếu API trả về lỗi
    if (!response.success) {
      console.error("🔴 Login failed:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Invalid email or password."));
    }

    // ✅ Kiểm tra nếu cần 2FA (Có thể bỏ nếu không dùng)
    if (response.requiresTwoFactor) {
      console.warn("⚠️ Requires Two-Factor Authentication!");
      return Promise.reject(new Error("Requires two-factor authentication."));
    }

    // ✅ Trả về token nếu có
    if (response.token) {
      console.log("🔵 API Token:", response.token);
      return { token: response.token, requiresTwoFactor: false };
    }

    return Promise.reject(new Error("Login failed: No token received."));
  } catch (error: any) {
    console.error("🔴 Login API Error:", error);

    // ✅ Nếu lỗi là mất kết nối
    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    // ✅ Nếu lỗi là do API trả về mã 400 (Sai email/mật khẩu)
    if (error.response?.status === 400) {
      return Promise.reject(new Error("Invalid email or password."));
    }

    // ✅ Nếu lỗi do mất kết nối hoặc lỗi server
    return Promise.reject(new Error("Network error, please try again."));
  }
};
export const googleLoginAPI = async (idToken: string): Promise<ILoginResponse> => {
  const url = "/api/Auth/google-login"; // API route cho Google Login

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<ILoginResponse> = await apiClient.post(url, {
      idToken: idToken, // Gửi idToken từ Google
    });

    console.log("🟢 Full API Response:", response);

    // ✅ Kiểm tra nếu API không phản hồi đúng định dạng
    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    // ✅ Kiểm tra nếu API trả về lỗi
    if (!response.success) {
      console.error("🔴 Google login failed:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Google login failed."));
    }

    // ✅ Kiểm tra nếu cần 2FA
    if (response.requiresTwoFactor) {
      console.warn("⚠️ Requires Two-Factor Authentication!");
      return Promise.reject(new Error("Requires two-factor authentication."));
    }

    // ✅ Trả về token nếu có
    if (response.token) {
      console.log("🔵 API Token:", response.token);
      return { token: response.token, requiresTwoFactor: false };
    }

    return Promise.reject(new Error("Google login failed: No token received."));
  } catch (error: any) {
    console.error("🔴 Google Login API Error:", error);

    // ✅ Nếu lỗi là mất kết nối
    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    // ✅ Nếu lỗi là do API trả về mã 400 (Sai token)
    if (error.response?.status === 400) {
      return Promise.reject(new Error("Invalid Google token."));
    }

    // ✅ Nếu lỗi do mất kết nối hoặc lỗi server
    return Promise.reject(new Error("Network error, please try again."));
  }
};
