import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/ThemeContext';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    // Any additional logic on success screen load
  }, []);

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme === 'dark' ? '#151718' : '#ffffff' 
      }
    ]}>
      <View style={styles.successContainer}>
        <Ionicons 
          name="checkmark-circle" 
          size={120} 
          color="#4CAF50" 
        />
        
        <Text style={[
          styles.successTitle, 
          { color: theme === 'dark' ? '#ffffff' : '#000000' }
        ]}>
          Payment Successful
        </Text>
        
        <Text style={[
          styles.successMessage, 
          { color: theme === 'dark' ? '#aaaaaa' : '#666666' }
        ]}>
          Your payment has been processed successfully.
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              { 
                backgroundColor: theme === 'dark' ? '#2C3E50' : '#3498DB',
                borderColor: theme === 'dark' ? '#34495E' : '#2980B9'
              }
            ]}
            onPress={() => router.push('/screens/Wallet')}
          >
            <Text style={[
              styles.buttonText, 
              { color: theme === 'dark' ? '#ffffff' : '#ffffff' }
            ]}>
              View Wallet
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.button, 
              { 
                backgroundColor: theme === 'dark' ? '#273746' : '#ECF0F1',
                borderColor: theme === 'dark' ? '#2C3E50' : '#BDC3C7'
              }
            ]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={[
              styles.buttonText, 
              { color: theme === 'dark' ? '#ffffff' : '#2C3E50' }
            ]}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 30,
    borderRadius: 15,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 30,
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});