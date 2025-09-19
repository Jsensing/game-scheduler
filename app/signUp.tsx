import bcrypt from 'bcryptjs';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { db } from '../firebase';

interface SignUpProps {
  onSignUpSuccess: () => void;
  onBackToLogin: () => void;
}

export default function SignUp({ onSignUpSuccess, onBackToLogin }: SignUpProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill out both fields');
      return;
    }

    try {
      // Check if username already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        Alert.alert('Error', 'Username already taken');
        return;
      }

      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      await addDoc(usersRef, {
        username,
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
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});
