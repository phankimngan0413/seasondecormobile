import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';


interface PrimaryButtonProps {
  title: string;
  onPress: () => void;

  btnStyle?: object; // Optional button style
  labelStyle?: object; // Optional label style
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  btnStyle,
  labelStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, btnStyle]} // Apply passed button styles
      onPress={onPress}
    >
      <View style={styles.buttonContent}>
        <Text style={[styles.buttonText, labelStyle]}>{title}</Text> {/* Button text */}
      </View>
    </TouchableOpacity>
  );
};

// Default styles for the button
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3498db', // Blue background
    borderRadius: 20, // Rounded corners
    paddingVertical: 10, // Vertical padding
    paddingHorizontal: 20, // Horizontal padding
    alignItems: 'center', // Center content horizontally
    justifyContent: 'center', // Center content vertically
    flexDirection: 'row', // Align icon and text horizontally
    width: 150, // Fixed width (adjustable)
    height: 40, // Fixed height (adjustable)
  },
  buttonContent: {
    flexDirection: 'row', // Align icon and text in a row
    alignItems: 'center', // Vertically center content
  },
  icon: {
    marginRight: 8, // Space between icon and text
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold', // Bold text
    color: '#fff', // White text color
    textTransform: 'uppercase', // Uppercase text
  },
});

export default PrimaryButton;
