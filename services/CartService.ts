// CartService.ts - Cải tiến để ngăn việc gọi liên tục API
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCartAPI } from "@/utils/cartAPI";

// Key lưu trữ
const CART_DATA_KEY = "@cart_data_";

// Cache và các biến kiểm soát
let cartDataCache: Record<number, any> = {}; // Cache theo userId
let lastCartFetch: Record<number, number> = {}; // Thời điểm fetch cuối theo userId
const CART_CACHE_TTL = 60000; // Cache 1 phút (có thể điều chỉnh)

// Promise cache để tránh trùng lặp request
const pendingPromises: Record<string, Promise<any>> = {};

// Điều khiển logging
let debugLogging = true;

// Hàm log có kiểm soát
const logDebug = (message: string, ...args: any[]) => {
  if (debugLogging) {
    console.log(message, ...args);
  }
};

class CartService {
  /**
   * Lấy dữ liệu giỏ hàng với cơ chế chống trùng lặp
   */
  async getCartData(userId: number): Promise<any> {
    // Kiểm tra cache trước khi làm bất cứ điều gì
    const now = Date.now();
    if (cartDataCache[userId] && now - (lastCartFetch[userId] || 0) < CART_CACHE_TTL) {
      logDebug("🟢 Using cached cart data for user", userId);
      return cartDataCache[userId];
    }
    
    const key = `getCartData_${userId}`;
    
    // Kiểm tra xem đã có request đang chạy chưa
    if (key in pendingPromises) {
      logDebug("🔄 Reusing in-flight cart data request for user", userId);
      return pendingPromises[key];
    }
  
    try {
      // Tạo và lưu promise
      const promise = this._getCartDataInternal(userId);
      pendingPromises[key] = promise;
      
      // Đợi kết quả
      const result = await promise;
      
      // Xóa khỏi cache promise
      delete pendingPromises[key];
      
      return result;
    } catch (error) {
      // Xóa khỏi cache promise khi lỗi
      delete pendingPromises[key];
      console.error("🔴 Error in getCartData:", error);
      return null;
    }
  }
  
  /**
   * Phương thức nội bộ để lấy dữ liệu giỏ hàng
   */
  private async _getCartDataInternal(userId: number): Promise<any> {
    try {
      // Kiểm tra lại cache (để xử lý race condition)
      const now = Date.now();
      if (cartDataCache[userId] && now - (lastCartFetch[userId] || 0) < CART_CACHE_TTL) {
        logDebug("🟢 Using cached cart data for user (double-check)", userId);
        return cartDataCache[userId];
      }

      logDebug("🟡 Fetching cart data from API for user", userId);
      
      // Gọi API để lấy dữ liệu
      const cartData = await getCartAPI(userId);
      
      if (cartData) {
        // Cập nhật cache
        cartDataCache[userId] = cartData;
        lastCartFetch[userId] = now;
        
        // Lưu vào AsyncStorage để persistence
        await this.saveCartDataToStorage(userId, cartData);
        
        logDebug("🟢 Cart data retrieved from API and cached for user", userId);
        return cartData;
      } else {
        logDebug("🟡 No cart data found for user", userId);
        return { cartItems: [], totalPrice: 0 };
      }
    } catch (error) {
      console.error("🔴 Error fetching cart data:", error);
      
      // Thử lấy từ storage nếu API lỗi
      try {
        const cachedData = await this.getCartDataFromStorage(userId);
        if (cachedData) {
          logDebug("🟡 Using fallback data from storage for user", userId);
          return cachedData;
        }
      } catch (storageError) {
        console.error("🔴 Error getting fallback cart data:", storageError);
      }
      
      return { cartItems: [], totalPrice: 0 };
    }
  }

  /**
   * Lưu dữ liệu giỏ hàng vào AsyncStorage
   */
  private async saveCartDataToStorage(userId: number, cartData: any): Promise<void> {
    try {
      const cartDataJson = JSON.stringify(cartData);
      await AsyncStorage.setItem(`${CART_DATA_KEY}${userId}`, cartDataJson);
    } catch (error) {
      console.error("🔴 Error saving cart data to storage:", error);
    }
  }

  /**
   * Lấy dữ liệu giỏ hàng từ AsyncStorage
   */
  private async getCartDataFromStorage(userId: number): Promise<any | null> {
    try {
      const cartDataJson = await AsyncStorage.getItem(`${CART_DATA_KEY}${userId}`);
      if (cartDataJson) {
        return JSON.parse(cartDataJson);
      }
      return null;
    } catch (error) {
      console.error("🔴 Error reading cart data from storage:", error);
      return null;
    }
  }

  /**
   * Cập nhật dữ liệu giỏ hàng sau khi thêm/xóa/sửa
   */
  async updateCartData(userId: number, cartData: any): Promise<void> {
    try {
      // Cập nhật cache
      cartDataCache[userId] = cartData;
      lastCartFetch[userId] = Date.now();
      
      // Lưu vào AsyncStorage
      await this.saveCartDataToStorage(userId, cartData);
      
      logDebug("🟢 Cart data updated for user", userId);
    } catch (error) {
      console.error("🔴 Error updating cart data:", error);
    }
  }

  /**
   * Làm mới dữ liệu giỏ hàng (force refresh)
   */
  async refreshCartData(userId: number): Promise<any> {
    try {
      // Xóa cache
      delete cartDataCache[userId];
      delete lastCartFetch[userId];
      
      // Xóa promise đang chạy
      const key = `getCartData_${userId}`;
      delete pendingPromises[key];
      
      logDebug("🔄 Forcing refresh of cart data for user", userId);
      
      // Gọi lại API
      return await this.getCartData(userId);
    } catch (error) {
      console.error("🔴 Error refreshing cart data:", error);
      return null;
    }
  }

  /**
   * Xóa dữ liệu giỏ hàng
   */
  async removeCartData(userId: number): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CART_DATA_KEY}${userId}`);
      
      // Xóa khỏi cache
      delete cartDataCache[userId];
      delete lastCartFetch[userId];
      
      logDebug("✅ Cart data removed and cache cleared for user", userId);
    } catch (error) {
      console.error("🔴 Error removing cart data:", error);
    }
  }

  /**
   * Xóa toàn bộ cache (hữu ích khi logout)
   */
  clearCache(): void {
    cartDataCache = {};
    lastCartFetch = {};
    // Xóa tất cả pending promises
    for (const key in pendingPromises) {
      if (key.startsWith('getCartData_')) {
        delete pendingPromises[key];
      }
    }
    logDebug("🧹 Cart cache cleared completely");
  }
  
  /**
   * Bật/tắt debug logging
   */
  setDebugLogging(enabled: boolean): void {
    debugLogging = enabled;
    console.log(`🔧 Cart debug logging ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Tạo và export một instance singleton
const cartService = new CartService();
export default cartService;

// Export các phương thức riêng lẻ để tương thích ngược
export const getCartData = (userId: number) => cartService.getCartData(userId);
export const updateCartData = (userId: number, cartData: any) => cartService.updateCartData(userId, cartData);
export const refreshCartData = (userId: number) => cartService.refreshCartData(userId);
export const removeCartData = (userId: number) => cartService.removeCartData(userId);
export const clearCartCache = () => cartService.clearCache();
export const setCartDebugLogging = (enabled: boolean) => cartService.setDebugLogging(enabled);