import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { db } from '../firebase';
import { registerForPushNotificationsAsync } from './notifications';
import { useUser } from './userContext';


// Props interface for the Login component
interface LoginProps {
  onLogin: () => void;              // Callback to invoke when login is successful
  onSwitchToSignUp: () => void;     // Callback to navigate to sign-up screen
}

/**
 * Login component that handles user authentication
 * Validates credentials against Firebase Firestore and uses bcrypt for password verification
 * Includes Remember Me functionality using AsyncStorage
 */
export default function Login({ onLogin, onSwitchToSignUp }: LoginProps) {
  // Get setCurrentUser from user context
  const { setCurrentUser } = useUser();
  
  // State for username input field
  const [username, setUsername] = useState('');
  
  // State for password input field
  const [password, setPassword] = useState('');

  // State for Remember Me toggle
  const [rememberMe, setRememberMe] = useState(false);

  /**
 * Check for saved credentials and clear password when component mounts
 * If user previously enabled Remember Me, auto-fill the username
 */
useEffect(() => {
  const loadSavedCredentials = async () => {
    // Always clear password for security
    setPassword('');
    
    try {
      const savedUsername = await AsyncStorage.getItem('savedUsername');
      const savedRememberMe = await AsyncStorage.getItem('rememberMe');

      // If both values exist and remember me was true, restore username
      if (savedUsername && savedRememberMe === 'true') {
        setUsername(savedUsername);
        setRememberMe(true);
      } else {
        // If no Remember Me, clear username too
        setUsername('');
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };
  loadSavedCredentials();
}, []); 

  /**
   * Handles the login process
   * 1. Queries Firestore for user with matching username
   * 2. Compares entered password with stored hashed password
   * 3. Saves or clears Remember Me credentials based on toggle
   * 4. Sets current user in context and calls onLogin callback
   * 5. Shows error alert if credentials are invalid or an error occurs
   */
  const handleLogin = async () => {
    try {
      // Get reference to the 'users' collection in Firestore
      const usersRef = collection(db, 'users');
      
      // Create query to find user document with matching username
      const q = query(usersRef, where('username', '==', username));
      
      // Execute the query and get results
      const snapshot = await getDocs(q);

      // Check if a user with this username exists
      if (!snapshot.empty) {
        // Extract user data from the first (should be only) matching document
        const userData = snapshot.docs[0].data();

        // Compare entered password with stored hashed password using bcrypt
        // bcrypt.compareSync handles the hashing and comparison securely
        const isMatch = bcrypt.compareSync(password, userData.password);

        // If password matches, trigger successful login
        if (isMatch) {
          //get push token
          const pushToken = await registerForPushNotificationsAsync();

          // Save or clear credentials based on Remember Me toggle
          if (rememberMe) {
            // User wants to be remembered - save username
            await AsyncStorage.setItem('savedUsername', username);
            await AsyncStorage.setItem('rememberMe', 'true');
          } else {
            // User doesn't want to be remembered - clear saved data
            await AsyncStorage.removeItem('savedUsername');
            await AsyncStorage.removeItem('rememberMe');
          }

          // Set current user in context
          setCurrentUser({
            id: snapshot.docs[0].id,
            username: userData.username
          });
          
          // Trigger navigation to home screen
          onLogin();
          return;
        }
      }

      // If we reach here, either user doesn't exist or password is wrong
      // Show generic error message for security (don't reveal which is wrong)
      Alert.alert('Login Failed', 'Invalid username or password');
    } catch (error) {
      // Log error for debugging purposes
      console.error('Login error:', error);
      
      // Show user-friendly error message
      Alert.alert('Error', 'Something went wrong while logging in.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Login screen title */}
      <Text style={styles.title}>Login</Text>

      {/* Username input field */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#999"
        value={username}
        onChangeText={setUsername}
      />

      {/* Password input field with secure text entry (masked characters) */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Remember Me toggle */}
      <View style={styles.rememberMeContainer}>
        <Switch
          value={rememberMe}
          onValueChange={setRememberMe}
          trackColor={{ false: '#ccc', true: '#4CAF50' }}
        />
        <Text style={styles.rememberMeText}>Remember Me</Text>
      </View>

      {/* Login button - triggers authentication */}
      <View style={{ marginTop: 20 }}>
        <Button title="Login" onPress={handleLogin} />
      </View>

      {/* Sign Up button - navigates to sign-up screen */}
      <View style={{ marginTop: 10 }}>
        <Button title="Sign Up" onPress={onSwitchToSignUp} color="gray" />
      </View>
    </SafeAreaView>
  );
}

// Stylesheet for the Login component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#000',
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  rememberMeText: {
    fontSize: 16,
    color: '#333',
  },
});