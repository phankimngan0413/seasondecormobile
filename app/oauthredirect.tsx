import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OAuthRedirect() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        
        // Check if token exists
        const token = await AsyncStorage.getItem('@app_token');
        
        if (token) {
          // If token exists, redirect to profile
          setTimeout(() => {
            router.replace("/(tabs)/profile");
          }, 1000);
        } else {
          // If no token found, return to login page
          setTimeout(() => {
            router.replace("/(auth)/login");
          }, 1000);
        }
      } catch (error) {
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 1000);
      }
    };
    
    handleRedirect();
  }, []);
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ff6600" style={styles.loader} />
      <Text style={styles.text}>Processing login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loader: {
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});