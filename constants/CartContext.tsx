import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCartAPI } from '@/utils/cartAPI';
import { getUserIdFromToken } from '@/services/auth';

// Define interface for context value
interface CartContextType {
  cartItemCount: number;
  isLoading: boolean;
  refreshCartCount: () => Promise<void>;
}

// Create context with default value
const CartContext = createContext<CartContextType>({
  cartItemCount: 0,
  isLoading: false,
  refreshCartCount: async () => {}
});

// Define props interface for CartProvider
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to fetch cart data and update item count
  const fetchCartCount = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const userId = await getUserIdFromToken();
      if (!userId) {
        setCartItemCount(0);
        return;
      }

      const cartData = await getCartAPI(userId);
      
      if (cartData?.cartItems && Array.isArray(cartData.cartItems)) {
        setCartItemCount(cartData.cartItems.length);
        
        // Also store in AsyncStorage for persistence
        await AsyncStorage.setItem('cartItemCount', cartData.cartItems.length.toString());
      } else {
        setCartItemCount(0);
        await AsyncStorage.setItem('cartItemCount', '0');
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
      // Try to get from local storage as fallback
      const storedCount = await AsyncStorage.getItem('cartItemCount');
      if (storedCount) {
        setCartItemCount(parseInt(storedCount, 10));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize cart count on mount
  useEffect(() => {
    const initializeCart = async () => {
      // First try to get from AsyncStorage for immediate display
      const storedCount = await AsyncStorage.getItem('cartItemCount');
      if (storedCount) {
        setCartItemCount(parseInt(storedCount, 10));
      }
      
      // Then fetch the real count from API
      fetchCartCount();
    };

    initializeCart();
    
    // Set up polling to refresh cart count every 30 seconds
    const intervalId = setInterval(fetchCartCount, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Value object to be provided by context
  const value: CartContextType = {
    cartItemCount,
    isLoading,
    refreshCartCount: fetchCartCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};