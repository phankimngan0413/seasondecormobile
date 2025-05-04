import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCartData } from '@/services/CartService';
import { getUserIdFromToken } from '@/services/auth';

interface CartContextType {
  cartItemCount: number;
  refreshCartCount: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType>({
  cartItemCount: 0,
  refreshCartCount: async () => {},
  isLoading: false,
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Sử dụng ref để tránh re-render và track trạng thái
  const lastFetchRef = useRef(0);
  const isFetchingRef = useRef(false);
  const userIdRef = useRef<number | null>(null);
  
  // Thời gian cache dài hơn để tránh gọi API quá thường xuyên
  const MIN_FETCH_INTERVAL = 60000; // 1 phút
  
  // Lấy userId một lần và lưu vào ref
  const fetchUserId = useCallback(async () => {
    if (userIdRef.current) return userIdRef.current;
    
    try {
      const userId = await getUserIdFromToken();
      if (userId) {
        const numericId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        userIdRef.current = numericId;
        return numericId;
      }
      return null;
    } catch (err) {
      console.error("Error getting userId:", err);
      return null;
    }
  }, []);
  
  const refreshCartCount = useCallback(async () => {
    // Tránh gọi liên tục nếu đã gọi gần đây
    const now = Date.now();
    if (now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
      return;
    }
    
    // Tránh nhiều yêu cầu đồng thời
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      
      // Lấy userId (hoặc dùng cache)
      const userId = await fetchUserId();
      if (!userId) {
        setCartItemCount(0);
        return;
      }
      
      // Sử dụng CartService để lấy dữ liệu giỏ hàng
      const cartData = await getCartData(userId);
      
      // Cập nhật số lượng sản phẩm
      if (cartData && cartData.cartItems) {
        setCartItemCount(cartData.cartItems.length);
      } else {
        setCartItemCount(0);
      }
      
      // Cập nhật thời gian fetch gần nhất
      lastFetchRef.current = now;
      
    } catch (error) {
      console.error('Error refreshing cart count:', error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [fetchUserId]);

  // Chỉ gọi một lần khi component mount
  useEffect(() => {
    // Gọi không đồng bộ để không block render
    const initCart = async () => {
      await refreshCartCount();
    };
    
    initCart();
    
    // Không thêm refreshCartCount vào dependencies
  }, []);

  return (
    <CartContext.Provider value={{ cartItemCount, refreshCartCount, isLoading }}>
      {children}
    </CartContext.Provider>
  );
};