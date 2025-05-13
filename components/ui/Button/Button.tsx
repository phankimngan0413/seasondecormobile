import React from "react";
import { TouchableOpacity, Text, StyleSheet, View, StyleProp, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/constants/ThemeContext";
import { Colors } from "@/constants/Colors";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  btnStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary' | 'outline'; // Added variant prop
  size?: 'small' | 'medium' | 'large'; // Added size prop
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  icon,
  btnStyle,
  labelStyle,
  disabled,
  style,
  textStyle,
  variant = 'primary',
  size = 'medium'
}) => {
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];

  // Get button styles based on variant and theme
  const getButtonStyles = () => {
    let backgroundColor: string;
    let borderColor: string | undefined;
    let textColor: string;
    
    if (disabled) {
      backgroundColor = colors.disabled || "#aaa";
      textColor = colors.text || "#fff";
    } else {
      switch (variant) {
        case 'secondary':
          backgroundColor = colors.card || "#f5f5f5";
          textColor = colors.text || "#333";
          break;
        case 'outline':
          backgroundColor = 'transparent';
          borderColor = colors.primary || "#5fc1f1";
          textColor = colors.primary || "#5fc1f1";
          break;
        case 'primary':
        default:
          backgroundColor = colors.primary || "#5fc1f1";
          textColor = "#fff";
          break;
      }
    }
    
    return {
      backgroundColor,
      borderColor,
      textColor,
      borderWidth: variant === 'outline' ? 1 : 0,
    };
  };

  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 12,
          borderRadius: 25,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          fontSize: 16,
          borderRadius: 50,
        };
      case 'medium':
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          fontSize: 14,
          borderRadius: 50,
        };
    }
  };

  const buttonStyles = getButtonStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: buttonStyles.backgroundColor,
          borderColor: buttonStyles.borderColor,
          borderWidth: buttonStyles.borderWidth,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
          shadowColor: validTheme === 'dark' ? "#fff" : "#000",
          shadowOpacity: validTheme === 'dark' ? 0.1 : 0.3,
          elevation: validTheme === 'dark' ? 2 : 5,
        },
        btnStyle,
        style
      ]}
    >
      <View style={styles.buttonWrapper}>
        {icon && (
          <View style={styles.icon}>
            {/* Clone icon with proper color */}
            {React.isValidElement(icon) ? 
              React.cloneElement(icon as React.ReactElement<any>, { 
                color: buttonStyles.textColor 
              }) : 
              icon
            }
          </View>
        )}
        <Text 
          style={[
            styles.buttonText, 
            { 
              color: buttonStyles.textColor,
              fontSize: sizeStyles.fontSize
            }, 
            labelStyle, 
            textStyle
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
  },
  buttonWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "bold",
    marginLeft: 8,
  },
  icon: {
    marginRight: 8,
  }
});

export default CustomButton;