import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useUser } from '../context/userContext';
import Home from './home';
import Login from './login';
import SignUp from './signUp';

export default function RootNavigator() {
  const { currentUser } = useUser();
  const [showSignUp, setShowSignUp] = useState(false);

  if (currentUser === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (currentUser) {
    return <Home />;
  }

  if (showSignUp) {
    return (
      <SignUp
        onSignUpSuccess={() => setShowSignUp(false)}
        onBackToLogin={() => setShowSignUp(false)}
      />
    );
  }

  return (
    <Login
      onLogin={() => {}}
      onSwitchToSignUp={() => setShowSignUp(true)}
    />
  );
}