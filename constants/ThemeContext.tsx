import React, { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";

// Tạo Context với giá trị mặc định
const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme(); // Lấy theme của hệ thống
  const [theme, setTheme] = useState(systemColorScheme || "light"); // Lưu trạng thái theme

  // Hàm chuyển đổi theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook để sử dụng theme ở bất kỳ đâu trong app
export const useTheme = () => useContext(ThemeContext);
