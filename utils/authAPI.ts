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
  success?: any;
  token: string;
  requiresTwoFactor: boolean;
  errors?: string[];
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
export const registerCustomerAPI = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  slug: string,
  dateOfBirth: string,
  gender: boolean
): Promise<any> => {
  const url = "/api/Auth/register-customer";

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<any> = await apiClient.post(url, {
      email,
      password,
      firstName,
      lastName,
      slug,
      dateOfBirth,
      gender
    });

    console.log("🟢 Full API Response:", response);

    // Check if API response is valid
    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    // Check if API returned an error
    if (!response.success) {
      console.error("🔴 Registration failed:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Registration failed."));
    }

    // Return success response
    return response.data;
  } catch (error: any) {
    console.error("🔴 Registration API Error:", error);

    // Network connection error
    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    // Handle specific error codes
    if (error.response?.status === 400) {
      // Parse validation errors if available
      const errorData = error.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        return Promise.reject(new Error(errorData.errors.join(", ")));
      }
      return Promise.reject(new Error("Invalid registration data."));
    }

    if (error.response?.status === 409) {
      return Promise.reject(new Error("Email or username already exists."));
    }

    // General network or server error
    return Promise.reject(new Error("Network error, please try again."));
  }
};
export const verifyEmailAPI = async (email: string, otp: string): Promise<any> => {
  const url = "/api/Auth/verify-email";

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<any> = await apiClient.post(url, {
      email,
      OTP: otp // Đổi tên trường từ verificationCode sang OTP theo yêu cầu API
    });

    console.log("🟢 Full API Response:", response);

    // ✅ Kiểm tra nếu API không phản hồi đúng định dạng
    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    // ✅ Kiểm tra nếu API trả về lỗi
    if (!response.success) {
      console.error("🔴 Verification failed:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Verification failed."));
    }

    // ✅ Trả về dữ liệu
    return response.data;
  } catch (error: any) {
    console.error("🔴 Email Verification API Error:", error.response?.data || error);

    // ✅ Nếu lỗi là mất kết nối
    if (error.message?.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    // ✅ Nếu lỗi là do API trả về mã 400
    if (error.response?.status === 400) {
      const errorData = error.response?.data;
      
      // Xử lý lỗi validation cụ thể từ API
      if (errorData?.errors) {
        const errorMessages = [];
        for (const field in errorData.errors) {
          errorMessages.push(...errorData.errors[field]);
        }
        if (errorMessages.length > 0) {
          return Promise.reject(new Error(errorMessages.join(", ")));
        }
      }
      
      return Promise.reject(new Error("Invalid verification code."));
    }

    // ✅ Nếu lỗi do mất kết nối hoặc lỗi server
    return Promise.reject(new Error("Network error, please try again."));
  }
};
export const resendVerificationCodeAPI = async (email: string): Promise<any> => {
  const url = "/api/Auth/resend-verification";

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<any> = await apiClient.post(url, {
      email
    });

    console.log("🟢 Full API Response:", response);

    // ✅ Kiểm tra nếu API không phản hồi đúng định dạng
    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    // ✅ Kiểm tra nếu API trả về lỗi
    if (!response.success) {
      console.error("🔴 Resend verification failed:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Failed to resend verification code."));
    }

    // ✅ Trả về dữ liệu
    return response.data;
  } catch (error: any) {
    console.error("🔴 Resend Verification API Error:", error);

    // ✅ Nếu lỗi là mất kết nối
    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    // ✅ Nếu lỗi là do API trả về mã 400
    if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.errors ? 
        error.response.data.errors.join(", ") : 
        "Invalid email address.";
      return Promise.reject(new Error(errorMsg));
    }

    // ✅ Nếu lỗi do mất kết nối hoặc lỗi server
    return Promise.reject(new Error("Network error, please try again."));
  }
};
export const verifyOtpAPI = async (email: string, otp: string): Promise<any> => {
  const url = "/api/Auth/verify-otp";

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<any> = await apiClient.post(url, {
      email,
      otp
    });

    console.log("🟢 Full API Response:", response);

    // ✅ Kiểm tra nếu API không phản hồi đúng định dạng
    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    // ✅ Kiểm tra nếu API trả về lỗi
    if (!response.success) {
      console.error("🔴 OTP verification failed:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "OTP verification failed."));
    }

    // ✅ Trả về dữ liệu
    return response.data;
  } catch (error: any) {
    console.error("🔴 OTP Verification API Error:", error);

    // ✅ Nếu lỗi là mất kết nối
    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    // ✅ Nếu lỗi là do API trả về mã 400 (OTP không hợp lệ)
    if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.errors ? 
        error.response.data.errors.join(", ") : 
        "The OTP field is required.";
      return Promise.reject(new Error(errorMsg));
    }

    // ✅ Nếu lỗi do mất kết nối hoặc lỗi server
    return Promise.reject(new Error("Network error, please try again."));
  }
};

