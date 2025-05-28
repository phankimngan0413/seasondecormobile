import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Predefined color palette
const COLOR_PALETTE = [
  { id: 1, name: "Soft White", colorCode: "#F5F5F5" },
  { id: 2, name: "Warm Beige", colorCode: "#D7CCC8" },
  { id: 3, name: "Light Taupe", colorCode: "#BCAAA4" },
  { id: 4, name: "Sage Green", colorCode: "#9CAF88" },
  { id: 5, name: "Dusty Blue", colorCode: "#78909C" },
  { id: 6, name: "Charcoal Gray", colorCode: "#4E4E50" },
  { id: 7, name: "Muted Terracotta", colorCode: "#C97B63" },
  { id: 8, name: "Soft Blush", colorCode: "#E3B7A0" },
  { id: 9, name: "Natural Wood", colorCode: "#A9746E" },
  { id: 10, name: "Deep Navy", colorCode: "#283747" },
  { id: 11, name: "Cream", colorCode: "#F5F5DC" },
  { id: 12, name: "Olive Green", colorCode: "#6AB04C" },
  { id: 13, name: "Clay Brown", colorCode: "#B66E41" },
  { id: 14, name: "Slate Gray", colorCode: "#708090" },
  { id: 15, name: "Dusty Rose", colorCode: "#D4A5A5" },
  { id: 16, name: "Mustard Yellow", colorCode: "#D4B106" },
  { id: 17, name: "Soft Lavender", colorCode: "#B9AEDC" },
  { id: 18, name: "Warm Taupe", colorCode: "#927E71" },
  { id: 19, name: "Pale Aqua", colorCode: "#A7C7E7" },
  { id: 20, name: "Chocolate Brown", colorCode: "#5D4037" }
];



// Props interface
interface ColorPaletteProps {
  selectedColorIds: number[];
  onColorSelect: (colorIds: number[]) => void;
  colors: any; // Theme colors from app
  maxSelection?: number; // Optional: limit number of selections
}

const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColorIds,
  onColorSelect,
  colors,
  maxSelection = 5 // Default max 5 colors
}) => {
  
  // Handle color selection
  const handleColorSelect = (colorId: number) => {
    if (selectedColorIds.includes(colorId)) {
      // Remove color if already selected
      const updatedSelection = selectedColorIds.filter(id => id !== colorId);
      onColorSelect(updatedSelection);
    } else {
      // Add color if not selected and under max limit
      if (selectedColorIds.length < maxSelection) {
        const updatedSelection = [...selectedColorIds, colorId];
        onColorSelect(updatedSelection);
      }
    }
  };

  // Get selected color names
  const getSelectedColorNames = (): string => {
    return selectedColorIds
      .map(id => COLOR_PALETTE.find(color => color.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <View style={styles.container}>
      {/* Color Grid */}
      <View style={styles.colorGrid}>
        {COLOR_PALETTE.map((color) => {
          const isSelected = selectedColorIds.includes(color.id);
          const isDisabled = !isSelected && selectedColorIds.length >= maxSelection;
          
          return (
            <TouchableOpacity
              key={color.id}
              style={[
                styles.colorOption,
                {
                  borderColor: isSelected 
                    ? colors.primary 
                    : colors.border || '#E0E0E0',
                  borderWidth: isSelected ? 3 : 1,
                  opacity: isDisabled ? 0.5 : 1
                }
              ]}
              onPress={() => handleColorSelect(color.id)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              {/* Color Swatch */}
              <View 
                style={[
                  styles.colorSwatch, 
                  { 
                    backgroundColor: color.colorCode,
                    borderColor: color.colorCode === '#FFFFFF' ? '#E0E0E0' : 'transparent',
                    borderWidth: color.colorCode === '#FFFFFF' ? 1 : 0
                  }
                ]} 
              />
              
              {/* Color Name */}
              <Text style={[
                styles.colorName,
                { 
                  color: isSelected 
                    ? colors.primary 
                    : colors.text || '#000000',
                  fontWeight: isSelected ? '600' : '400'
                }
              ]}>
                {color.name}
              </Text>
              
              {/* Color Code */}
              <Text style={[
                styles.colorCode,
                { 
                  color: colors.textSecondary || '#666666'
                }
              ]}>
                {color.colorCode}
              </Text>
              
              {/* Selection Indicator */}
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selection Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: `${colors.primary}10` }]}>
        <View style={styles.summaryHeader}>
          <Ionicons name="color-palette" size={16} color={colors.primary} />
          <Text style={[styles.summaryTitle, { color: colors.primary }]}>
            Selected Colors ({selectedColorIds.length}/{maxSelection})
          </Text>
        </View>
        
        {selectedColorIds.length > 0 ? (
          <Text style={[styles.summaryText, { color: colors.text }]}>
            {getSelectedColorNames()}
          </Text>
        ) : (
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            Select up to {maxSelection} colors for your design
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorOption: {
    width: '22%', // 4 columns with gap
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#FAFAFA',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  colorName: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
  },
  colorCode: {
    fontSize: 9,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  summaryContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
  },
  placeholderText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});

export default ColorPalette;