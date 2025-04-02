import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/ThemeContext';

export default function PaymentFailureScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    // Any additional error logging or processing
  }, []);

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme === 'dark' ? '#151718' : '#ffffff' 
      }
    ]}>
      <View style={styles.failureContainer}>
        <Ionicons 
          name="close-circle" 
          size={120} 
          color="#FF5252" 
        />
        
        <Text style={[
          styles.failureTitle, 
          { color: theme === 'dark' ? '#ffffff' : '#000000' }
        ]}>
          Payment Failed
        </Text>
        
        <Text style={[
          styles.failureMessage, 
          { color: theme === 'dark' ? '#aaaaaa' : '#666666' }
        ]}>
          There was an issue processing your payment. 
          Please try again or contact support.
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
            onPress={() => router.push('/screens/payment/add-funds')}
          >
            <Text style={[
              styles.buttonText, 
              { color: theme === 'dark' ? '#ffffff' : '#ffffff' }
            ]}>
              Try Again
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
  failureContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 30,
    borderRadius: 15,
  },
  failureTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  failureMessage: {
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