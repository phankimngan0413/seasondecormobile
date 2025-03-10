const tintColorLight = "#0a7ea4";
const tintColorDark = "#ffffff";

export const Colors = {
  light: {
    text: "#11181C",  // 🔹 Màu chữ chính (đen nhạt)
    background: "#FFFFFF",  // 🔹 Màu nền trắng
    card: "#F8F9FA",  // 🔹 Màu nền của card
    border: "#E5E5E5",  // 🔹 Màu viền nhẹ cho card
    tint: tintColorLight,  // 🔹 Màu điểm nhấn
    icon: "#687076",  // 🔹 Màu icon
    tabIconDefault: "#687076", 
    tabIconSelected: tintColorLight, 

    button: "#0A7EA4",  // 🔹 Màu nền của nút bấm chính
    buttonText: "#FFFFFF",  // 🔹 Màu chữ trên nút
    buttonBackground: "#0A7EA4",  // 🔹 Nền của nút bấm
    buttonBorder: "#06698C",  // 🔹 Viền của nút bấm
    buttonHover: "#06698C",  // 🔹 Khi hover vào nút

    primary: "#0A7EA4",  // 🔹 Màu chính (Xanh dương đậm)
    secondary: "#3A99D8",  // 🔹 Màu phụ (Xanh dương nhạt)
    danger: "#FF4444",  // 🔹 Màu cảnh báo (Đỏ)
  },
  dark: {
    text: "#ECEDEE",  // 🔹 Màu chữ chính (trắng)
    background: "#151718",  // 🔹 Màu nền tối
    card: "#1E1E1E",  // 🔹 Màu nền card trong dark mode
    border: "#2B2D2F",  // 🔹 Màu viền card tối
    tint: tintColorDark,  // 🔹 Màu điểm nhấn
    icon: "#9BA1A6",  // 🔹 Màu icon trong dark mode
    tabIconDefault: "#9BA1A6", 
    tabIconSelected: tintColorDark, 

    button: "#FFFFFF",  // 🔹 Màu nền của nút bấm trong dark mode
    buttonText: "#000000",  // 🔹 Màu chữ trên nút (đen)
    buttonBackground: "#FFFFFF",  // 🔹 Nền của nút bấm (trắng)
    buttonBorder: "#D0D0D0",  // 🔹 Viền nút bấm
    buttonHover: "#F1F1F1",  // 🔹 Khi hover vào nút

    primary: "#0A7EA4",  // 🔹 Màu chính (giữ nguyên)
    secondary: "#3A99D8",  // 🔹 Màu phụ (giữ nguyên)
    danger: "#FF4444",  // 🔹 Màu cảnh báo (giữ nguyên)
  },
};
