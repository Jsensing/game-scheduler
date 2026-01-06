import * as bcrypt from 'bcryptjs';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { db } from '../firebase';

// Props interface for the SignUp component
interface SignUpProps {
  onSignUpSuccess: () => void;    // Callback to invoke when account creation is successful
  onBackToLogin: () => void;      // Callback to navigate back to login screen
}

/**
 * Configure bcrypt's random number generator fallback for React Native
 * React Native doesn't have access to Node's crypto module, so we provide
 * a custom random number generator using Math.random()
 * 
 * This generates an array of random bytes for bcrypt's salt generation
 */
bcrypt.setRandomFallback((len: number) => {
  const randoms: number[] = [];
  for (let i = 0; i < len; i++) {
    // Generate random numbers between 0-255 (byte range)
    randoms.push(Math.floor(Math.random() * 256));
  }
  return randoms;
});

/**
 * SignUp component that handles new user registration
 * Creates new user accounts with hashed passwords stored in Firebase Firestore
 */
export default function SignUp({ onSignUpSuccess, onBackToLogin }: SignUpProps) {
  // State for username input field
  const [username, setUsername] = useState('');
  
  // State for password input field
  const [password, setPassword] = useState('');

  /**
   * Handles the sign-up process
   * 1. Validates that both fields are filled
   * 2. Checks if username already exists in database
   * 3. Hashes the password using bcrypt
   * 4. Creates new user document in Firestore
   * 5. Calls onSignUpSuccess callback on successful creation
   */
  const handleSignUp = async () => {
    // Validate that both fields are filled out
    if (!username || !password) {
      Alert.alert('Error', 'Please fill out both fields');
      return;
    }

    try {
      // Get reference to the 'users' collection in Firestore
      const usersRef = collection(db, 'users');
      
      // Create query to check if username already exists
      const q = query(usersRef, where('username', '==', username));
      
      // Execute the query
      const snapshot = await getDocs(q);

      // If username exists, prevent account creation (usernames must be unique)
      if (!snapshot.empty) {
        Alert.alert('Error', 'Username already taken');
        return;
      }

      // Hash the password with bcrypt using 10 salt rounds
      // Salt rounds determine the computational cost - higher is more secure but slower
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Create new user document in Firestore with username and hashed password
      // Never store passwords in plain text - always hash them!
      await addDoc(usersRef, {
        username: String(username),     // Ensure username is stored as string
        password: hashedPassword,       // Store hashed password, not plain text
      });

      // Show success message and trigger callback to auto-login user
      Alert.alert('Success', 'Account created!');
      onSignUpSuccess();
    } catch (error) {
      // Log error for debugging
      console.error('Error creating user:', error);
      
      // Show user-friendly error message
      Alert.alert('Error', 'Could not create account');
    }
  };

  return (
    <View style={styles.container}>
      {/* Sign-up screen title */}
      <Text style={styles.title}>Sign Up</Text>

      {/* Username input field */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
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

      {/* Create Account button - triggers account creation process */}
      <Button title="Create Account" onPress={handleSignUp} />

      {/* Back to Login button - returns user to login screen */}
      <View style={{ marginTop: 10 }}>
        <Button title="Back to Login" onPress={onBackToLogin} color="gray" />
      </View>
    </View>
  );
}

// Stylesheet for the SignUp component
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center',         // Center content vertically
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});