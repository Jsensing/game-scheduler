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
import { db } from '../firebase'; // use db from firebase.js

interface LoginProps {
  onLogin: () => void;
  onSwitchToSignUp: () => void; 
}

export default function Login({ onLogin, onSwitchToSignUp }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('username', '==', username),
        where('password', '==', password)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        onLogin(); // Success → move to calendar
      } else {
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong while logging in.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        autoCapitalize="none"
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Login" onPress={handleLogin} />
      </View>

      {/* New Sign Up button */}
      <View style={{ marginTop: 10 }}>
        <Button
          title="Sign Up"
          onPress={onSwitchToSignUp}
          color="gray"
        />
      </View>
    </SafeAreaView>
  );
}

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
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
  },
});
