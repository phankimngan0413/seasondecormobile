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
  if (!idToken) {
    console.error("🔴 GOOGLE LOGIN: ID token is empty");
    return Promise.reject(new Error("Invalid Google token: Empty token"));
  }

  console.log(`🟡 GOOGLE LOGIN: Processing ID token (${idToken.length} chars): ${idToken.substring(0, 10)}...`);
  
  const url = "/api/Auth/google-login";
  const apiClient = await initApiClient();
  console.log("🟡 GOOGLE LOGIN: API Endpoint:", apiClient.defaults.baseURL + url);

  try {
    // Log request data for debugging
    console.log("🟡 GOOGLE LOGIN: Sending data to API:", { idToken: idToken.substring(0, 15) + "..." });
    
    const response = await apiClient.post(url, {
      idToken: idToken,
    });

    // Log raw response before processing
    console.log("🟢 GOOGLE LOGIN: Raw API response received:", response);
    
    // Handle common response structures
    let processedResponse;
    
    // Handle if the response is wrapped in a data property (common API pattern)
    if (response && response.data) {
      processedResponse = response.data;
      console.log("🟡 GOOGLE LOGIN: Processing response.data:", processedResponse);
    } else {
      processedResponse = response;
      console.log("🟡 GOOGLE LOGIN: Direct response:", processedResponse);
    }
    
    // If response is a string (direct token response)
    if (typeof processedResponse === 'string') {
      console.log("🟢 GOOGLE LOGIN: Received direct token string");
      return { 
        token: processedResponse, 
        requiresTwoFactor: false 
      };
    }

    // Handle standard response structure
    if (processedResponse && typeof processedResponse.success !== "undefined") {
      console.log("🟡 GOOGLE LOGIN: Standard response structure detected");
      
      if (!processedResponse.success) {
        const errorMsg = processedResponse.errors?.join(", ") || "Google login failed";
        console.error("🔴 GOOGLE LOGIN: Request unsuccessful:", errorMsg);
        return Promise.reject(new Error(errorMsg));
      }
      
      // Check for token in multiple possible locations
      const token = processedResponse.token || 
                   (processedResponse.data && processedResponse.data.token) ||
                   processedResponse.accessToken ||
                   processedResponse.access_token;
      
      if (token) {
        console.log(`🟢 GOOGLE LOGIN: Successfully extracted token (${token.length} chars): ${token.substring(0, 10)}...`);
        return { 
          token: token, 
          requiresTwoFactor: processedResponse.requiresTwoFactor || false 
        };
      } else {
        console.error("🔴 GOOGLE LOGIN: No token in successful response:", processedResponse);
        return Promise.reject(new Error("Login successful but no token received"));
      }
    } 
    
    // If we can't determine response structure but there seems to be a token
    if (processedResponse && (processedResponse.token || processedResponse.accessToken || processedResponse.access_token)) {
      const token = processedResponse.token || processedResponse.accessToken || processedResponse.access_token;
      console.log(`🟢 GOOGLE LOGIN: Found token in non-standard response (${token.length} chars): ${token.substring(0, 10)}...`);
      return { 
        token: token, 
        requiresTwoFactor: processedResponse.requiresTwoFactor || false 
      };
    }
    
    // If we get here, we couldn't find a token in the response
    console.error("🔴 GOOGLE LOGIN: Could not determine response structure:", processedResponse);
    return Promise.reject(new Error("Invalid response format from server"));
    
  } catch (error: any) {
    console.error("🔴 GOOGLE LOGIN: API call failed:", error);
    console.error("🔴 GOOGLE LOGIN: Error details:", error.response?.data || error.message);

    // Log response error data if available
    if (error.response) {
      console.error("🔴 GOOGLE LOGIN: Status:", error.response.status);
      console.error("🔴 GOOGLE LOGIN: Headers:", error.response.headers);
      console.error("🔴 GOOGLE LOGIN: Data:", error.response.data);
    }

    if (error.message && error.message.includes("Network Error")) {
      return Promise.reject(new Error("Cannot connect to server. Please check your internet connection."));
    }

    if (error.response?.status === 400) {
      const errorMsg = error.response.data?.errors?.join(", ") || 
                     error.response.data?.message || 
                     "Invalid Google token.";
      return Promise.reject(new Error(errorMsg));
    }

    return Promise.reject(new Error(error.message || "Network error, please try again."));
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