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
 */
bcrypt.setRandomFallback((len: number) => {
  const randoms: number[] = [];
  for (let i = 0; i < len; i++) {
    randoms.push(Math.floor(Math.random() * 256));
  }
  return randoms;
});

/**
 * SignUp component that handles new user registration
 * Creates new user accounts with hashed passwords stored in Firebase Firestore
 */
export default function SignUp({ onSignUpSuccess, onBackToLogin }: SignUpProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill out both fields');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        Alert.alert('Error', 'Username already taken');
        return;
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      await addDoc(usersRef, {
        username: String(username),
        password: hashedPassword,
      });

      Alert.alert('Success', 'Account created!');
      onSignUpSuccess();
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'Could not create account');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Create Account" onPress={handleSignUp} />

      <View style={{ marginTop: 10 }}>
        <Button title="Back to Login" onPress={onBackToLogin} color="gray" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});