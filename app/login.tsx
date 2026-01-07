import bcrypt from 'bcryptjs';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { db } from '../firebase';

// Props interface for the Login component
interface LoginProps {
  onLogin: () => void;              // Callback to invoke when login is successful
  onSwitchToSignUp: () => void;     // Callback to navigate to sign-up screen
}

/**
 * Login component that handles user authentication
 * Validates credentials against Firebase Firestore and uses bcrypt for password verification
 */
export default function Login({ onLogin, onSwitchToSignUp }: LoginProps) {
  // State for username input field
  const [username, setUsername] = useState('');
  
  // State for password input field
  const [password, setPassword] = useState('');

  /**
   * Handles the login process
   * 1. Queries Firestore for user with matching username
   * 2. Compares entered password with stored hashed password
   * 3. Calls onLogin callback if credentials are valid
   * 4. Shows error alert if credentials are invalid or an error occurs
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
          onLogin(); // ✅ Success → move to calendar
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
        value={username}
        autoCapitalize="none"           // Prevent auto-capitalization for usernames
        onChangeText={setUsername}
      />

      {/* Password input field with secure text entry (masked characters) */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry                 // Masks password characters for security
        value={password}
        onChangeText={setPassword}
      />

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
    justifyContent: 'center',        // Center content vertically
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
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
  },
});