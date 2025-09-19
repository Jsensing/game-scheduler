import React, { useState } from 'react';
import Home from './home';
import Login from './login';
import SignUp from './signUp';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  if (isLoggedIn) {
    return <Home />;
  }

  if (isSignUp) {
    return (
      <SignUp
        onSignUpSuccess={() => {
          setIsSignUp(false);
          setIsLoggedIn(true); // auto-login after signup
        }}
        onBackToLogin={() => setIsSignUp(false)}
      />
    );
  }

  return (
    <Login
      onLogin={() => setIsLoggedIn(true)}
      onSwitchToSignUp={() => setIsSignUp(true)}
    />
  );
}