export const forgotPasswordAPI = async (email: string): Promise<any> => {
  const url = "/api/Auth/forgot-password";

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<any> = await apiClient.post(url, {
      email
    });

    console.log("🟢 Full API Response:", response);

    // ✅ Kiểm tra nếu API không phản hồi đúng định dạng
    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    // ✅ Kiểm tra nếu API trả về lỗi
    if (!response.success) {
      console.error("🔴 Forgot password request failed:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Failed to send password reset email."));
    }

    // ✅ Trả về dữ liệu
    return response.data;
  } catch (error: any) {
    console.error("🔴 Forgot Password API Error:", error);

    // ✅ Nếu lỗi là mất kết nối
    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    // ✅ Nếu lỗi là do API trả về mã 400
    if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.errors ? 
        error.response.data.errors.join(", ") : 
        "Invalid email address.";
      return Promise.reject(new Error(errorMsg));
    }

    // ✅ Nếu lỗi do mất kết nối hoặc lỗi server
    return Promise.reject(new Error("Network error, please try again."));
  }
};

export const resetPasswordAPI = async (otp: string, newPassword: string): Promise<any> => {
  const url = "/api/Auth/reset-password";

  const apiClient = await initApiClient();
  console.log("🟡 API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    const response: IBackendRes<any> = await apiClient.post(url, {
      otp,
      newPassword
    });

    console.log("🟢 Full API Response:", response);

    // ✅ Kiểm tra nếu API không phản hồi đúng định dạng
    if (!response || typeof response.success === "undefined") {
      console.error("🔴 API Response không hợp lệ:", response);
      return Promise.reject(new Error("Invalid response from server."));
    }

    // ✅ Kiểm tra nếu API trả về lỗi
    if (!response.success) {
      console.error("🔴 Reset password failed:", response);
      return Promise.reject(new Error(response.errors?.join(", ") || "Failed to reset password."));
    }

    // ✅ Trả về thông tin login nếu có
    if (response.token) {
      console.log("🔵 API Token:", response.token);
      return { token: response.token, requiresTwoFactor: false };
    }

    // ✅ Trả về thành công nếu không có token
    return response.data;
  } catch (error: any) {
    console.error("🔴 Reset Password API Error:", error);

    // ✅ Nếu lỗi là mất kết nối
    if (error.message.includes("Network Error")) {
      return Promise.reject(new Error("⚠️ Cannot connect to server. Please check your internet connection."));
    }

    // ✅ Nếu lỗi là do API trả về mã 400 (OTP không hợp lệ hoặc mật khẩu không đạt yêu cầu)
    if (error.response?.status === 400) {
      const errorData = error.response?.data;
      if (errorData?.errors) {
        const errorMessages = [];
        for (const field in errorData.errors) {
          errorMessages.push(...errorData.errors[field]);
        }
        if (errorMessages.length > 0) {
          return Promise.reject(new Error(errorMessages.join(", ")));
        }
      }
      
      return Promise.reject(new Error("Invalid OTP or password requirements not met."));
    }

    // ✅ Nếu lỗi do mất kết nối hoặc lỗi server
    return Promise.reject(new Error("Network error, please try again."));
  }
};