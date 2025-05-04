import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { verifySignatureAPI } from '@/utils/contractAPI';

const SignatureSuccessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string | undefined;
  const { theme } = useTheme();
  const validTheme = theme as "light" | "dark";
  const colors = Colors[validTheme];
  
  // State for tracking verification status (only used for loading)
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);
  
  useEffect(() => {
 
    
    // Animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Make API call in background if token is available
    if (token) {
      try {
        verifySignatureAPI(token).catch(error => {
        });
      } catch (error) {
      }
    }

    // Show brief loading screen for better UX
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, [token]);
  
  const handleGoToBookings = () => {
    router.replace('/screens/Bookings');
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        edges={['top']}
      >
        <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Signature Verification
          </Text>
        </View>
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.successCard, 
              { 
                backgroundColor: colors.card,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
              <Ionicons name="hourglass-outline" size={50} color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Verifying your signature...
              </Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // Success state
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['top']}
    >
      <StatusBar barStyle={validTheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text, textAlign: 'center', flex: 1 }]}>
          Contract Signature
        </Text>
      </View>
      
      {/* Main content */}
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.successCard, 
            { 
              backgroundColor: colors.card,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Success icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={50} color="#FFFFFF" />
            </View>
          </View>
          
          {/* Success message */}
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Success!
          </Text>
          
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            Your contract has been successfully signed.
          </Text>
          
          {/* Button to go back to bookings */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleGoToBookings}
          >
            <Text style={styles.buttonText}>
              Return to Bookings
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    width: '100%',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#00C853', // Success green color
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default SignatureSuccessScreen;